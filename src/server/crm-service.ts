/**
 * Contacts, leads and identity resolution (PRD 7.1, 7.2, 13, 14, 15).
 *
 * Tenant-scoped like everything else: `caller.org.id` filters first, then the
 * hierarchy decides which records the caller may see (PRD 10).
 */
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db, schema } from "@/db/client";
import type { Contact, Lead } from "@/db/schema";
import { can, visibleUserIds, type OrgUser } from "@/lib/rbac";
import type { Caller } from "./auth";
import { audit, id, listUsers, publicUser, requirePermission } from "./org-service";
import { refreshScore } from "./routing";

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Viewing",
  "Offer",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Normalised keys used for duplicate detection (PRD 14, level one). */
export function normaliseEmail(email: string | null | undefined) {
  const value = (email ?? "").trim().toLowerCase();
  return value || null;
}

export function normalisePhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  return digits.length >= 7 ? digits : null;
}

/** The set of member ids whose records this caller may read. */
async function scope(caller: Caller) {
  const rows = await listUsers(caller);
  const directory = rows.map(publicUser);
  const me = directory.find((u) => u.id === caller.user.id);
  if (!me) throw new Error("Caller is not a member of this organization");
  return { me, ids: visibleUserIds(me as OrgUser, directory as OrgUser[]) };
}

/** Unassigned records stay visible to anyone who can assign them. */
function ownerFilter(ids: Set<string>, column: AnyPgColumn, canAssign: boolean) {
  const list = [...ids];
  const owned = list.length ? sql`${column} in ${list}` : sql`false`;
  return canAssign ? or(owned, isNull(column)) : owned;
}

/* -------------------------------------------------------------------- reads */

export async function listContacts(caller: Caller, query = "") {
  requirePermission(caller, "contacts.view");
  const database = await db();
  const { me, ids } = await scope(caller);
  const like = `%${query.trim().toLowerCase()}%`;

  return database
    .select()
    .from(schema.contacts)
    .where(
      and(
        eq(schema.contacts.organizationId, caller.org.id),
        ownerFilter(ids, schema.contacts.ownerId, can(me, "leads.assign")),
        query.trim()
          ? sql`(lower(${schema.contacts.name}) like ${like} or lower(coalesce(${schema.contacts.email}, '')) like ${like} or coalesce(${schema.contacts.phone}, '') like ${like})`
          : undefined,
      ),
    )
    .orderBy(desc(schema.contacts.updatedAt))
    .limit(200);
}

export async function getContact(caller: Caller, contactId: string) {
  requirePermission(caller, "contacts.view");
  const database = await db();
  const { me, ids } = await scope(caller);
  const [contact] = await database
    .select()
    .from(schema.contacts)
    .where(
      and(
        eq(schema.contacts.id, contactId),
        eq(schema.contacts.organizationId, caller.org.id),
        ownerFilter(ids, schema.contacts.ownerId, can(me, "leads.assign")),
      ),
    )
    .limit(1);
  if (!contact) throw new Error("Contact not found");

  const [contactLeads, conversations] = await Promise.all([
    database
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.contactId, contactId))
      .orderBy(desc(schema.leads.createdAt)),
    database
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.contactId, contactId))
      .orderBy(desc(schema.conversations.lastMessageAt)),
  ]);

  return { contact, leads: contactLeads, conversations };
}

export async function listLeads(caller: Caller, status?: string) {
  requirePermission(caller, "leads.view");
  const database = await db();
  const { me, ids } = await scope(caller);

  return database
    .select({ lead: schema.leads, contact: schema.contacts })
    .from(schema.leads)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.leads.contactId))
    .where(
      and(
        eq(schema.leads.organizationId, caller.org.id),
        ownerFilter(ids, schema.leads.assignedToId, can(me, "leads.assign")),
        status && status !== "all" ? eq(schema.leads.status, status) : undefined,
      ),
    )
    .orderBy(desc(schema.leads.updatedAt))
    .limit(200);
}

