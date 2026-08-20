/**
 * Self-check for property matching. Run: `npx tsx src/lib/matching.test.ts`.
 * A silent break here shows people the wrong homes, so the filters get asserted.
 */
import assert from "node:assert/strict";
import {
  eligible,
  matchListings,
  scoreMatch,
  type MatchCandidate,
  type MatchRequirement,
} from "./matching";

const listing = (over: Partial<MatchCandidate> = {}): MatchCandidate => ({
  listingId: "ls_1",
  propertyId: "pr_1",
  address: "Unit 1704, Marina Heights",
  city: "Dubai Marina",
  price: 5_000_000,
  currency: "AED",
  dealType: "sale",
  bedrooms: 3,
  bathrooms: 2,
  areaSqft: 1800,
  type: "Apartment",
  features: ["sea view", "parking"],
  status: "Live",
  ...over,
});

const need = (over: Partial<MatchRequirement> = {}): MatchRequirement => ({
  leadType: "buyer",
  budgetMin: null,
  budgetMax: 6_000_000,
  bedrooms: 3,
  location: "Dubai Marina",
  propertyType: "",
  features: [],
  ...over,
});

/* stage one — hard filters */
assert.equal(eligible(listing(), need()), null);
assert.equal(eligible(listing({ status: "Draft" }), need()), "not on the market");
assert.equal(eligible(listing({ status: "Sold" }), need()), "not on the market");
// A tenant must never be shown a sale, and vice versa.
assert.equal(eligible(listing(), need({ leadType: "tenant" })), "for sale, not to let");
assert.equal(eligible(listing({ dealType: "rent" }), need()), "to let, not for sale");
// Budget: 10% stretch allowed, beyond that excluded.
assert.equal(eligible(listing({ price: 6_500_000 }), need()), null);
assert.equal(eligible(listing({ price: 7_000_000 }), need()), "over budget");
// Two bedrooms short is a different property.
assert.equal(eligible(listing({ bedrooms: 1 }), need()), "too few bedrooms");
assert.equal(eligible(listing({ bedrooms: 2 }), need()), null);
assert.equal(
  eligible(listing({ type: "Villa" }), need({ propertyType: "Apartment" })),
  "different property type",
);
assert.equal(eligible(listing({ type: "Villa" }), need({ propertyType: "any" })), null);

/* stage two — weighted score with reasons */
const perfect = scoreMatch(listing({ price: 5_000_000 }), need({ features: ["sea view"] }));
assert.ok(perfect.score >= 85, `expected a strong match, got ${perfect.score}`);
assert.ok(perfect.reasons.some((r) => r.includes("Exactly 3 bedrooms")));
assert.ok(perfect.reasons.some((r) => r.includes("Dubai Marina")));
assert.equal(perfect.concerns.length, 0);

// Concerns are stated, not hidden.
const stretch = scoreMatch(
  listing({ price: 6_400_000, city: "Jumeirah", address: "Villa 3, Jumeirah" }),
  need({ features: ["garden"] }),
);
assert.ok(stretch.concerns.some((c) => c.includes("over budget")));
assert.ok(stretch.concerns.some((c) => c.includes("Not in Dubai Marina")));
assert.ok(stretch.concerns.some((c) => c.includes("No garden")));
assert.ok(stretch.score < perfect.score);

/* ranking */
const ranked = matchListings(
  [
    listing({ listingId: "far", city: "Sharjah", address: "Al Nahda, Sharjah" }),
    listing({ listingId: "ideal", price: 4_500_000 }),
    listing({ listingId: "sold", status: "Sold" }),
  ],
  need(),
);
assert.deepEqual(
  ranked.map((m) => m.listingId),
  ["ideal", "far"],
);
assert.ok(ranked.every((m) => m.score >= 0 && m.score <= 100));

console.log("matching: ok");
