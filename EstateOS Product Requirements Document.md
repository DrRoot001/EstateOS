# EstateOS

## AI Powered Real Estate Operating System

**Product Requirements Document**

**Version:** 1.0  
**Research date:** August 12, 2026  
**Product:** Heptagram AI EstateOS  
**Document scope:** Complete product vision from lead acquisition through transaction closing and post transaction property operations

# 1. Executive Summary

EstateOS is a multi tenant real estate operating system designed to centralize and automate the complete operational journey from first inquiry through qualification, property matching, viewing, offer, transaction, closing, commission, and ongoing property maintenance.

EstateOS is not intended to function only as a CRM.

The product becomes the operational system of record for:

* People
* Leads
* Conversations
* Properties
* Listings
* Viewings
* Offers
* Transactions
* Documents
* Tasks
* Commissions
* Maintenance
* Vendors
* Automation
* Analytics

The core concept is simple.

A brokerage should not need one system for leads, another for WhatsApp, another for phone calls, another for listings, another for transaction documents, another for agent assignments, and spreadsheets for reporting.

EstateOS connects these operations around a common data model.

A new inquiry arriving from WhatsApp, Zillow, Realtor.com, email, SMS, telephone, a website form, or another portal should become the same canonical EstateOS lead.

From there the system can:

1. Identify the person.
2. Detect duplicates.
3. Determine their intent.
4. Create or update their requirement profile.
5. Calculate a lead score.
6. Assign an appropriate agent.
7. Start the correct response SLA.
8. Trigger the correct automation.
9. Track subsequent communications.
10. Recommend suitable properties.
11. Schedule viewings.
12. Track offers.
13. Create a transaction workspace.
14. Collect documents and signatures.
15. Monitor closing milestones.
16. Calculate commissions.
17. Attribute revenue to the original acquisition source.

For businesses managing rental properties, the same property record can later power tenant requests, maintenance work orders, vendors, approvals, costs, and maintenance analytics.

EstateOS therefore operates as the connective layer between revenue operations and property operations.

# 2. Research Basis

Current real estate systems demonstrate strong demand for lead distribution, automated follow up, centralized communications, property search, transaction management, and team reporting.

Follow Up Boss, for example, allows incoming lead sources to trigger lead distribution and action plans and provides a team inbox for calls and texts.

Lofty now positions its CRM around AI based lead management, lead routing, performance tracking, IDX, transaction management, and AI agents, illustrating the industry's movement beyond static contact databases toward operational automation.

BoldTrail similarly supports configurable lead routing, Smart CRM workflows, property alerts, marketing automation, and communication tools.

RESO Data Dictionary 2.0 exists specifically to normalize real estate listing fields and values across technology systems. EstateOS should therefore use a RESO aligned internal listing schema where practical rather than inventing incompatible property terminology.

DocuSign Rooms demonstrates the need for a centralized transaction workspace in which documents, signatures, forms, and transaction activity can be managed together.

Property management systems such as AppFolio increasingly centralize maintenance intake, work orders, vendor dispatch, communication, and completion tracking.

These products validate the individual components of EstateOS.

EstateOS differentiates itself by connecting them through one shared operational and automation layer.

# 3. Product Vision

EstateOS should become:

> The system that knows every lead, every conversation, every property, every next action, every deal, and every operational obligation of a real estate business.

The system should answer operational questions such as:

* Which new leads have not received a response?
* Which agent should receive this buyer?
* Which leads are most likely to transact?
* Which properties match this buyer right now?
* Which buyers match this newly listed property?
* Which viewings need confirmation?
* Which offers are waiting for action?
* Which transactions have approaching deadlines?
* Which documents remain unsigned?
* Which agents are ignoring assigned leads?
* Which marketing source produces actual commission?
* Which vendors repeatedly miss maintenance SLAs?
* Which transactions are likely to close this month?
* Which clients need attention today?

# 4. Product Positioning

EstateOS should not be positioned primarily as:

* A CRM
* A chatbot
* A lead database
* A property portal
* A listing tool
* A transaction management application
* A maintenance application

EstateOS should be positioned as a real estate operating system.

The CRM is one component.

The inbox is one component.

The listing system is one component.

AI is an operational layer across all components.

# 5. Target Customers

## 5.1 Primary ICP

Residential real estate brokerages with approximately 10 to 100 agents.

Characteristics:

* Multiple lead sources
* Dedicated sales agents
* Significant WhatsApp, SMS, telephone, or email usage
* Existing portal advertising
* Manual lead distribution
* Managers responsible for agent performance
* Listings managed in multiple systems
* Significant follow up requirements
* Transaction coordination overhead

## 5.2 Secondary ICP

* Property management companies
* Hybrid brokerage and property management companies
* Rental agencies
* Developer sales teams
* Commercial real estate teams
* Real estate investment companies
* Apartment operators

# 6. User Roles

## 6.1 Organization Owner

Controls subscription, organization configuration, integrations, permissions, offices, and security policies.

## 6.2 Brokerage Administrator

Manages users, agents, teams, lead sources, routing logic, automation, pipelines, and reporting.

## 6.3 Sales Manager

Monitors leads, assignments, SLA breaches, agent activity, conversion, viewings, offers, and revenue.

## 6.4 Agent

Receives leads, communicates with clients, updates qualification information, recommends properties, schedules viewings, manages offers, and follows transactions.

## 6.5 Inside Sales Agent

Handles first response, qualification, appointment generation, and transfers qualified opportunities to agents.

## 6.6 Transaction Coordinator

Manages accepted offers, documents, signatures, checklists, deadlines, and closing activities.

## 6.7 Property Manager

Manages rental properties, tenants, owners, maintenance, approvals, and vendors.

## 6.8 Maintenance Coordinator

Handles work order triage, vendor dispatch, scheduling, escalation, and completion.

## 6.9 Finance User

Reviews commission calculations, transaction values, marketing spend, revenue attribution, and vendor costs.

## 6.10 Vendor

Receives assigned work orders and can update job status, appointments, photographs, notes, estimates, and invoices.

## 6.11 Client

May represent:

* Buyer
* Seller
* Tenant
* Landlord

A single person may hold multiple roles simultaneously.

# 7. Core Product Principles

## 7.1 One Person, One Canonical Record

EstateOS must not create separate people simply because they contacted the company through different channels.

The same person could:

* Submit a website form
* Send a WhatsApp message
* Call the office
* Reply by email
* Submit another portal inquiry

These interactions must resolve to one Contact whenever identity confidence is sufficient.

## 7.2 Contact and Lead Must Be Separate Objects

A Contact represents the human or organization.

A Lead represents a commercial opportunity.

Example:

John Smith could simultaneously have:

* Buyer Lead
* Seller Lead
* Landlord Lead

All three belong to one Contact.

## 7.3 Every Interaction Must Be Attributable

Every lead should maintain source attribution.

Example:

Google Ads → Landing Page → WhatsApp → Agent → Viewing → Offer → Closed transaction.

EstateOS must retain the original acquisition source even when subsequent communication switches channels.

## 7.4 Every Assignment Must Be Explainable

The system should be able to explain why an agent received a lead.

Example:

Assigned to Sarah because:

* Dubai Marina territory matched
* Arabic language matched
* Residential specialization matched
* Sarah was available
* Sarah had available capacity

## 7.5 AI Must Assist Operations Rather Than Hide Decisions

AI recommendations must provide confidence and reason codes where practical.

Important decisions should remain reviewable.

## 7.6 No Fabricated Data

EstateOS never displays data it does not hold.

Rules:

* Every figure, list, badge, and status on every screen must originate from the organization's own records.
* An empty account shows an empty state and the action that fills it, never seeded example content.
* An integration is shown as connected only when a live credential exists and its last health check succeeded.
* Counters, charts, and scores are computed from stored events, never hard coded.
* Demonstration data may exist only behind an explicit seed command run by the platform operator, and must be labelled as demonstration data inside the product.

This rule exists because a brokerage cannot tell a fabricated pipeline from a real one, and a single invented number destroys trust in every other number on the page.

# 8. Complete Product Architecture

EstateOS contains sixteen major product domains, all of which sit on top of a cross cutting Market Localization layer (Module Zero) and inside a multi tenant Platform layer (Section 8B) that provisions and isolates customer organizations.

0. Market Localization (country packs)
1. Organization and Access Control
2. Unified Communications
3. Contact and Lead Management
4. Qualification
5. Lead Scoring
6. Lead Routing
7. Property and Listing Management
8. Property Matching
9. Viewing Management
10. Offers
11. Transactions
12. Documents and Electronic Signatures
13. Closing and Commissions
14. Property Maintenance
15. Automation and AI
16. Reporting and Intelligence

# 8A. Module Zero: Market Localization Layer

EstateOS must be deployable in any country without forking the product.

The initial supported markets are:

* Pakistan (PK)
* United Arab Emirates (AE)
* United Kingdom (GB)
* United States (US)

Everything that differs between these markets must live in a declarative **country pack**, not in branching application code. Adding a fifth market must mean adding a configuration record plus, where genuinely required, a small set of market specific adapters (portal feed, e signature provider, tax rule).

## 8A.1 Design Rule

> Country specific behaviour is data. The application reads it.

Prohibited:

* Hard coded currency symbols
* Hard coded `sqft`
* Hard coded `state` and `ZIP` address fields
* Hard coded commission percentages
* Hard coded transaction stages
* US only compliance assumptions
* English only, left to right only layout

Required:

* Every monetary value stores an amount plus a currency code
* Every area value stores a magnitude plus a unit
* Every phone number stores E.164
* Every timestamp stores UTC and renders in the org or user time zone
* Every address stores a structured, market shaped payload

