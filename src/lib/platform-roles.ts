/** Platform staff roles (PRD 8B.1). Client-safe: no database, no request context. */
export type PlatformRole = "owner" | "admin" | "support";
export type PlatformAction = "org.provision" | "org.update" | "org.lifecycle" | "staff.manage";

const PLATFORM_ROLES: Record<PlatformRole, PlatformAction[]> = {
  owner: ["org.provision", "org.update", "org.lifecycle", "staff.manage"],
  admin: ["org.provision", "org.update", "org.lifecycle"],
  support: [],
};

export const PLATFORM_ROLE_IDS = Object.keys(PLATFORM_ROLES) as PlatformRole[];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  owner: "Platform Owner",
  admin: "Platform Administrator",
  support: "Platform Support",
};

/** Support is deliberately read-only: health and counts, never customer records. */
export function platformCan(user: { role: string; active: boolean }, action: PlatformAction) {
  if (!user.active) return false;
  return (PLATFORM_ROLES[user.role as PlatformRole] ?? []).includes(action);
}
