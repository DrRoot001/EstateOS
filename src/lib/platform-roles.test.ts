/**
 * Self-check for the platform authority boundary. Run: `npx tsx src/lib/platform-roles.test.ts`.
 */
import assert from "node:assert/strict";
import { PLATFORM_ROLE_IDS, platformCan } from "./platform-roles";
import { ROLE_IDS, permissionsOf } from "./rbac";

const active = (role: string) => ({ role, active: true });

// Only an owner manages other platform staff.
assert.equal(platformCan(active("owner"), "staff.manage"), true);
assert.equal(platformCan(active("admin"), "staff.manage"), false);

// Admins provision and run lifecycle; support does neither.
for (const action of ["org.provision", "org.update", "org.lifecycle"] as const) {
  assert.equal(platformCan(active("admin"), action), true);
  assert.equal(platformCan(active("support"), action), false);
}

// A disabled account can do nothing, whatever its role.
assert.equal(platformCan({ role: "owner", active: false }, "org.provision"), false);

// The two authority systems share role *names* ("owner", "admin") but nothing else:
// the vocabularies do not overlap, so neither check can be satisfied by the other's
// grant. Separation at runtime comes from separate tables and separate sessions.
const platformActions = ["org.provision", "org.update", "org.lifecycle", "staff.manage"];
for (const action of platformActions) {
  assert.equal(
    permissionsOf("owner").includes(action as never),
    false,
    `${action} must not be a tenant permission`,
  );
}
for (const permission of permissionsOf("owner")) {
  assert.equal(
    platformActions.includes(permission),
    false,
    `${permission} must not be a platform action`,
  );
  // A tenant permission handed to the platform check grants nothing.
  assert.equal(platformCan(active("owner"), permission as never), false);
}
assert.deepEqual(PLATFORM_ROLE_IDS, ["owner", "admin", "support"]);

console.log("platform-roles: ok");
