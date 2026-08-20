/**
 * Organization, hierarchy, people and audit endpoints (PRD 9, 10, 83).
 * Every handler resolves the caller from their session first — the client can
 * never name a user or an organization.
 */
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { MARKET_CODES } from "@/lib/markets";
import { ROLE_IDS, permissionsOf, type OrgUser, type RoleId } from "@/lib/rbac";
import {
  currentCaller,
  newToken,
  requireCaller,
  revokeUserSessions,
  tokenExpiry,
} from "@/server/auth";
import {
  audit,
  id,
  listAuditEntries,
  listOffices,
  listTeams,
  publicUser,
  requirePermission,
  setUserActiveState,
  updateOrganization,
  upsertOffice,
  upsertTeam,
  upsertUser,
  visibleDirectory,
  findUserById,
} from "@/server/org-service";

/**
 * Identity, organization and hierarchy for the shell. Returns null when nobody is
 * signed in; the root route turns that into a redirect.
 */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const caller = await currentCaller();
  if (!caller) return null;

  const [offices, teams, directory] = await Promise.all([
    listOffices(caller),
    listTeams(caller),
    visibleDirectory(caller),
  ]);

  const seatsUsed = directory.users.filter((u) => u.active).length;

  return {
    user: directory.me,
    org: {
      id: caller.org.id,
      name: caller.org.name,
      primaryMarket: caller.org.primaryMarket,
      enabledMarkets: caller.org.enabledMarkets,
      jurisdiction: caller.org.jurisdiction,
      timezone: caller.org.timezone,
      reportingCurrency: caller.org.reportingCurrency,
      licence: caller.org.licence,
      dataResidency: caller.org.dataResidency,
      plan: caller.org.plan,
      seatLimit: caller.org.seatLimit,
      seatsUsed,
      status: caller.org.status,
      workingHoursStart: caller.org.workingHoursStart,
      workingHoursEnd: caller.org.workingHoursEnd,
      slaFirstResponseMinutes: caller.org.slaFirstResponseMinutes,
    },
    offices: offices.map((o) => ({
      id: o.id,
      name: o.name,
      market: o.market,
      city: o.city,
      timezone: o.timezone,
      jurisdiction: o.jurisdiction,
      active: o.active,
    })),
    teams: teams.map((t) => ({
      id: t.id,
      officeId: t.officeId,
      name: t.name,
      managerId: t.managerId,
      active: t.active,
    })),
    users: directory.users,
    permissions: permissionsOf(directory.me.role),
  };
});

const officeInput = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  market: z.enum(MARKET_CODES as [string, ...string[]]),
  city: z.string().min(1).max(80),
  timezone: z.string().min(1).max(60),
  jurisdiction: z.string().max(80).default(""),
  active: z.boolean().default(true),
});

export const saveOffice = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof officeInput>) => officeInput.parse(d))
  .handler(async ({ data }) => upsertOffice(await requireCaller(), data));

const teamInput = z.object({
  id: z.string().optional(),
  officeId: z.string().min(1),
  name: z.string().min(2).max(80),
  managerId: z.string().nullable().default(null),
  active: z.boolean().default(true),
});

export const saveTeam = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof teamInput>) => teamInput.parse(d))
  .handler(async ({ data }) => upsertTeam(await requireCaller(), data));

const userInput = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  email: z.string().email().max(200),
  title: z.string().max(80).default(""),
  role: z.enum(ROLE_IDS as [RoleId, ...RoleId[]]),
  officeId: z.string().nullable().default(null),
  teamId: z.string().nullable().default(null),
  managerId: z.string().nullable().default(null),
  active: z.boolean().default(true),
});

export const saveUser = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof userInput>) => userInput.parse(d))
  .handler(async ({ data }) => {
    const row = await upsertUser(await requireCaller(), data as Parameters<typeof upsertUser>[1]);
    return publicUser(row);
  });

