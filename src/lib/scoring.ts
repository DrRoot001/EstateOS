/**
 * Rule-based lead scoring (PRD 18).
 *
 * Deliberately transparent: every point is attributable to a stated reason, so a
 * manager can argue with the score instead of guessing at it. No model, no
 * hidden weights — the AI layer later *explains* this, it does not replace it.
 */

export type ScoreInput = {
  /** Buying | Selling | Renting | Letting | Browsing */
  intent: string;
  /** e.g. "Immediate", "1-3 months", "3-6 months", "6+ months" */
  timeline: string;
  /** e.g. "Cash", "Pre-approved", "Needs mortgage", "Unknown" */
  financing: string;
  budgetMax: number | null;
  /** Inbound messages from the person so far. */
  inboundMessages: number;
  /** Hours since the enquiry arrived. */
  ageHours: number;
  hasEmail: boolean;
  hasPhone: boolean;
  location: string;
  source: string;
};

export type Score = { score: number; band: "Hot" | "Warm" | "Cold"; reasons: string[] };

const TIMELINE_POINTS: Array<[RegExp, number, string]> = [
  [/immediate|asap|this week/i, 20, "Wants to move immediately"],
  [/1-3|one to three|month/i, 14, "Timeline within three months"],
  [/3-6|three to six/i, 8, "Timeline three to six months"],
  [/6\+|six|year|browsing/i, 2, "Long or undefined timeline"],
];

const FINANCING_POINTS: Array<[RegExp, number, string]> = [
  [/cash/i, 20, "Cash buyer"],
  [/pre-?approved|preapproved/i, 16, "Mortgage pre-approved"],
  [/in progress|applying/i, 8, "Mortgage application in progress"],
  [/needs|not started|unknown/i, 2, "Financing not arranged"],
];

const SOURCE_POINTS: Array<[RegExp, number, string]> = [
  [/referral/i, 10, "Referral source"],
  [/website|form/i, 8, "Came through your own website"],
  [/whatsapp|call|phone/i, 6, "Direct message or call"],
  [/portal|zameen|bayut|rightmove|zillow|property ?finder/i, 4, "Portal enquiry"],
];

/** Highest matching rule wins; unmatched inputs simply score nothing. */
function match(rules: Array<[RegExp, number, string]>, value: string) {
  for (const [pattern, points, reason] of rules) if (pattern.test(value)) return { points, reason };
  return null;
}

export function scoreLead(input: ScoreInput): Score {
  const reasons: string[] = [];
  let score = 0;

  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(`${points >= 0 ? "+" : ""}${points} ${reason}`);
  };

  // Intent (PRD 18).
  if (/buy|sell|let|rent/i.test(input.intent))
    add(15, `Clear intent: ${input.intent.toLowerCase()}`);
  else if (input.intent) add(5, "Intent stated but vague");

  const timeline = match(TIMELINE_POINTS, input.timeline);
  if (timeline) add(timeline.points, timeline.reason);

  const financing = match(FINANCING_POINTS, input.financing);
  if (financing) add(financing.points, financing.reason);

  if (input.budgetMax && input.budgetMax > 0) add(10, "Budget provided");

  // Engagement: more inbound messages means a live conversation.
  if (input.inboundMessages >= 3) add(12, `${input.inboundMessages} messages from them`);
  else if (input.inboundMessages === 2) add(8, "Replied more than once");
  else if (input.inboundMessages === 1) add(4, "One enquiry so far");

  // Profile completeness — two ways to reach someone beats one.
  if (input.hasEmail && input.hasPhone) add(8, "Email and phone on file");
  else if (input.hasEmail || input.hasPhone) add(4, "One contact method on file");

  if (input.location.trim()) add(5, "Area of interest known");

  const source = match(SOURCE_POINTS, input.source);
  if (source) add(source.points, source.reason);

  // Recency: an enquiry decays if nobody works it.
  if (input.ageHours <= 1) add(10, "Arrived within the hour");
  else if (input.ageHours <= 24) add(6, "Arrived today");
  else if (input.ageHours <= 72) add(2, "Arrived in the last three days");
  else add(-5, "No progress for several days");

  const bounded = Math.max(0, Math.min(100, score));
  const band: Score["band"] = bounded >= 70 ? "Hot" : bounded >= 40 ? "Warm" : "Cold";
  return { score: bounded, band, reasons };
}
