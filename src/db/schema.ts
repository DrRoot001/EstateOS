/**
 * EstateOS persistence (PRD 74). Plain PostgreSQL — no vendor extensions — so the
 * same schema runs on a VPS, on Vercel, or on Supabase.
 *
 * Rule: every tenant-owned row carries `organizationId`, and every query filters
 * on it before anything else (PRD 8B.3).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tradingName: text("trading_name"),
  /** Country pack code (PRD 8A): PK | AE | GB | US. */
  primaryMarket: text("primary_market").notNull(),
  enabledMarkets: jsonb("enabled_markets").$type<string[]>().notNull().default([]),
  jurisdiction: text("jurisdiction").notNull().default(""),
  timezone: text("timezone").notNull(),
  reportingCurrency: text("reporting_currency").notNull(),
  businessType: text("business_type").notNull().default("Brokerage"),
  licence: text("licence").notNull().default(""),
  dataResidency: text("data_residency").notNull().default(""),
  /** Subscription entitlements (PRD PLAT 003). */
  plan: text("plan").notNull().default("trial"),
  seatLimit: integer("seat_limit").notNull().default(10),
  /** active | suspended | terminated (PRD PLAT 004). */
  status: text("status").notNull().default("active"),
  workingHoursStart: text("working_hours_start").notNull().default("09:00"),
  workingHoursEnd: text("working_hours_end").notNull().default("18:00"),
  slaFirstResponseMinutes: integer("sla_first_response_minutes").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offices = pgTable(
  "offices",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    market: text("market").notNull(),
    city: text("city").notNull(),
    timezone: text("timezone").notNull(),
    jurisdiction: text("jurisdiction").notNull().default(""),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("offices_org_idx").on(t.organizationId)],
);

export const teams = pgTable(
  "teams",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    officeId: text("office_id")
      .notNull()
      .references(() => offices.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** users.id — no FK, the reference is circular and validated in the service. */
    managerId: text("manager_id"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("teams_org_idx").on(t.organizationId)],
);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    title: text("title").notNull().default(""),
    /** RoleId from src/lib/rbac.ts. */
    role: text("role").notNull(),
    officeId: text("office_id").references(() => offices.id, { onDelete: "set null" }),
    teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
    managerId: text("manager_id"),
    /** Null until the member activates their invitation (PRD AUTH 009). */
    passwordHash: text("password_hash"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_org_email_idx").on(t.organizationId, t.email),
    index("users_org_idx").on(t.organizationId),
  ],
);

/**
 * The EstateOS operator's own staff (PRD 8B.1, level 1). Deliberately a separate
 * table from `users`: no customer account can ever be escalated into platform
 * authority, and no platform account belongs to a tenant.
 */
export const platformUsers = pgTable(
  "platform_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    /** owner | admin | support */
    role: text("role").notNull().default("admin"),
    passwordHash: text("password_hash"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("platform_users_email_idx").on(t.email)],
);

export const platformSessions = pgTable(
  "platform_sessions",
  {
    id: text("id").primaryKey(),
    platformUserId: text("platform_user_id")
      .notNull()
      .references(() => platformUsers.id, { onDelete: "cascade" }),
    ip: text("ip").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("platform_sessions_user_idx").on(t.platformUserId)],
);