export async function getLead(caller: Caller, leadId: string) {
  requirePermission(caller, "leads.view");
  const database = await db();
  const { me, ids } = await scope(caller);
  const [row] = await database
    .select({ lead: schema.leads, contact: schema.contacts })
    .from(schema.leads)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.leads.contactId))
    .where(
      and(
        eq(schema.leads.id, leadId),
        eq(schema.leads.organizationId, caller.org.id),
        ownerFilter(ids, schema.leads.assignedToId, can(me, "leads.assign")),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Lead not found");
  return row;
}

/* ------------------------------------------------------- identity resolution */

/**
 * PRD 14: find the canonical person before creating another one. Exact email is
 * level one, exact phone is level two; anything weaker is left to a human.
 */
export async function resolveContact(
  organizationId: string,
  input: { name: string; email?: string | null; phone?: string | null },
): Promise<{ contact: Contact; matched: boolean }> {
  const database = await db();
  const email = normaliseEmail(input.email);
  const phone = normalisePhone(input.phone);

  if (email || phone) {
    const [existing] = await database
      .select()
      .from(schema.contacts)
      .where(
        and(
          eq(schema.contacts.organizationId, organizationId),
          or(
            email ? eq(schema.contacts.email, email) : undefined,
            phone ? eq(schema.contacts.phone, phone) : undefined,
          ),
        ),
      )
      .limit(1);

    if (existing) {
      // Fill in whichever identifier we did not have before.
      const patch: Partial<Contact> = {};
      if (!existing.email && email) patch.email = email;
      if (!existing.phone && phone) patch.phone = phone;
      if (Object.keys(patch).length) {
        const [updated] = await database
          .update(schema.contacts)
          .set({ ...patch, updatedAt: new Date() })
          .where(eq(schema.contacts.id, existing.id))
          .returning();
        return { contact: updated as Contact, matched: true };
      }
      return { contact: existing, matched: true };
    }
  }

  const [created] = await database
    .insert(schema.contacts)
    .values({
      id: id("ct"),
      organizationId,
      name: input.name.trim() || email || phone || "Unknown",
      email,
      phone,
    })
    .returning();
  return { contact: created as Contact, matched: false };
}

/* ------------------------------------------------------------------- writes */

export type ContactInput = {
  id?: string | undefined;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  preferredChannel: string;
  city: string;
  region: string;
  notes: string;
  ownerId: string | null;
  consentEmail: boolean;
  consentSms: boolean;
  consentWhatsapp: boolean;
};

export async function upsertContact(caller: Caller, input: ContactInput) {
  requirePermission(caller, "contacts.edit");
  const database = await db();
  const values = {
    name: input.name.trim(),
    email: normaliseEmail(input.email),
    phone: normalisePhone(input.phone),
    type: input.type,
    preferredChannel: input.preferredChannel,
    city: input.city,
    region: input.region,
    notes: input.notes,
    ownerId: input.ownerId,
    consentEmail: input.consentEmail,
    consentSms: input.consentSms,
    consentWhatsapp: input.consentWhatsapp,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [existing] = await database
      .select()
      .from(schema.contacts)
      .where(
        and(eq(schema.contacts.id, input.id), eq(schema.contacts.organizationId, caller.org.id)),
      )
      .limit(1);
    if (!existing) throw new Error("Contact not found");
    const [row] = await database
      .update(schema.contacts)
      .set(values)
      .where(eq(schema.contacts.id, input.id))
      .returning();
    await audit(caller, "contact.update", "contact", input.id, existing, row);
    return row as Contact;
  }

  const [row] = await database
    .insert(schema.contacts)
    .values({ id: id("ct"), organizationId: caller.org.id, ...values })
    .returning();
  await audit(caller, "contact.create", "contact", row!.id, null, row);
  return row as Contact;
}

export type LeadInput = {
  id?: string | undefined;
  contactId: string;
  type: string;
  status: LeadStatus;
  source: string;
  assignedToId: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  location: string;
  bedrooms: number | null;
  timeline: string;
  notes: string;
  /** Qualification (PRD 17) — optional so a stage change need not resend it. */
  intent?: string | undefined;
  financing?: string | undefined;
};

export async function upsertLead(caller: Caller, input: LeadInput) {
  requirePermission(caller, "leads.edit");
  const database = await db();

  const [contact] = await database
    .select()
    .from(schema.contacts)
    .where(
      and(
        eq(schema.contacts.id, input.contactId),
        eq(schema.contacts.organizationId, caller.org.id),
      ),
    )
    .limit(1);
  if (!contact) throw new Error("Contact not found");

  // Only someone who may assign work can hand a lead to another member.
  const assignedToId = can(caller.user as never, "leads.assign")
    ? input.assignedToId
    : (input.assignedToId ?? caller.user.id);

  const values = {
    contactId: input.contactId,
    type: input.type,
    status: input.status,
    source: input.source,
    assignedToId,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    currency: caller.org.reportingCurrency,
    location: input.location,
    bedrooms: input.bedrooms,
    timeline: input.timeline,
    notes: input.notes,
    intent: input.intent ?? "",
    financing: input.financing ?? "",
    qualifiedAt: input.timeline && input.financing && input.budgetMax ? new Date() : null,
    closedAt: input.status === "Won" || input.status === "Lost" ? new Date() : null,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [existing] = await database
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.id, input.id), eq(schema.leads.organizationId, caller.org.id)))
      .limit(1);
    if (!existing) throw new Error("Lead not found");
    const [row] = await database
      .update(schema.leads)
      .set(values)
      .where(eq(schema.leads.id, input.id))
      .returning();
    await audit(
      caller,
      existing.assignedToId === assignedToId ? "lead.update" : "lead.reassign",
      "lead",
      input.id,
      existing,
      row,
    );
    return (await refreshScore(input.id)) ?? (row as Lead);
  }

  const [row] = await database
    .insert(schema.leads)
    .values({
      id: id("ld"),
      organizationId: caller.org.id,
      officeId: caller.user.officeId,
      ...values,
    })
    .returning();
  await audit(caller, "lead.create", "lead", row!.id, null, row);
  return (await refreshScore(row!.id)) ?? (row as Lead);
}

/** Pipeline counts for the dashboard, already scoped to the caller. */
export async function pipelineSummary(caller: Caller) {
  if (!can(caller.user as never, "leads.view")) return null;
  const database = await db();
  const { me, ids } = await scope(caller);

  const rows = await database
    .select({ status: schema.leads.status, n: sql<number>`count(*)::int` })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.organizationId, caller.org.id),
        ownerFilter(ids, schema.leads.assignedToId, can(me, "leads.assign")),
      ),
    )
    .groupBy(schema.leads.status);

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  const open = LEAD_STATUSES.filter((s) => s !== "Won" && s !== "Lost").reduce(
    (sum, s) => sum + (byStatus[s] ?? 0),
    0,
  );
  return { byStatus, open, unanswered: byStatus["New"] ?? 0 };
}
