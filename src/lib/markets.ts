import { useSyncExternalStore } from "react";

/**
 * Module Zero: country packs (PRD 8A).
 * Everything market-specific is data here — no branching in feature code.
 * Adding a market = adding one entry to MARKETS.
 */

export type MarketCode = "PK" | "AE" | "GB" | "US";

export type Market = {
  code: MarketCode;
  name: string;
  flag: string;
  locale: string;
  currency: string;
  /** Display-only conversion from the USD-denominated demo data. */
  fx: number;
  /** Secondary area unit shown alongside sq ft, with sq ft per unit. */
  secondaryArea: { label: string; sqftPer: number } | null;
  /** Province / emirate / county / state. */
  regionLabel: string;
  regionPlaceholder: string;
  postalLabel: string | null;
  postalPlaceholder: string;
  cityPlaceholder: string;
  addressPlaceholder: string;
  dialCode: string;
  /** Inbox + automation channel priority. */
  channels: string[];
  portals: string[];
  /** Sale-side commission convention. */
  commission: { rate: number; paidBy: string; taxLabel: string; taxRate: number };
  /** 0 = Sunday. Days the SLA clock and routing treat as non-working. */
  weekend: number[];
  languages: string[];
  dir: "ltr" | "rtl";
  /** Sub-jurisdictions needing their own transaction stage template. */
  jurisdictions: string[];
  compliance: string[];
};

export const MARKETS: Record<MarketCode, Market> = {
  PK: {
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰",
    locale: "en-PK",
    currency: "PKR",
    fx: 280,
    secondaryArea: { label: "marla", sqftPer: 272.25 },
    regionLabel: "Province",
    regionPlaceholder: "Sindh",
    postalLabel: "Postal code",
    postalPlaceholder: "75500",
    cityPlaceholder: "Karachi",
    addressPlaceholder: "House 12, Street 4, Phase VI, DHA",
    dialCode: "+92",
    channels: ["WhatsApp", "Call", "SMS", "Email"],
    portals: ["Zameen", "Graana", "Bayut PK"],
    commission: { rate: 0.01, paidBy: "Both sides", taxLabel: "Sales tax on services", taxRate: 0 },
    weekend: [0],
    languages: ["English", "اردو"],
    dir: "ltr",
    jurisdictions: ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad CT"],
    compliance: [
      "CNIC identity capture",
      "FBR withholding (filer status)",
      "Provincial stamp duty & registration",
    ],
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    locale: "en-AE",
    currency: "AED",
    fx: 3.67,
    secondaryArea: { label: "m²", sqftPer: 10.7639 },
    regionLabel: "Emirate",
    regionPlaceholder: "Dubai",
    postalLabel: null,
    postalPlaceholder: "",
    cityPlaceholder: "Dubai Marina",
    addressPlaceholder: "Unit 1704, Marina Heights",
    dialCode: "+971",
    channels: ["WhatsApp", "Call", "Email", "SMS"],
    portals: ["Bayut", "Property Finder", "Dubizzle"],
    commission: { rate: 0.02, paidBy: "Buyer", taxLabel: "VAT", taxRate: 0.05 },
    weekend: [6, 0],
    languages: ["English", "العربية"],
    dir: "ltr",
    jurisdictions: ["Dubai (DLD/RERA)", "Abu Dhabi (ADREC)", "Sharjah"],
    compliance: [
      "RERA broker card & Trakheesi permit",
      "Ejari / Oqood registration",
      "AML CDD + goAML reporting",
      "UAE PDPL",
    ],
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    locale: "en-GB",
    currency: "GBP",
    fx: 0.79,
    secondaryArea: { label: "m²", sqftPer: 10.7639 },
    regionLabel: "County",
    regionPlaceholder: "Greater London",
    postalLabel: "Postcode",
    postalPlaceholder: "SW1A 1AA",
    cityPlaceholder: "London",
    addressPlaceholder: "42 Elm Grove",
    dialCode: "+44",
    channels: ["Email", "Call", "SMS", "WhatsApp"],
    portals: ["Rightmove", "Zoopla", "OnTheMarket"],
    commission: { rate: 0.015, paidBy: "Seller", taxLabel: "VAT", taxRate: 0.2 },
    weekend: [6, 0],
    languages: ["English"],
    dir: "ltr",
    jurisdictions: ["England & Wales", "Scotland", "Northern Ireland"],
    compliance: [
      "MLR 2017 (HMRC supervised)",
      "Material Information Parts A/B/C",
      "EPC on listing",
      "UK GDPR & PECR",
      "Redress scheme membership",
    ],
  },
  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    locale: "en-US",
    currency: "USD",
    fx: 1,
    secondaryArea: null,
    regionLabel: "State",
    regionPlaceholder: "TX",
    postalLabel: "ZIP",
    postalPlaceholder: "78701",
    cityPlaceholder: "Austin",
    addressPlaceholder: "4521 Oak Meadow Dr",
    dialCode: "+1",
    channels: ["SMS", "Email", "Call"],
    portals: ["MLS (RESO)", "Zillow", "Realtor.com"],
    commission: {
      rate: 0.05,
      paidBy: "Seller / buyer agreement",
      taxLabel: "Sales tax",
      taxRate: 0,
    },
    weekend: [6, 0],
    languages: ["English", "Español"],
    dir: "ltr",
    jurisdictions: ["Texas", "California", "New York", "Florida"],
    compliance: [
      "Fair Housing Act & HUD AI guidance",
      "State licensing",
      "TCPA / CAN-SPAM",
      "RESPA / TRID",
    ],
  },
};