/** Server-side sessions (PRD AUTH 005). The cookie holds a token; this holds its hash. */
export const sessions = pgTable(
  "sessions",
  {
    /** sha256 of the session token. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").notNull(),
    ip: text("ip").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Single-use activation and password-reset tokens (PRD AUTH 009, AUTH 010). */
export const authTokens = pgTable(
  "auth_tokens",
  {
    /** sha256 of the token handed to the user. */
    id: text("id").primaryKey(),
    /** Exactly one of these is set: a tenant member, or a platform staff account. */
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    platformUserId: text("platform_user_id").references(() => platformUsers.id, {
      onDelete: "cascade",
    }),
    /** activation | reset */
    kind: text("kind").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

/** PRD 83. Never updated, never deleted by the application. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    actorUserId: text("actor_user_id"),
    /** Set when the actor was EstateOS platform staff rather than a member. */
    actorPlatformUserId: text("actor_platform_user_id"),
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull().default(""),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip").notNull().default(""),
    requestId: text("request_id").notNull().default(""),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_org_at_idx").on(t.organizationId, t.at)],
);

/* ------------------------------------------------------------------ Phase 3 */

/**
 * The canonical person (PRD 7.1, 13). One human, one row, however many leads,
 * viewings or transactions they generate. Identity resolution (PRD 14) merges on
 * email and phone before a duplicate is ever created.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    /** E.164 where known; the country pack supplies the dial code. */
    phone: text("phone"),
    /** buyer | seller | tenant | landlord | investor | vendor | other (PRD 13). */
    type: text("type").notNull().default("buyer"),
    preferredChannel: text("preferred_channel").notNull().default("email"),
    preferredLanguage: text("preferred_language").notNull().default("en"),
    city: text("city").notNull().default(""),
    region: text("region").notNull().default(""),
    notes: text("notes").notNull().default(""),
    /** Owning member; visibility follows the hierarchy from there. */
    ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
    /** PRD 12: consent is per channel and is enforced before any outbound message. */
    consentEmail: boolean("consent_email").notNull().default(true),
    consentSms: boolean("consent_sms").notNull().default(true),
    consentWhatsapp: boolean("consent_whatsapp").notNull().default(true),
    optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("contacts_org_idx").on(t.organizationId),
    index("contacts_org_email_idx").on(t.organizationId, t.email),
    index("contacts_org_phone_idx").on(t.organizationId, t.phone),
  ],
);

/** A demand or supply intent belonging to a contact (PRD 7.2, 15). */
export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    /** buyer | seller | tenant | landlord */
    type: text("type").notNull().default("buyer"),
    /** New | Contacted | Qualified | Viewing | Offer | Negotiation | Won | Lost (PRD 15). */
    status: text("status").notNull().default("New"),
    source: text("source").notNull().default("Website form"),
    sourceDetail: text("source_detail").notNull().default(""),
    assignedToId: text("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    officeId: text("office_id").references(() => offices.id, { onDelete: "set null" }),
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    /** Stored with the lead so a multi-market organization never mixes currencies. */
    currency: text("currency").notNull().default("USD"),
    location: text("location").notNull().default(""),
    bedrooms: integer("bedrooms"),
    timeline: text("timeline").notNull().default(""),
    notes: text("notes").notNull().default(""),
    /** Qualification (PRD 17). */
    intent: text("intent").notNull().default(""),
    financing: text("financing").notNull().default(""),
    qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
    /** Rule-based score 0–100 and its band (PRD 18). Recomputed, never typed in. */
    score: integer("score").notNull().default(0),
    scoreBand: text("score_band").notNull().default("Cold"),
    scoreReasons: jsonb("score_reasons").$type<string[]>().notNull().default([]),
    /** Routing (PRD 20–22). */
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    routingReason: text("routing_reason").notNull().default(""),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
    /** SLA clock (PRD 20–22): set when the first outbound reply is sent. */
    firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
    nextActionAt: timestamp("next_action_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("leads_org_idx").on(t.organizationId),
    index("leads_org_status_idx").on(t.organizationId, t.status),
    index("leads_assigned_idx").on(t.assignedToId),
  ],
);

/* ------------------------------------------------------------------ Phase 4 */

/**
 * One connected channel for one organization (PRD 79A). Secrets are encrypted at
 * rest with the app's SESSION_SECRET-derived key and never leave the server.
 */
export const channelConnections = pgTable(
  "channel_connections",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** webform | email | whatsapp | sms */
    kind: text("kind").notNull(),
    /** Display name: the mailbox, the WhatsApp number, the website. */
    label: text("label").notNull(),
    /** not_connected | connected | degraded | disconnected */
    status: text("status").notNull().default("not_connected"),
    /** Public identifier for inbound webhooks; never a secret on its own. */
    publicKey: text("public_key"),
    /** Encrypted JSON: tokens, app passwords, phone number ids. */
    secret: text("secret"),
    /** Non-secret settings the UI may show. */
    config: jsonb("config").$type<Record<string, string>>().notNull().default({}),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("channels_org_idx").on(t.organizationId),
    uniqueIndex("channels_public_key_idx").on(t.publicKey),
  ],
);

