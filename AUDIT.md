# EstateOS — System Audit

Date: 2026-08-12 · Updated after Phases 0–2, the Phase 3 CRM spine, Phase 4 intake, and the Phase 5 pipeline brain and inventory · Audited against `EstateOS Product Requirements Document.md` (now including the new sections 7.6, 8B, 10A, 61A, 79A).

**Original verdict: the repository was a high-fidelity prototype, not a sellable product.** One module was implemented against a server; everything else was a React screen driven by `src/lib/mock-data.ts`, with no authentication, no tenancy, no database, no real integration and no AI.

**Since then, Phases 0, 1 and 2 have landed:** PostgreSQL with migrations and tenant scoping; real password authentication with server-side sessions, invitations and resets; the deletion of `mock-data.ts` and every fabricated screen; and the Platform Console, which provisions customer organizations with their country pack and plan, hands over an Organization Owner, and runs suspend / resume / terminate / export. Integrations (2.3), the Unified Inbox and every product module beyond organization management remain outstanding.

---

## 1. What actually exists

| Area | State | Where |
|---|---|---|
| PostgreSQL schema, migrations, tenant scoping | Real | `src/db/schema.ts`, `drizzle/`, `src/server/org-service.ts` |
| Authentication: passwords, sessions, activation, reset, revocation, throttling | Real | `src/server/crypto.ts`, `src/server/auth.ts`, `src/lib/auth-api.ts`, `src/routes/login.tsx`, `src/routes/activate.tsx` |
| Org hierarchy: offices, teams, users, reporting lines | Real. Server-validated, persisted, audited | `src/lib/org-api.ts`, `src/routes/admin.tsx` |
| RBAC: 11 roles, 30 permissions, scope org/office/team/own | Real, enforced in the data access layer | `src/lib/rbac.ts` (+ `rbac.test.ts`) |
| Audit log | Real; covers organization and identity events | `src/server/org-service.ts` |
| Platform Console: provisioning, entitlements, lifecycle, export, staff | Real | `src/routes/platform/`, `src/server/platform-service.ts`, `src/server/platform-auth.ts` |
| Country packs (currency, area, address, weekend, compliance text) | Real formatting layer, display only | `src/lib/markets.ts` |
| Every other module | Empty state naming what will fill it | `src/components/empty-state.tsx` |

---

## 2. The four defects called out

### 2.1 There is no authentication — a dropdown is not a login  ✅ **Fixed (Phase 1)**

`src/components/user-switcher.tsx` lets anyone become anyone by setting the `eos_uid` cookie through an unauthenticated server function. There is no password anywhere in the codebase, no session store, no sign-out, no lockout, no MFA. `DEFAULT_USER = "u_nadia"` means an anonymous visitor is the Organization Owner.

Now implemented: scrypt password hashing (`src/server/crypto.ts`, self-checked in `crypto.test.ts`), opaque server-side sessions with idle and absolute lifetimes (`src/server/auth.ts`), sign in, sign out, sign out everywhere, invitation-based activation, administrator-issued reset links, session revocation, per-account and per-IP throttling, and audit entries for every identity event. The switcher is deleted. Still outstanding from PRD 10A: TOTP multi-factor, organization SSO, and self-service password reset (which needs email delivery, Phase 4).

### 2.2 There is no multi-tenancy — the product cannot be sold to a second customer  ✅ **Fixed (Phases 0 and 2)**

There is exactly one hard-coded organization (`org_1`, "Brightwater Realty") seeded in `src/server/db.ts`. There is no platform layer, no provisioning, no plan or seat limit, no `organizationId` on any record, and no isolation boundary. The intended model — platform admin creates the customer org and its country, hands over one Organization Owner, who creates their own members — does not exist at any level.

Now implemented: every table carries `organizationId`, every query goes through `src/server/org-service.ts` which filters by the caller's organization before anything else, plan and seat entitlements are enforced on user creation, and organizations are provisioned with country pack, jurisdiction, plan and seat limit by `npm run bootstrap` — which creates the Organization Owner and prints a single-use activation link, exactly as PLAT 001 and PLAT 002 describe.

