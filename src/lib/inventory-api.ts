/** Property, listing and matching endpoints (PRD 23–29). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MARKET_CODES } from "@/lib/markets";
import { requireCaller } from "@/server/auth";
import {
  LISTING_STATUSES,
  PROPERTY_TYPES,
  getProperty,
  listProperties,
  matchesForLead,
  upsertListing,
  upsertProperty,
} from "@/server/inventory-service";

const iso = (v: Date | null | undefined) => v?.toISOString() ?? null;

export const fetchProperties = createServerFn({ method: "GET" })
  .validator((d: { query?: string }) =>
    z.object({ query: z.string().max(120).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const rows = await listProperties(await requireCaller(), data.query ?? "");
    return rows.map(({ property, listing }) => ({
      id: property.id,
      reference: property.reference,
      type: property.type,
      address: property.address,
      city: property.city,
      market: property.market,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft,
      features: property.features,
      updatedAt: property.updatedAt.toISOString(),
      listing: listing
        ? {
            id: listing.id,
            status: listing.status,
            dealType: listing.dealType,
            price: listing.price,
            currency: listing.currency,
            pricePeriod: listing.pricePeriod,
          }
        : null,
    }));
  });

export const fetchProperty = createServerFn({ method: "GET" })
  .validator((d: { propertyId: string }) => z.object({ propertyId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { property, listings } = await getProperty(await requireCaller(), data.propertyId);
    return {
      property: {
        ...property,
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
      },
      listings: listings.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        availableFrom: iso(l.availableFrom),
        listedAt: iso(l.listedAt),
        closedAt: iso(l.closedAt),
      })),
    };
  });

const propertyInput = z.object({
  id: z.string().optional(),
  reference: z.string().max(40).default(""),
  type: z.enum(PROPERTY_TYPES as unknown as [string, ...string[]]),
  address: z.string().min(3).max(200),
  city: z.string().max(80).default(""),
  region: z.string().max(80).default(""),
  postal: z.string().max(20).default(""),
  market: z.enum(MARKET_CODES as [string, ...string[]]),
  bedrooms: z.number().int().min(0).max(50).nullable().default(null),
  bathrooms: z.number().int().min(0).max(50).nullable().default(null),
  areaSqft: z.number().int().min(0).nullable().default(null),
  features: z.array(z.string().max(40)).max(30).default([]),
  description: z.string().max(4000).default(""),
  ownerContactId: z.string().nullable().default(null),
});

export const saveProperty = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof propertyInput>) => propertyInput.parse(d))
  .handler(async ({ data }) => {
    const row = await upsertProperty(await requireCaller(), data);
    return { id: row.id, address: row.address };
  });

const listingInput = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  dealType: z.enum(["sale", "rent"]),
  status: z.enum(LISTING_STATUSES as unknown as [string, ...string[]]),
  price: z.number().int().min(0),
  pricePeriod: z.string().max(20).default(""),
  agentId: z.string().nullable().default(null),
  compliance: z.record(z.string(), z.string()).default({}),
});

export const saveListing = createServerFn({ method: "POST" })
  .validator((d: z.input<typeof listingInput>) => listingInput.parse(d))
  .handler(async ({ data }) => {
    const row = await upsertListing(await requireCaller(), data);
    return { id: row.id, status: row.status };
  });

export const fetchMatches = createServerFn({ method: "GET" })
  .validator((d: { leadId: string }) => z.object({ leadId: z.string() }).parse(d))
  .handler(async ({ data }) => matchesForLead(await requireCaller(), data.leadId));
