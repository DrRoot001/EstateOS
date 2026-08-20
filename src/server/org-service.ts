/**
 * Tenant-scoped data access for the organization module (PRD 9, 10, 83).
 *
 * Every function here takes the authenticated caller and filters by
 * `caller.org.id` before anything else. No route, page, or server function may
 * reach the database except through this layer.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { AuditRow, Office, Organization, Team, UserRow } from "@/db/schema";
import { can, visibleUserIds, type OrgUser, type Permission } from "@/lib/rbac";
import { requestIp, type Caller } from "./auth";

export type PublicUser = OrgUser & { lastLoginAt: string | null };

/** Strips the password hash and anything else the client must never receive. */
export function publicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    initials: row.initials,
    role: row.role as OrgUser["role"],
    officeId: row.officeId,
    teamId: row.teamId,
    managerId: row.managerId,
    title: row.title,
    active: row.active,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
  };
}

export function requirePermission(caller: Caller, permission: Permission) {
  if (!can({ role: caller.user.role as OrgUser["role"], active: caller.user.active }, permission))
    throw new Error(`Forbidden: ${permission} required`);
}

export function id(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ----------------------------------------------------------------------- reads */

export async function listOffices(caller: Caller): Promise<Office[]> {
  const database = await db();
  return database
    .select()
    .from(schema.offices)
    .where(eq(schema.offices.organizationId, caller.org.id))
    .orderBy(schema.offices.createdAt);
}

export async function listTeams(caller: Caller): Promise<Team[]> {
  const database = await db();
  return database
    .select()
    .from(schema.teams)
    .where(eq(schema.teams.organizationId, caller.org.id))
    .orderBy(schema.teams.createdAt);
}

export async function listUsers(caller: Caller): Promise<UserRow[]> {
  const database = await db();
  return database
    .select()
    .from(schema.users)
    .where(eq(schema.users.organizationId, caller.org.id))
    .orderBy(schema.users.createdAt);
}

/**
 * The directory the caller is allowed to see: their role scope plus their
 * reporting line (PRD AUTH 014). Administrators with users.manage see everyone
 * in the organization because that is what managing people requires.
 */
export async function visibleDirectory(caller: Caller) {
  const rows = await listUsers(caller);
  const all = rows.map(publicUser);
  const me = all.find((u) => u.id === caller.user.id);
  if (!me) throw new Error("Caller is not a member of this organization");
  if (can(me, "users.manage")) return { me, users: all, visible: new Set(all.map((u) => u.id)) };
  const visible = visibleUserIds(me, all);
  return { me, users: all.filter((u) => visible.has(u.id)), visible };
}

export async function findUserById(caller: Caller, userId: string) {
  const database = await db();
  const [row] = await database
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.id, userId), eq(schema.users.organizationId, caller.org.id)))
    .limit(1);
  return row ?? null;
}

export async function listAuditEntries(caller: Caller, limit = 100): Promise<AuditRow[]> {
  const database = await db();
  return database
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.organizationId, caller.org.id))
    .orderBy(desc(schema.auditLog.at))
    .limit(limit);
}

/* ---------------------------------------------------------------------- audit */

export async function audit(
  caller: Pick<Caller, "org"> & { user: Pick<UserRow, "id" | "name"> },
  action: string,
  entity: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  const database = await db();
  await database.insert(schema.auditLog).values({
    id: id("au"),
    organizationId: caller.org.id,
    actorUserId: caller.user.id,
    actorName: caller.user.name,
    action,
    entity,
    entityId,
    before: (before ?? null) as never,
    after: (after ?? null) as never,
    ip: requestIp(),
    requestId: randomUUID(),
  });
}

/* --------------------------------------------------------------------- writes */

export async function upsertOffice(
  caller: Caller,
  input: {
    id?: string | undefined;
    name: string;
    market: string;
    city: string;
    timezone: string;
    jurisdiction: string;
    active: boolean;
  },
) {
  requirePermission(caller, "offices.manage");
  const database = await db();
  const existing = input.id ? await findOffice(caller, input.id) : null;
  if (input.id && !existing) throw new Error("Unknown office");

  const values = {
    name: input.name,
    market: input.market,
    city: input.city,
    timezone: input.timezone,
    jurisdiction: input.jurisdiction,
    active: input.active,
  };

  if (existing) {
    const [row] = await database
      .update(schema.offices)
      .set(values)
      .where(
        and(eq(schema.offices.id, existing.id), eq(schema.offices.organizationId, caller.org.id)),
      )
      .returning();
    await audit(caller, "office.update", "office", existing.id, existing, row);
    return row as Office;
  }

  const [row] = await database
    .insert(schema.offices)
    .values({ id: id("of"), organizationId: caller.org.id, ...values })
    .returning();
  await audit(caller, "office.create", "office", row!.id, null, row);
  return row as Office;
}

async function findOffice(caller: Caller, officeId: string) {
  const database = await db();
  const [row] = await database
    .select()
    .from(schema.offices)
    .where(and(eq(schema.offices.id, officeId), eq(schema.offices.organizationId, caller.org.id)))
    .limit(1);
  return row ?? null;
}

