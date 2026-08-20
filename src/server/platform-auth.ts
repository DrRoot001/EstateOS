/**
 * Authentication for EstateOS platform staff (PRD 8B.1, level 1).
 *
 * Separate table, separate session store, separate cookie. A tenant session can
 * never satisfy a platform check and a platform session can never satisfy a
 * tenant check — the two paths share only the hashing primitives.
 */
import { and, eq, isNull } from "drizzle-orm";
import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { db, schema } from "@/db/client";
import type { PlatformUser } from "@/db/schema";
import { platformCan, type PlatformAction } from "@/lib/platform-roles";
import { newToken, sha256 } from "./crypto";
import { requestIp } from "./auth";

const COOKIE = "eos_platform";
const IDLE_MS = 8 * 60 * 60 * 1000;
const ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;

export { platformCan };

export function requirePlatformAction(user: PlatformUser, action: PlatformAction) {
  if (!platformCan(user, action)) throw new Error(`Forbidden: platform ${action} required`);
}

export async function createPlatformSession(user: PlatformUser) {
  const database = await db();
  const { token, hash } = newToken();
  await database.insert(schema.platformSessions).values({
    id: hash,
    platformUserId: user.id,
    ip: requestIp(),
    userAgent: (getRequestHeader("user-agent") ?? "").slice(0, 300),
    expiresAt: new Date(Date.now() + IDLE_MS),
  });
  await database
    .update(schema.platformUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.platformUsers.id, user.id));
  setCookie(COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: Math.floor(ABSOLUTE_MS / 1000),
  });
}

export async function currentPlatformUser(): Promise<PlatformUser | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const database = await db();
  const id = sha256(token);

  const [row] = await database
    .select({ session: schema.platformSessions, user: schema.platformUsers })
    .from(schema.platformSessions)
    .innerJoin(
      schema.platformUsers,
      eq(schema.platformUsers.id, schema.platformSessions.platformUserId),
    )
    .where(and(eq(schema.platformSessions.id, id), isNull(schema.platformSessions.revokedAt)))
    .limit(1);

  if (!row) return null;

  const now = Date.now();
  if (
    row.session.expiresAt.getTime() < now ||
    row.session.createdAt.getTime() + ABSOLUTE_MS < now ||
    !row.user.active
  ) {
    await database
      .update(schema.platformSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.platformSessions.id, id));
    deleteCookie(COOKIE, { path: "/" });
    return null;
  }

  if (row.session.lastSeenAt.getTime() + 5 * 60 * 1000 < now) {
    await database
      .update(schema.platformSessions)
      .set({ lastSeenAt: new Date(now), expiresAt: new Date(now + IDLE_MS) })
      .where(eq(schema.platformSessions.id, id));
  }

  return row.user;
}

export async function requirePlatformUser(): Promise<PlatformUser> {
  const user = await currentPlatformUser();
  if (!user) throw new Error("Not signed in to the platform console");
  return user;
}

export async function endPlatformSession() {
  const token = getCookie(COOKIE);
  deleteCookie(COOKIE, { path: "/" });
  if (!token) return;
  const database = await db();
  await database
    .update(schema.platformSessions)
    .set({ revokedAt: new Date() })
    .where(eq(schema.platformSessions.id, sha256(token)));
}

export async function revokePlatformSessions(platformUserId: string) {
  const database = await db();
  await database
    .update(schema.platformSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.platformSessions.platformUserId, platformUserId),
        isNull(schema.platformSessions.revokedAt),
      ),
    );
}
