/**
 * Platform Console endpoints (PRD 8B). Every handler resolves platform staff from
 * the platform session — a tenant session never satisfies these checks.
 */
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { MARKET_CODES, type MarketCode } from "@/lib/markets";
import { assertNotThrottled, clearFailures, recordFailure, requestIp } from "@/server/auth";
import { verifyPassword } from "@/server/crypto";
import { platformCan, type PlatformRole } from "@/lib/platform-roles";
import {
  createPlatformSession,
  currentPlatformUser,
  endPlatformSession,
  requirePlatformUser,
} from "@/server/platform-auth";
import {
  exportOrganization,
  invitePlatformStaff,
  listOrganizations,
  listPlatformStaff,
  provisionOrganization,
  reissueOwnerActivation,
  setOrganizationStatus,
  updateEntitlements,
} from "@/server/platform-service";

export const platformSignIn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) =>
    z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    assertNotThrottled(`platform:${email}`);
    assertNotThrottled(`ip:${requestIp()}`);

    const database = await db();
    const [staff] = await database
      .select()
      .from(schema.platformUsers)
      .where(eq(schema.platformUsers.email, email))
      .limit(1);

    const ok = staff ? await verifyPassword(data.password, staff.passwordHash) : false;
    if (!ok || !staff || !staff.active) {
      recordFailure(`platform:${email}`);
      recordFailure(`ip:${requestIp()}`);
      throw new Error("Email or password is incorrect");
    }

    clearFailures(`platform:${email}`);
    await createPlatformSession(staff);
    return { ok: true as const };
  });

export const platformSignOut = createServerFn({ method: "POST" }).handler(async () => {
  await endPlatformSession();
  return { ok: true as const };
});

/** Null when nobody is signed in; the console route turns that into a redirect. */
export const getPlatformSession = createServerFn({ method: "GET" }).handler(async () => {
  const staff = await currentPlatformUser();
  if (!staff) return null;
  const [organizations, team] = await Promise.all([listOrganizations(), listPlatformStaff()]);
  return {
    user: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      initials: staff.initials,
      role: staff.role as PlatformRole,
    },
    can: {
      provision: platformCan(staff, "org.provision"),
      update: platformCan(staff, "org.update"),
      lifecycle: platformCan(staff, "org.lifecycle"),
      staff: platformCan(staff, "staff.manage"),
    },
    organizations,
    team,
  };
});

const provisionInput = z.object({
  name: z.string().min(2).max(120),
  primaryMarket: z.enum(MARKET_CODES as [string, ...string[]]),
  jurisdiction: z.string().max(80).default(""),
  timezone: z.string().min(1).max(60),
  plan: z.string().min(2).max(40),
  seatLimit: z.number().int().min(1).max(10000),
  licence: z.string().max(80).default(""),
  dataResidency: z.string().max(40).default(""),
  ownerName: z.string().min(2).max(80),
  ownerEmail: z.string().email().max(200),
});

export const provisionOrg = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof provisionInput>) => provisionInput.parse(d))
  .handler(async ({ data }) =>
    provisionOrganization(await requirePlatformUser(), {
      ...data,
      primaryMarket: data.primaryMarket as MarketCode,
    }),
  );

export const updateOrgEntitlements = createServerFn({ method: "POST" })
  .validator(
    (d: {
      organizationId: string;
      plan: string;
      seatLimit: number;
      licence: string;
      dataResidency: string;
    }) =>
      z
        .object({
          organizationId: z.string(),
          plan: z.string().min(2).max(40),
          seatLimit: z.number().int().min(1).max(10000),
          licence: z.string().max(80).default(""),
          dataResidency: z.string().max(40).default(""),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const { organizationId, ...rest } = data;
    return updateEntitlements(await requirePlatformUser(), organizationId, rest);
  });

export const setOrgStatus = createServerFn({ method: "POST" })
  .validator((d: { organizationId: string; status: string; confirmation?: string }) =>
    z
      .object({
        organizationId: z.string(),
        status: z.enum(["active", "suspended", "terminated"]),
        confirmation: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) =>
    setOrganizationStatus(
      await requirePlatformUser(),
      data.organizationId,
      data.status,
      data.confirmation,
    ),
  );

export const exportOrg = createServerFn({ method: "POST" })
  .validator((d: { organizationId: string }) => z.object({ organizationId: z.string() }).parse(d))
  .handler(async ({ data }) =>
    exportOrganization(await requirePlatformUser(), data.organizationId),
  );

export const reissueOwnerLink = createServerFn({ method: "POST" })
  .validator((d: { organizationId: string }) => z.object({ organizationId: z.string() }).parse(d))
  .handler(async ({ data }) =>
    reissueOwnerActivation(await requirePlatformUser(), data.organizationId),
  );

export const inviteStaff = createServerFn({ method: "POST" })
  .validator((d: { name: string; email: string; role: PlatformRole }) =>
    z
      .object({
        name: z.string().min(2).max(80),
        email: z.string().email().max(200),
        role: z.enum(["owner", "admin", "support"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => invitePlatformStaff(await requirePlatformUser(), data));
