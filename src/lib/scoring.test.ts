/**
 * Self-check for lead scoring. Run: `npx tsx src/lib/scoring.test.ts`.
 * Scoring drives who gets called first, so a silent change here is a real defect.
 */
import assert from "node:assert/strict";
import { scoreLead, type ScoreInput } from "./scoring";

const base: ScoreInput = {
  intent: "",
  timeline: "",
  financing: "",
  budgetMax: null,
  inboundMessages: 0,
  ageHours: 500,
  hasEmail: false,
  hasPhone: false,
  location: "",
  source: "",
};

// An empty enquiry that has sat for days is cold and cannot go negative.
const empty = scoreLead(base);
assert.equal(empty.score, 0);
assert.equal(empty.band, "Cold");

// A cash buyer wanting to move now, reachable, engaged, is hot.
const hot = scoreLead({
  intent: "Buying",
  timeline: "Immediate",
  financing: "Cash",
  budgetMax: 45_000_000,
  inboundMessages: 3,
  ageHours: 0.5,
  hasEmail: true,
  hasPhone: true,
  location: "DHA Phase 6",
  source: "Website form",
});
assert.ok(hot.score >= 70, `expected hot, got ${hot.score}`);
assert.equal(hot.band, "Hot");

// Every point is explained.
assert.ok(hot.reasons.length >= 8);
assert.ok(hot.reasons.every((r) => /^[+-]\d+ /.test(r)));
assert.ok(hot.reasons.some((r) => r.includes("Cash buyer")));

// A browser with no financing and one message is warm at best.
const warm = scoreLead({
  ...base,
  intent: "Buying",
  timeline: "6+ months",
  financing: "Needs mortgage",
  inboundMessages: 1,
  ageHours: 10,
  hasEmail: true,
  source: "Zameen",
});
assert.ok(warm.score < 70 && warm.score > 0, `expected warm/cold, got ${warm.score}`);

// Recency decays: the same lead scores lower once it is stale.
const fresh = scoreLead({ ...base, intent: "Buying", ageHours: 0.5, hasEmail: true });
const stale = scoreLead({ ...base, intent: "Buying", ageHours: 200, hasEmail: true });
assert.ok(fresh.score > stale.score);

// Bounded to 0–100 whatever the inputs.
const maxed = scoreLead({
  intent: "Buying",
  timeline: "Immediate",
  financing: "Cash",
  budgetMax: 1,
  inboundMessages: 99,
  ageHours: 0,
  hasEmail: true,
  hasPhone: true,
  location: "x",
  source: "Referral",
});
assert.ok(maxed.score <= 100);

console.log("scoring: ok");