## 8A.2 Country Pack Definition

A country pack declares:

| Group | Contents |
|---|---|
| Identity | Country code, display name, default language(s), text direction |
| Money | Currency code, locale, compact number style, tax name and rate |
| Measurement | Primary area unit, secondary area units, conversion factors |
| Address | Ordered address fields with labels and validation |
| Contact | Dialling code, phone validation, dominant messaging channel |
| Calendar | Weekend days, first day of week, public holidays, seasonal working hours |
| Inventory | Portal and listing data sources, listing identifier scheme |
| Transaction | Stage template, required documents, party roles, deposit conventions |
| Money out | Commission conventions, who pays, tax on commission, withholding |
| Compliance | Consent regime, AML regime, fair housing regime, data residency, retention |
| Integrations | E signature providers, mapping provider, accounting provider |

## 8A.3 Functional Requirements

**CTRY 001** — An organization selects one primary market at creation and may enable additional markets.

**CTRY 002** — The country pack drives all currency, area, address, phone, and date rendering.

**CTRY 003** — Users may override display currency for reporting; stored values never change.

**CTRY 004** — Area may be entered in any unit valid for the market and is stored normalized (square metres) with the entered unit preserved.

**CTRY 005** — Transaction stage templates, checklists, and required documents are supplied per market and are editable per organization.

**CTRY 006** — Commission plans reference the market's convention (who pays, side split, tax treatment, withholding) as their default.

**CTRY 007** — The communication policy engine evaluates the market's consent regime before any outbound message.

**CTRY 008** — Compliance features that do not apply to a market are hidden rather than shown as empty. Fair housing controls, for example, remain enforced everywhere as product policy but display US statutory language only in the US pack.

**CTRY 009** — Language packs must support English, Urdu, and Arabic, with right to left layout for Arabic and Urdu.

**CTRY 010** — Data residency must be configurable per organization, since UK and EU customers commonly require in region storage.

**CTRY 011** — Multi market organizations must be able to report in a single reporting currency using a dated FX rate, and the rate used must be recorded on the record.

**CTRY 012** — Adding a market must not require changes to core domain code. This is an architectural acceptance criterion, verified by adding a market in configuration only.

## 8A.4 Market Comparison

### Money and Measurement

| | Pakistan | UAE | United Kingdom | United States |
|---|---|---|---|---|
| Currency | PKR | AED | GBP | USD |
| Locale | en-PK, ur-PK | en-AE, ar-AE | en-GB | en-US |
| Large number style | Lakh and crore | Millions | Millions | Millions |
| Primary area unit | Square feet | Square feet | Square feet | Square feet |
| Secondary units | Marla, kanal, square yard | Square metre | Square metre, acre | Acre |
| Tax on services | Provincial sales tax on services | VAT 5 percent | VAT 20 percent | State and local, generally not on commission |

Pakistan requires genuine lakh and crore rendering. Displaying `Rs 126M` to a Karachi user is a defect; `12.6 crore` is correct.

### Address Shape

| Market | Fields |
|---|---|
| Pakistan | House or plot, street, block, sector or phase, society or scheme, city, province, postal code |
| UAE | Unit, floor, building or tower, community, area, emirate, Makani number where available |
| United Kingdom | Building name or number, address line 1, address line 2, town or city, county, postcode |
| United States | Street address, unit, city, state, ZIP |

Postcode is authoritative for UK addressing. UAE addressing is community and building led rather than postcode led. Pakistan addressing is society, block, and phase led.

### Inventory Sources

| Market | Sources |
|---|---|
| Pakistan | Zameen, Graana, Bayut Pakistan, direct developer inventory, manual entry |
| UAE | Bayut, Property Finder, Dubizzle, developer inventory, DLD listing permit data |
| United Kingdom | Rightmove, Zoopla, OnTheMarket, direct agency feeds. There is no MLS |
| United States | MLS via RESO Web API, Zillow, Realtor.com |

The RESO alignment described elsewhere in this document remains the internal canonical schema. Non US markets map into it; they do not require it externally.

### Listing and Regulatory Identifiers

| Market | Identifiers |
|---|---|
| Pakistan | CNIC for parties, NTN for businesses, society or authority allotment or transfer letter, registered sale deed |
| UAE | Emirates ID, title deed number, Oqood for off plan, Ejari for tenancy, RERA broker card, Trakheesi listing permit, Makani |
| United Kingdom | HM Land Registry title number, UPRN, EPC certificate reference, company number |
| United States | MLS number, APN or parcel number, state licence number |

### Transaction Conventions

| Market | Typical flow |
|---|---|
| Pakistan | Offer, token money, bayana or earnest agreement, buyer due diligence on title and dues, provincial withholding tax on buyer and seller, stamp duty, registration at the sub registrar or society transfer, possession |
| UAE | Offer, Form A, B and F under RERA where applicable, MOU with deposit, developer or bank NOC, mortgage settlement, DLD transfer appointment, title deed issuance. Escrow applies to off plan |
| United Kingdom | Offer accepted subject to contract, memorandum of sale, solicitor conveyancing, searches and enquiries, survey, mortgage offer, exchange of contracts with deposit, completion, SDLT or LBTT or LTT return, Land Registry registration. England and Wales, Scotland, and Northern Ireland differ and must be separate stage templates |
| United States | Offer and counteroffers, purchase agreement, earnest money to escrow, inspection period, appraisal, financing contingency, title search and insurance, closing disclosure and TRID timing, closing and recording |

Scotland is materially different, including offers being made by solicitors and the missives process. The UK pack must therefore be three sub templates, not one.

### Commission Conventions

| Market | Convention |
|---|---|
| Pakistan | Commonly around 1 percent from each of buyer and seller; 1 month rent typical on tenancies; frequently cash sensitive, so recording and receipting matters |
| UAE | Commonly 2 percent of sale price, 5 percent of annual rent for leasing, plus 5 percent VAT; agent must hold a RERA broker card |
| United Kingdom | Seller pays, commonly 1 to 2.5 percent inclusive or plus VAT at 20 percent; sole agency, multi agency and fixed fee models must be supported; buyer side agency fees are uncommon |
| United States | Historically 5 to 6 percent split between listing and buyer side. Following the 2024 NAR settlement, buyer broker compensation must be handled through a written buyer representation agreement and must not be assumed from a listing offer of compensation |

The commission engine must therefore support: who pays, per side percentages, flat fees, tax on commission, and withholding at source.

### Compliance Regimes

| Market | Key obligations EstateOS must accommodate |
|---|---|
| Pakistan | CNIC based identity capture, FBR withholding under the applicable sections on buyer and seller, filer and non filer status affecting rates, provincial stamp duty and registration, PECA and consumer consent expectations for bulk messaging |
| UAE | AML and CFT obligations on real estate brokers including customer due diligence and reporting through the federal goAML channel for qualifying cash and virtual asset transactions, RERA and DLD registration and permit rules, Ejari registration for tenancies, UAE Personal Data Protection Law, TDRA rules on marketing consent |
| United Kingdom | Money Laundering Regulations 2017 with HMRC supervision of estate agency businesses, Estate Agents Act 1979, mandatory redress scheme membership, National Trading Standards material information Parts A, B and C on listings, EPC requirement, UK GDPR and PECR for electronic marketing, Right to Rent checks in England, tenancy deposit protection |
| United States | Fair Housing Act and HUD guidance including AI in tenant screening and advertising, state real estate licensing, TCPA for calls and texts, CAN SPAM for email, RESPA and TRID for closing, state specific disclosure packages |

Fair housing style non discrimination controls remain enforced in every market as product policy, because discriminatory routing and matching is a product defect regardless of local statute. Only the statutory wording, the protected category list, and the reporting surfaces are market specific.

### Communication Reality

| Market | Dominant channels |
|---|---|
| Pakistan | WhatsApp overwhelmingly, then voice. SMS secondary, email weak |
| UAE | WhatsApp and voice, then email. Multilingual: English, Arabic, Hindi, Urdu, Russian |
| United Kingdom | Email and voice, then SMS. WhatsApp growing |
| United States | SMS, email and voice. WhatsApp limited |

Channel priority ordering in the Unified Inbox and in automation defaults must come from the country pack.

### Calendar and Working Week

| Market | Weekend | Notes |
|---|---|---|
| Pakistan | Sunday, with Saturday partial in many firms | Ramadan hours, two Eids, prayer time gaps on Friday |
| UAE | Saturday and Sunday, Friday afternoon reduced | Ramadan hours, Islamic calendar holidays announced at short notice |
| United Kingdom | Saturday and Sunday | Bank holidays differ between England and Wales, Scotland, and Northern Ireland |
| United States | Saturday and Sunday | Federal and state holidays |

SLA timers, routing hours, viewing scheduling, and reminder automation must all respect the market calendar rather than a US business week.

## 8A.5 Localization Acceptance Criteria

1. Switching an organization's market changes currency, area units, address form, phone format, date format, weekend, and stage template with no code change.
2. A Pakistani user sees crore and lakh; an Emirati user sees AED with 5 percent VAT on commission; a UK user sees GBP with 20 percent VAT and a postcode field; a US user sees USD, state and ZIP.
3. No screen displays an address field that does not exist in the active market.
4. Arabic and Urdu render right to left across navigation, tables, and forms.
5. A transaction created in the UK pack uses the England and Wales, Scotland, or Northern Ireland template as selected, never the US closing pipeline.
6. Consent enforcement uses the active market's regime, and an outbound message blocked by consent records the regime that blocked it.
7. Multi market reporting states the reporting currency and the FX rate date on every aggregated figure.

