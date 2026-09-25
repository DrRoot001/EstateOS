/**
 * Properties and listings (PRD 23–26), plus matching a lead against live stock
 * (PRD 27–29).
 *
 * A property is the asset and outlives every listing made from it; a listing is
 * one attempt to sell or let it. Inventory is organization-wide by design — an
 * agent must be able to sell a colleague's listing — while contacts and leads
 * stay scoped to the hierarchy.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { Listing, Property } from "@/db/schema";
import { matchListings, type MatchCandidate } from "@/lib/matching";
import type { Caller } from "./auth";
import { audit, id, requirePermission } from "./org-service";

export const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "House",
  "Townhouse",
  "Plot",
  "Office",
  "Retail",
  "Warehouse",
] as const;

export const LISTING_STATUSES = [
  "Draft",
  "Live",
  "Under offer",
  "Sold",
  "Let",
  "Withdrawn",
] as const;

export async function listProperties(caller: Caller, query = "") {
  requirePermission(caller, "properties.view");
  const database = await db();
  const like = `%${query.trim().toLowerCase()}%`;

  const properties = await database.select().from(schema.properties)
    .where(
      and(
        eq(schema.properties.organizationId, caller.org.id),
        query.trim()
          ? sql`(lower(${schema.properties.address}) like ${like} or lower(${schema.properties.city}) like ${like} or lower(${schema.properties.reference}) like ${like})`
          : undefined,
      ),
    )
    .orderBy(desc(schema.properties.updatedAt))
    .limit(200);

  if (!properties.length) return [];

  const propertyIds = properties.map((property) => property.id);
  const listings = await database
    .select()
    .from(schema.listings)
    .where(
      and(
        eq(schema.listings.organizationId, caller.org.id),
        inArray(schema.listings.propertyId, propertyIds),
        sql`${schema.listings.status} <> 'Withdrawn'`,
      ),
    )
    .orderBy(desc(schema.listings.updatedAt));

  const latestListing = new Map<string, (typeof listings)[number]>();
  for (const listing of listings) {
    if (!latestListing.has(listing.propertyId)) latestListing.set(listing.propertyId, listing);
  }

  return properties.map((property) => ({
    property,
    listing: latestListing.get(property.id) ?? null,
  }));
}

export async function getProperty(caller: Caller, propertyId: string) {
  requirePermission(caller, "properties.view");
  const database = await db();
  const [property] = await database
    .select()
    .from(schema.properties)
    .where(
      and(
        eq(schema.properties.id, propertyId),
        eq(schema.properties.organizationId, caller.org.id),
      ),
    )
    .limit(1);
  if (!property) throw new Error("Property not found");

  const propertyListings = await database
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.propertyId, propertyId))
    .orderBy(desc(schema.listings.createdAt));

  return { property, listings: propertyListings };
}

export type PropertyInput = {
  id?: string | undefined;
  reference: string;
  type: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  market: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  features: string[];
  description: string;
  ownerContactId: string | null;
};

export async function upsertProperty(caller: Caller, input: PropertyInput) {
  requirePermission(caller, "properties.edit");
  const database = await db();
  const values = {
    reference: input.reference,
    type: input.type,
    address: input.address.trim(),
    city: input.city,
    region: input.region,
    postal: input.postal,
    market: input.market,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    areaSqft: input.areaSqft,
    features: input.features,
    description: input.description,
    ownerContactId: input.ownerContactId,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [existing] = await database
      .select()
      .from(schema.properties)
      .where(
        and(
          eq(schema.properties.id, input.id),
          eq(schema.properties.organizationId, caller.org.id),
        ),
      )
      .limit(1);
    if (!existing) throw new Error("Property not found");
    const [row] = await database
      .update(schema.properties)
      .set(values)
      .where(eq(schema.properties.id, input.id))
      .returning();
    await audit(caller, "property.update", "property", input.id, existing, row);
    return row as Property;
  }

  const [row] = await database
    .insert(schema.properties)
    .values({
      id: id("pr"),
      organizationId: caller.org.id,
      officeId: caller.user.officeId,
      ...values,
    })
    .returning();
  await audit(caller, "property.create", "property", row!.id, null, row);
  return row as Property;
}

export type ListingInput = {
  id?: string | undefined;
  propertyId: string;
  dealType: string;
  status: string;
  price: number;
  pricePeriod: string;
  agentId: string | null;
  compliance: Record<string, string>;
};

export async function upsertListing(caller: Caller, input: ListingInput) {
  requirePermission(caller, "properties.edit");
  const database = await db();

  const [property] = await database
    .select()
    .from(schema.properties)
    .where(
      and(
        eq(schema.properties.id, input.propertyId),
        eq(schema.properties.organizationId, caller.org.id),
      ),
    )
    .limit(1);
  if (!property) throw new Error("Property not found");

  const closing = ["Sold", "Let", "Withdrawn"].includes(input.status);
  const values = {
    propertyId: input.propertyId,
    dealType: input.dealType,
    status: input.status,
    price: input.price,
    // Money is stored with its currency, never as a bare number (PRD 8A.5).
    currency: caller.org.reportingCurrency,
    pricePeriod: input.dealType === "rent" ? input.pricePeriod || "yearly" : "",
    agentId: input.agentId ?? caller.user.id,
    compliance: input.compliance,
    listedAt: input.status === "Live" ? new Date() : null,
    closedAt: closing ? new Date() : null,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [existing] = await database
      .select()
      .from(schema.listings)
      .where(
        and(eq(schema.listings.id, input.id), eq(schema.listings.organizationId, caller.org.id)),
      )
      .limit(1);
    if (!existing) throw new Error("Listing not found");
    const [row] = await database
      .update(schema.listings)
      .set({ ...values, listedAt: existing.listedAt ?? values.listedAt })
      .where(eq(schema.listings.id, input.id))
      .returning();
    await audit(caller, "listing.update", "listing", input.id, existing, row);
    return row as Listing;
  }

  const [row] = await database
    .insert(schema.listings)
    .values({ id: id("ls"), organizationId: caller.org.id, ...values })
    .returning();
  await audit(caller, "listing.create", "listing", row!.id, null, row);
  return row as Listing;
}

/**
 * Live stock that fits a lead's requirement, ranked and explained (PRD 28).
 * Returns nothing rather than something weak: an empty result is an honest
 * answer, and the interface says so.
 */
