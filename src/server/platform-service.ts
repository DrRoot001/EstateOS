/**
 * Organization provisioning and lifecycle (PRD 8B.2, PLAT 001–006).
 *
 * The platform console reads counts and health, never customer records: no lead,
 * contact, conversation or document is ever returned from this file. Reading a
 * tenant's data requires a consented support session, which is not built yet.
 */
import { count, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { Organization, PlatformUser } from "@/db/schema";
import { MARKETS, type MarketCode } from "@/lib/markets";
import { newToken, tokenExpiry } from "./crypto";
import { id, initialsOf } from "./org-service";
import { requestIp } from "./auth";
import { requirePlatformAction } from "./platform-auth";

/** Platform actions land in the customer's own audit log (PRD PLAT 005). */
async function platformAudit(
  actor: PlatformUser,
  organizationId: string,
  action: string,
  entity: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  const database = await db();
  await database.insert(schema.auditLog).values({
    id: id("au"),
    organizationId,
    actorUserId: null,
    actorPlatformUserId: actor.id,
    actorName: `Platform · ${actor.name}`,
    action,
    entity,
    entityId,
    before: (before ?? null) as never,
    after: (after ?? null) as never,
    ip: requestIp(),
    requestId: id("req"),
  });
}

export type OrganizationSummary = {
  id: string;
  name: string;
  primaryMarket: string;
  jurisdiction: string;
  timezone: string;
  reportingCurrency: string;
  licence: string;
  plan: string;
  seatLimit: number;
  status: string;
  createdAt: string;
  seatsUsed: number;
  offices: number;
  teams: number;
  pendingActivations: number;
  lastActivityAt: string | null;
  owner: { name: string; email: string; activated: boolean } | null;
};

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const database = await db();
  const orgs = await database
    .select()
    .from(schema.organizations)
    .orderBy(desc(schema.organizations.createdAt));

  return Promise.all(orgs.map((org) => summarize(org)));
}

async function summarize(org: Organization): Promise<OrganizationSummary> {
  const database = await db();
  const [members, officeRows, teamRows, lastEvent] = await Promise.all([
    database.select().from(schema.users).where(eq(schema.users.organizationId, org.id)),
    database
      .select({ n: count() })
      .from(schema.offices)
      .where(eq(schema.offices.organizationId, org.id)),
    database
      .select({ n: count() })
      .from(schema.teams)
      .where(eq(schema.teams.organizationId, org.id)),
    database
      .select({ at: schema.auditLog.at })
      .from(schema.auditLog)
      .where(eq(schema.auditLog.organizationId, org.id))
      .orderBy(desc(schema.auditLog.at))
      .limit(1),
  ]);

  const owner = members.find((m) => m.role === "owner");
  return {
    id: org.id,
    name: org.name,
    primaryMarket: org.primaryMarket,
    jurisdiction: org.jurisdiction,
    timezone: org.timezone,
    reportingCurrency: org.reportingCurrency,
    licence: org.licence,
    plan: org.plan,
    seatLimit: org.seatLimit,
    status: org.status,
    createdAt: org.createdAt.toISOString(),
    seatsUsed: members.filter((m) => m.active).length,
    offices: officeRows[0]?.n ?? 0,
    teams: teamRows[0]?.n ?? 0,
    pendingActivations: members.filter((m) => !m.passwordHash).length,
    lastActivityAt: lastEvent[0]?.at?.toISOString() ?? null,
    owner: owner
      ? { name: owner.name, email: owner.email, activated: Boolean(owner.passwordHash) }
      : null,
  };
}

export type ProvisionInput = {
  name: string;
  primaryMarket: MarketCode;
  jurisdiction: string;
  timezone: string;
  plan: string;
  seatLimit: number;
  licence: string;
  dataResidency: string;
  ownerName: string;
  ownerEmail: string;
};