# 8B. Platform Tenancy and Organization Provisioning

EstateOS is sold as a platform. Three distinct authority levels exist, and they must never be collapsed into one another.

## 8B.1 Authority Levels

**Level 1 — Platform**

The EstateOS operator. Owns the software, the infrastructure, and the customer relationship. Works inside a Platform Console that is separate from any customer workspace.

Platform roles:

* Platform Owner — full platform control, including billing and other platform administrators
* Platform Administrator — provisions and supports customer organizations
* Platform Support — read only access to operational health, no customer record access without an approved support session

**Level 2 — Organization**

A customer company (a brokerage, a developer, a property management firm). Fully isolated tenant. Its highest authority is the Organization Owner, created by the platform during provisioning.

**Level 3 — Organization Internals**

Offices, teams, and users inside a customer organization, managed by that organization itself as defined in Module One.

The platform never manages a customer's agents. The customer never sees another customer's existence.

## 8B.2 Organization Provisioning

**PLAT 001 — Create organization**

A Platform Administrator creates a tenant with:

* Legal company name and trading name
* Primary country and market, which selects the country pack (Module Zero)
* Additional enabled markets
* Regulatory jurisdiction, such as Punjab, Sindh, Dubai, Abu Dhabi, England and Wales, Scotland, or a US state
* Time zone, reporting currency, primary language
* Business type: sales brokerage, lettings, property management, developer, or mixed
* Licence and regulatory registration numbers required by the selected market
* Data residency region
* Subscription plan, seat limit, and contract dates
* Billing contact

**PLAT 002 — Create the Organization Owner**

Provisioning creates exactly one Organization Owner account and sends an activation invitation. The platform sets no password for this account and never stores one it can read.

**PLAT 003 — Plan and entitlements**

The plan determines seat count, enabled modules, AI usage allowance, and integration allowances. The organization cannot exceed its entitlements; attempts return a clear upgrade path rather than a silent failure.

**PLAT 004 — Lifecycle**

Suspend, resume, and terminate an organization. Suspension blocks user sign in and outbound automation while preserving data. Termination schedules deletion after the contractual retention window and produces an export first.

**PLAT 005 — Support access**

Platform staff cannot read customer records by default. A support session must be requested, justified, time boxed, consented to by an Organization Owner or Administrator, and written to both the platform audit log and the organization audit log. Every action taken during a support session is attributed to the platform user, never to the customer's own staff.

**PLAT 006 — Platform observability**

Per organization: seat usage, message volume, integration health, AI spend, error rate, and last activity. Aggregate metrics never expose record contents.

## 8B.3 Tenant Isolation

* Every domain table carries an organization identifier, and every query is scoped by the caller's organization before any other filter.
* Object storage, search indexes, vector indexes, queues, and caches are partitioned by organization.
* Integration credentials belong to an organization, never to the platform.
* A cross organization read is a security incident, not a bug. It must be impossible through the API surface rather than merely absent from the user interface.

## 8B.4 Onboarding Path

1. Platform Administrator creates the organization and the Organization Owner.
2. The Organization Owner activates their account and completes a guided setup: brand, offices, working hours, holidays, SLA policy, commission plan, permitted lead sources.
3. The Organization Owner or an Organization Administrator connects channels and integrations for the organization (Section 79A).
4. The Organization Administrator invites members, assigns roles, offices, teams, and reporting lines.
5. Members activate their own accounts and set their own credentials.

Setup progress is visible as a checklist, and the workspace states plainly which capabilities remain unavailable until a step is completed.

# 9. Module One: Organization Management

EstateOS must support true multi tenant operation.

Each customer organization receives logically isolated data.

## Functional Requirements

**ORG 001**

Create an organization.

Fields:

* Organization name
* Country and market (selects the country pack, see Module Zero)
* Additional enabled markets
* Time zone
* Currency and reporting currency
* Primary language and additional languages
* Regulatory market and sub jurisdiction where applicable, such as England and Wales, Scotland, Dubai, Abu Dhabi, Punjab, Sindh, or a US state
* Business type
* Brokerage license details when applicable, such as RERA broker card, HMRC AML supervision registration, state licence, or provincial registration
* Data residency region

**ORG 002**

Create multiple offices.

**ORG 003**

Create teams within offices.

**ORG 004**

Assign agents to teams.

**ORG 005**

Configure working hours.

**ORG 006**

Configure organization holidays.

**ORG 007**

Configure default SLA policies.

**ORG 008**

Configure currencies and commission rules.

**ORG 009**

Configure permitted lead sources.

**ORG 010**

Configure branding.

# 10. Role Based Access Control

Permissions must operate at:

* Organization
* Office
* Team
* Record
* Module
* Action

Example permissions:

* contacts.view
* contacts.edit
* leads.assign
* leads.reassign
* properties.edit
* transactions.approve
* commissions.view
* commissions.edit
* automation.manage
* reports.organization
* reports.team
* maintenance.assign
* integrations.manage

Sensitive financial data should not automatically be visible to every agent.

# 10A. Authentication, Sessions and Credential Lifecycle

Identity is a security boundary. EstateOS has no user switching control, no impersonation dropdown, and no shared logins.

## 10A.1 Sign In

**AUTH 001**

Email and password sign in. Passwords are hashed with a memory hard algorithm such as Argon2id or bcrypt at a current work factor. Plaintext and reversible encryption are prohibited.

**AUTH 002**

Sign in is rate limited per account and per IP, with progressive delay and temporary lockout after repeated failure. Failed attempts are logged without recording the attempted password.

**AUTH 003**

Sign in failure messages must not reveal whether the account exists.

**AUTH 004**

Optional single sign on per organization: Google Workspace, Microsoft Entra ID, or SAML. When enforced by the organization, password sign in is disabled for its members.

## 10A.2 Sessions

**AUTH 005**

Server side sessions referenced by an opaque, signed, HTTP only, Secure, SameSite cookie. No user identity, role, or permission is trusted from anything the client can edit.

**AUTH 006**

Idle timeout and absolute lifetime are organization policy. Defaults: 12 hour idle, 30 day absolute.

**AUTH 007**

Sign out revokes the session server side. A user can list their active sessions and revoke any of them. An administrator can revoke all sessions for a member.

**AUTH 008**

Every request resolves the caller from the session, then resolves the organization from the caller. A caller cannot name their own organization.

## 10A.3 Account Lifecycle

**AUTH 009**

Members are created by an Organization Administrator and receive a single use, expiring activation link. The administrator never sets or sees a member password.

**AUTH 010**

Password reset uses a single use, expiring token delivered by email, invalidates all existing sessions on completion, and notifies the account owner.

**AUTH 011**

Deactivation immediately revokes sessions and blocks sign in while preserving the member's historical attribution on every record they touched.

**AUTH 012**

Multi factor authentication by TOTP, optional per user and enforceable per organization. Recovery codes are issued once and stored hashed.

## 10A.4 Authorization at Request Time

**AUTH 013**

Permission checks execute on the server for every read and every write. Hiding a control in the interface is presentation, never protection.

**AUTH 014**

Record visibility follows the hierarchy defined in Section 10: organization, office, team, own, plus the caller's reporting line. Scope is applied in the data access layer, not in the page.

**AUTH 015**

Sign in, sign out, failed sign in, password change, role change, session revocation, MFA change, and support session start and end are all audited (Section 83).

# 11. Module Two: Unified Inbox

The Unified Inbox is one of the primary EstateOS interfaces.

It must aggregate:

* WhatsApp
* SMS
* Email
* Telephone
* Website chat
* Website forms
* Portal inquiries

Meta's WhatsApp Business Platform uses APIs and webhooks for business messaging, making event driven synchronization appropriate for the EstateOS inbox architecture.

Twilio similarly supports event webhooks for messages and telephone activity, including call status callbacks.

## 11.1 Inbox Layout

Left panel:

* All
* Mine
* Unassigned
* Team
* Urgent
* SLA breached
* WhatsApp
* SMS
* Calls
* Email
* Portal
* Archived

Middle panel:

Conversation list.

Right panel:

Contact intelligence.

Right panel displays:

* Name
* Lead type
* Assigned agent
* Lead score
* Qualification
* Desired areas
* Budget
* Timeline
* Financing
* Matching properties
* Last activity
* Next task
* Active viewing
* Active offer
* Active transaction

Agents should not need to leave the conversation to understand the client.

## 11.2 Conversation Features

Every conversation must support:

* Reply
* Internal note
* Mention teammate
* Attach file
* Send property
* Send viewing link
* Create task
* Change assignment
* Update lead status
* Open client profile
* Open property
* Open transaction

## 11.3 AI Conversation Assistance

EstateOS AI may:

* Summarize long conversations
* Detect intent
* Extract budget
* Extract desired location
* Extract bedrooms
* Extract timeline
* Extract financing information
* Detect viewing requests
* Detect complaints
* Suggest responses
* Translate messages
* Recommend next actions

AI extracted fields require source attribution.

Example:

Budget: AED 2.1M

Source:

WhatsApp message received August 12.

# 12. Communication Compliance

EstateOS requires a centralized Consent Ledger.

WhatsApp requires businesses to obtain opt in before initiating messaging, and Meta uses a customer service window after incoming user activity.

For U.S. automated calls and texts, consent and revocation obligations can apply under TCPA rules.

Commercial email in the United States must also support requirements including accurate sender information and opt out mechanisms under CAN SPAM.

EstateOS therefore requires per channel consent.

ConsentRecord:

* contact_id
* channel
* phone_or_email
* purpose
* status
* source
* collected_at
* evidence
* revoked_at
* jurisdiction

Status:

* unknown
* opted_in
* opted_out
* transactional_only
* restricted

