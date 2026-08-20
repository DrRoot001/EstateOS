import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Sparkle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchLead, saveLead } from "@/lib/crm-api";
import { fetchMatches } from "@/lib/inventory-api";
import { formatMoney, useMarket } from "@/lib/markets";
import { useCan, useSession } from "@/lib/session";

const STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Viewing",
  "Offer",
  "Negotiation",
  "Won",
  "Lost",
] as const;
const INTENTS = ["Buying", "Selling", "Renting", "Letting", "Browsing"];
const TIMELINES = ["Immediate", "1-3 months", "3-6 months", "6+ months"];
const FINANCING = ["Cash", "Pre-approved", "Application in progress", "Needs mortgage", "Unknown"];

export const Route = createFileRoute("/leads/$leadId")({
  loader: ({ params }) => fetchLead({ data: { leadId: params.leadId } }),
  head: () => ({ meta: [{ title: "Lead — EstateOS" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  useMarket();
  const { lead, contact } = Route.useLoaderData();
  const matches = useQuery({
    queryKey: ["matches", lead.id, lead.updatedAt],
    queryFn: () => fetchMatches({ data: { leadId: lead.id } }),
  });
  const { users } = useSession();
  const can = useCan();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    status: lead.status as (typeof STATUSES)[number],
    intent: lead.intent || "",
    timeline: lead.timeline || "",
    financing: lead.financing || "",
    budgetMin: lead.budgetMin?.toString() ?? "",
    budgetMax: lead.budgetMax?.toString() ?? "",
    location: lead.location,
    bedrooms: lead.bedrooms?.toString() ?? "",
    notes: lead.notes,
    assignedToId: lead.assignedToId,
  });

  const owner = users.find((u) => u.id === lead.assignedToId);
  const editable = can("leads.edit");

  return (
    <AppShell
      title={contact.name}
      subtitle={`${lead.source} · ${new Date(lead.createdAt).toLocaleString()}`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/leads">
            <ArrowLeft className="size-4" /> All leads
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <form
          className="panel space-y-4 p-5 lg:col-span-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await saveLead({
                data: {
                  id: lead.id,
                  contactId: contact.id,
                  type: lead.type,
                  source: lead.source,
                  status: form.status,
                  intent: form.intent,
                  timeline: form.timeline,
                  financing: form.financing,
                  budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
                  budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
                  location: form.location,
                  bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
                  notes: form.notes,
                  assignedToId: form.assignedToId,
                },
              });
              toast.success("Lead updated — score recalculated");
              await router.invalidate();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save");
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 className="font-display text-lg">Qualification</h2>
          <p className="-mt-2 text-sm text-muted-foreground">
            What you learn here drives the score and the priority queue (PRD 17, 18).
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stage">
              <Select
                value={form.status}
                disabled={!editable}
                onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}
              >
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
            </Field>
            <Field label="Owner">
              <Select
                value={form.assignedToId ?? "none"}
                disabled={!can("leads.assign")}
                onValueChange={(v) => setForm({ ...form, assignedToId: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users
                    .filter((u) => u.active)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Intent">
              <Select
                value={form.intent || "unset"}
                disabled={!editable}
                onValueChange={(v) => setForm({ ...form, intent: v === "unset" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not asked yet</SelectItem>
                  {INTENTS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Timeline">
              <Select
                value={form.timeline || "unset"}
                disabled={!editable}
                onValueChange={(v) => setForm({ ...form, timeline: v === "unset" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not asked yet</SelectItem>
                  {TIMELINES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Financing">
              <Select
                value={form.financing || "unset"}
                disabled={!editable}
                onValueChange={(v) => setForm({ ...form, financing: v === "unset" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not asked yet</SelectItem>
                  {FINANCING.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={`Area of interest`}>
              <Input
                value={form.location}
                disabled={!editable}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
            <Field label="Bedrooms needed">
              <Input
                type="number"
                min={0}
                value={form.bedrooms}
                disabled={!editable}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </Field>
            <Field label={`Budget from (${lead.currency})`}>
              <Input
                type="number"
                value={form.budgetMin}
                disabled={!editable}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
              />
            </Field>
            <Field label={`Budget to (${lead.currency})`}>
              <Input
                type="number"
                value={form.budgetMax}
                disabled={!editable}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              rows={4}
              value={form.notes}
              disabled={!editable}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>

          <Button type="submit" disabled={!editable || busy}>
            {busy ? "Saving…" : "Save lead"}
          </Button>
        </form>

        <div className="space-y-4">
          <section className="panel p-5">
            <div className="flex items-center gap-2">
              <Sparkle className="size-4 text-accent" />
              <h2 className="font-display text-lg">Score</h2>
              <Badge
                className="ml-auto"
                variant={lead.scoreBand === "Hot" ? "default" : "secondary"}
              >
                {lead.scoreBand}
              </Badge>
            </div>
            <p className="mt-2 font-display text-3xl">{lead.score}</p>
            <Progress value={lead.score} className="mt-2 h-1.5" />
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {lead.scoreReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
              {lead.scoreReasons.length === 0 ? <li>Not scored yet.</li> : null}
            </ul>
          </section>

          <section className="panel p-5">
            <h2 className="font-display text-lg">Matching properties</h2>
            <p className="text-sm text-muted-foreground">
              Live listings that pass the hard filters, ranked and explained (PRD 27–29).
            </p>
            <ul className="mt-3 space-y-3">
              {(matches.data ?? []).map((match) => (
                <li key={match.listingId} className="rounded-lg bg-secondary/60 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="min-w-0 flex-1">
                      <Link
                        to="/properties/$propertyId"
                        params={{ propertyId: match.listing.propertyId }}
                        className="font-medium hover:underline"
                      >
                        {match.listing.address}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {formatMoney(match.listing.price, true)} · {match.listing.bedrooms ?? "?"}{" "}
                        bed · {match.listing.city}
                      </span>
                    </span>
                    <Badge>{match.score}</Badge>
                  </div>
                  <ul className="mt-1.5 text-xs text-muted-foreground">
                    {match.reasons.map((r) => (
                      <li key={r}>✓ {r}</li>
                    ))}
                    {match.concerns.map((c) => (
                      <li key={c}>! {c}</li>
                    ))}
                  </ul>
                </li>
              ))}
              {matches.data && matches.data.length === 0 ? (
                <li className="py-4 text-center text-xs text-muted-foreground">
                  Nothing live fits this brief yet. EstateOS shows no match rather than a weak one.
                </li>
              ) : null}
            </ul>
          </section>

          <section className="panel space-y-2 p-5 text-sm">
            <h2 className="font-display text-lg">Routing and SLA</h2>
            <Row label="Owner" value={owner?.name ?? "Unassigned"} />
            <Row label="Why" value={lead.routingReason || "Assigned by hand"} />
            <Row
              label="First response"
              value={
                lead.firstResponseAt
                  ? new Date(lead.firstResponseAt).toLocaleString()
                  : lead.slaDueAt
                    ? `Due ${new Date(lead.slaDueAt).toLocaleTimeString()}`
                    : "—"
              }
            />
            <Row
              label="Qualified"
              value={lead.qualifiedAt ? new Date(lead.qualifiedAt).toLocaleDateString() : "Not yet"}
            />
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link to="/contacts/$contactId" params={{ contactId: contact.id }}>
                Open contact
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
