/**
 * Roles, permissions and data scope (PRD 6 + 10).
 * Pure data + pure functions: the same module runs on the server (enforcement)
 * and in the client (hiding what you can't do anyway).
 */

export const PERMISSIONS = [
  "org.manage",
  "offices.manage",
  "teams.manage",
  "users.manage",
  "roles.manage",
  "integrations.manage",
  "security.manage",
  "audit.view",
  "contacts.view",
  "contacts.edit",
  "leads.view",
  "leads.edit",
  "leads.assign",
  "leads.reassign",
  "properties.view",
  "properties.edit",
  "viewings.manage",
  "offers.view",
  "offers.edit",
  "transactions.view",
  "transactions.edit",
  "transactions.approve",
  "documents.manage",
  "commissions.view",
  "commissions.edit",
  "automation.manage",
  "reports.organization",
  "reports.team",
  "maintenance.view",
  "maintenance.assign",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** How far down the org tree a role can see records. */
export type Scope = "org" | "office" | "team" | "own";

export type RoleId =
  | "owner"
  | "admin"
  | "manager"
  | "agent"
  | "isa"
  | "tc"
  | "pm"
  | "maintenance"
  | "finance"
  | "vendor"
  | "client";

export type Role = {
  id: RoleId;
  label: string;
  scope: Scope;
  /** "*" = every permission. */
  permissions: Permission[] | "*";
};

const AGENT_PERMS: Permission[] = [
  "contacts.view",
  "contacts.edit",
  "leads.view",
  "leads.edit",
  "properties.view",
  "viewings.manage",
  "offers.view",
  "offers.edit",
  "transactions.view",
  "documents.manage",
  "commissions.view",
];

export const ROLES: Record<RoleId, Role> = {
  owner: { id: "owner", label: "Organization Owner", scope: "org", permissions: "*" },
  admin: {
    id: "admin",
    label: "Brokerage Administrator",
    scope: "org",
    permissions: [
      "offices.manage",
      "teams.manage",
      "users.manage",
      "roles.manage",
      "integrations.manage",
      "audit.view",
      ...AGENT_PERMS,
      "leads.assign",
      "leads.reassign",
      "properties.edit",
      "transactions.edit",
      "automation.manage",
      "reports.organization",
      "reports.team",
      "maintenance.view",
      "maintenance.assign",
    ],
  },
  manager: {
    id: "manager",
    label: "Sales Manager",
    scope: "office",
    permissions: [
      ...AGENT_PERMS,
      "leads.assign",
      "leads.reassign",
      "properties.edit",
      "transactions.edit",
      "reports.team",
    ],
  },
  agent: { id: "agent", label: "Agent", scope: "own", permissions: AGENT_PERMS },
  isa: {
    id: "isa",
    label: "Inside Sales Agent",
    scope: "team",
    permissions: [
      "contacts.view",
      "contacts.edit",
      "leads.view",
      "leads.edit",
      "leads.assign",
      "properties.view",
      "viewings.manage",
    ],
  },
  tc: {
    id: "tc",
    label: "Transaction Coordinator",
    scope: "office",
    permissions: [
      "contacts.view",
      "properties.view",
      "offers.view",
      "transactions.view",
      "transactions.edit",
      "documents.manage",
    ],
  },
  pm: {
    id: "pm",
    label: "Property Manager",
    scope: "office",
    permissions: [
      "contacts.view",
      "contacts.edit",
      "properties.view",
      "properties.edit",
      "transactions.view",
      "maintenance.view",
      "maintenance.assign",
      "documents.manage",
    ],
  },
  maintenance: {
    id: "maintenance",
    label: "Maintenance Coordinator",
    scope: "office",
    permissions: ["contacts.view", "properties.view", "maintenance.view", "maintenance.assign"],
  },
  finance: {
    id: "finance",
    label: "Finance User",
    scope: "org",
    permissions: [
      "transactions.view",
      "commissions.view",
      "commissions.edit",
      "reports.organization",
    ],
  },
  vendor: { id: "vendor", label: "Vendor", scope: "own", permissions: ["maintenance.view"] },
  client: { id: "client", label: "Client", scope: "own", permissions: ["properties.view"] },
};

export const ROLE_IDS = Object.keys(ROLES) as RoleId[];

/** The hierarchy node a permission check runs against. */
export type OrgUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: RoleId;
  officeId: string | null;
  teamId: string | null;
  managerId: string | null;
  title: string;
  active: boolean;
};

export function permissionsOf(role: RoleId): Permission[] {
  const p = ROLES[role].permissions;
  return p === "*" ? [...PERMISSIONS] : p;
}

export function can(user: Pick<OrgUser, "role" | "active">, permission: Permission): boolean {
  if (!user.active) return false;
  const p = ROLES[user.role].permissions;
  return p === "*" || p.includes(permission);
}

/** Everyone reporting to `userId`, at any depth. */
export function reportsOf(userId: string, users: OrgUser[]): Set<string> {
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const u of users) {
      if (u.managerId === id && !out.has(u.id)) {
        out.add(u.id);
        walk(u.id);
      }
    }
  };
  walk(userId);
  return out;
}

/**
 * Which users' records the viewer may see: their role scope, plus everyone
 * below them in the reporting chain (a manager over two teams sees both).
 */
export function visibleUserIds(viewer: OrgUser, users: OrgUser[]): Set<string> {
  const scope = ROLES[viewer.role].scope;
  const ids = new Set<string>([viewer.id, ...reportsOf(viewer.id, users)]);
  for (const u of users) {
    if (scope === "org") ids.add(u.id);
    else if (scope === "office" && u.officeId !== null && u.officeId === viewer.officeId)
      ids.add(u.id);
    else if (scope === "team" && u.teamId !== null && u.teamId === viewer.teamId) ids.add(u.id);
  }
  return ids;
}

/** Managers may only act on people inside their own scope. */
export function canManage(viewer: OrgUser, target: OrgUser, users: OrgUser[]): boolean {
  return can(viewer, "users.manage") && visibleUserIds(viewer, users).has(target.id);
}
