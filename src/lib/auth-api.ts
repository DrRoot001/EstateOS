/**
 * Public authentication endpoints (PRD 10A). These are the only server functions
 * callable without a session.
 */
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db/client";
import {
  assertNotThrottled,
  clearFailures,
  createSession,
  currentCaller,
  endCurrentSession,
  hashPassword,
  recordFailure,
  requestIp,
  requireCaller,
  revokeUserSessions,
  sha256,
  verifyPassword,
} from "@/server/auth";
import { audit } from "@/server/org-service";
import { createPlatformSession, revokePlatformSessions } from "@/server/platform-auth";

const credentials = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const signIn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => credentials.parse(d))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    // Throttle by account and by origin (PRD AUTH 002).
    assertNotThrottled(`email:${email}`);
    assertNotThrottled(`ip:${requestIp()}`);

    const database = await db();
    const [row] = await database
      .select({ user: schema.users, org: schema.organizations })
      .from(schema.users)
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.users.organizationId))
      .where(eq(schema.users.email, email))
      .limit(1);

    const ok = row ? await verifyPassword(data.password, row.user.passwordHash) : false;

    // One message for every failure mode (PRD AUTH 003).
    if (!ok || !row || !row.user.active || row.org.status !== "active") {
      recordFailure(`email:${email}`);
      recordFailure(`ip:${requestIp()}`);
      if (row)
        await audit(
          { org: row.org, user: { id: row.user.id, name: row.user.name } },
          "auth.signin.failed",
          "user",
          row.user.id,
          null,
          null,
        );
      throw new Error("Email or password is incorrect");
    }

    clearFailures(`email:${email}`);
    clearFailures(`ip:${requestIp()}`);
    await createSession(row.user);
    await audit(
      { org: row.org, user: { id: row.user.id, name: row.user.name } },
      "auth.signin",
      "user",
      row.user.id,
      null,
      null,
    );
    return { ok: true as const };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const caller = await currentCaller();
  if (caller) {
    await audit(caller, "auth.signout", "user", caller.user.id, null, null);
  }
  await endCurrentSession();
  return { ok: true as const };
});

export const signOutEverywhere = createServerFn({ method: "POST" }).handler(async () => {
  const caller = await requireCaller();
  await revokeUserSessions(caller.user.id);
  await audit(caller, "auth.sessions.revoked", "user", caller.user.id, null, null);
  return { ok: true as const };
});

/** Reads an activation or reset link without consuming it, so the page can render. */
export const inspectAuthToken = createServerFn({ method: "GET" })
  .validator((d: { token: string }) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const database = await db();
    const [row] = await database
      .select()
      .from(schema.authTokens)
      .where(eq(schema.authTokens.id, sha256(data.token)))
      .limit(1);

    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now())
      return { valid: false as const };

    const account = await accountFor(row);
    if (!account) return { valid: false as const };

    return {
      valid: true as const,
      kind: row.kind as "activation" | "reset",
      audience: account.audience,
      name: account.name,
      email: account.email,
    };
  });

/** A token belongs either to a tenant member or to platform staff, never both. */
async function accountFor(token: { userId: string | null; platformUserId: string | null }) {
  const database = await db();
  if (token.userId) {
    const [user] = await database
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, token.userId))
      .limit(1);
    return user ? { audience: "organization" as const, ...user } : null;
  }
  if (token.platformUserId) {
    const [staff] = await database
      .select()
      .from(schema.platformUsers)
      .where(eq(schema.platformUsers.id, token.platformUserId))
      .limit(1);
    return staff ? { audience: "platform" as const, ...staff } : null;
  }
  return null;
}

/**
 * Completes an invitation or a password reset. Both flows end here: set the
 * password, consume the token, revoke every existing session (PRD AUTH 010).
 */
export const setPasswordWithToken = createServerFn({ method: "POST" })
  .validator((d: { token: string; password: string }) =>
    z.object({ token: z.string().min(10), password: z.string().min(12).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    assertNotThrottled(`ip:${requestIp()}`);
    const database = await db();
    const hash = sha256(data.token);

    const [token] = await database
      .select()
      .from(schema.authTokens)
      .where(eq(schema.authTokens.id, hash))
      .limit(1);

    const account = token ? await accountFor(token) : null;
    if (!token || !account || token.usedAt || token.expiresAt.getTime() < Date.now()) {
      recordFailure(`ip:${requestIp()}`);
      throw new Error("That link is no longer valid. Ask an administrator for a new one.");
    }
    if (!account.active) throw new Error("That account is disabled");

    const passwordHash = await hashPassword(data.password);
    await database
      .update(schema.authTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.authTokens.id, hash));

    if (account.audience === "platform") {
      await database
        .update(schema.platformUsers)
        .set({ passwordHash })
        .where(eq(schema.platformUsers.id, account.id));
      await revokePlatformSessions(account.id);
      await createPlatformSession({ ...account, passwordHash });
      return { ok: true as const, audience: "platform" as const };
    }

    const [org] = await database
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, account.organizationId))
      .limit(1);
    if (!org) throw new Error("That organization no longer exists");

    await database
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, account.id));
    await revokeUserSessions(account.id);
    await audit(
      { org, user: { id: account.id, name: account.name } },
      token.kind === "activation" ? "auth.account.activated" : "auth.password.reset",
      "user",
      account.id,
      null,
      null,
    );
    await createSession({ ...account, passwordHash });
    return { ok: true as const, audience: "organization" as const };
  });

/** Changing your own password requires proving you know the current one. */
export const changePassword = createServerFn({ method: "POST" })
  .validator((d: { current: string; next: string }) =>
    z.object({ current: z.string().min(1), next: z.string().min(12).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const caller = await requireCaller();
    assertNotThrottled(`pwchange:${caller.user.id}`);
    if (!(await verifyPassword(data.current, caller.user.passwordHash))) {
      recordFailure(`pwchange:${caller.user.id}`);
      throw new Error("Current password is incorrect");
    }
    const database = await db();
    const passwordHash = await hashPassword(data.next);
    await database
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, caller.user.id));
    await revokeUserSessions(caller.user.id);
    await audit(caller, "auth.password.changed", "user", caller.user.id, null, null);
    await createSession({ ...caller.user, passwordHash });
    return { ok: true as const };
  });