/** PLAT 001 + PLAT 002: one organization, one head office, one Organization Owner. */
export async function provisionOrganization(actor: PlatformUser, input: ProvisionInput) {
  requirePlatformAction(actor, "org.provision");
  const database = await db();
  const pack = MARKETS[input.primaryMarket];
  if (!pack) throw new Error("Unknown market");

  const email = input.ownerEmail.trim().toLowerCase();
  const clash = await database
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (clash.length) throw new Error(`${email} already has an EstateOS account`);

  const orgId = id("org");
  const [org] = await database
    .insert(schema.organizations)
    .values({
      id: orgId,
      name: input.name.trim(),
      primaryMarket: input.primaryMarket,
      enabledMarkets: [input.primaryMarket],
      jurisdiction: input.jurisdiction || (pack.jurisdictions[0] ?? ""),
      timezone: input.timezone,
      reportingCurrency: pack.currency,
      licence: input.licence,
      dataResidency: input.dataResidency,
      plan: input.plan,
      seatLimit: input.seatLimit,
    })
    .returning();

  const officeId = id("of");
  await database.insert(schema.offices).values({
    id: officeId,
    organizationId: orgId,
    name: `${input.name.trim()} — head office`,
    market: input.primaryMarket,
    city: pack.cityPlaceholder,
    timezone: input.timezone,
    jurisdiction: input.jurisdiction || (pack.jurisdictions[0] ?? ""),
  });

  const ownerId = id("u");
  await database.insert(schema.users).values({
    id: ownerId,
    organizationId: orgId,
    email,
    name: input.ownerName.trim(),
    initials: initialsOf(input.ownerName),
    title: "Organization Owner",
    role: "owner",
    officeId,
  });

  const { token, hash } = newToken();
  await database.insert(schema.authTokens).values({
    id: hash,
    userId: ownerId,
    kind: "activation",
    expiresAt: tokenExpiry(),
  });

  await platformAudit(actor, orgId, "org.provisioned", "organization", orgId, null, {
    name: org!.name,
    market: input.primaryMarket,
    plan: input.plan,
    seats: input.seatLimit,
    owner: email,
  });

  return { organization: await summarize(org!), activationPath: `/activate?token=${token}` };
}

/** PLAT 003: change the plan, the seat limit, or the commercial details. */
export async function updateEntitlements(
  actor: PlatformUser,
  organizationId: string,
  input: { plan: string; seatLimit: number; licence: string; dataResidency: string },
) {
  requirePlatformAction(actor, "org.update");
  const database = await db();
  const before = await findOrg(organizationId);

  const active = await database
    .select({ n: count() })
    .from(schema.users)
    .where(sql`${schema.users.organizationId} = ${organizationId} and ${schema.users.active}`);
  if ((active[0]?.n ?? 0) > input.seatLimit)
    throw new Error(
      `That organization already has ${active[0]?.n} active members. Deactivate members before lowering the seat limit.`,
    );

  const [row] = await database
    .update(schema.organizations)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.organizations.id, organizationId))
    .returning();
  await platformAudit(
    actor,
    organizationId,
    "org.entitlements.updated",
    "organization",
    organizationId,
    before,
    row,
  );
  return summarize(row!);
}

/** PLAT 004: suspension blocks sign-in and outbound automation; data is untouched. */
export async function setOrganizationStatus(
  actor: PlatformUser,
  organizationId: string,
  status: "active" | "suspended" | "terminated",
  confirmation?: string,
) {
  requirePlatformAction(actor, "org.lifecycle");
  const database = await db();
  const org = await findOrg(organizationId);

  if (status === "terminated" && confirmation !== org.name)
    throw new Error("Type the organization name exactly to confirm termination");

  const [row] = await database
    .update(schema.organizations)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.organizations.id, organizationId))
    .returning();

  // Sign-in is already blocked by status, but live sessions must end immediately.
  if (status !== "active") {
    const members = await database
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.organizationId, organizationId));
    for (const member of members) {
      await database
        .update(schema.sessions)
        .set({ revokedAt: new Date() })
        .where(eq(schema.sessions.userId, member.id));
    }
  }

  await platformAudit(
    actor,
    organizationId,
    `org.${status}`,
    "organization",
    organizationId,
    { status: org.status },
    { status },
  );
  return summarize(row!);
}