Before automation sends a message, the communication policy engine evaluates the Consent Ledger.

# 13. Module Three: Contact Management

The Contact is the canonical representation of a person or business.

## Contact Fields

* Contact ID
* First name
* Last name
* Display name
* Email addresses
* Phone numbers
* WhatsApp numbers
* Preferred language
* Preferred communication channel
* Time zone
* Company
* Contact type
* Tags
* Assigned team
* Assigned agent
* Source history
* Communication preferences
* Consent information
* Notes
* Relationships
* Created date
* Last activity date

## Contact Types

A contact may simultaneously be:

* Buyer
* Seller
* Tenant
* Landlord
* Investor
* Vendor
* Referral partner
* Past client

# 14. Identity Resolution and Duplicate Detection

EstateOS should automatically detect possible duplicate contacts.

Signals:

* Exact normalized email
* Exact normalized phone
* WhatsApp identity
* Portal identity
* Similar name plus matching phone
* Similar name plus matching email

Duplicate handling should have three levels.

## Level One

High confidence.

Automatically merge identities into one Contact.

## Level Two

Medium confidence.

Ask an administrator or agent to confirm.

## Level Three

Low confidence.

Keep records separate.

All merges must be reversible through audit history.

# 15. Module Four: Lead Management

A Lead represents an active opportunity associated with a Contact.

## Lead Types

* Buyer
* Seller
* Tenant
* Landlord

Optional future types:

* Investor
* Commercial buyer
* Commercial tenant
* Developer inquiry

## Standard Lead Pipeline

1. New
2. Attempting Contact
3. Contacted
4. Qualification
5. Qualified
6. Nurture
7. Viewing
8. Offer
9. Converted to Transaction
10. Closed Won
11. Closed Lost
12. Unqualified

The stages should be configurable by organization.

# 16. Lead Source Capture

EstateOS must track sources such as:

* Website
* Google Ads
* Meta Ads
* WhatsApp
* Zillow
* Realtor.com
* Property portal
* Referral
* Organic
* Walk in
* Telephone
* Email
* Imported database
* Manual entry
* Partner

Lead integrations may arrive through:

* Native API
* Webhook
* Email parsing
* CSV
* Integration platform
* Manual creation

Real estate CRM products already use both direct integrations and lead parsing mechanisms to pull inquiries from portals into a central CRM.

# 17. Module Five: Qualification Engine

EstateOS must provide different qualification forms depending on intent.

# 17.1 Buyer Qualification

Fields:

* Purchase purpose
* Property type
* Preferred locations
* Alternative locations
* Minimum bedrooms
* Minimum bathrooms
* Minimum area
* Maximum area
* Minimum price
* Maximum budget
* Cash or financing
* Mortgage preapproval
* Buying timeline
* Must have features
* Preferred features
* Furnished preference
* New construction preference
* Ready property preference
* Occupancy preference
* Viewing availability
* Current location
* Decision maker status
* Notes

# 17.2 Seller Qualification

Fields:

* Property
* Property address
* Property type
* Ownership confirmation
* Occupancy
* Expected price
* Mortgage status
* Selling timeline
* Reason for selling
* Current listing status
* Existing agent agreement
* Property condition
* Viewing availability
* Documentation readiness

# 17.3 Tenant Qualification

Fields:

* Preferred locations
* Property type
* Bedrooms
* Bathrooms
* Budget
* Move date
* Lease duration
* Furnishing requirement
* Number of occupants
* Pets
* Employment information when legally appropriate
* Viewing availability
* Required amenities

# 17.4 Landlord Qualification

Fields:

* Property
* Desired rental amount
* Availability date
* Furnishing
* Current occupancy
* Existing tenancy
* Management requirement
* Maintenance requirement
* Leasing requirement
* Property documentation

# 18. Module Six: Rule Based Lead Scoring

EstateOS should initially use an explainable rules engine rather than opaque machine learning.

Score range:

0 to 100.

Suggested scoring model:

## Intent

Maximum 20 points.

Signals:

* Explicitly wants to buy
* Explicitly wants to sell
* Requests viewing
* Requests offer information

## Timeline

Maximum 20 points.

Example:

* Within 30 days: 20
* Within 90 days: 15
* Within 180 days: 10
* Unknown: 5
* More than 12 months: 2

## Financial Readiness

Maximum 15 points.

Buyer example:

* Cash ready
* Mortgage approved
* Mortgage process started
* Financing unknown

## Engagement

Maximum 15 points.

Signals:

* Replies to messages
* Answers calls
* Opens property recommendations
* Requests details
* Books viewing

## Profile Completeness

Maximum 10 points.

## Property Fit Availability

Maximum 10 points.

## Source Quality

Maximum 5 points.

## Recency

Maximum 5 points.

Classification:

* 80 to 100: Hot
* 60 to 79: Warm
* 40 to 59: Developing
* 20 to 39: Nurture
* 0 to 19: Low intent

Each score must expose an explanation.

Example:

**Lead score: 84**

Reasons:

* Purchase within 30 days: plus 20
* Cash buyer: plus 15
* Requested viewing: plus 15
* Complete requirements: plus 9
* Replied within 10 minutes: plus 10
* Matching inventory available: plus 10
* Source quality: plus 5

# 19. Fair Housing Guardrails

EstateOS must not use protected characteristics for lead scoring, property matching, tenant decisions, or housing recommendations.

In the United States, the Fair Housing Act protects against housing discrimination based on categories including race, color, national origin, religion, sex, familial status, and disability.

HUD has also specifically addressed the application of AI to tenant screening and digital housing advertising.

Therefore:

* Protected attributes must never affect lead priority.
* Protected attributes must never affect property recommendations.
* AI must not infer protected attributes for routing.
* Property recommendations must be based on legitimate housing preferences.
* Sensitive filters must be jurisdiction configurable.
* Tenant screening integrations should produce auditable outcomes.
* Human review must remain available where required.

# 20. Module Seven: Agent Routing Engine

Routing should operate in two stages.

## Stage One: Eligibility

Remove agents who cannot receive the lead.

Eligibility conditions may include:

* Correct office
* Correct territory
* Correct property type
* Required language
* Working hours
* Not on leave
* Capacity available
* Required certification
* Lead source eligibility

## Stage Two: Ranking

Eligible agents receive a routing score.

Suggested model:

Territory fit: 25

Availability: 20

Language match: 15

Specialization: 15

Capacity: 15

Recent SLA performance: 10

Total: 100.

Configuration must be adjustable by administrators.

## Routing Strategies

EstateOS must support:

* Round robin
* Weighted round robin
* Territory
* Language
* Specialization
* Availability
* Capacity
* Performance
* Team queue
* First claim
* Hybrid

# 21. Automatic Reassignment

Every new lead receives an SLA timer.

Example:

Lead created at 14:00.

Agent assigned immediately.

Expected acknowledgement:

2 minutes.

Expected first attempt:

5 minutes.

If no acknowledgement:

Manager notification.

If no response attempt after 5 minutes:

Reassign.

If second agent fails:

Move to team queue.

SLA policies must be configurable by:

* Lead source
* Lead score
* Time of day
* Team
* Market
* Lead type

All reassignments must be recorded.

# 22. Agent Availability

Each agent profile contains:

* Working hours
* Time zone
* Calendar
* Active status
* Away status
* Vacation dates
* Capacity limit
* Active lead count
* Active transaction count
* Territories
* Languages
* Specializations

Agents should be automatically excluded from new assignment during approved leave or outside configurable routing hours.

# 23. Module Eight: Property Database

EstateOS requires separate Property and Listing concepts.

## Property

Represents the physical asset.

Examples:

Apartment 1704, Marina Tower.

## Listing

Represents an offering of that property.

The same property can have different listings over time.

Example:

2025 rental listing.

2026 sale listing.

# 24. Property Record

Core fields:

* Property ID
* Address, stored as a structured payload shaped by the active country pack rather than as fixed street, state and ZIP columns
* Geographic coordinates
* Building
* Unit
* Community
* City
* Region, meaning province, emirate, county, or state depending on market
* Postal code where the market uses one
* Country
* Local identifiers, such as Land Registry title number, title deed number, Makani, APN, or society allotment reference
* Property type
* Bedrooms
* Bathrooms
* Area, stored normalized with the originally entered unit preserved, such as square feet, square metres, marla, kanal, square yard, or acre
* Lot area
* Floors
* Parking
* Furnishing
* Amenities
* Features
* Year built
* Description
* Images
* Videos
* Floor plans
* Owner
* Current occupancy
* Documents
* Maintenance history

# 25. Listing Record

Fields:

* Listing ID
* Property ID
* Listing type
* Sale or rent
* Asking price
* Currency
* Listing agent
* Brokerage
* Listing source
* External MLS ID
* Portal IDs
* Status
* Available date
* Commission terms
* Media
* Description
* Publication status
* Created date
* Expiration date

Listing states:

1. Draft
2. Coming Soon
3. Active
4. Under Offer
5. Pending
6. Sold
7. Leased
8. Withdrawn
9. Expired
10. Off Market

EstateOS should align listing fields with RESO terminology where relevant because RESO Data Dictionary standardizes property information across real estate technologies.

# 26. Listing Import

EstateOS should support:

* RESO Web API
* MLS integrations
* XML feeds
* CSV
* Manual creation
* Partner APIs
* Property portal feeds

Import must support:

* Initial synchronization
* Incremental synchronization
* Deleted listing reconciliation
* Status changes
* Price changes
* Media changes

# 27. Module Nine: AI Assisted Property Matching

Property matching should use a hybrid model.

## Stage One: Hard Filters