/** A threaded conversation with one contact on one channel (PRD 11). */
export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
    channelId: text("channel_id").references(() => channelConnections.id, { onDelete: "set null" }),
    channel: text("channel").notNull(),
    subject: text("subject").notNull().default(""),
    /** open | snoozed | closed */
    status: text("status").notNull().default("open"),
    assignedToId: text("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    unread: boolean("unread").notNull().default(true),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("conversations_org_idx").on(t.organizationId),
    index("conversations_org_status_idx").on(t.organizationId, t.status),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    /** inbound | outbound */
    direction: text("direction").notNull(),
    channel: text("channel").notNull(),
    body: text("body").notNull(),
    /** Member who sent it; null for inbound and for automated messages. */
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull().default(""),
    /** queued | sent | delivered | read | failed | received */
    deliveryStatus: text("delivery_status").notNull().default("received"),
    deliveryError: text("delivery_error"),
    /** Provider message id, for idempotent webhook replay (PRD 81). */
    externalId: text("external_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId, t.at),
    uniqueIndex("messages_external_idx").on(t.organizationId, t.externalId),
  ],
);

export type Contact = typeof contacts.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type ChannelConnection = typeof channelConnections.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

/* --------------------------------------------------- Phase 5: inventory */

/**
 * The physical asset (PRD 23, 24). It exists whether or not it is on the market,
 * and it outlives any number of listings.
 */
export const properties = pgTable(
  "properties",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    reference: text("reference").notNull().default(""),
    /** Apartment | Villa | House | Plot | Office | Retail | Warehouse */
    type: text("type").notNull().default("Apartment"),
    address: text("address").notNull(),
    city: text("city").notNull().default(""),
    region: text("region").notNull().default(""),
    postal: text("postal").notNull().default(""),
    /** Country pack code, so one organization can hold stock in several markets. */
    market: text("market").notNull(),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    /** Stored in square feet; the country pack converts for display (PRD 8A). */
    areaSqft: integer("area_sqft"),
    plotSqft: integer("plot_sqft"),
    yearBuilt: integer("year_built"),
    /** Free-form, searchable list: parking, garden, sea view, furnished. */
    features: jsonb("features").$type<string[]>().notNull().default([]),
    description: text("description").notNull().default(""),
    /** Landlord or vendor — a contact, never a duplicated person (PRD 7.1). */
    ownerContactId: text("owner_contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    officeId: text("office_id").references(() => offices.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("properties_org_idx").on(t.organizationId),
    index("properties_org_city_idx").on(t.organizationId, t.city),
  ],
);

/** Putting a property on the market: one property, many listings over time (PRD 25). */
export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    /** sale | rent */
    dealType: text("deal_type").notNull().default("sale"),
    /** Draft | Live | Under offer | Sold | Let | Withdrawn */
    status: text("status").notNull().default("Draft"),
    price: integer("price").notNull(),
    currency: text("currency").notNull(),
    /** For rentals: monthly | yearly. Empty for sales. */
    pricePeriod: text("price_period").notNull().default(""),
    availableFrom: timestamp("available_from", { withTimezone: true }),
    /** Listing agent — the member answerable for it. */
    agentId: text("agent_id").references(() => users.id, { onDelete: "set null" }),
    /** Market-specific identifiers: RERA permit, EPC rating, MLS id (PRD 8A.4). */
    compliance: jsonb("compliance").$type<Record<string, string>>().notNull().default({}),
    listedAt: timestamp("listed_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("listings_org_idx").on(t.organizationId),
    index("listings_org_status_idx").on(t.organizationId, t.status),
  ],
);

export type Property = typeof properties.$inferSelect;
export type Listing = typeof listings.$inferSelect;

export const organizationRelations = relations(organizations, ({ many }) => ({
  offices: many(offices),
  teams: many(teams),
  users: many(users),
}));

export type Organization = typeof organizations.$inferSelect;
export type PlatformUser = typeof platformUsers.$inferSelect;
export type Office = typeof offices.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type AuditRow = typeof auditLog.$inferSelect;