Phase 2 added the Platform Console at `/platform`: its own staff table, its own session cookie and its own sign-in, so no customer account can be escalated into platform authority. It provisions an organization with country pack, jurisdiction, plan, seats, licence and residency; creates the Organization Owner and issues their activation link; edits entitlements with a seat-count guard; suspends, resumes and terminates (name-typed confirmation, sessions revoked immediately, JSON export first); and invites further platform staff, where Support is read-only by design.

Verified end to end: a second tenant (Sapphire Estates, Pakistan/Punjab, PKR) was provisioned from the console; suspending an organization immediately blocked its owner's sign-in with correct credentials, and resuming restored it. Platform actions land in the *customer's* audit log attributed to "Platform · <name>" (PLAT 005 transparency).

Still outstanding: consented, time-boxed support sessions for reading tenant data (PLAT 005) — until they exist, the console shows counts and health only and cannot read a single customer record.

### 2.3 Every integration is fabricated

`src/routes/settings.tsx` lists Google Calendar "Connected · 5 agents", Twilio "Connected", DocuSign "Connected", plus per-market portals — all string literals. Nothing is connected. Similarly fabricated: the "24s median first response" in the sidebar, the notification bell's "3", the AI Assistant replies (`src/routes/assistant.tsx`), the automation run log (`src/routes/automation.tsx` uses `setTimeout` to invent activity), reports (`src/routes/reports.tsx`), and lead scores.

Worse, the Unified Inbox — Module Two, described in the PRD as one of the primary EstateOS interfaces and the reason the email and WhatsApp integrations exist at all — **does not exist as a route**. The stated goal (nobody opens Gmail or WhatsApp; they read and reply inside EstateOS) is currently unmet in its entirety.

Required: PRD 79A ownership and connection flow, real OAuth for Google/Microsoft, Meta WhatsApp Business embedded signup, Twilio, webhook ingestion with replay, and the Unified Inbox built on top. Every "Connected" badge must derive from a stored credential plus a passing health check. All fixture data is deleted (PRD 7.6).

### 2.4 The workflow is unreadable  ◐ **Partly addressed**

There is no first-run path, no empty state, and no explanation of what to do next. A new user lands on a dashboard already full of somebody else's numbers. Nine navigation items appear at once with no ordering by daily use, no relationship between them (a lead does not visibly become a viewing, an offer, then a transaction), and no queue anywhere that says "these five things need you now".

Done: the dashboard now opens on a setup checklist (PRD 8B.4) that states what is configured, what is next, and what is not available yet, and every unbuilt module says so in its own words instead of showing invented records.

Still required: inbox-first information architecture, one visible lifecycle spine (Contact → Lead → Qualification → Match → Viewing → Offer → Transaction → Closing → Commission) on the record itself, and lists that default to "what needs attention".

---

## 3. Module-by-module gap analysis

Legend: **Built** = works against persisted data. **Shell** = UI exists over fixtures. **Missing** = not present.

