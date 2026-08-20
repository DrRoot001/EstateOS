/**
 * Authentication and sessions (PRD 10A).
 *
 * Nothing here trusts the client: the cookie carries an opaque token, the token's
 * hash is the session primary key, and identity plus organization are always read
 * back from the database.
 */
import { and, eq, isNull, lt, or } from "drizzle-orm";
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestIP,
  setCookie,
} from "@tanstack/react-start/server";
import { db, schema } from "@/db/client";
import { newToken, sha256 } from "./crypto";
import type { Organization, UserRow } from "@/db/schema";

export {
  assertPasswordPolicy,
  hashPassword,
  newToken,
  sha256,
  tokenExpiry,
  verifyPassword,
} from "./crypto";

const COOKIE = "eos_session";
const IDLE_MS = 12 * 60 * 60 * 1000;
const ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000;

export type Caller = { user: UserRow; org: Organization };

/* ------------------------------------------------------------------- sessions */

export async function createSession(user: UserRow): Promise<string> {
  const database = await db();
  const { token, hash } = newToken();
  await database.insert(schema.sessions).values({
    id: hash,
    userId: user.id,
    organizationId: user.organizationId,
    ip: requestIp(),
    userAgent: (getRequestHeader("user-agent") ?? "").slice(0, 300),
    expiresAt: new Date(Date.now() + IDLE_MS),
  });
  await database
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));
  setCookie(COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: Math.floor(ABSOLUTE_MS / 1000),
  });
  return token;
}

/** Resolves the signed-in caller, or null. Also slides the idle window. */
export async function currentCaller(): Promise<Caller | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const database = await db();
  const id = sha256(token);

  const [row] = await database
    .select({ session: schema.sessions, user: schema.users, org: schema.organizations })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.users.organizationId))
    .where(and(eq(schema.sessions.id, id), isNull(schema.sessions.revokedAt)))
    .limit(1);

  if (!row) return null;

  const now = Date.now();
  const expired = row.session.expiresAt.getTime() < now;
  const tooOld = row.session.createdAt.getTime() + ABSOLUTE_MS < now;
  if (expired || tooOld || !row.user.active || row.org.status !== "active") {
    await database
      .update(schema.sessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.sessions.id, id));
    deleteCookie(COOKIE, { path: "/" });
    return null;
  }

  // Slide the idle window at most once every five minutes.
  if (row.session.lastSeenAt.getTime() + 5 * 60 * 1000 < now) {
    await database
      .update(schema.sessions)
      .set({ lastSeenAt: new Date(now), expiresAt: new Date(now + IDLE_MS) })
      .where(eq(schema.sessions.id, id));
  }

  return { user: row.user, org: row.org };
}

export async function requireCaller(): Promise<Caller> {
  const caller = await currentCaller();
  if (!caller) throw new Error("Not signed in");
  return caller;
}

export async function endCurrentSession() {
  const token = getCookie(COOKIE);
  deleteCookie(COOKIE, { path: "/" });
  if (!token) return;
  const database = await db();
  await database
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(eq(schema.sessions.id, sha256(token)));
}

export async function revokeUserSessions(userId: string) {
  const database = await db();
  await database
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.sessions.userId, userId), isNull(schema.sessions.revokedAt)));
}

/** Housekeeping: drop sessions that can never be valid again. */
export async function pruneSessions() {
  const database = await db();
  const cutoff = new Date(Date.now() - ABSOLUTE_MS);
  await database
    .delete(schema.sessions)
    .where(or(lt(schema.sessions.expiresAt, new Date()), lt(schema.sessions.createdAt, cutoff)));
}

/* ---------------------------------------------------------------- rate limits */

type Bucket = { failures: number; blockedUntil: number };
// ponytail: per-process counters. Move to Redis when EstateOS runs more than one
// instance — until then this is the whole rate limiter and it works.
const buckets = new Map<string, Bucket>();
const MAX_FAILURES = 10;
const BLOCK_MS = 15 * 60 * 1000;

export function assertNotThrottled(key: string) {
  const bucket = buckets.get(key.toLowerCase());
  if (bucket && bucket.blockedUntil > Date.now())
    throw new Error("Too many attempts. Try again in a few minutes.");
}

export function recordFailure(key: string) {
  const k = key.toLowerCase();
  const bucket = buckets.get(k) ?? { failures: 0, blockedUntil: 0 };
  bucket.failures += 1;
  if (bucket.failures >= MAX_FAILURES) {
    bucket.blockedUntil = Date.now() + BLOCK_MS;
    bucket.failures = 0;
  }
  buckets.set(k, bucket);
}

export function clearFailures(key: string) {
  buckets.delete(key.toLowerCase());
}

export function requestIp() {
  return getRequestIP({ xForwardedFor: true }) ?? "";
}
