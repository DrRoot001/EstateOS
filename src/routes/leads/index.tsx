import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Contact } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { fetchLeads, saveLead } from "@/lib/crm-api";
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

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads — EstateOS" },
      {
        name: "description",
        content:
          "Every enquiry as a lead against a canonical contact, with owner and pipeline stage.",
      },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  useMarket();
  const can = useCan();
  const { users } = useSession();
  const [status, setStatus] = useState("all");
  const leads = useQuery({
    queryKey: ["leads", status],
    queryFn: () => fetchLeads({ data: { status } }),
  });

  const rows = leads.data ?? [];
  const nameOf = (id: string | null) => users.find((u) => u.id === id)?.name ?? "Unassigned";

  return (
    <AppShell
      title="Leads"
      subtitle={`${rows.length} in your scope`}
      actions={
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44" aria-label="Filter by stage">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {rows.length === 0 && !leads.isLoading ? (
        <EmptyState
          icon={Contact}
          title="No leads yet"
          description="A lead is created automatically the moment an enquiry arrives from your website form, email or WhatsApp — attached to the person who sent it, never as a duplicate."
          action={{ label: "Open integrations setup", to: "/settings" }}
        />
      ) : (
        <div className="panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>First response</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link
                      to="/leads/$leadId"
                      params={{ leadId: lead.id }}
                      className="font-medium hover:underline"
                    >
                      {lead.contact.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {lead.contact.email ?? lead.contact.phone ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lead.scoreBand === "Hot" ? "default" : "secondary"}>
                      {lead.score} · {lead.scoreBand}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.source}
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.budgetMax ? formatMoney(lead.budgetMax, true) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{nameOf(lead.assignedToId)}</TableCell>
                  <TableCell className="text-sm">
                    {lead.firstResponseAt ? (
                      new Date(lead.firstResponseAt).toLocaleString()
                    ) : lead.slaDueAt && new Date(lead.slaDueAt) < new Date() ? (
                      <Badge variant="destructive">SLA breached</Badge>
                    ) : (
                      <Badge variant="outline">Awaiting</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {can("leads.edit") ? (
                      <Select
                        value={lead.status}
                        onValueChange={async (next) => {
                          try {
                            await saveLead({
                              data: {
                                id: lead.id,
                                contactId: lead.contact.id,
                                status: next as (typeof STATUSES)[number],
                                type: lead.type,
                                source: lead.source,
                                assignedToId: lead.assignedToId,
                                budgetMin: lead.budgetMin,
                                budgetMax: lead.budgetMax,
                                location: lead.location,
                                timeline: lead.timeline,
                              },
                            });
                            toast.success(`Moved to ${next}`);
                            void leads.refetch();
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Could not update",
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="w-36">
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
                    ) : (
                      <Badge variant="secondary">{lead.status}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
