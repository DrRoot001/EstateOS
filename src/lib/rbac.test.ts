/**
 * Self-check for permissions and hierarchy scope. Run: `npx tsx src/lib/rbac.test.ts`
 * (or `bun src/lib/rbac.test.ts`). No framework on purpose.
 */
import assert from "node:assert/strict";
import { can, canManage, reportsOf, visibleUserIds, type OrgUser, type RoleId } from "./rbac";

const u = (
  id: string,
  role: RoleId,
  officeId: string,
  teamId: string | null,
  managerId: string | null,
): OrgUser => ({
  id,
  name: id,
  email: `${id}@x.test`,
  initials: "XX",
  role,
  officeId,
  teamId,
  managerId,
  title: "",
  active: true,
});

const owner = u("owner", "owner", "o1", null, null);
const mgr = u("mgr", "manager", "o1", null, "owner");
const a1 = u("a1", "agent", "o1", "t1", "mgr");
const a2 = u("a2", "agent", "o1", "t2", "mgr");
const isa = u("isa", "isa", "o1", "t1", "mgr");
const other = u("other", "agent", "o2", "t9", null);
const fin = u("fin", "finance", "o1", null, "owner");
const users = [owner, mgr, a1, a2, isa, other, fin];

// Permissions come from the role, and a disabled account can do nothing.
assert.equal(can(owner, "org.manage"), true);
assert.equal(can(mgr, "org.manage"), false);
assert.equal(can(mgr, "leads.reassign"), true);
assert.equal(can(a1, "leads.reassign"), false);
assert.equal(can(a1, "commissions.edit"), false);
assert.equal(can(fin, "commissions.edit"), true);
assert.equal(can({ ...owner, active: false }, "org.manage"), false);

// Scope: own / team / office / org.
assert.deepEqual([...visibleUserIds(a1, users)].sort(), ["a1"]);
assert.deepEqual([...visibleUserIds(isa, users)].sort(), ["a1", "isa"]); // team t1 only
assert.equal(visibleUserIds(mgr, users).has("other"), false); // different office
assert.deepEqual([...visibleUserIds(mgr, users)].sort(), [
  "a1",
  "a2",
  "fin",
  "isa",
  "mgr",
  "owner",
]);
assert.equal(visibleUserIds(owner, users).size, users.length);

// Reporting chain adds people the role scope alone would miss.
const remote = u("remote", "agent", "o2", null, "mgr");
assert.equal(visibleUserIds(mgr, [...users, remote]).has("remote"), true);
assert.deepEqual([...reportsOf("owner", users)].sort(), ["a1", "a2", "fin", "isa", "mgr"]);

// Managing people is gated by permission *and* scope.
assert.equal(canManage(owner, other, users), true);
assert.equal(canManage(mgr, a1, users), false); // manager has no users.manage
const admin = u("admin", "admin", "o1", null, "owner");
assert.equal(canManage(admin, a1, [...users, admin]), true);

console.log("rbac: ok");