export async function matchesForLead(caller: Caller, leadId: string) {
  requirePermission(caller, "properties.view");
  const database = await db();

  const [lead] = await database
    .select()
    .from(schema.leads)
    .where(and(eq(schema.leads.id, leadId), eq(schema.leads.organizationId, caller.org.id)))
    .limit(1);
  if (!lead) throw new Error("Lead not found");

  const rows = await database
    .select({ listing: schema.listings, property: schema.properties })
    .from(schema.listings)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.listings.propertyId))
    .where(
      and(eq(schema.listings.organizationId, caller.org.id), eq(schema.listings.status, "Live")),
    )
    .limit(500);

  const candidates: MatchCandidate[] = rows.map(({ listing, property }) => ({
    listingId: listing.id,
    propertyId: property.id,
    address: property.address,
    city: property.city,
    price: listing.price,
    currency: listing.currency,
    dealType: listing.dealType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft,
    type: property.type,
    features: property.features,
    status: listing.status,
  }));

  const matches = matchListings(candidates, {
    leadType: lead.type === "tenant" ? "tenant" : "buyer",
    budgetMin: lead.budgetMin,
    budgetMax: lead.budgetMax,
    bedrooms: lead.bedrooms,
    location: lead.location,
    propertyType: "",
    features: [],
  });

  const byId = new Map(candidates.map((c) => [c.listingId, c]));
  return matches.map((match) => ({ ...match, listing: byId.get(match.listingId)! }));
}
