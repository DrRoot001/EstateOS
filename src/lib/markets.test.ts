/**
 * Self-check for the country-pack formatters. Run: `npx tsx src/lib/markets.test.ts`
 * (or `bun src/lib/markets.test.ts`). No framework on purpose.
 */
import assert from "node:assert/strict";
import { MARKETS, formatArea, formatLocation, formatMoney } from "./markets";

/** Intl emits non-breaking spaces; compare on plain ones. */
const money = (...args: Parameters<typeof formatMoney>) =>
  formatMoney(...args).replace(/[\u202f\u00a0]/g, " ");

// Pakistan reads large numbers as lakh/crore, never "Rs 126M".
assert.equal(money(450_000, true, MARKETS.PK), "Rs 12.6 crore");
assert.equal(money(1_000, true, MARKETS.PK), "Rs 2.8 lakh");
assert.match(money(450_000, false, MARKETS.PK), /^Rs 126,000,000$/);

// Other markets keep Intl compact notation, in their own currency.
assert.equal(money(450_000, true, MARKETS.AE), "AED 1.7M");
assert.equal(money(450_000, true, MARKETS.GB), "£355.5K");
assert.equal(money(450_000, true, MARKETS.US), "$450K");

// Area: secondary unit per market, none for the US.
assert.equal(formatArea(1840, MARKETS.US), "1,840 sq ft");
assert.equal(formatArea(1840, MARKETS.PK), "1,840 sq ft · 6.76 marla");
assert.equal(formatArea(1840, MARKETS.AE), "1,840 sq ft · 170.9 m²");

// Postal code is dropped where the market has none.
const addr = { city: "Dubai Marina", region: "Dubai", postal: "78701" };
assert.equal(formatLocation(addr, MARKETS.AE), "Dubai Marina, Dubai");
assert.equal(
  formatLocation({ ...addr, city: "Austin", region: "TX" }, MARKETS.US),
  "Austin, TX 78701",
);

console.log("markets: ok");
