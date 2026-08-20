/**
 * Creates the first EstateOS platform staff account (PRD 8B.1).
 *
 * This is the only account that cannot be created from inside the product — it is
 * the operator's own super admin. Every later colleague is invited from the
 * Platform Console.
 *
 *   npm run bootstrap:platform -- --name "Sabih Haider" --email sabih@estateos.app
 *
 * Prints a single-use activation link; no password is ever set here.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { newToken, tokenExpiry } from "./crypto";
import { id, initialsOf } from "./org-service";
import { PLATFORM_ROLE_IDS, type PlatformRole } from "@/lib/platform-roles";

function arg(flag: string) {
  const index = process.argv.indexOf(`--${flag}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const name = arg("name");
  const email = arg("email")?.trim().toLowerCase();
  const role = (arg("role") ?? "owner") as PlatformRole;

  if (!name || !email) {
    console.error(
      'Usage: npm run bootstrap:platform -- --name "Sabih Haider" --email sabih@estateos.app [--role owner|admin|support]',
    );
    process.exit(1);
  }
  if (!PLATFORM_ROLE_IDS.includes(role)) {
    console.error(`Unknown role "${role}". One of: ${PLATFORM_ROLE_IDS.join(", ")}`);
    process.exit(1);
  }

  const database = await db();
  const existing = await database
    .select({ id: schema.platformUsers.id })
    .from(schema.platformUsers)
    .where(eq(schema.platformUsers.email, email))
    .limit(1);
  if (existing.length) {
    console.error(`${email} is already platform staff.`);
    process.exit(1);
  }

  const staffId = id("pu");
  await database.insert(schema.platformUsers).values({
    id: staffId,
    email,
    name,
    initials: initialsOf(name),
    role,
  });

  const { token, hash } = newToken();
  await database.insert(schema.authTokens).values({
    id: hash,
    platformUserId: staffId,
    kind: "activation",
    expiresAt: tokenExpiry(),
  });

  const base = process.env["APP_URL"] ?? "http://localhost:8080";
  console.log(`\nPlatform staff created: ${name} <${email}> (${role})`);
  console.log(`\nActivate here (single use, valid 7 days):\n${base}/activate?token=${token}`);
  console.log(`\nThen sign in at ${base}/platform/login\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