| PRD | Module | Status | Notes |
|---|---|---|---|
| 8A | Module Zero — Localization | Partial | Formatting only. Money is a USD number multiplied by a display FX rate; no `{amount, currency}` storage, no per-org pack binding, no RTL, no per-jurisdiction stage templates. |
| 8B | Platform tenancy | Built (partial) | Platform staff, console, provisioning, entitlements, lifecycle, export, tenant isolation. Missing: consented support sessions, per-tenant usage metering and billing. |
| 9 | Organization Management | Built (partial) | Offices, teams, users, reporting lines, working hours, SLA, plan and seats — all in Postgres. Missing: holidays, permitted lead sources, commission rules, branding. |
| 10 / 10A | RBAC and Auth | Built (partial) | Passwords, sessions, activation, reset, revocation, throttling, audit. Scope and permission checks run in the data access layer. Missing: MFA, SSO, self-service reset. |
| 11–12 | Unified Inbox and Compliance | Built (partial) | Threaded inbox, reply composer, assignment, open/close, per-channel consent enforced before sending. Missing: outbound delivery (needs a connected provider), quiet hours, templates. |
| 13–14 | Contacts and Identity Resolution | Built (partial) | Contact is the canonical person, Lead references it. Dedupe on exact email and phone at intake. Missing: fuzzy matching, merge UI, household grouping. |
| 15–16 | Lead Management and Capture | Built (partial) | Real leads with pipeline stages, owner, source and SLA first-response stamp. Website-form capture is live. Missing: portal, ad and call capture. |
| 17 | Qualification Engine | Built (partial) | Intent, timeline, financing, budget and area captured on the lead; qualified-at stamp. Missing: per-type questionnaires (seller/tenant/landlord), completeness scoring. |
| 18 | Lead Scoring | Built | Rule-based 0–100 with a band and an itemised reason per point (`src/lib/scoring.ts`, self-checked). Recomputed on every intake and every edit. |
| 19 | Fair Housing Guardrails | **Missing** | No protected-attribute filtering on matching, routing, or AI output. Legal exposure in US/UK. |
| 20–22 | Routing, Reassignment, Availability | Built (partial) | Two-stage routing (eligibility then lowest-workload ranking) runs on intake, records why, sets the SLA due time, and surfaces breaches. Missing: agent availability/working hours, automatic reassignment on breach, escalation. |
| 23–26 | Property and Listing | Built (partial) | Property (the asset) and Listing (one attempt to market it) as separate entities, per-market, area in sq ft displayed in local units, prices stored with currency. Missing: media/photos, portal and MLS/RESO import, price history. |
| 27–30 | Matching | Built (partial) | Hard filters then weighted ranking with per-match reasons *and* concerns (`src/lib/matching.ts`, self-checked), shown on the lead. Missing: semantic ranking via embeddings (AI layer), reverse matching, saved searches and alerts. |
| 31–33 | Viewings | **Missing** | Empty state. No booking, calendar sync, confirmations, reminders or feedback capture. |
| 34–35 | Offers | **Missing** | Empty state. No offers, counteroffer history, approvals or audit. |
| 36–40 | Transactions | **Missing** | No transaction workspace, stages, milestones, or checklists. |
| 41–44 | Documents and e-Signature | **Missing** | No storage, no OCR/extraction, no DocuSign. |
| 45–46 | Closing | **Missing** | — |
| 47–49 | Commission Engine | **Missing** | Commission appears only as a country-pack rate for display. |
| 50–56 | Maintenance, Vendors, Work Orders | **Missing** | Roles exist (PM, Maintenance Coordinator, Vendor) with nothing to operate. |
| 57–60 | Automation Engine | **Missing** | The simulated run log is deleted. No triggers, conditions, actions or versioning. |
| 61–63 / 61A | AI Layer | **Missing** | No model call anywhere. The canned assistant is deleted; the route now states that AI is unconfigured. Env contract is documented in `.env.example`. |
| 64–68 | Reporting | **Missing** | Static numbers deleted. Reporting returns when there are records to report on. |
| 69–71 | Dashboards | Built (partial) | Setup checklist and hierarchy counts are real; the pipeline widgets are empty until leads exist. |
| 72 | Notifications | **Missing** | Fixture list and hard-coded badge deleted. No delivery channels or severity yet. |
| 73 | Search | **Missing** | The header search input has no handler. |
| 74–75 | Core Data Model | Partial | Organization, Office, Team, User, Session, AuthToken and AuditLog persist in PostgreSQL with migrations. Every other entity is unbuilt. |
| 76–77 | Event-Driven Architecture | **Missing** | No events, no queue, no outbox. |
| 78 | Technical Architecture | Partial | PostgreSQL with Drizzle migrations, portable across VPS / Vercel / Supabase (PGlite locally when `DATABASE_URL` is unset). Still missing: pgvector, Redis, BullMQ, S3. |
| 79–81 / 79A | Integration Layer | Partial | Connection framework with encrypted secrets, health state and per-org keys; website forms fully live with rate limiting and idempotency. Email, WhatsApp and SMS need the operator's app registrations. |
| 82 | Security | Partial | Auth, hashed credentials, hashed tokens, session revocation, sign-in throttling, CSRF middleware. Missing: encryption at rest, secret management, MFA, and a rate limiter that survives more than one process. |
| 83 | Audit Logging | Partial | Correct shape, in Postgres; covers organization and identity events. Extends to each module as it is built. |
| 84 | Privacy | **Missing** | No consent records, retention, export, or erasure. |
| 85–88 | Performance, Availability, Observability | **Missing** | No metrics, tracing, health checks, or AI observability. |
| 89 | Mobile | **Missing** | Responsive web only. |

