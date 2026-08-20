import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
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
import { fetchProperty, saveListing } from "@/lib/inventory-api";
import { MARKETS, formatArea, formatMoney, useMarket, type MarketCode } from "@/lib/markets";
import { useCan, useSession } from "@/lib/session";

const STATUSES = ["Draft", "Live", "Under offer", "Sold", "Let", "Withdrawn"];

export const Route = createFileRoute("/properties/$propertyId")({
  loader: ({ params }) => fetchProperty({ data: { propertyId: params.propertyId } }),
  head: () => ({ meta: [{ title: "Property — EstateOS" }] }),
  component: PropertyDetail,
});

function PropertyDetail() {
  useMarket();
  const { property, listings } = Route.useLoaderData();
  const { users } = useSession();
  const can = useCan();
  const [listing, setListing] = useState(false);
  const pack = MARKETS[property.market as MarketCode];

  return (
    <AppShell
      title={property.address}
      subtitle={`${property.type} · ${[property.city, property.region].filter(Boolean).join(", ")} ${pack?.flag ?? ""}`}
      actions={
        <div className="flex gap-2">
          {can("properties.edit") ? (
            <Button onClick={() => setListing(true)}>
              <Plus className="size-4" /> New listing
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/properties">
              <ArrowLeft className="size-4" /> All properties
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel space-y-2 p-5">
          <h2 className="font-display text-lg">The asset</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Type" value={property.type} />
            <Row label="Bedrooms" value={property.bedrooms?.toString() ?? "—"} />
            <Row label="Bathrooms" value={property.bathrooms?.toString() ?? "—"} />
            <Row label="Area" value={property.areaSqft ? formatArea(property.areaSqft) : "—"} />
            <Row label="Market" value={`${pack?.flag ?? ""} ${pack?.name ?? property.market}`} />
            <Row label="Reference" value={property.reference || "—"} />
          </dl>
          {property.features.length ? (
            <div className="pt-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Features</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {property.features.map((f) => (
                  <Badge key={f} variant="secondary">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="font-display text-lg">Listings</h2>
          <p className="text-sm text-muted-foreground">
            One property, many listings over time. Only a Live listing is matched to leads.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {listings.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-32 flex-1">
                  <span className="block font-medium">
                    {formatMoney(l.price, true)}
                    {l.pricePeriod ? ` / ${l.pricePeriod}` : ""}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {l.dealType} · {users.find((u) => u.id === l.agentId)?.name ?? "unassigned"} ·{" "}
                    {new Date(l.createdAt).toLocaleDateString()}
                  </span>
                </span>
                <Badge variant={l.status === "Live" ? "default" : "secondary"}>{l.status}</Badge>
              </li>
            ))}
            {listings.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Not on the market. Create a listing to start matching it to leads.
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      {listing ? (
        <ListingDialog propertyId={property.id} onClose={() => setListing(false)} />
      ) : null}
    </AppShell>
  );
}

function ListingDialog({ propertyId, onClose }: { propertyId: string; onClose: () => void }) {
  const { org } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    dealType: "sale",
    status: "Live",
    price: "",
    pricePeriod: "yearly",
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New listing</DialogTitle>
          <DialogDescription>
            Prices are held in {org.reportingCurrency}, your organization's reporting currency.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await saveListing({
                data: {
                  propertyId,
                  dealType: form.dealType as "sale" | "rent",
                  status: form.status,
                  price: Number(form.price) || 0,
                  pricePeriod: form.dealType === "rent" ? form.pricePeriod : "",
                },
              });
              toast.success("Listing created");
              onClose();
              await router.invalidate();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Deal type</Label>
              <Select
                value={form.dealType}
                onValueChange={(v) => setForm({ ...form, dealType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">For sale</SelectItem>
                  <SelectItem value="rent">To let</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Price ({org.reportingCurrency})</Label>
            <Input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          {form.dealType === "rent" ? (
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select
                value={form.pricePeriod}
                onValueChange={(v) => setForm({ ...form, pricePeriod: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create listing</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