export async function upsertTeam(
  caller: Caller,
  input: {
    id?: string | undefined;
    officeId: string;
    name: string;
    managerId: string | null;
    active: boolean;
  },
) {
  requirePermission(caller, "teams.manage");
  const database = await db();
  if (!(await findOffice(caller, input.officeId))) throw new Error("Unknown office");
  if (input.managerId && !(await findUserById(caller, input.managerId)))
    throw new Error("Unknown manager");

  const values = {
    officeId: input.officeId,
    name: input.name,
    managerId: input.managerId,
    active: input.active,
  };

  if (input.id) {
    const [existing] = await database
      .select()
      .from(schema.teams)
      .where(and(eq(schema.teams.id, input.id), eq(schema.teams.organizationId, caller.org.id)))
      .limit(1);
    if (!existing) throw new Error("Unknown team");
    const [row] = await database
      .update(schema.teams)
      .set(values)
      .where(eq(schema.teams.id, existing.id))
      .returning();
    await audit(caller, "team.update", "team", existing.id, existing, row);
    return row as Team;
  }

  const [row] = await database
    .insert(schema.teams)
    .values({ id: id("tm"), organizationId: caller.org.id, ...values })
    .returning();
  await audit(caller, "team.create", "team", row!.id, null, row);
  return row as Team;
}

export type UserInput = {
  id?: string | undefined;
  name: string;
  email: string;
  title: string;
  role: OrgUser["role"];
  officeId: string | null;
  teamId: string | null;
  managerId: string | null;
  active: boolean;
};

export async function upsertUser(caller: Caller, input: UserInput) {
  requirePermission(caller, "users.manage");
  const database = await db();
  const directory = await visibleDirectory(caller);

  if (input.role === "owner" && caller.user.role !== "owner")
    throw new Error("Only an owner can grant the owner role");
  if (input.officeId && !(await findOffice(caller, input.officeId)))
    throw new Error("Unknown office");
  if (input.teamId) {
    const teams = await listTeams(caller);
    if (!teams.some((t) => t.id === input.teamId)) throw new Error("Unknown team");
  }
  if (input.managerId === input.id) throw new Error("A user cannot report to themselves");
  if (input.managerId && !directory.users.some((u) => u.id === input.managerId))
    throw new Error("Unknown manager");

  const email = input.email.trim().toLowerCase();
  const values = {
    name: input.name.trim(),
    email,
    initials: initialsOf(input.name),
    title: input.title,
    role: input.role,
    officeId: input.officeId,
    teamId: input.teamId,
    managerId: input.managerId,
    active: input.active,
  };

  const existing = input.id ? await findUserById(caller, input.id) : null;
  if (input.id && !existing) throw new Error("Unknown user");
  if (existing && !directory.visible.has(existing.id))
    throw new Error("Forbidden: that member is outside your scope");
  if (existing?.role === "owner" && caller.user.role !== "owner")
    throw new Error("Only an owner can edit an owner");

  if (wouldCycle(input.id ?? "new", input.managerId, directory.users))
    throw new Error("That reporting line would create a cycle");

  const clash = directory.users.find((u) => u.email === email && u.id !== existing?.id);
  if (clash) throw new Error("Another member already uses that email");

  if (existing) {
    const [row] = await database
      .update(schema.users)
      .set(values)
      .where(eq(schema.users.id, existing.id))
      .returning();
    await audit(
      caller,
      existing.role === values.role ? "user.update" : "permission.change",
      "user",
      existing.id,
      publicUser(existing),
      publicUser(row!),
    );
    return row as UserRow;
  }

  await assertSeatAvailable(caller);
  const [row] = await database
    .insert(schema.users)
    .values({ id: id("u"), organizationId: caller.org.id, ...values })
    .returning();
  await audit(caller, "user.create", "user", row!.id, null, publicUser(row!));
  return row as UserRow;
}

/** PRD PLAT 003: entitlements are enforced, with a clear message rather than a silent failure. */
export async function assertSeatAvailable(caller: Caller) {
  const users = await listUsers(caller);
  const used = users.filter((u) => u.active).length;
  if (used >= caller.org.seatLimit)
    throw new Error(
      `Seat limit reached (${used}/${caller.org.seatLimit}). Upgrade the plan or deactivate a member first.`,
    );
}

export async function setUserActiveState(caller: Caller, userId: string, active: boolean) {
  requirePermission(caller, "users.manage");
  const database = await db();
  const target = await findUserById(caller, userId);
  if (!target) throw new Error("Unknown user");
  if (target.id === caller.user.id) throw new Error("You cannot deactivate your own account");
  if (target.role === "owner" && caller.user.role !== "owner")
    throw new Error("Only an owner can deactivate an owner");
  const directory = await visibleDirectory(caller);
  if (!directory.visible.has(target.id))
    throw new Error("Forbidden: that member is outside your scope");
  if (active) await assertSeatAvailable(caller);

  const [row] = await database
    .update(schema.users)
    .set({ active })
    .where(eq(schema.users.id, target.id))
    .returning();
  await audit(
    caller,
    active ? "user.activate" : "user.deactivate",
    "user",
    target.id,
    publicUser(target),
    publicUser(row!),
  );
  return row as UserRow;
}

export async function updateOrganization(
  caller: Caller,
  input: {
    name: string;
    timezone: string;
    reportingCurrency: string;
    licence: string;
    dataResidency: string;
    slaFirstResponseMinutes: number;
    workingHoursStart: string;
    workingHoursEnd: string;
  },
) {
  requirePermission(caller, "org.manage");
  const database = await db();
  const [row] = await database
    .update(schema.organizations)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.organizations.id, caller.org.id))
    .returning();
  await audit(caller, "org.update", "organization", caller.org.id, caller.org, row);
  return row as Organization;
}

/** Walks up the reporting chain from `managerId`; true if it reaches `userId`. */
function wouldCycle(userId: string, managerId: string | null, users: PublicUser[]) {
  const seen = new Set([userId]);
  let current = managerId;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = users.find((u) => u.id === current)?.managerId ?? null;
  }
  return false;
}