Remove obviously unsuitable inventory.

Examples:

* Transaction type
* Maximum budget
* Minimum bedrooms
* Property type
* Required geography
* Availability

## Stage Two: Weighted Matching

Suggested criteria:

Budget fit: 25

Location fit: 20

Bedrooms and bathrooms: 15

Property type: 10

Area: 10

Amenities: 10

Availability and timeline: 5

Behavioral preference: 5

Total: 100.

## Stage Three: Semantic Ranking

AI can compare natural language requirements against:

* Listing descriptions
* Features
* Amenities
* Agent notes
* Previous client behavior

Example requirement:

> Modern apartment near metro, bright interior, balcony, not directly facing a highway.

Traditional filtering handles location, bedrooms, and price.

Semantic matching handles softer preferences such as:

* Bright
* Modern
* Quiet
* Balcony
* Lifestyle descriptions

# 28. Match Explanation

Every recommended property should explain the match.

Example:

**91 percent match**

* Within budget
* Preferred Dubai Marina location
* Three bedrooms requested
* Balcony requested
* Marina view preference detected
* 4 percent above preferred floor area

Agents can modify match weights.

# 29. Reverse Matching

EstateOS must support both directions.

Lead → Properties.

Property → Leads.

When a new listing becomes available, EstateOS should identify matching buyers or tenants.

Example:

New 2 bedroom Downtown apartment at AED 1.7M.

EstateOS finds:

42 possible buyers.

12 score above 80.

3 hot buyers.

Agent receives:

> Three high intent clients match this new listing.

# 30. Saved Searches and Alerts

Clients can have saved requirement profiles.

When inventory changes:

* New matching listing
* Price reduction
* Listing returned to market
* Similar property added

EstateOS may trigger an alert subject to communication consent.

# 31. Module Ten: Viewing Management

Viewing creation should be possible from:

* Lead
* Property
* Conversation
* Match result

Fields:

* Client
* Property
* Agent
* Listing agent
* Date
* Start time
* Duration
* Location
* Meeting instructions
* Status
* Notes

Statuses:

1. Proposed
2. Awaiting Client Confirmation
3. Confirmed
4. Reminder Sent
5. Arrived
6. Completed
7. Cancelled
8. No Show
9. Reschedule Requested

# 32. Calendar Integration

Integrate:

* Google Calendar
* Microsoft Outlook Calendar

Check agent availability before confirming viewings.

Optional future features:

* Travel time buffer
* Route optimization
* Multi property viewing tours

# 33. Viewing Automation

Example workflow:

Buyer requests viewing.

EstateOS identifies requested property.

System checks agent availability.

Three times are proposed.

Client chooses 3:00 PM.

Calendar event created.

Confirmation sent.

Reminder sent 24 hours before.

Reminder sent 2 hours before.

Agent completes viewing.

EstateOS requests outcome.

Agent selects:

* Interested
* Maybe
* Not interested

EstateOS captures feedback.

Lead score updates.

Next action generated.

# 34. Module Eleven: Offer Workspace

Agents must be able to create an Offer against a Listing.

Fields:

* Buyer or tenant
* Property
* Listing
* Offer amount
* Deposit
* Financing
* Proposed closing date
* Conditions
* Expiration
* Agent
* Supporting documents
* Notes

Offer states:

1. Draft
2. Submitted
3. Presented
4. Countered
5. Revised
6. Accepted
7. Rejected
8. Withdrawn
9. Expired

# 35. Counteroffer History

EstateOS should maintain the complete negotiation chain.

Example:

Offer One: AED 1.80M

Seller counter: AED 1.95M

Buyer counter: AED 1.88M

Seller final: AED 1.90M

Accepted: AED 1.90M

Previous values must never be overwritten.

# 36. Module Twelve: Transaction Workspace

Accepted offers can create a Transaction.

The transaction workspace becomes the central source of truth for the deal.

DocuSign's real estate products similarly center transaction documents and signatures inside a shared transaction workspace, validating this operating pattern.

## Transaction Header

Display:

* Property
* Buyer
* Seller
* Agent
* Transaction coordinator
* Price
* Commission
* Stage
* Closing date
* Days remaining
* Tasks completed
* Documents completed
* Outstanding blockers

# 37. Transaction Types

* Purchase
* Sale
* Residential lease
* Commercial sale
* Commercial lease

Each transaction type can have different milestone templates.

# 38. Transaction Stages

Example purchase pipeline:

1. Offer Accepted
2. Contract Preparation
3. Contract Signed
4. Deposit
5. Financing
6. Inspection
7. Appraisal
8. Conditions
9. Final Documentation
10. Closing Scheduled
11. Closing
12. Completed

Jurisdiction specific templates must be configurable.

# 39. Milestone Engine

Each milestone contains:

* Name
* Due date
* Responsible person
* Required documents
* Dependencies
* Status
* Reminder schedule
* Escalation policy

Example:

Mortgage Approval

Due:

September 5.

Owner:

Buyer Agent.

If not completed three days before deadline:

Notify Agent.

Two days before:

Notify Agent and Transaction Coordinator.

One day before:

Notify Manager.

# 40. Transaction Checklist

Organizations can create reusable checklist templates.

Example:

Buyer identity obtained.

Proof of funds received.

Offer signed.

Seller contract signed.

Deposit confirmed.

Inspection completed.

Financing approval obtained.

Final walkthrough completed.

Closing documents complete.

Commission confirmed.

# 41. Module Thirteen: Document Management

Documents belong to:

* Contact
* Property
* Lead
* Offer
* Transaction
* Maintenance request

Document properties:

* Name
* Category
* Version
* Owner
* Uploaded by
* Uploaded date
* Expiration date
* Verification status
* Electronic signature status
* Access permissions

# 42. Document Categories

Examples:

* Identity
* Ownership
* Property
* Contract
* Financial
* Disclosure
* Inspection
* Offer
* Lease
* Closing
* Vendor
* Invoice

# 43. AI Document Intelligence

AI can:

* Classify uploaded documents
* Extract names
* Extract dates
* Extract property information
* Extract prices
* Extract expiration dates
* Detect missing fields
* Summarize documents
* Identify transaction references

AI extraction should never silently overwrite verified transaction data.

Instead:

AI suggests value.

User accepts or rejects.

# 44. Electronic Signature Integration

EstateOS should initially integrate electronic signature providers instead of attempting to build a legally comprehensive signature platform.

Recommended initial provider:

* DocuSign

Provider abstraction should later allow:

* Adobe Acrobat Sign
* Dropbox Sign
* PandaDoc
* Local market providers

EstateOS tracks:

* Draft
* Sent
* Delivered
* Viewed
* Signed
* Declined
* Expired

Completed signed documents return to the transaction workspace.

# 45. Module Fourteen: Closing Management

EstateOS should provide a Closing Board.

Views:

* Closing this week
* Closing this month
* At risk
* Waiting on client
* Waiting on third party
* Documents incomplete
* Commission incomplete

# 46. Closing Risk Indicators

Possible risk signals:

* Multiple overdue milestones
* Unsigned contract
* Financing deadline approaching
* Deposit missing
* Inspection unresolved
* No agent activity
* Client communication stale

EstateOS generates a risk level:

* Normal
* Attention
* High Risk

Risk explanations must remain visible.

# 47. Module Fifteen: Commission Engine

EstateOS must calculate estimated and finalized commissions.

## Commission Inputs

* Transaction value
* Commission percentage
* Flat fee
* Buyer side commission
* Seller side commission
* Brokerage split
* Agent split
* Team split
* Referral fee
* Partner fee
* Tax
* Other deductions

# 48. Commission Plan

Example:

Sale price:

AED 2,000,000.

Gross commission:

2 percent.

Gross commission:

AED 40,000.

Brokerage split:

20 percent.

Agent portion:

AED 32,000.

Referral:

10 percent of agent portion.

Final agent commission:

AED 28,800.

EstateOS should show every calculation step.

# 49. Commission Status

1. Estimated
2. Confirmed
3. Closing Pending
4. Earned
5. Approved
6. Paid

Finance administrators may lock completed commission records.

# 50. Module Sixteen: Property Maintenance

The maintenance system is relevant to property management customers and hybrid agencies.

Modern property management tools increasingly centralize maintenance requests, work orders, vendors, communication, and completion activity rather than managing maintenance through calls and group messages.

## Maintenance Intake Channels

Requests can arrive through:

* Tenant portal
* WhatsApp
* Email
* Telephone
* SMS
* Property manager
* Inspection

# 51. Maintenance Request

Fields:

* Property
* Unit
* Tenant
* Issue description
* Category
* Priority
* Images
* Videos
* Availability
* Permission to enter
* Reported date
* Status

# 52. AI Maintenance Triage

AI can classify:

* Plumbing
* Electrical
* HVAC
* Appliance
* Structural
* Security
* Cleaning
* Pest
* General

Priority:

* Emergency
* Urgent
* Normal
* Low

Emergency keywords should trigger immediate escalation.

Example:

> Water pouring from ceiling.

EstateOS:

Category: Plumbing.

Priority: Emergency.

Action:

Notify property manager immediately.

# 53. Work Order Lifecycle

1. Request Received
2. Triaged
3. Approval Required
4. Vendor Selection
5. Vendor Assigned
6. Appointment Scheduled
7. In Progress
8. Waiting for Parts
9. Work Completed
10. Tenant Confirmation
11. Invoice Review
12. Closed

# 54. Vendor Management

Vendor fields:

* Company
* Contact
* Trade
* Service areas
* Operating hours
* Emergency availability
* Insurance documents
* License details
* Rating
* Average response time
* Average completion time
* Average cost
* Active work orders

