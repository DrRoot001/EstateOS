/**
 * Lead routing, scoring refresh and SLA tracking (PRD 18, 20–22).
 *
 * Two stages, exactly as the PRD describes: eligibility first, then ranking.
 * Every assignment records why it happened — an agent can always ask.
 */
import { and, count, eq, isNull, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { Lead, Organization } from "@/db/schema";
import { scoreLead } from "@/lib/scoring";
import { id } from "./org-service";

/* ------------------------------------------------------------------ scoring */

/** Recomputes the score from what we actually know about the lead right now. */
export async function refreshScore(leadId: string) {
  const database = await db();
  const [row] = await database
    .select({ lead: schema.leads, contact: schema.contacts })
    .from(schema.leads)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.leads.contactId))
    .where(eq(schema.leads.id, leadId))
    .limit(1);
  if (!row) return null;

  const [inbound] = await database
    .select({ n: count() })
    .from(schema.messages)
    .innerJoin(schema.conversations, eq(schema.conversations.id, schema.messages.conversationId))
    .where(
      and(
        eq(schema.conversations.contactId, row.contact.id),
        eq(schema.messages.direction, "inbound"),
      ),
    );

  const scored = scoreLead({
    intent: row.lead.intent || row.lead.type,
    timeline: row.lead.timeline,
    financing: row.lead.financing,
    budgetMax: row.lead.budgetMax,
    inboundMessages: inbound?.n ?? 0,
    ageHours: (Date.now() - row.lead.createdAt.getTime()) / 3_600_000,
    hasEmail: Boolean(row.contact.email),
    hasPhone: Boolean(row.contact.phone),
    location: row.lead.location,
    source: row.lead.source,
  });

  const [updated] = await database
    .update(schema.leads)
    .set({
      score: scored.score,
      scoreBand: scored.band,
      scoreReasons: scored.reasons,
      updatedAt: new Date(),
    })
    .where(eq(schema.leads.id, leadId))
    .returning();
  return updated as Lead;
}

/* ------------------------------------------------------------------ routing */

export type RoutingOutcome = {
  assignedToId: string | null;
  reason: string;
  slaDueAt: Date | null;
};

/**
 * Stage one — eligibility (PRD 20): active members who work leads, in the lead's
 * office when it has one. Stage two — ranking: fewest open leads wins, so work
 * spreads instead of piling on whoever answered last.
 */
export async function routeLead(lead: Lead, org: Organization): Promise<RoutingOutcome> {
  const database = await db();

  const candidates = await database
    .select({
      id: schema.users.id,
      name: schema.users.name,
      role: schema.users.role,
      officeId: schema.users.officeId,
    })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.organizationId, lead.organizationId),
        eq(schema.users.active, true),
        sql`${schema.users.role} in ('agent','isa','manager')`,
        // Only members who have activated their account can be given work.
        sql`${schema.users.passwordHash} is not null`,
      ),
    );

  const inOffice = lead.officeId
    ? candidates.filter((c) => c.officeId === lead.officeId)
    : candidates;
  const pool = (inOffice.length ? inOffice : candidates).filter((c) => c.role !== "manager");
  // A one-person organization routes to whoever exists, including the manager.
  const eligible = pool.length ? pool : inOffice.length ? inOffice : candidates;

  const slaDueAt = new Date(Date.now() + org.slaFirstResponseMinutes * 60_000);

  if (!eligible.length)
    return {
      assignedToId: null,
      reason: "No eligible member — invite an agent so new leads can be routed",
      slaDueAt,
    };

  const workload = await database
    .select({ userId: schema.leads.assignedToId, n: count() })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.organizationId, lead.organizationId),
        sql`${schema.leads.status} not in ('Won','Lost')`,
      ),
    )
    .groupBy(schema.leads.assignedToId);

  const openBy = new Map(workload.map((w) => [w.userId, w.n]));
  const ranked = [...eligible].sort(
    (a, b) => (openBy.get(a.id) ?? 0) - (openBy.get(b.id) ?? 0) || a.name.localeCompare(b.name),
  );
  const winner = ranked[0]!;

  return {
    assignedToId: winner.id,
    reason: `Lowest open workload in ${lead.officeId ? "the office" : "the organization"} (${openBy.get(winner.id) ?? 0} open leads)`,
    slaDueAt,
  };
}

/** Applies routing to a lead and records it, including on the audit trail. */
export async function assignLead(lead: Lead, org: Organization) {
  const database = await db();
  const outcome = await routeLead(lead, org);

  const [updated] = await database
    .update(schema.leads)
    .set({
      assignedToId: outcome.assignedToId,
      routingReason: outcome.reason,
      assignedAt: outcome.assignedToId ? new Date() : null,
      slaDueAt: outcome.slaDueAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.leads.id, lead.id))
    .returning();

  await database.insert(schema.auditLog).values({
    id: id("au"),
    organizationId: lead.organizationId,
    actorName: "Routing engine",
    action: outcome.assignedToId ? "lead.routed" : "lead.unrouted",
    entity: "lead",
    entityId: lead.id,
    after: { assignedToId: outcome.assignedToId, reason: outcome.reason } as never,
  });

  return updated as Lead;
}

/**
 * Leads past their first-response SLA with nobody having replied (PRD 21).
 * Read on demand rather than by a background job: the number is small and always
 * current, and there is no queue to babysit.
 */
export async function slaBreaches(organizationId: string) {
  const database = await db();
  return database
    .select({ lead: schema.leads, contact: schema.contacts })
    .from(schema.leads)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.leads.contactId))
    .where(
      and(
        eq(schema.leads.organizationId, organizationId),
        isNull(schema.leads.firstResponseAt),
        lt(schema.leads.slaDueAt, new Date()),
        sql`${schema.leads.status} not in ('Won','Lost')`,
      ),
    )
    .orderBy(schema.leads.slaDueAt)
    .limit(50);
}