/** PLAT 004: an export is produced before any termination takes effect. */
export async function exportOrganization(actor: PlatformUser, organizationId: string) {
  requirePlatformAction(actor, "org.update");
  const database = await db();
  const org = await findOrg(organizationId);
  const [offices, teams, users, audit] = await Promise.all([
    database.select().from(schema.offices).where(eq(schema.offices.organizationId, organizationId)),
    database.select().from(schema.teams).where(eq(schema.teams.organizationId, organizationId)),
    database.select().from(schema.users).where(eq(schema.users.organizationId, organizationId)),
    database
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.organizationId, organizationId)),
  ]);

  await platformAudit(actor, organizationId, "org.exported", "organization", organizationId, null, {
    records: offices.length + teams.length + users.length + audit.length,
  });

  return {
    exportedAt: new Date().toISOString(),
    organization: { ...org, createdAt: iso(org.createdAt), updatedAt: iso(org.updatedAt) },
    offices: offices.map((o) => ({ ...o, createdAt: iso(o.createdAt) })),
    teams: teams.map((t) => ({ ...t, createdAt: iso(t.createdAt) })),
    // Credentials never leave the database, not even in an export.
    users: users.map(({ passwordHash: _ignored, ...rest }) => ({
      ...rest,
      createdAt: iso(rest.createdAt),
      lastLoginAt: rest.lastLoginAt ? iso(rest.lastLoginAt) : null,
    })),
    auditLog: audit.map((entry) => ({
      ...entry,
      at: iso(entry.at),
      before: entry.before ? JSON.stringify(entry.before) : null,
      after: entry.after ? JSON.stringify(entry.after) : null,
    })),
  };
}

/** Re-issues the owner's activation link when the first one was lost. */
export async function reissueOwnerActivation(actor: PlatformUser, organizationId: string) {
  requirePlatformAction(actor, "org.update");
  const database = await db();
  await findOrg(organizationId);
  const [owner] = await database
    .select()
    .from(schema.users)
    .where(
      sql`${schema.users.organizationId} = ${organizationId} and ${schema.users.role} = 'owner'`,
    )
    .limit(1);
  if (!owner) throw new Error("That organization has no owner account");

  const { token, hash } = newToken();
  await database.insert(schema.authTokens).values({
    id: hash,
    userId: owner.id,
    kind: owner.passwordHash ? "reset" : "activation",
    expiresAt: tokenExpiry(),
  });
  await platformAudit(actor, organizationId, "auth.owner_link.issued", "user", owner.id, null, {
    email: owner.email,
  });
  return { email: owner.email, name: owner.name, path: `/activate?token=${token}` };
}

function iso(value: Date) {
  return value.toISOString();
}

async function findOrg(organizationId: string): Promise<Organization> {
  const database = await db();
  const [org] = await database
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);
  if (!org) throw new Error("Unknown organization");
  return org;
}

/* ------------------------------------------------------------- platform staff */

export async function listPlatformStaff() {
  const database = await db();
  const rows = await database
    .select()
    .from(schema.platformUsers)
    .orderBy(schema.platformUsers.createdAt);
  return rows.map(({ passwordHash, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    lastLoginAt: rest.lastLoginAt?.toISOString() ?? null,
    activated: Boolean(passwordHash),
  }));
}

export async function invitePlatformStaff(
  actor: PlatformUser,
  input: { name: string; email: string; role: "owner" | "admin" | "support" },
) {
  requirePlatformAction(actor, "staff.manage");
  const database = await db();
  const email = input.email.trim().toLowerCase();
  const clash = await database
    .select({ id: schema.platformUsers.id })
    .from(schema.platformUsers)
    .where(eq(schema.platformUsers.email, email))
    .limit(1);
  if (clash.length) throw new Error("That address is already platform staff");

  const staffId = id("pu");
  await database.insert(schema.platformUsers).values({
    id: staffId,
    email,
    name: input.name.trim(),
    initials: initialsOf(input.name),
    role: input.role,
  });

  const { token, hash } = newToken();
  await database.insert(schema.authTokens).values({
    id: hash,
    platformUserId: staffId,
    kind: "activation",
    expiresAt: tokenExpiry(),
  });
  return { email, name: input.name.trim(), path: `/activate?token=${token}` };
}
