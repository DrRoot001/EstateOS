import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Check,
  Contact,
  MessagesSquare,
  Sparkle,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ModuleReadinessPanel } from "@/components/module-readiness-panel";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchLeads, fetchPipeline } from "@/lib/crm-api";
import { MARKETS, type MarketCode } from "@/lib/markets";
import { MODULE_READINESS } from "@/lib/module-readiness";
import { ROLES } from "@/lib/rbac";
import { useCan, useSession, type Session } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — EstateOS" },
      {
        name: "description",
        content:
          "What needs attention now, scoped to your organization, office, team or own records.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const session = useSession();
  const can = useCan();
  const scope = ROLES[session.user.role].scope;
  const office = session.offices.find((o) => o.id === session.user.officeId);
  const setupOwner = can("offices.manage") || can("users.manage");
  const pipeline = useQuery({ queryKey: ["pipeline-summary"], queryFn: () => fetchPipeline() });
  const newLeads = useQuery({
    queryKey: ["dashboard-new-leads"],
    queryFn: () => fetchLeads({ data: { status: "New" } }),
  });
  const leads = newLeads.data ?? [];
  const slaBreached = leads.filter((lead) => lead.slaDueAt && new Date(lead.slaDueAt) < new Date());
  const unassigned = leads.filter((lead) => !lead.assignedToId);
  const unanswered = pipeline.data?.unanswered ?? leads.length;
  const openPipeline = pipeline.data?.open ?? 0;

  return (
    <AppShell
      title={scope === "own" ? "My workspace" : "Dashboard"}
      subtitle={`${ROLES[session.user.role].label} · ${office?.name ?? session.org.name} · sees ${
        scope === "own" ? "own records" : `${scope} records`
      }`}
      actions={
        can("users.manage") ? (
          <Button asChild>
            <Link to="/admin">Administration</Link>
          </Button>
        ) : null
      }
    >
      <div className="space-y-6">
        <ModuleReadinessPanel title="Dashboard readiness" readiness={MODULE_READINESS.dashboard} />

        {setupOwner ? <Setup session={session} /> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="People in scope"
            value={String(session.users.filter((u) => u.active).length)}
            icon={UsersRound}
            hint={`${session.org.seatsUsed} of ${session.org.seatLimit} seats used`}
          />
          <StatCard
            label="Offices"
            value={String(session.offices.length)}
            icon={Building2}
            hint={[...new Set(session.offices.map((o) => o.market))]
              .map((m) => MARKETS[m as MarketCode]?.flag ?? m)
              .join(" ")}
          />
          <StatCard label="Teams" value={String(session.teams.length)} icon={UsersRound} />
          <StatCard
            label="Open conversations"
            value={String(unanswered)}
            icon={MessagesSquare}
            hint="unanswered leads in current scope"
          />
          <StatCard
            label="Open pipeline"
            value={String(openPipeline)}
            icon={Gauge}
            hint="excluding Won and Lost"
          />
        </section>

        <section className="panel p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg">Needs attention now</h2>
            <Badge variant={slaBreached.length ? "destructive" : "secondary"}>
              {slaBreached.length ? `${slaBreached.length} overdue` : "No overdue items"}
            </Badge>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3">
              <span>Unanswered leads</span>
              <span className="font-medium">{unanswered}</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3">
              <span>SLA breaches</span>
              <span className="font-medium">{slaBreached.length}</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3">
              <span>Unassigned new leads</span>
              <span className="font-medium">{unassigned.length}</span>
            </li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/leads">Open lead queue</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/inbox">Open inbox</Link>
            </Button>
          </div>
        </section>

        <EmptyState
          icon={Contact}
          title="No pipeline data yet"
          description={
            scope === "own"
              ? "Your assigned leads, follow-ups due, today's viewings and live offers appear here once leads start arriving."
              : "New and unanswered leads, SLA breaches, agent workload, pipeline value and transaction risk appear here once leads start arriving."
          }
          note="Nothing on this dashboard is sampled or estimated — it stays empty until your organization has records of its own."
        />
      </div>
    </AppShell>
  );
}

type Step = { label: string; detail: string; done: boolean; blocked?: string; icon: LucideIcon };

/** PRD 8B.4: say plainly what is set up, what is next, and what is not available yet. */
function Setup({ session }: { session: Session }) {
  const active = session.users.filter((u) => u.active).length;
  const steps: Step[] = [
    {
      icon: Building2,
      label: "Create your offices",
      detail: `${session.offices.length} created. Each office carries its own country pack.`,
      done: session.offices.length > 0,
    },
    {
      icon: UsersRound,
      label: "Build teams and reporting lines",
      detail: `${session.teams.length} teams. A manager sees every record in their scope.`,
      done: session.teams.length > 0,
    },
    {
      icon: Contact,
      label: "Invite your people",
      detail: `${active} active ${active === 1 ? "member" : "members"}.`,
      done: active > 1,
    },
    {
      icon: MessagesSquare,
      label: "Connect email and WhatsApp",
      detail: "Your team reads and replies inside EstateOS instead of Gmail or WhatsApp.",
      done: false,
      blocked: "Integrations land in Phase 4",
    },
    {
      icon: Sparkle,
      label: "Enable the AI layer",
      detail: "Set ANTHROPIC_API_KEY and AI_ENABLED in the environment.",
      done: false,
      blocked: "Configured at deployment",
    },
  ];

  const done = steps.filter((s) => s.done).length;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">Set up {session.org.name}</h2>
          <p className="text-sm text-muted-foreground">
            {done} of {steps.length} complete ·{" "}
            {MARKETS[session.org.primaryMarket as MarketCode]?.name ?? session.org.primaryMarket} ·
            plan {session.org.plan}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">Open Administration</Link>
        </Button>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {steps.map((step) => (
          <li key={step.label} className="flex flex-wrap items-center gap-3 py-3">
            <span
              className={
                step.done
                  ? "grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
                  : "grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"
              }
            >
              {step.done ? <Check className="size-4" /> : <step.icon className="size-4" />}
            </span>
            <span className="min-w-48 flex-1">
              <span className="block text-sm font-medium">{step.label}</span>
              <span className="block text-xs text-muted-foreground">{step.detail}</span>
            </span>
            {step.blocked ? (
              <Badge variant="outline">{step.blocked}</Badge>
            ) : step.done ? (
              <Badge variant="secondary">Done</Badge>
            ) : (
              <Badge>To do</Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