AppFolio's vendor workflow provides vendors with centralized access to assigned work, invoices, notes, photographs, and completion updates, which is a useful model for EstateOS vendor access.

# 55. Vendor Routing

Similar to lead assignment.

EstateOS evaluates:

* Trade
* Territory
* Availability
* Price
* SLA performance
* Owner preference
* Property preference

# 56. Owner Approval Rules

Example:

Repairs below AED 500:

Automatically approve.

AED 500 to AED 2,000:

Property manager approval.

Above AED 2,000:

Owner approval.

Emergency repair:

Immediate dispatch with notification.

Thresholds must be configurable.

# 57. Module Seventeen: Automation Engine

Automation is the core infrastructure behind EstateOS.

Automation structure:

**Trigger → Conditions → Actions → Delay → Branch → Result**

## Triggers

Examples:

* Lead created
* Lead score changed
* Lead assigned
* Message received
* Message unanswered
* Property created
* Listing activated
* Match discovered
* Viewing scheduled
* Viewing completed
* Offer submitted
* Offer accepted
* Transaction created
* Milestone approaching
* Document uploaded
* Signature completed
* Maintenance request created
* Work order overdue

# 58. Automation Conditions

Conditions may evaluate:

* Lead type
* Lead score
* Source
* Agent
* Team
* Territory
* Language
* Property
* Deal stage
* Consent
* Time
* Channel
* Transaction value
* Listing type
* Maintenance priority

# 59. Automation Actions

Actions may include:

* Assign agent
* Reassign agent
* Create task
* Send notification
* Send approved communication
* Change stage
* Add tag
* Update field
* Start SLA
* Schedule reminder
* Create viewing
* Create transaction
* Request document
* Notify manager
* Call webhook

# 60. Automation Versioning

Changing an automation must not silently alter historical execution records.

Every automation version must be stored.

Execution logs should show:

* Trigger
* Conditions evaluated
* Actions
* Timestamp
* Result
* Error

# 61. EstateOS AI Layer

AI should operate across the platform rather than existing as one chatbot.

## AI Capability One: Conversation Intelligence

* Summaries
* Intent detection
* Field extraction
* Suggested responses
* Translation

## AI Capability Two: Lead Intelligence

* Qualification assistance
* Next action recommendation
* Lead prioritization explanation

## AI Capability Three: Property Intelligence

* Semantic property matching
* Listing summarization
* Reverse buyer matching

## AI Capability Four: Call Intelligence

When recording is legally enabled:

* Transcription
* Summary
* Action items
* Requirement extraction
* Sentiment indicators
* Follow up suggestions

Twilio's voice APIs and recording callbacks can support programmatic call tracking and recording workflows when appropriately configured.

## AI Capability Five: Document Intelligence

* Classification
* Extraction
* Summary
* Missing item detection

## AI Capability Six: Transaction Intelligence

* Deadline monitoring
* Risk detection
* Next action
* Missing document detection

## AI Capability Seven: Maintenance Intelligence

* Issue classification
* Priority detection
* Vendor recommendation
* Work order summaries

# 61A. AI Provider Configuration

## 61A.1 Configuration Rules

* Model provider credentials are supplied through environment variables at deployment. They are never stored in the database, never returned by an API, and never visible in the interface.
* No AI feature falls back to canned text. If the provider is unreachable, the feature reports that it is unavailable and the underlying workflow continues without it.
* Every AI call records model, prompt version, token usage, latency, cost, and outcome against the calling organization (Section 88).
* Per organization AI settings control which capabilities are enabled and the monthly spend cap. Reaching the cap disables AI features and notifies the Organization Owner rather than failing silently.

## 61A.2 Expected Environment Variables

```
ANTHROPIC_API_KEY          # primary model provider
AI_MODEL_DEFAULT           # model id used for assistant, summarisation, drafting
AI_MODEL_FAST              # cheaper model for classification and scoring support
AI_EMBEDDING_MODEL         # embeddings for semantic property and document search
AI_MONTHLY_BUDGET_USD      # platform level safety cap
AI_ENABLED                 # global kill switch
```

Missing variables disable AI capability cleanly at boot and surface as an integration health warning in the Platform Console.

## 61A.3 Boundary

The AI layer reads only records the calling user is already permitted to read, and writes nothing without either an explicit user action or an automation rule the organization has enabled (Section 63).

# 62. EstateOS AI Copilot

Global command interface:

> Ask EstateOS

Example queries:

> Show me hot buyer leads that have not been contacted today.

> Which transactions closing this month are at risk?

> Find buyers matching Property 1024.

> Show agents with more than five unanswered leads.

> What happened with Ahmed Khan's transaction?

> Which marketing source produced the highest commission this quarter?

> Summarize this client's conversation.

> Show emergency maintenance requests.

The copilot should translate natural language queries into controlled EstateOS data operations.

# 63. AI Permission Boundary

AI may automatically perform low risk actions.

Examples:

* Classification
* Summarization
* Extraction
* Task creation
* Internal notifications
* Match suggestions

Higher risk actions require explicit policies or approval.

Examples:

* Sending legal documents
* Changing transaction price
* Rejecting applicants
* Cancelling transactions
* Modifying commission
* Making housing eligibility decisions
* Bulk marketing communications

# 64. Reporting and Analytics

EstateOS requires four analytics categories.

## 64.1 Revenue Analytics

Metrics:

* Leads
* Qualified leads
* Viewings
* Offers
* Transactions
* Closed revenue
* Gross commission income
* Pipeline value
* Forecast commission

## 64.2 Source Analytics

For every source:

* Spend
* Leads
* Cost per lead
* Qualified leads
* Cost per qualified lead
* Viewings
* Offers
* Closings
* Revenue
* Gross commission
* Cost per acquisition
* Return on investment

Suggested ROI calculation:

**Source ROI = Attributed Gross Commission minus Source Cost divided by Source Cost**

Attribution models:

* First touch
* Last touch
* Linear
* Custom

# 65. Agent Performance

Metrics:

* Leads assigned
* Median first response time
* SLA compliance
* Contact rate
* Qualification rate
* Viewing rate
* Offer rate
* Close rate
* Gross commission
* Active pipeline
* Follow up compliance
* Lead reassignment count

Managers should be able to compare agents by team and date range.

# 66. Funnel Analytics

EstateOS should visualize:

Lead

→ Contacted

→ Qualified

→ Viewing

→ Offer

→ Transaction

→ Closed

Users should be able to identify where conversion collapses.

Example:

1,000 leads

620 contacted

310 qualified

180 viewings

65 offers

42 transactions

37 closed.

# 67. Property Analytics

Metrics:

* Listing views
* Leads generated
* Matches
* Recommendations sent
* Viewings
* Offers
* Days on market
* Price changes
* Conversion
* Closing price

# 68. Maintenance Analytics

Metrics:

* Open requests
* Emergency requests
* First response time
* Time to assignment
* Time to resolution
* Cost per work order
* Cost per property
* Repeat issue rate
* Vendor completion time
* Vendor SLA compliance

Time to response and time to resolution are among the operational maintenance metrics commonly tracked by current property management systems.

# 69. Main Dashboard

The dashboard should answer:

**What requires attention right now?**

Widgets:

* New leads
* Unanswered leads
* SLA breaches
* Hot leads
* Today's viewings
* Offers awaiting response
* At risk transactions
* Upcoming closings
* Missing documents
* Open maintenance emergencies

Secondary widgets:

* Pipeline value
* Monthly closed commission
* Source ROI
* Agent leaderboard
* Conversion funnel

# 70. Daily Agent Workspace

Agents should see:

## Today

* New assigned leads
* Follow ups due
* Viewings
* Calls
* Tasks
* Offers
* Transaction deadlines

## Priority Leads

Ranked by:

* Lead score
* SLA
* Recent engagement
* Transaction probability

## Suggested Actions

Example:

> Call Ahmed. He requested pricing yesterday and opened three listings this morning.

# 71. Manager Command Center

Managers receive:

* Unassigned leads
* Unanswered leads
* SLA breaches
* Agent workload
* Reassignments
* Pipeline
* Agent conversion
* Source performance
* Transaction risks

This should allow operational intervention without manually opening every agent's CRM.

# 72. Notifications

EstateOS notifications can be delivered through:

* Application
* Email
* Push
* SMS
* WhatsApp
* Slack
* Microsoft Teams

Notification severity:

* Information
* Action Required
* Urgent
* Critical

# 73. Search

Global EstateOS search should support:

* Contact name
* Phone
* Email
* Property
* Address
* Listing ID
* Transaction ID
* Agent
* Vendor
* Document
* Work order

Natural language search can be provided through the AI Copilot.

# 74. Core Data Model

Major entities:

1. Organization
2. Office
3. Team
4. User
5. AgentProfile
6. Contact
7. ChannelIdentity
8. ConsentRecord
9. Lead
10. LeadSource
11. SourceAttribution
12. QualificationProfile
13. LeadScore
14. Conversation
15. Message
16. Call
17. Activity
18. Task
19. Property
20. Listing
21. PropertyPreference
22. PropertyMatch
23. Viewing
24. Offer
25. Transaction
26. TransactionMilestone
27. TransactionChecklist
28. Document
29. SignatureEnvelope
30. CommissionPlan
31. Commission
32. MaintenanceRequest
33. WorkOrder
34. Vendor
35. VendorInvoice
36. Automation
37. AutomationExecution
38. Notification
39. AuditLog

# 75. Critical Entity Relationships

Organization

→ Offices

→ Teams

→ Users

Contact

→ Leads

→ Conversations

→ Viewings

→ Offers

→ Transactions

Property

→ Listings

