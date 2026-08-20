/**
 * Contacts, leads, inbox and channel endpoints (PRD 11–16, 79A).
 * Every handler resolves the caller from their session first.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCaller } from "@/server/auth";
import {
  LEAD_STATUSES,
  getContact,
  getLead,
  listContacts,
  listLeads,
  pipelineSummary,
  upsertContact,
  upsertLead,
  type LeadStatus,
} from "@/server/crm-service";
import {
  assignConversation,
  connectWebForm,
  disconnectChannel,
  getConversation,
  listChannels,
  listConversations,
  sendReply,
  setConversationStatus,
} from "@/server/inbox-service";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

/* ----------------------------------------------------------------- contacts */

export const fetchContacts = createServerFn({ method: "GET" })
  .validator((d: { query?: string }) =>
    z.object({ query: z.string().max(120).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const rows = await listContacts(await requireCaller(), data.query ?? "");
    return rows.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      optedOutAt: iso(c.optedOutAt),
    }));
  });

export const fetchContact = createServerFn({ method: "GET" })
  .validator((d: { contactId: string }) => z.object({ contactId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { contact, leads, conversations } = await getContact(
      await requireCaller(),
      data.contactId,
    );
    return {
      contact: {
        ...contact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
        optedOutAt: iso(contact.optedOutAt),
      },
      leads: leads.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        firstResponseAt: iso(l.firstResponseAt),
        nextActionAt: iso(l.nextActionAt),
        closedAt: iso(l.closedAt),
      })),
      conversations: conversations.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        lastMessageAt: c.lastMessageAt.toISOString(),
      })),
    };
  });

const contactInput = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(120),
  email: z.string().email().max(200).nullable().default(null),
  phone: z.string().max(40).nullable().default(null),
  type: z.string().max(30).default("buyer"),
  preferredChannel: z.string().max(20).default("email"),
  city: z.string().max(80).default(""),
  region: z.string().max(80).default(""),
  notes: z.string().max(4000).default(""),
  ownerId: z.string().nullable().default(null),
  consentEmail: z.boolean().default(true),
  consentSms: z.boolean().default(true),
  consentWhatsapp: z.boolean().default(true),
});

export const saveContact = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof contactInput>) => contactInput.parse(d))
  .handler(async ({ data }) => {
    const row = await upsertContact(await requireCaller(), data);
    return { id: row.id, name: row.name };
  });

/* -------------------------------------------------------------------- leads */

export const fetchLeads = createServerFn({ method: "GET" })
  .validator((d: { status?: string }) => z.object({ status: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await listLeads(await requireCaller(), data.status);
    return rows.map(({ lead, contact }) => ({
      id: lead.id,
      status: lead.status,
      type: lead.type,
      source: lead.source,
      assignedToId: lead.assignedToId,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      currency: lead.currency,
      location: lead.location,
      timeline: lead.timeline,
      createdAt: lead.createdAt.toISOString(),
      firstResponseAt: iso(lead.firstResponseAt),
      contact: { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone },
      score: lead.score,
      scoreBand: lead.scoreBand,
      slaDueAt: iso(lead.slaDueAt),
    }));
  });

export const fetchLead = createServerFn({ method: "GET" })
  .validator((d: { leadId: string }) => z.object({ leadId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { lead, contact } = await getLead(await requireCaller(), data.leadId);
    return {
      lead: {
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        firstResponseAt: iso(lead.firstResponseAt),
        nextActionAt: iso(lead.nextActionAt),
        qualifiedAt: iso(lead.qualifiedAt),
        assignedAt: iso(lead.assignedAt),
        slaDueAt: iso(lead.slaDueAt),
        closedAt: iso(lead.closedAt),
      },
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      },
    };
  });

const leadInput = z.object({
  id: z.string().optional(),
  contactId: z.string(),
  type: z.string().max(20).default("buyer"),
  status: z.enum(LEAD_STATUSES as unknown as [LeadStatus, ...LeadStatus[]]),
  source: z.string().max(60).default("Manual"),
  assignedToId: z.string().nullable().default(null),
  budgetMin: z.number().int().nullable().default(null),
  budgetMax: z.number().int().nullable().default(null),
  location: z.string().max(120).default(""),
  bedrooms: z.number().int().nullable().default(null),
  timeline: z.string().max(60).default(""),
  notes: z.string().max(4000).default(""),
  intent: z.string().max(40).optional(),
  financing: z.string().max(60).optional(),
});

export const saveLead = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof leadInput>) => leadInput.parse(d))
  .handler(async ({ data }) => {
    const row = await upsertLead(await requireCaller(), data);
    return { id: row.id, status: row.status };
  });

