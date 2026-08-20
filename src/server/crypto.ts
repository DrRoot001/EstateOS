/**
 * Password hashing and single-use tokens (PRD 10A, 82).
 * Pure node:crypto — no request context — so it is testable on its own.
 */
import { randomBytes, createHash, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

/** scrypt cost: 2^15 memory factor, roughly 100ms per hash on one laptop core. */
const SCRYPT_N = 32768;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  const salt = randomBytes(16);
  const key = await scryptKey(password, salt);
  return `scrypt$${SCRYPT_N}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, n, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !n || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptKey(password, Buffer.from(salt, "base64"), Number(n), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function scryptKey(password: string, salt: Buffer, n = SCRYPT_N, keylen = 64): Promise<Buffer> {
  // node:crypto needs maxmem raised for any N above 16384.
  return new Promise((resolve, reject) => {
    scryptCb(
      password.normalize("NFKC"),
      salt,
      keylen,
      { N: n, r: 8, p: 1, maxmem: 128 * n * 8 * 2 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** PRD 82: a weak password is a defect, not a user preference. */
export function assertPasswordPolicy(password: string) {
  if (password.length < 12) throw new Error("Password must be at least 12 characters");
  if (password.length > 200) throw new Error("Password is too long");
  if (!/[a-z]/i.test(password) || !/\d/.test(password))
    throw new Error("Password must contain a letter and a number");
}

export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: sha256(token) };
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function tokenExpiry(ms = TOKEN_TTL_MS) {
  return new Date(Date.now() + ms);
}