→ Matches

→ Viewings

→ Offers

→ Transactions

→ Maintenance Requests

Transaction

→ Documents

→ Milestones

→ Commission

Maintenance Request

→ Work Order

→ Vendor

→ Invoice

# 76. Event Driven Architecture

EstateOS should be designed around domain events.

Example incoming WhatsApp workflow:

Meta webhook

→ Integration Gateway

→ Message Received event

→ Identity Resolution

→ Contact Lookup

→ Lead Lookup

→ Conversation Update

→ AI Extraction

→ Lead Score Recalculation

→ Routing Evaluation

→ SLA Timer

→ Agent Notification

This prevents communication providers from being tightly coupled to the CRM logic.

# 77. Important Domain Events

Examples:

* contact.created
* contact.updated
* lead.created
* lead.qualified
* lead.score_changed
* lead.assigned
* lead.sla_breached
* message.received
* message.sent
* call.completed
* listing.created
* listing.status_changed
* match.created
* viewing.created
* viewing.completed
* offer.created
* offer.accepted
* transaction.created
* milestone.overdue
* document.signed
* transaction.closed
* commission.earned
* maintenance.created
* work_order.assigned
* work_order.completed

# 78. Recommended Technical Architecture

## Frontend

Recommended:

* Next.js
* TypeScript
* React
* Tailwind CSS
* Component library such as shadcn/ui

## Backend

Recommended:

* TypeScript based application services
* Node.js
* NestJS or structured Next.js services depending on deployment architecture

A modular monolith is preferable for the first production version.

Do not start EstateOS as twenty microservices.

The domain is already complex enough.

Internal modules can later be extracted when scaling demands it.

## Database

PostgreSQL.

Reasons:

* Strong relational consistency
* Transaction support
* JSON support
* Full text capabilities
* Mature indexing
* Excellent SaaS ecosystem

## Vector Search

Use PostgreSQL with pgvector initially.

This can support semantic property matching and document retrieval without introducing another database.

## Cache

Redis.

Use for:

* Sessions
* Rate limiting
* Queue coordination
* Temporary routing state
* Distributed locks

## Queue

Recommended options:

* BullMQ
* Cloud queue provider
* Kafka only when volume genuinely requires it

## Object Storage

S3 compatible object storage.

Used for:

* Property media
* Documents
* Voice recordings where lawful
* Maintenance photos
* Attachments

# 79. Integration Layer

Initial integrations:

## Messaging

* Meta WhatsApp Business Platform
* Twilio SMS

## Voice

* Twilio Voice

## Email

* Google Workspace
* Microsoft 365

## Calendar

* Google Calendar
* Microsoft Outlook Calendar

## Listing Data

* RESO Web API
* MLS integrations
* Portal feeds

## Electronic Signature

* DocuSign

## Maps

* Google Maps or Mapbox

## Accounting

Future:

* QuickBooks
* Xero

# 79A. Integration Ownership and Connection Flow

## 79A.1 Ownership

Every integration credential belongs to one organization. The platform holds only the application level registrations, such as the Meta app or the Google OAuth client, and never a customer's mailbox or messaging credential.

An integration has exactly one of these states, derived from a real credential and a real health check:

* Not connected
* Connecting
* Connected
* Degraded, with the last error and the time it occurred
* Disconnected by provider, requiring reconnection

No other state may be displayed, and a state may never be hard coded.

## 79A.2 Who Connects What

Organization Owner or Organization Administrator connects, in the organization's Integrations settings:

* Email — Google Workspace or Microsoft 365, by OAuth, per shared mailbox and per user mailbox
* WhatsApp — Meta WhatsApp Business Platform, by embedded signup, including phone number, message templates, and webhook subscription
* SMS and voice — Twilio, by account credentials or connected subaccount
* Calendar — Google Calendar or Outlook Calendar, by OAuth, per user
* Listings — portal feeds and RESO or MLS credentials for the organization's market
* Electronic signature — DocuSign
* Maps — platform level key, no customer action required

Individual members connect only their own mailbox and calendar, and only when the organization permits it.

## 79A.3 Why It Exists

The purpose of the email and WhatsApp integrations is that nobody in the brokerage opens Gmail or the WhatsApp app to do their job.

Requirements:

* Inbound email and WhatsApp messages arrive in the EstateOS Unified Inbox (Module Two) within seconds, threaded against the contact and the lead.
* A user reads, replies, forwards, assigns, snoozes, and closes the conversation inside EstateOS.
* An outbound reply is delivered through the same channel and the same identity the customer already knows, and appears in the external mailbox or WhatsApp thread as a normal sent message.
* Attachments flow both directions and are stored against the record.
* Delivery, read, and failure receipts are shown on the message.
* WhatsApp session windows and template requirements are handled by the product, not by the user. When a free form reply is no longer permitted, the composer offers approved templates and explains why.
* Consent and opt out state (Section 12) is enforced before any outbound message leaves EstateOS.

## 79A.5 Connection Experience

Connecting a channel is an administrator task measured in minutes, not a project.

**Website forms — zero third-party dependency**

EstateOS mints a per-organization endpoint and key. The administrator pastes one HTML form, or points an existing form at the endpoint, and every submission becomes a contact, a lead and an inbox thread. Requires nothing from Google or Meta, so it is the first channel every customer connects.

**Email — one sign-in**

The administrator clicks Connect, signs in to Google Workspace or Microsoft 365, and picks the mailbox to share. EstateOS never sees a password. Replies leave from the same address the customer already knows.

**WhatsApp — Meta embedded signup**

The administrator clicks Connect, completes Meta's embedded signup inside a popup, and selects the WhatsApp Business number. EstateOS subscribes to the webhook and starts threading messages. The 24-hour session window and template requirements are handled by the composer, not explained to the user.

**What the platform must supply first**

Email and WhatsApp cannot complete without the EstateOS operator registering its own applications: a Google OAuth client, a Microsoft Entra app, and a Meta app with Business verification, with the keys placed in the environment (Section 61A lists the variables). Until those exist the interface states plainly that the channel is unavailable and why — it never shows a connect button that cannot finish.

## 79A.4 Connection Health

Each connection stores last successful sync, last error, webhook subscription status, token expiry, and quota usage. Expiring credentials raise a notification to the Organization Administrator before they break. A degraded connection never silently drops inbound messages; undeliverable inbound events are queued and replayed.

# 80. Integration Gateway Requirements

Every external integration must support:

* Authentication management
* Webhook verification
* Idempotency
* Retry policies
* Dead letter handling
* Rate limits
* Logging
* Health status
* Credential rotation

Provider outages must not corrupt EstateOS state.

# 81. Webhook Reliability

Inbound events should be stored before asynchronous processing where possible.

The system should:

1. Receive webhook.
2. Verify signature.
3. Store raw event.
4. Generate idempotency key.
5. Acknowledge provider.
6. Process event asynchronously.
7. Retry temporary failures.
8. Mark permanent failures.
9. Alert administrators when required.

Duplicate provider events must not create duplicate leads, messages, or transactions.

# 82. Security Requirements

EstateOS handles significant personally identifiable and financial information.

Required controls:

* TLS
* Encryption at rest
* Secure secret storage
* Organization isolation
* Role based authorization
* MFA for privileged users
* Secure password hashing
* OAuth where available
* Webhook signature validation
* Rate limiting
* Session management
* Audit logs
* File access controls
* Malware scanning for uploads
* Database backups

# 83. Audit Logging

Audit critical actions:

* Lead assignment
* Lead reassignment
* Lead merge
* Transaction update
* Offer change
* Document deletion
* Commission update
* Permission change
* Automation change
* Integration change
* Consent change

Audit entry fields:

* User
* Action
* Entity
* Previous value
* New value
* Time
* IP
* Request ID

# 84. Privacy Requirements

EstateOS should support:

* Data export
* Contact deletion workflow
* Data retention policies
* Consent history
* Marketing suppression
* Channel specific opt out
* Record access audit
* Data minimization
* Configurable regional policies

For EU related deployments, GDPR principles include purpose limitation, data minimization, storage limitation, security, and transparency around automated decision making.

# 85. Performance Requirements

Target interactive API performance:

P95 common read operation:

Under 500 milliseconds where technically reasonable.

New webhook persistence:

Under 2 seconds.

New lead visible to routing system:

Under 5 seconds under normal operating conditions.

Inbox message update:

Near real time.

Global search:

Under 2 seconds for standard organization sizes.

# 86. Availability

Production target:

99.9 percent monthly availability for core application services.

External provider downtime must be visible separately.

EstateOS must not report itself fully healthy when WhatsApp or telephony delivery is failing.

# 87. Observability

Required:

* Structured application logs
* Error tracking
* Distributed request IDs
* Queue metrics
* Webhook metrics
* Provider error rates
* API latency
* Database monitoring
* Automation execution logs
* AI usage monitoring

# 88. AI Observability

Track:

* Model used
* Prompt version
* Input reference
* Output
* Confidence
* Tokens
* Cost
* Latency
* User acceptance
* User rejection

This creates the dataset required to improve EstateOS AI later.

# 89. Mobile Strategy

Agents operate away from desks.

EstateOS must be fully responsive from the beginning.

First delivery:

Responsive web application or PWA.

Later:

Native iOS and Android applications if usage justifies development.

Mobile priority features:

* Inbox
* Calls
* Lead profile
* Property search
* Viewings
* Tasks
* Offers
* Transaction updates
* Maintenance photographs

# 90. MVP Definition

The first commercially demonstrable EstateOS should not attempt to build every module equally.

The MVP should prove the central revenue workflow.

## MVP Scope

### P0