export const fetchPipeline = createServerFn({ method: "GET" }).handler(async () =>
  pipelineSummary(await requireCaller()),
);

/* -------------------------------------------------------------------- inbox */

export const fetchConversations = createServerFn({ method: "GET" })
  .validator((d: { status?: string }) => z.object({ status: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await listConversations(await requireCaller(), data.status ?? "open");
    return rows.map(({ conversation, contact, lead }) => ({
      id: conversation.id,
      channel: conversation.channel,
      subject: conversation.subject,
      status: conversation.status,
      unread: conversation.unread,
      assignedToId: conversation.assignedToId,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      contact: { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone },
      leadStatus: lead?.status ?? null,
      leadId: lead?.id ?? null,
    }));
  });

export const fetchConversation = createServerFn({ method: "GET" })
  .validator((d: { conversationId: string }) => z.object({ conversationId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { conversation, contact, messages } = await getConversation(
      await requireCaller(),
      data.conversationId,
    );
    return {
      conversation: {
        id: conversation.id,
        channel: conversation.channel,
        subject: conversation.subject,
        status: conversation.status,
        assignedToId: conversation.assignedToId,
        leadId: conversation.leadId,
      },
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        consentEmail: contact.consentEmail,
        consentWhatsapp: contact.consentWhatsapp,
        optedOut: Boolean(contact.optedOutAt),
      },
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        authorName: m.authorName,
        deliveryStatus: m.deliveryStatus,
        deliveryError: m.deliveryError,
        at: m.at.toISOString(),
      })),
    };
  });

export const replyToConversation = createServerFn({ method: "POST" })
  .validator((d: { conversationId: string; body: string }) =>
    z.object({ conversationId: z.string(), body: z.string().min(1).max(8000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const message = await sendReply(await requireCaller(), data.conversationId, data.body);
    return { id: message.id, deliveryStatus: message.deliveryStatus, error: message.deliveryError };
  });

export const closeConversation = createServerFn({ method: "POST" })
  .validator((d: { conversationId: string; status: "open" | "closed" }) =>
    z.object({ conversationId: z.string(), status: z.enum(["open", "closed"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const row = await setConversationStatus(
      await requireCaller(),
      data.conversationId,
      data.status,
    );
    return { id: row.id, status: row.status };
  });

export const assignConversationTo = createServerFn({ method: "POST" })
  .validator((d: { conversationId: string; userId: string | null }) =>
    z.object({ conversationId: z.string(), userId: z.string().nullable() }).parse(d),
  )
  .handler(async ({ data }) => {
    const row = await assignConversation(await requireCaller(), data.conversationId, data.userId);
    return { id: row.id, assignedToId: row.assignedToId };
  });

/* ----------------------------------------------------------------- channels */

export const fetchChannels = createServerFn({ method: "GET" }).handler(async () =>
  listChannels(await requireCaller()),
);

export const connectWebFormChannel = createServerFn({ method: "POST" })
  .validator((d: { label: string }) => z.object({ label: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => connectWebForm(await requireCaller(), data.label));

export const removeChannel = createServerFn({ method: "POST" })
  .validator((d: { channelId: string }) => z.object({ channelId: z.string() }).parse(d))
  .handler(async ({ data }) => disconnectChannel(await requireCaller(), data.channelId));
