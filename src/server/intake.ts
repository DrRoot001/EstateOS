/**
 * Public inbound endpoints (PRD 16, 79A).
 *
 * These are the only routes an outside system may call without a session:
 *
 *   POST /api/forms/:publicKey   website form submissions
 *   GET  /api/forms/:publicKey   CORS preflight helper / health ping
 *
 * The key identifies the organization's channel; it is not a secret in the sense
 * that a password is, so everything here is rate limited and validated hard.
 */
import { z } from "zod";
import { findChannelByPublicKey, ingestInbound } from "./inbox-service";

const submission = z.object({
  name: z.string().max(120).optional().default(""),
  email: z.string().max(200).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  message: z.string().max(4000).optional().default(""),
  subject: z.string().max(200).optional().default(""),
  /** Anything else the form posts is kept verbatim on the message payload. */
  meta: z.record(z.string(), z.unknown()).optional(),
});

// ponytail: per-process counter, same as the sign-in limiter. Redis when there
// is more than one instance.
const hits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 20;
const WINDOW_MS = 60_000;

function throttled(key: string) {
  const now = Date.now();
  const bucket = hits.get(key);
  if (!bucket || bucket.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > LIMIT;
}

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

/** Returns null when the request is not an intake call, so SSR continues. */
export async function handleIntake(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/forms\/([\w-]+)\/?$/);
  if (!match) return null;
  const publicKey = match[1]!;

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Use POST to submit a form" }, 405);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(`${publicKey}:${ip}`)) return json({ error: "Too many submissions" }, 429);

  const channel = await findChannelByPublicKey(publicKey);
  if (!channel || channel.kind !== "webform") return json({ error: "Unknown form key" }, 404);

  let raw: Record<string, unknown>;
  try {
    const type = request.headers.get("content-type") ?? "";
    raw = type.includes("application/json")
      ? ((await request.json()) as Record<string, unknown>)
      : Object.fromEntries(await request.formData());
  } catch {
    return json({ error: "Body must be JSON or form-encoded" }, 400);
  }

  const parsed = submission.safeParse(raw);
  if (!parsed.success) return json({ error: "Invalid submission" }, 400);
  const data = parsed.data;

  if (!data.email.trim() && !data.phone.trim())
    return json({ error: "An email address or phone number is required" }, 400);

  const known = new Set(["name", "email", "phone", "message", "subject", "meta"]);
  const extras = Object.fromEntries(Object.entries(raw).filter(([k]) => !known.has(k)));

  const result = await ingestInbound({
    channel,
    name: data.name || data.email || data.phone,
    email: data.email || null,
    phone: data.phone || null,
    subject: data.subject || undefined,
    message: data.message || "(no message)",
    meta: { ...extras, ...(data.meta ?? {}), source: "webform", ip },
  });

  return json({ ok: true, duplicate: result.duplicate });
}