export const setUserActive = createServerFn({ method: "POST" })
  .validator((d: { userId: string; active: boolean }) =>
    z.object({ userId: z.string(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const caller = await requireCaller();
    const row = await setUserActiveState(caller, data.userId, data.active);
    if (!data.active) await revokeUserSessions(row.id);
    return publicUser(row);
  });

const orgInput = z.object({
  name: z.string().min(2).max(80),
  timezone: z.string().min(1).max(60),
  reportingCurrency: z.string().length(3),
  licence: z.string().max(80).default(""),
  dataResidency: z.string().max(40).default(""),
  slaFirstResponseMinutes: z.number().int().min(1).max(1440),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/),
});

export const saveOrg = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof orgInput>) => orgInput.parse(d))
  .handler(async ({ data }) => {
    const org = await updateOrganization(await requireCaller(), data);
    return { name: org.name, slaFirstResponseMinutes: org.slaFirstResponseMinutes };
  });

export const listAudit = createServerFn({ method: "GET" }).handler(async () => {
  const caller = await requireCaller();
  requirePermission(caller, "audit.view");
  const rows = await listAuditEntries(caller);
  return rows.map((r) => ({
    id: r.id,
    at: r.at.toISOString(),
    actorName: r.actorName,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    before: r.before ? JSON.stringify(r.before) : null,
    after: r.after ? JSON.stringify(r.after) : null,
    ip: r.ip,
  }));
});

/**
 * Issues a single-use activation or reset link for a member (PRD AUTH 009, 010).
 *
 * ponytail: the link is returned to the administrator to deliver, because email
 * delivery is not connected yet (PRD 79A, Phase 4). Once it is, this sends the
 * mail instead of returning a URL — and the caller stops seeing the token.
 */
export const issueAccessLink = createServerFn({ method: "POST" })
  .validator((d: { userId: string; kind: "activation" | "reset" }) =>
    z.object({ userId: z.string(), kind: z.enum(["activation", "reset"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const caller = await requireCaller();
    requirePermission(caller, "users.manage");
    const target = await findUserById(caller, data.userId);
    if (!target) throw new Error("Unknown user");
    const directory = await visibleDirectory(caller);
    if (!directory.visible.has(target.id))
      throw new Error("Forbidden: that member is outside your scope");
    if (target.role === "owner" && caller.user.role !== "owner")
      throw new Error("Only an owner can issue links for an owner");

    const database = await db();
    const { token, hash } = newToken();
    await database.insert(schema.authTokens).values({
      id: hash,
      userId: target.id,
      kind: data.kind,
      expiresAt: tokenExpiry(),
    });
    await audit(
      caller,
      data.kind === "activation" ? "auth.invitation.issued" : "auth.reset.issued",
      "user",
      target.id,
      null,
      { kind: data.kind, email: target.email },
    );

    return {
      email: target.email,
      name: target.name,
      path: `/activate?token=${token}`,
      expiresAt: tokenExpiry().toISOString(),
    };
  });

export const revokeSessions = createServerFn({ method: "POST" })
  .validator((d: { userId: string }) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const caller = await requireCaller();
    requirePermission(caller, "users.manage");
    const target = await findUserById(caller, data.userId);
    if (!target) throw new Error("Unknown user");
    const directory = await visibleDirectory(caller);
    if (!directory.visible.has(target.id))
      throw new Error("Forbidden: that member is outside your scope");
    await revokeUserSessions(target.id);
    await audit(caller, "auth.sessions.revoked", "user", target.id, null, null);
    return { ok: true as const };
  });

/** Who has never signed in, so the People table can show "invitation pending". */
export const listPendingActivations = createServerFn({ method: "GET" }).handler(async () => {
  const caller = await requireCaller();
  requirePermission(caller, "users.manage");
  const database = await db();
  const rows = await database
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.organizationId, caller.org.id));
  return rows.filter((r) => !r.passwordHash).map((r) => r.id);
});

export type SessionUser = OrgUser;