export const MARKET_CODES = Object.keys(MARKETS) as MarketCode[];

const STORAGE_KEY = "estateos.market";
const DEFAULT_MARKET: MarketCode = "US";

let active: MarketCode = DEFAULT_MARKET;
const subscribers = new Set<() => void>();

export function getMarket(): Market {
  return MARKETS[active];
}

export function setMarket(code: MarketCode) {
  if (code === active) return;
  active = code;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, code);
  subscribers.forEach((fn) => fn());
}

/** Restore the saved market. Call from an effect — never during render (hydration). */
export function restoreMarket() {
  if (typeof window === "undefined") return;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && saved in MARKETS) setMarket(saved as MarketCode);
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Re-renders the caller whenever the active market changes. */
export function useMarket(): Market {
  return useSyncExternalStore(subscribe, getMarket, () => MARKETS[DEFAULT_MARKET]);
}

/** Pakistani reading of large numbers: lakh (10^5) and crore (10^7). */
function lakhCrore(value: number) {
  if (value >= 1e7) return `${trim(value / 1e7)} crore`;
  if (value >= 1e5) return `${trim(value / 1e5)} lakh`;
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value);
}

function trim(n: number) {
  return Number(n.toFixed(n < 10 ? 2 : 1)).toString();
}

/**
 * Formats a USD-denominated demo amount in the active market's currency.
 * ponytail: display-only FX multiplier — real money must be stored as {amount, currency}.
 */
export function formatMoney(usd: number, compact = false, market = getMarket()) {
  const value = usd * market.fx;
  if (market.code === "PK" && compact) return `Rs ${lakhCrore(value)}`;
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

/** Square feet in, market-appropriate area string out. */
export function formatArea(sqft: number, market = getMarket()) {
  const primary = `${sqft.toLocaleString(market.locale)} sq ft`;
  if (!market.secondaryArea) return primary;
  const { label, sqftPer } = market.secondaryArea;
  return `${primary} · ${trim(sqft / sqftPer)} ${label}`;
}

/** "Austin, TX 78701" / "Dubai Marina, Dubai" / "London, Greater London SW1A 1AA" */
export function formatLocation(
  parts: { city: string; region: string; postal?: string },
  market = getMarket(),
) {
  const tail = market.postalLabel && parts.postal ? ` ${parts.postal}` : "";
  return `${parts.city}, ${parts.region}${tail}`;
}
