/**
 * Channels, conversations and messages (PRD 11, 12, 79A).
 *
 * Inbound events become a Contact, a Lead and a threaded Conversation in one
 * step, so nobody has to open Gmail or WhatsApp to see what arrived.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { ChannelConnection, Conversation, Message } from "@/db/schema";
import { can, visibleUserIds, type OrgUser } from "@/lib/rbac";
import type { Caller } from "./auth";
import { audit, id, listUsers, publicUser, requirePermission } from "./org-service";
import { resolveContact } from "./crm-service";
import { assignLead, refreshScore } from "./routing";

export const CHANNEL_KINDS = ["webform", "email", "whatsapp", "sms"] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

/* ------------------------------------------------------------ secret storage */

/**
 * Channel secrets are encrypted at rest with a key derived from SESSION_SECRET.
 * ponytail: one static key, no rotation. Move to a KMS when there is more than
 * one deployment to rotate — the call sites do not change.
 */
function key() {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < 16)
    throw new Error("SESSION_SECRET must be set (32+ characters) before connecting a channel");
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    data.toString("base64"),
  ].join(".");
}

export function decryptSecret<T>(stored: string | null): T | null {
  if (!stored) return null;
  const [iv, tag, data] = stored.split(".");
  if (!iv || !tag || !data) return null;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as T;
}

/* ----------------------------------------------------------------- channels */

export async function listChannels(caller: Caller) {
  const database = await db();
  const rows = await database
    .select()
    .from(schema.channelConnections)
    .where(eq(schema.channelConnections.organizationId, caller.org.id))
    .orderBy(schema.channelConnections.createdAt);
  // The secret never leaves the server, not even to an administrator.
  return rows.map(({ secret: _secret, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    lastEventAt: rest.lastEventAt?.toISOString() ?? null,
  }));
}

/**
 * Website forms need nothing from Google or Meta: EstateOS mints an endpoint and
 * a key, the customer pastes one snippet, and leads start arriving.
 */
export async function connectWebForm(caller: Caller, label: string) {
  requirePermission(caller, "integrations.manage");
  const database = await db();
  const [row] = await database
    .insert(schema.channelConnections)
    .values({
      id: id("ch"),
      organizationId: caller.org.id,
      kind: "webform",
      label: label.trim() || "Website form",
      status: "connected",
      publicKey: `wf_${randomBytes(18).toString("base64url")}`,
      createdById: caller.user.id,
    })
    .returning();
  await audit(caller, "channel.connected", "channel", row!.id, null, {
    kind: "webform",
    label: row!.label,
  });
  return { id: row!.id, publicKey: row!.publicKey!, label: row!.label };
}

export async function disconnectChannel(caller: Caller, channelId: string) {
  requirePermission(caller, "integrations.manage");
  const database = await db();
  const [existing] = await database
    .select()
    .from(schema.channelConnections)
    .where(
      and(
        eq(schema.channelConnections.id, channelId),
        eq(schema.channelConnections.organizationId, caller.org.id),
      ),
    )
    .limit(1);
  if (!existing) throw new Error("Channel not found");

  await database
    .delete(schema.channelConnections)
    .where(eq(schema.channelConnections.id, channelId));
  await audit(caller, "channel.disconnected", "channel", channelId, existing, null);
  return { ok: true as const };
}

export async function findChannelByPublicKey(publicKey: string) {
  const database = await db();
  const [row] = await database
    .select()
    .from(schema.channelConnections)
    .where(eq(schema.channelConnections.publicKey, publicKey))
    .limit(1);
  return (row as ChannelConnection | undefined) ?? null;
}

/* ------------------------------------------------------------------- intake */

export type InboundEvent = {
  channel: ChannelConnection;
  name: string;
  email?: string | null;
  phone?: string | null;
  message: string;
  subject?: string | undefined;
  /** Provider id, so a replayed webhook cannot create a second message (PRD 81). */
  externalId?: string | null | undefined;
  meta?: Record<string, unknown> | undefined;
};

/**
 * One inbound event → canonical contact → open lead → threaded conversation.
 * Everything an organization sees in the inbox comes through here.
 */
