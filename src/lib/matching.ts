/**
 * Property matching (PRD 27–29).
 *
 * Stage one is a hard filter — anything a buyer cannot or will not take is
 * excluded outright. Stage two is a weighted score, and every match carries the
 * reasons it scored, because "why am I being shown this?" must always have an
 * answer (PRD 28). Semantic ranking (stage three) needs embeddings and arrives
 * with the AI layer; the shape here does not change when it does.
 */

export type MatchCandidate = {
  listingId: string;
  propertyId: string;
  address: string;
  city: string;
  price: number;
  currency: string;
  dealType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  type: string;
  features: string[];
  status: string;
};

export type MatchRequirement = {
  /** buyer | tenant — a seller lead has nothing to match against. */
  leadType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  location: string;
  propertyType: string;
  features: string[];
};

export type Match = {
  listingId: string;
  score: number;
  reasons: string[];
  concerns: string[];
};

const OVER_BUDGET_TOLERANCE = 0.1;

/** Stage one (PRD 27): exclusions that no amount of scoring should override. */
export function eligible(candidate: MatchCandidate, need: MatchRequirement): string | null {
  if (candidate.status !== "Live") return "not on the market";

  const wantsRental = need.leadType === "tenant";
  if (wantsRental && candidate.dealType !== "rent") return "for sale, not to let";
  if (!wantsRental && candidate.dealType !== "sale") return "to let, not for sale";

  if (need.budgetMax && candidate.price > need.budgetMax * (1 + OVER_BUDGET_TOLERANCE))
    return "over budget";
  if (need.budgetMin && candidate.price < need.budgetMin * 0.6) return "far below budget";

  // One bedroom short is a stretch; two is a different property.
  if (need.bedrooms && candidate.bedrooms !== null && candidate.bedrooms < need.bedrooms - 1)
    return "too few bedrooms";

  if (
    need.propertyType &&
    candidate.type.toLowerCase() !== need.propertyType.toLowerCase() &&
    need.propertyType.toLowerCase() !== "any"
  )
    return "different property type";

  return null;
}

/** Stage two (PRD 27): weighted fit, capped at 100, with its reasoning. */
export function scoreMatch(candidate: MatchCandidate, need: MatchRequirement): Match {
  const reasons: string[] = [];
  const concerns: string[] = [];
  let score = 0;

  if (need.budgetMax) {
    const ratio = candidate.price / need.budgetMax;
    if (ratio <= 0.9) {
      score += 30;
      reasons.push("Comfortably inside budget");
    } else if (ratio <= 1) {
      score += 25;
      reasons.push("Within budget");
    } else {
      score += 10;
      concerns.push(`${Math.round((ratio - 1) * 100)}% over budget`);
    }
  } else {
    score += 10;
    reasons.push("No budget given — price not assessed");
  }

  if (need.bedrooms && candidate.bedrooms !== null) {
    if (candidate.bedrooms === need.bedrooms) {
      score += 25;
      reasons.push(`Exactly ${need.bedrooms} bedrooms`);
    } else if (candidate.bedrooms > need.bedrooms) {
      score += 18;
      reasons.push(`${candidate.bedrooms} bedrooms, one more than asked`);
    } else {
      score += 8;
      concerns.push("One bedroom short");
    }
  }

  const wanted = need.location.trim().toLowerCase();
  if (wanted) {
    const haystack = `${candidate.address} ${candidate.city}`.toLowerCase();
    if (haystack.includes(wanted)) {
      score += 25;
      reasons.push(`In ${need.location}`);
    } else if (wanted.split(/[\s,]+/).some((word) => word.length > 3 && haystack.includes(word))) {
      score += 12;
      reasons.push("Near the requested area");
    } else {
      concerns.push(`Not in ${need.location}`);
    }
  }

  const matchedFeatures = need.features.filter((f) =>
    candidate.features.some((c) => c.toLowerCase().includes(f.toLowerCase())),
  );
  if (need.features.length) {
    const ratio = matchedFeatures.length / need.features.length;
    score += Math.round(ratio * 20);
    if (matchedFeatures.length) reasons.push(`Has ${matchedFeatures.join(", ")}`);
    const missing = need.features.filter((f) => !matchedFeatures.includes(f));
    if (missing.length) concerns.push(`No ${missing.join(", ")}`);
  }

  return {
    listingId: candidate.listingId,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    concerns,
  };
}

/** Filter, score, rank. Returns only what a person should actually be shown. */
export function matchListings(
  candidates: MatchCandidate[],
  need: MatchRequirement,
  limit = 10,
): Match[] {
  return candidates
    .filter((candidate) => eligible(candidate, need) === null)
    .map((candidate) => scoreMatch(candidate, need))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
