import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ChannelConnect } from "@/components/channel-connect";
import { MarketSwitcher } from "@/components/market-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { changePassword } from "@/lib/auth-api";
import { useMarket } from "@/lib/markets";
import { ROLES, ROLE_IDS, permissionsOf } from "@/lib/rbac";
import { useSession } from "@/lib/session";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EstateOS" },
      {
        name: "description",
        content: "Your account, the organization profile, market pack, roles and integrations.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const market = useMarket();
  const { user, org } = useSession();

  return (
    <AppShell title="Settings" subtitle={`${org.name} · ${market.flag} ${market.name}`}>
      <Tabs defaultValue="account" className="space-y-5">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel space-y-2 p-5">
              <h2 className="font-display text-lg">{user.name}</h2>
              <dl className="space-y-2 text-sm">
                <Row label="Email" value={user.email} />
                <Row label="Role" value={ROLES[user.role].label} />
                <Row label="Record scope" value={ROLES[user.role].scope} />
                <Row label="Last sign in" value={formatWhen(user.lastLoginAt)} />
              </dl>
              <p className="pt-2 text-xs text-muted-foreground">
                Your role and reporting line are set by an administrator. Signing out everywhere is
                in the account menu, top right.
              </p>
            </div>
            <ChangePassword />
          </div>
        </TabsContent>

        <TabsContent value="organization">
          <div className="panel max-w-xl space-y-3 p-5">
            <dl className="space-y-2 text-sm">
              <Row label="Organization" value={org.name} />
              <Row label="Primary market" value={`${market.flag} ${market.name}`} />
              <Row label="Jurisdiction" value={org.jurisdiction || "—"} />
              <Row label="Licence / registration" value={org.licence || "Not recorded"} />
              <Row
                label="Working hours"
                value={`${org.workingHoursStart}–${org.workingHoursEnd} (${org.timezone})`}
              />
              <Row label="First response SLA" value={`${org.slaFirstResponseMinutes} min`} />
              <Row label="Reporting currency" value={org.reportingCurrency} />
              <Row label="Data residency" value={org.dataResidency || "Not set"} />
              <Row label="Plan" value={`${org.plan} · ${org.seatsUsed}/${org.seatLimit} seats`} />
            </dl>
            <p className="text-xs text-muted-foreground">
              Organization, offices, teams and people are edited in Administration, where every
              change is permission-checked and audited.
            </p>
            <Button asChild>
              <Link to="/admin">Open Administration</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="market">
          <div className="panel max-w-2xl space-y-4 p-5">
            <div>
              <Label>Country pack preview</Label>
              <div className="mt-1.5">
                <MarketSwitcher />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Drives currency, area units, address fields, portals, commission defaults, working
                week and compliance. Your organization's own pack is {org.primaryMarket}; switching
                here previews another market.
              </p>
            </div>
            <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
              {[
                ["Currency", `${market.currency} · ${market.locale}`],
                [
                  "Area units",
                  market.secondaryArea ? `sq ft · ${market.secondaryArea.label}` : "sq ft",
                ],
                [
                  "Address",
                  [market.regionLabel, market.postalLabel ?? "no postal code"].join(" · "),
                ],
                ["Dialling code", market.dialCode],
                ["Channel priority", market.channels.join(" → ")],
                ["Weekend", market.weekend.map((d) => WEEKDAYS[d]).join(", ")],
                ["Languages", market.languages.join(", ")],
                [
                  "Commission",
                  `${(market.commission.rate * 100).toFixed(1)}% · ${market.commission.paidBy}`,
                ],
                [
                  market.commission.taxLabel,
                  market.commission.taxRate > 0
                    ? `${market.commission.taxRate * 100}%`
                    : "Not applied",
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 sm:block">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
                  <dd className="sm:mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border pt-4">
              <Label>Transaction templates</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {market.jurisdictions.map((j) => (
                  <span key={j} className="rounded-full bg-secondary px-3 py-1 text-xs">
                    {j}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <Label>Compliance obligations</Label>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {market.compliance.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <div className="panel divide-y divide-border">
            {ROLE_IDS.map((id) => (
              <div key={id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{ROLES[id].label}</p>
                  <p className="text-sm text-muted-foreground">
                    Sees {ROLES[id].scope} records · {permissionsOf(id).length} permissions
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">View matrix</Link>
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <ChannelConnect />
        </TabsContent>
      </Tabs>
    </AppShell>
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

function formatWhen(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : "First session";
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="panel space-y-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (next !== confirm) {
          toast.error("Both new passwords must match");
          return;
        }
        setBusy(true);
        try {
          await changePassword({ data: { current, next } });
          setCurrent("");
          setNext("");
          setConfirm("");
          toast.success("Password changed", {
            description: "Every other session has been signed out.",
          });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not change password");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-display text-lg">Change password</h2>
      <div className="space-y-1.5">
        <Label htmlFor="current">Current password</Label>
        <Input
          id="current"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          At least 12 characters, including a letter and a number.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
