/**
 * Self-check for the credential primitives. Run: `npx tsx src/server/crypto.test.ts`.
 * These are the money paths: a silent break here is a security hole, not a bug.
 */
import assert from "node:assert/strict";
import {
  assertPasswordPolicy,
  hashPassword,
  newToken,
  sha256,
  tokenExpiry,
  verifyPassword,
} from "./crypto";

const password = "correct horse 42 battery";
const hash = await hashPassword(password);

// The stored value is a salted scrypt digest, never the password.
assert.match(hash, /^scrypt\$32768\$[\w+/=]+\$[\w+/=]+$/);
assert.ok(!hash.includes(password));

assert.equal(await verifyPassword(password, hash), true);
assert.equal(await verifyPassword("wrong password 42", hash), false);
assert.equal(await verifyPassword(password, null), false);
assert.equal(await verifyPassword(password, "garbage"), false);
// A tampered digest must not verify.
assert.equal(await verifyPassword(password, hash.slice(0, -4) + "AAAA"), false);

// Same password, different salt: two hashes never match.
assert.notEqual(hash, await hashPassword(password));

// Unicode normalisation, so the same typed password works on any keyboard.
const nfc = await hashPassword("café passwörd 1");
assert.equal(await verifyPassword("café passwörd 1", nfc), true);

// Policy (PRD 82).
assert.throws(() => assertPasswordPolicy("short1"), /at least 12/);
assert.throws(() => assertPasswordPolicy("nodigitsatall"), /letter and a number/);
assert.throws(() => assertPasswordPolicy("1".repeat(201)), /too long/);
assert.doesNotThrow(() => assertPasswordPolicy("legitimate1password"));

// Tokens: the database stores only the hash, and tokens do not repeat.
const a = newToken();
const b = newToken();
assert.notEqual(a.token, b.token);
assert.equal(a.hash, sha256(a.token));
assert.notEqual(a.hash, a.token);
assert.equal(a.hash.length, 64);
assert.ok(tokenExpiry().getTime() > Date.now());

console.log("crypto: ok");