**Score: 1 of 17 product modules implemented, with identity, tenancy and persistence now real underneath them.**

---

## 4. Additional findings

1. ~~**Client-side data is not access control.**~~ Fixed: the fixtures are deleted and every read goes through the tenant-scoped service layer.
2. ~~**No database.**~~ Fixed: PostgreSQL with generated migrations in `drizzle/`.
3. **No backups and no CI.** Migrations exist; backup policy and a pipeline do not.
4. **Four self-checks** (`markets.test.ts`, `rbac.test.ts`, `platform-roles.test.ts`, `crypto.test.ts`) via `npm run check`. No integration tests around the auth endpoints yet.
5. **Money is a bare number.** Multi-currency correctness requires `{amount, currency}` plus an FX rate with a date on every aggregate (PRD 8A.5 item 7).
6. **No i18n framework** despite Arabic and Urdu RTL being an acceptance criterion.
7. **`agentId` is a fixture key.** The `OrgUser.agentId → mock-data` link disappears the moment leads become real records keyed by `userId`.
8. **Lovable/Vite scaffolding** (`README.md`, error reporting) still describes a template project, not this system.

---

## 5. Recommended build order

Each phase ends with something demonstrable and nothing fabricated.

**Phase 0 — Foundation ✅ landed**
PostgreSQL with Prisma or Drizzle; migrations; `organizationId` on every table; repository layer that scopes by tenant and hierarchy before any query. Port the existing org/user/audit store into it. Delete `mock-data.ts` and every screen that depends on it, replacing each with an empty state.

Two decisions taken (2026-08-12):

- **Deployment-agnostic Postgres.** The app talks to plain PostgreSQL through `DATABASE_URL` and nothing else — no vendor SDK, no platform-specific client. The same build must run on a VPS, on Vercel, or against Supabase, chosen at deploy time. Object storage is likewise S3-compatible via config, not a hosted-provider SDK.
- **Empty states now.** `mock-data.ts` is deleted in Phase 0. Every screen it fed renders a real empty state naming the action that fills it. Demos look sparse until the modules land; nothing fabricated can reach a customer.

**Phase 1 — Identity (PRD 10A) ✅ landed**
Password hashing, sessions, sign in/out, invitation activation, reset, revocation, rate limiting, MFA-ready. Delete the user switcher. All existing RBAC becomes enforced at the data layer.

**Phase 2 — Platform (PRD 8B) ✅ landed**
Platform Console: provision organization with country pack and plan, create Organization Owner, lifecycle, entitlements, per-tenant health. Support sessions deferred.

**Phase 3 — Org setup and Contacts**
Guided onboarding checklist, working hours, holidays, SLA policy, lead sources, commission plan, branding. Contact as the canonical person, with Lead as a separate object referencing it (PRD 7.1, 7.2), plus identity resolution.

**Phase 4 — Communications (PRD 11, 12, 79A)**
Integration framework (credential vault, OAuth, webhook ingest with idempotency and replay, health checks), then Google/Microsoft email, Meta WhatsApp Business, Twilio SMS. Then the Unified Inbox: threaded, assignable, replyable, consent-enforced. This is the feature the product is bought for.

**Phase 5 — Pipeline**
Lead capture, qualification, computed scoring, routing with SLA timers and reassignment, viewings with real calendar sync.

**Phase 6 — AI (PRD 61A, 63)**
Env-configured provider, conversation summarisation, reply drafting, scoring support, semantic matching with pgvector, copilot — each with permission boundary, cost tracking, and no canned fallback.

**Phase 7 — Transactions through Commission, then Maintenance, Automation, Reporting.**

---

## 6. Immediate next step

Phase 3 — organization setup and Contacts: the guided onboarding checklist filled out (holidays, permitted lead sources, commission plan, branding), then Contact as the canonical person with Lead as a separate object referencing it (PRD 7.1, 7.2) and identity resolution on top.

Then Phase 4 — the integration framework and the Unified Inbox. That is the feature the product is actually bought for: email and WhatsApp arriving in EstateOS, answered from EstateOS, so nobody on the team opens Gmail or WhatsApp to do their job.