0. Market localization layer with Pakistan, UAE, UK and US country packs
1. Organization and users
2. Unified inbox
3. WhatsApp integration
4. Email integration
5. SMS integration
6. Website lead capture
7. Canonical contacts
8. Lead records
9. Buyer qualification
10. Seller qualification
11. Tenant qualification
12. Landlord qualification
13. Rule based lead scoring
14. Smart agent routing
15. Automatic reassignment
16. Property database
17. Listing database
18. Property matching
19. Viewing scheduling
20. Tasks and reminders
21. Basic pipeline
22. Source reporting
23. Agent reporting
24. Automation engine
25. AI conversation summaries
26. AI field extraction

This creates the core demonstration:

**Inquiry → Qualification → Assignment → Matching → Viewing**

That is the MVP story that sells EstateOS.

# 91. Phase Two

Add:

* Native calling
* Call recording where lawful
* AI call summaries
* Offers
* Transaction workspace
* Milestones
* Document collection
* DocuSign
* Closing dashboard
* Commission engine
* Advanced analytics

The workflow becomes:

**Inquiry → Qualification → Property → Viewing → Offer → Transaction → Closing**

# 92. Phase Three

Add:

* Tenant portal
* Landlord portal
* Maintenance requests
* Vendor portal
* Vendor routing
* Owner approvals
* Vendor invoices
* Maintenance analytics

The system becomes:

**Lead to Close plus Property Operations**

# 93. Phase Four

Add advanced intelligence:

* Predictive lead scoring
* Deal probability
* Closing risk models
* Listing performance predictions
* Dynamic property recommendations
* Conversation quality scoring
* Automated manager recommendations
* Database reactivation
* Advanced attribution
* Forecasting

# 94. MVP Demonstration Scenario

The sales demonstration should use one continuous story.

### Step One

A buyer sends:

> Hi, I'm looking for a 2 bedroom apartment in Dubai Marina around AED 1.8M.

through WhatsApp.

### Step Two

EstateOS creates or finds the Contact.

### Step Three

AI extracts:

Intent: Buyer.

Area: Dubai Marina.

Bedrooms: 2.

Budget: AED 1.8M.

### Step Four

Lead score:

74.

Warm.

### Step Five

Routing engine selects Agent Sarah.

Reason:

* Marina specialist
* Available
* English speaking
* Four active leads against capacity of ten

### Step Six

Sarah receives the lead.

SLA begins.

### Step Seven

EstateOS instantly shows matching properties.

Top match:

Marina Heights 1208.

Match:

94 percent.

### Step Eight

Sarah sends the property directly from EstateOS.

### Step Nine

Buyer replies:

> Can I see it tomorrow?

EstateOS detects viewing intent.

### Step Ten

Available slots appear.

Buyer selects 4:00 PM.

### Step Eleven

Viewing created.

Calendar updated.

Confirmation sent.

### Step Twelve

Viewing completed.

Sarah selects:

Interested.

### Step Thirteen

Lead score becomes:

89.

Hot.

### Step Fourteen

Buyer offers AED 1.72M.

Offer workspace created.

### Step Fifteen

Seller accepts AED 1.76M.

### Step Sixteen

EstateOS converts Offer to Transaction.

### Step Seventeen

Transaction checklist begins.

Documents requested.

Electronic signatures tracked.

### Step Eighteen

Closing completes.

### Step Nineteen

Commission calculated.

### Step Twenty

Dashboard shows:

WhatsApp

→ Qualified Buyer

→ Viewing

→ Offer

→ Closed

Gross Commission:

AED X.

This demonstration communicates the entire EstateOS value proposition without explaining AI infrastructure.

# 95. Key Product Metrics

EstateOS success should be measured through business outcomes rather than number of AI calls.

Primary metrics:

* Median speed to first human response
* Percentage of leads contacted
* Lead SLA compliance
* Lead to qualified conversion
* Qualified to viewing conversion
* Viewing to offer conversion
* Offer to close conversion
* Gross commission per lead
* Gross commission per source
* Agent response compliance
* Lead reassignment rate
* Transaction cycle time
* Closing milestone compliance

Property management customers additionally measure:

* Maintenance response time
* Maintenance resolution time
* Vendor SLA compliance
* Maintenance cost per property

# 96. Product North Star

Recommended North Star Metric:

**Qualified Opportunities Progressed per Active Agent per Month**

Why?

EstateOS is supposed to reduce operational friction.

If agents handle more legitimate opportunities without increasing administrative workload, the operating system is doing its job.

Secondary North Star:

**Gross Commission Influenced Through EstateOS**

# 97. Acceptance Criteria for Core Workflow

A new lead arriving from an integrated source must:

1. Enter EstateOS automatically.
2. Resolve against existing contacts.
3. Preserve its source.
4. Create the correct lead type.
5. Trigger qualification.
6. Calculate a lead score.
7. Evaluate routing.
8. Assign an eligible agent.
9. Start an SLA.
10. Appear in the Unified Inbox.
11. Notify the assigned agent.
12. Trigger configured automation.
13. Maintain an audit record.

No manual spreadsheet entry should be required.

# 98. Acceptance Criteria for Routing

Given eligible agents with different territories, languages, availability, capacity, and specialization:

EstateOS must select an eligible agent according to configured routing rules.

The routing result must expose:

* Selected agent
* Candidate agents
* Eligibility results
* Routing score
* Assignment time
* SLA

If the selected agent violates the response SLA, the configured reassignment workflow must execute automatically.

# 99. Acceptance Criteria for Property Matching

Given a qualified buyer with:

* Location
* Budget
* Bedrooms
* Property type

EstateOS must:

1. Search active inventory.
2. Remove incompatible properties.
3. Score remaining inventory.
4. Rank matches.
5. Explain the score.
6. Allow an agent to send a property.
7. Record the recommendation.
8. Capture subsequent client interaction.

# 100. Acceptance Criteria for Transaction Management

Once an offer becomes accepted:

EstateOS must allow creation of a Transaction containing:

* Parties
* Property
* Agreed price
* Commission
* Closing date
* Milestones
* Tasks
* Documents
* Signature status
* Activity history

Users must be able to determine transaction health without reviewing external spreadsheets.

# 101. Acceptance Criteria for Maintenance

When a tenant submits a maintenance request:

EstateOS must:

1. Identify tenant.
2. Identify property.
3. Create maintenance request.
4. Classify issue.
5. Assign priority.
6. Determine approval requirement.
7. Select eligible vendor.
8. Create work order.
9. Track appointment.
10. Track work status.
11. Capture evidence.
12. Capture invoice.
13. Close request.

# 102. Non Goals for Initial Product

EstateOS should not initially attempt to replace:

* Full general ledger accounting
* Mortgage origination systems
* Title systems
* Government registration systems
* MLS networks themselves
* Full legal document authoring
* Construction project management
* Enterprise asset management
* Consumer property marketplace
* Statutory filing and submission, such as SDLT returns, FBR withholding payment, DLD transfer booking, or goAML report submission. EstateOS captures the data and the obligation; it does not file on the customer's behalf in the first product

These should integrate with EstateOS when required.

Trying to build them all internally would destroy development focus.

# 103. Competitive Differentiation

EstateOS should compete through operational cohesion.

Do not claim:

> We have AI.

Every competitor now claims AI.

The stronger proposition is:

> EstateOS knows what happened, what needs to happen next, who is responsible, and whether it actually happened.

The differentiation comes from five things.

## One

Canonical operational data.

Contacts, leads, properties, messages, viewings, offers, transactions, commissions, and maintenance exist in one model.

## Two

Action oriented automation.

EstateOS does not merely display records.

It assigns, escalates, schedules, reminds, matches, and routes.

## Three

Management visibility.

Managers know which leads, agents, transactions, and maintenance jobs require intervention.

## Four

Explainable AI.

Users see why a lead is prioritized, why an agent was selected, and why a property was recommended.

## Five

Complete attribution.

EstateOS connects acquisition source to actual transaction value and commission.

# 104. Core EstateOS Navigation

Recommended navigation:

**Home**

**Inbox**

**Leads**

**Contacts**

**Properties**

**Viewings**

**Offers**

**Transactions**

**Maintenance**

**Tasks**

**Reports**

**Automations**

**AI Copilot**

**Admin**

Admin contains:

* Organization
* Offices
* Teams
* Users
* Roles
* Lead Sources
* Routing
* Pipelines
* Qualification
* Lead Scoring
* Integrations
* Communication
* Consent
* Transaction Templates
* Commission Plans
* Vendors
* Automation
* Audit Logs
* Billing

# 105. Final Product Definition

EstateOS should ultimately operate as the orchestration layer for a real estate organization.

The complete workflow is:

**Lead Sources**

↓  

**Unified Communication**

↓  

**Identity Resolution**

↓  

**Canonical Contact**

↓  

**Lead**

↓  

**Qualification**

↓  

**Lead Score**

↓  

**Agent Routing**

↓  

**Automated Follow Up**

↓  

**Property Matching**

↓  

**Viewing**

↓  

**Offer**

↓  

**Transaction**

↓  

**Documents**

↓  

**Milestones**

↓  

**Closing**

↓  

**Commission**

↓  

**Source ROI**

For managed rental assets:

**Property**

↓  

**Tenant**

↓  

**Maintenance Request**

↓  

**Triage**

↓  

**Approval**

↓  

**Vendor**

↓  

**Work Order**

↓  

**Completion**

↓  

**Invoice**

↓  

**Maintenance Analytics**

That is EstateOS.

Not another real estate CRM.

It is the operating system connecting customer acquisition, brokerage execution, transaction operations, property operations, AI, and management intelligence around one consistent real estate data model.