export async function ingestInbound(event: InboundEvent) {
  const database = await db();
  const organizationId = event.channel.organizationId;

  if (event.externalId) {
    const [seen] = await database
      .select({ id: schema.messages.id })
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.organizationId, organizationId),
          eq(schema.messages.externalId, event.externalId),
        ),
      )
      .limit(1);
    if (seen) return { duplicate: true as const, messageId: seen.id };
  }

  const { contact, matched } = await resolveContact(organizationId, {
    name: event.name,
    email: event.email ?? null,
    phone: event.phone ?? null,
  });

  // An open lead per contact per channel; a returning enquiry joins its thread.
  const [openLead] = await database
    .select()
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.organizationId, organizationId),
        eq(schema.leads.contactId, contact.id),
        sql`${schema.leads.status} not in ('Won','Lost')`,
      ),
    )
    .orderBy(desc(schema.leads.createdAt))
    .limit(1);

  const lead =
    openLead ??
    (
      await database
        .insert(schema.leads)
        .values({
          id: id("ld"),
          organizationId,
          contactId: contact.id,
          status: "New",
          source: sourceLabel(event.channel),
          sourceDetail: event.channel.label,
          intent: event.channel.kind === "webform" ? "Buying" : "",
        })
        .returning()
    )[0]!;

  const [existingThread] = await database
    .select()
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.organizationId, organizationId),
        eq(schema.conversations.contactId, contact.id),
        eq(schema.conversations.channel, event.channel.kind),
      ),
    )
    .limit(1);

  const conversation =
    existingThread ??
    (
      await database
        .insert(schema.conversations)
        .values({
          id: id("cv"),
          organizationId,
          contactId: contact.id,
          leadId: lead.id,
          channelId: event.channel.id,
          channel: event.channel.kind,
          subject: event.subject ?? `${sourceLabel(event.channel)} enquiry`,
        })
        .returning()
    )[0]!;

  const [message] = await database
    .insert(schema.messages)
    .values({
      id: id("ms"),
      organizationId,
      conversationId: conversation.id,
      direction: "inbound",
      channel: event.channel.kind,
      body: event.message.trim(),
      authorName: contact.name,
      deliveryStatus: "received",
      externalId: event.externalId ?? null,
      payload: (event.meta ?? {}) as Record<string, unknown>,
    })
    .returning();

  await database
    .update(schema.conversations)
    .set({ lastMessageAt: new Date(), unread: true, status: "open" })
    .where(eq(schema.conversations.id, conversation.id));

  await database
    .update(schema.channelConnections)
    .set({ lastEventAt: new Date(), status: "connected", lastError: null })
    .where(eq(schema.channelConnections.id, event.channel.id));

  await database.insert(schema.auditLog).values({
    id: id("au"),
    organizationId,
    actorName: `Channel · ${event.channel.label}`,
    action: matched ? "message.received" : "contact.created_by_intake",
    entity: "conversation",
    entityId: conversation.id,
    after: { contact: contact.name, channel: event.channel.kind } as never,
  });

  // Score first, then route: assignment reads the workload, not the score, but a
  // manager looking at the queue needs both to be current (PRD 18, 20).
  await refreshScore(lead.id);
  if (!openLead) {
    const [org] = await database
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, organizationId))
      .limit(1);
    if (org) await assignLead(lead, org);
  }

  return {
    duplicate: false as const,
    contactId: contact.id,
    leadId: lead.id,
    conversationId: conversation.id,
    messageId: message!.id,
  };
}

function sourceLabel(channel: ChannelConnection) {
  return channel.kind === "webform"
    ? "Website form"
    : channel.kind === "whatsapp"
      ? "WhatsApp"
      : channel.kind === "email"
        ? "Email"
        : "SMS";
}

/* -------------------------------------------------------------------- inbox */

async function scopeIds(caller: Caller) {
  const rows = await listUsers(caller);
  const directory = rows.map(publicUser);
  const me = directory.find((u) => u.id === caller.user.id);
  if (!me) throw new Error("Caller is not a member of this organization");
  return { me, ids: visibleUserIds(me as OrgUser, directory as OrgUser[]) };
}

export async function listConversations(caller: Caller, status = "open") {
  requirePermission(caller, "contacts.view");
  const database = await db();
  const { me, ids } = await scopeIds(caller);
  const list = [...ids];

  return database
    .select({
      conversation: schema.conversations,
      contact: schema.contacts,
      lead: schema.leads,
    })
    .from(schema.conversations)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.conversations.contactId))
    .leftJoin(schema.leads, eq(schema.leads.id, schema.conversations.leadId))
    .where(
      and(
        eq(schema.conversations.organizationId, caller.org.id),
        status === "all" ? undefined : eq(schema.conversations.status, status),
        can(me, "leads.assign")
          ? undefined
          : sql`(${schema.conversations.assignedToId} in ${list.length ? list : [""]} or ${schema.conversations.assignedToId} is null)`,
      ),
    )
    .orderBy(desc(schema.conversations.lastMessageAt))
    .limit(100);
}

