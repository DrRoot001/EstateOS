# EstateOS

AI-powered real estate operating system, sold as a multi-tenant platform: the platform operator provisions a customer organization with its country pack and plan, hands over one Organization Owner, and that organization runs its own offices, teams, members, integrations and pipeline inside an isolated workspace.

- Product specification: [EstateOS Product Requirements Document.md](EstateOS%20Product%20Requirements%20Document.md)
- Honest state of the build and the plan to close the gap: [AUDIT.md](AUDIT.md)

## Current state

Real: PostgreSQL persistence with tenant scoping, authentication (passwords, sessions, invitations, resets, revocation, throttling), the Platform Console for provisioning customer organizations, the organization hierarchy with roles and permissions, and the audit log. Every other module shows an empty state naming what will fill it — EstateOS never displays data it does not hold (PRD 7.6).

## Getting started

Requires Node.js 20+.

```sh
npm install
```

Create your own platform super admin. This is the only account that cannot be created from inside the product; everyone else is invited from within it:

```sh
npm run bootstrap:platform -- --name "Your Name" --email you@estateos.app
```

Start the app, open the activation link the command printed, set a password, and you land in the Platform Console at `/platform`. From there you provision customer organizations — company name, country, jurisdiction, plan, seats — and hand each one an Organization Owner who runs their own company inside their own isolated workspace.

```sh
npm run dev
```

Markets: `PK`, `AE`, `GB`, `US`. Organizations can also be provisioned from the command line:

```sh
npm run bootstrap -- --name "Acme Realty" --market AE --owner "Sara Malik" --email sara@acme.example
```

## Who signs in where

| Surface | Who | Sign in |
|---|---|---|
| `/platform` | EstateOS staff — owner, admin, support | `/platform/login` |
| `/` | A customer's members — owner, admin, manager, agent, and the rest | `/login` |

The two are separate tables, separate sessions and separate cookies. Neither can be escalated into the other.

## Database

The app talks to plain PostgreSQL through `DATABASE_URL`, so the same build runs on a VPS, on Vercel, or against Supabase. With no `DATABASE_URL` set it falls back to [PGlite](https://pglite.dev) in `.data/pg` so development needs no server — one process at a time, so stop `npm run dev` before running `npm run bootstrap`.

Deploy on a Node runtime; the Postgres driver uses TCP and will not run on Cloudflare Workers without a proxy such as Hyperdrive.

```sh
npm run db:generate   # create a migration after editing src/db/schema.ts
npm run db:migrate    # apply migrations (also applied automatically at first use)
```

## Checks

```sh
npm run check
```

Type check plus four assert-based self-checks: country packs, RBAC scope, the platform authority boundary, and credential hashing. No test framework by design.

## Environment

Copy `.env.example` to `.env`. AI and integration features stay disabled until their variables are present, and report themselves as unavailable rather than faking a result (PRD 61A, 79A).

## Built with

TanStack Start · React · TypeScript · Tailwind CSS · shadcn/ui · Drizzle ORM · PostgreSQL · Zod
