import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchProperties, saveProperty } from "@/lib/inventory-api";
import { MARKETS, formatArea, formatMoney, useMarket, type MarketCode } from "@/lib/markets";
import { useCan, useSession } from "@/lib/session";

const TYPES = ["Apartment", "Villa", "House", "Townhouse", "Plot", "Office", "Retail", "Warehouse"];

export const Route = createFileRoute("/properties/")({
  head: () => ({
    meta: [
      { title: "Properties — EstateOS" },
      {
        name: "description",
        content: "Your inventory: the asset, and every listing made from it.",
      },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  useMarket();
  const can = useCan();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const properties = useQuery({
    queryKey: ["properties", query],
    queryFn: () => fetchProperties({ data: { query } }),
  });

  const rows = properties.data ?? [];

  return (
    <AppShell
      title="Properties"
      subtitle={`${rows.length} in inventory`}
      actions={
        can("properties.edit") ? (
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add property
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address, city or reference"
          className="max-w-sm"
          aria-label="Search properties"
        />

        {rows.length === 0 && !properties.isLoading ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add the asset once — the address, size and features — then create a listing each time you take it to market for sale or to let."
          />
        ) : (
          <div className="panel overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        to="/properties/$propertyId"
                        params={{ propertyId: p.id }}
                        className="font-medium hover:underline"
                      >
                        {p.address}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {[p.city, MARKETS[p.market as MarketCode]?.flag]
                          .filter(Boolean)
                          .join(" · ")}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.type}
                      <p className="text-xs text-muted-foreground">
                        {[p.bedrooms && `${p.bedrooms} bed`, p.bathrooms && `${p.bathrooms} bath`]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.areaSqft ? formatArea(p.areaSqft) : "—"}
                    </TableCell>
                    <TableCell>
                      {p.listing ? (
                        <Badge variant={p.listing.status === "Live" ? "default" : "secondary"}>
                          {p.listing.status} · {p.listing.dealType}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not listed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.listing
                        ? `${formatMoney(p.listing.price, true)}${p.listing.pricePeriod ? ` / ${p.listing.pricePeriod}` : ""}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {adding ? (
        <AddProperty
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            void properties.refetch();
          }}
        />
      ) : null}
    </AppShell>
  );
}

function AddProperty({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { org } = useSession();
  const [form, setForm] = useState({
    address: "",
    type: "Apartment",
    city: "",
    region: "",
    market: org.primaryMarket,
    bedrooms: "",
    bathrooms: "",
    areaSqft: "",
    features: "",
  });
  const pack = MARKETS[form.market as MarketCode];

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add property</DialogTitle>
          <DialogDescription>
            The asset itself. Area is stored in square feet and shown in the units of whichever
            market the property sits in.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await saveProperty({
                data: {
                  address: form.address,
                  type: form.type,
                  city: form.city,
                  region: form.region,
                  market: form.market,
                  bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
                  bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
                  areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
                  features: form.features
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean),
                },
              });
              toast.success("Property added");
              onSaved();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save");
            }
          }}
        >
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              required
              value={form.address}
              placeholder={pack?.addressPlaceholder}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Market</Label>
              <Select value={form.market} onValueChange={(v) => setForm({ ...form, market: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {org.enabledMarkets.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MARKETS[m as MarketCode]?.flag} {MARKETS[m as MarketCode]?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                placeholder={pack?.cityPlaceholder}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{pack?.regionLabel ?? "Region"}</Label>
              <Input
                value={form.region}
                placeholder={pack?.regionPlaceholder}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bedrooms</Label>
              <Input
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bathrooms</Label>
              <Input
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Area (sq ft)</Label>
              <Input
                type="number"
                min={0}
                value={form.areaSqft}
                onChange={(e) => setForm({ ...form, areaSqft: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Features</Label>
              <Input
                value={form.features}
                placeholder="sea view, parking, furnished"
                onChange={(e) => setForm({ ...form, features: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add property</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
