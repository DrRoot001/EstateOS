import { createFileRoute, Link } from "@tanstack/react-router";
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
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MARKETS, type MarketCode } from "@/lib/markets";
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
            value="—"
            icon={MessagesSquare}
            hint="inbox not connected"
          />
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
