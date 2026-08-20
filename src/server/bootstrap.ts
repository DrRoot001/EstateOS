/**
 * Provisions an organization and its Organization Owner (PRD PLAT 001, PLAT 002).
 *
 * This is the command-line stand-in for the Platform Console until Phase 2 builds
 * it. It is the only way an organization comes into existence, and it never sets
 * a password — it prints a single-use activation link for the owner.
 *
 *   npm run bootstrap -- --name "Acme Realty" --market AE \
 *     --owner "Sara Malik" --email sara@acme.example
 *
 * With no DATABASE_URL this writes to the local PGlite store, which one process
 * may hold at a time: stop the dev server first.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { MARKETS, type MarketCode } from "@/lib/markets";
import { newToken, tokenExpiry } from "./auth";
import { id, initialsOf } from "./org-service";

function arg(flag: string) {
  const index = process.argv.indexOf(`--${flag}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const name = arg("name");
  const market = (arg("market") ?? "US").toUpperCase() as MarketCode;
  const ownerName = arg("owner");
  const email = arg("email")?.trim().toLowerCase();
  const plan = arg("plan") ?? "trial";
  const seats = Number(arg("seats") ?? 25);

  if (!name || !ownerName || !email) {
    console.error(
      'Usage: npm run bootstrap -- --name "Acme Realty" --market US --owner "Sara Malik" --email sara@acme.example [--plan growth] [--seats 25]',
    );
    process.exit(1);
  }
  if (!MARKETS[market]) {
    console.error(`Unknown market "${market}". One of: ${Object.keys(MARKETS).join(", ")}`);
    process.exit(1);
  }

  const database = await db();
  const pack = MARKETS[market];

  const existing = await database
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing.length) {
    console.error(`${email} already has an account.`);
    process.exit(1);
  }

  const orgId = id("org");
  await database.insert(schema.organizations).values({
    id: orgId,
    name,
    primaryMarket: market,
    enabledMarkets: [market],
    jurisdiction: pack.jurisdictions[0] ?? "",
    timezone: arg("timezone") ?? "UTC",
    reportingCurrency: pack.currency,
    plan,
    seatLimit: seats,
  });

  const officeId = id("of");
  await database.insert(schema.offices).values({
    id: officeId,
    organizationId: orgId,
    name: `${name} — head office`,
    market,
    city: pack.cityPlaceholder,
    timezone: arg("timezone") ?? "UTC",
    jurisdiction: pack.jurisdictions[0] ?? "",
  });

  const ownerId = id("u");
  await database.insert(schema.users).values({
    id: ownerId,
    organizationId: orgId,
    email,
    name: ownerName,
    initials: initialsOf(ownerName),
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

  await database.insert(schema.auditLog).values({
    id: id("au"),
    organizationId: orgId,
    actorUserId: null,
    actorName: "platform",
    action: "org.provisioned",
    entity: "organization",
    entityId: orgId,
    after: { name, market, plan, seats, owner: email } as never,
  });

  const base = process.env["APP_URL"] ?? "http://localhost:8080";
  console.log(
    `\nOrganization provisioned: ${name} (${pack.flag} ${pack.name}, plan ${plan}, ${seats} seats)`,
  );
  console.log(`Owner: ${ownerName} <${email}>`);
  console.log(
    `\nSend this single-use activation link (valid 7 days):\n${base}/activate?token=${token}\n`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