export async function getConversation(caller: Caller, conversationId: string) {
  requirePermission(caller, "contacts.view");
  const database = await db();
  const [row] = await database
    .select({ conversation: schema.conversations, contact: schema.contacts })
    .from(schema.conversations)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.conversations.contactId))
    .where(
      and(
        eq(schema.conversations.id, conversationId),
        eq(schema.conversations.organizationId, caller.org.id),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Conversation not found");

  const thread = await database
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(schema.messages.at);

  await database
    .update(schema.conversations)
    .set({ unread: false })
    .where(eq(schema.conversations.id, conversationId));

  return { ...row, messages: thread };
}

/**
 * Sends a reply from inside EstateOS (PRD 79A.3).
 *
 * Consent is checked before anything leaves (PRD 12). Delivery itself needs a
 * connected outbound channel; until the organization has one, the reply is
 * stored as queued and the interface says so rather than pretending it sent.
 */
export async function sendReply(caller: Caller, conversationId: string, body: string) {
  requirePermission(caller, "contacts.edit");
  const database = await db();
  const { conversation, contact } = await getConversation(caller, conversationId);

  if (contact.optedOutAt) throw new Error(`${contact.name} has opted out of messages`);
  const consented =
    conversation.channel === "whatsapp"
      ? contact.consentWhatsapp
      : conversation.channel === "sms"
        ? contact.consentSms
        : contact.consentEmail;
  if (!consented) throw new Error(`${contact.name} has not consented to ${conversation.channel}`);

  const [channel] = conversation.channelId
    ? await database
        .select()
        .from(schema.channelConnections)
        .where(eq(schema.channelConnections.id, conversation.channelId))
        .limit(1)
    : [];

  // A website form is an inbound-only channel: replies need email or WhatsApp.
  const deliverable =
    channel?.kind === "email" || channel?.kind === "whatsapp" || channel?.kind === "sms";

  const [message] = await database
    .insert(schema.messages)
    .values({
      id: id("ms"),
      organizationId: caller.org.id,
      conversationId,
      direction: "outbound",
      channel: conversation.channel,
      body: body.trim(),
      authorId: caller.user.id,
      authorName: caller.user.name,
      deliveryStatus: deliverable ? "queued" : "queued",
      deliveryError: deliverable
        ? null
        : "No outbound channel connected yet — connect email or WhatsApp to deliver replies.",
    })
    .returning();

  await database
    .update(schema.conversations)
    .set({ lastMessageAt: new Date(), unread: false })
    .where(eq(schema.conversations.id, conversationId));

  // First outbound reply stops the SLA clock (PRD 20–22).
  if (conversation.leadId) {
    await database
      .update(schema.leads)
      .set({
        firstResponseAt: sql`coalesce(${schema.leads.firstResponseAt}, now())`,
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, conversation.leadId));
  }

  await audit(caller, "message.sent", "conversation", conversationId, null, {
    channel: conversation.channel,
    delivered: deliverable,
  });

  return message as Message;
}

export async function setConversationStatus(
  caller: Caller,
  conversationId: string,
  status: "open" | "closed",
) {
  requirePermission(caller, "contacts.edit");
  const database = await db();
  const [row] = await database
    .update(schema.conversations)
    .set({ status })
    .where(
      and(
        eq(schema.conversations.id, conversationId),
        eq(schema.conversations.organizationId, caller.org.id),
      ),
    )
    .returning();
  if (!row) throw new Error("Conversation not found");
  return row as Conversation;
}

export async function assignConversation(
  caller: Caller,
  conversationId: string,
  userId: string | null,
) {
  requirePermission(caller, "leads.assign");
  const database = await db();
  const [row] = await database
    .update(schema.conversations)
    .set({ assignedToId: userId })
    .where(
      and(
        eq(schema.conversations.id, conversationId),
        eq(schema.conversations.organizationId, caller.org.id),
      ),
    )
    .returning();
  if (!row) throw new Error("Conversation not found");
  if (row.leadId)
    await database
      .update(schema.leads)
      .set({ assignedToId: userId, updatedAt: new Date() })
      .where(eq(schema.leads.id, row.leadId));
  await audit(caller, "conversation.assigned", "conversation", conversationId, null, { userId });
  return row as Conversation;
}
