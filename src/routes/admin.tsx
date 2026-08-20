import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  History,
  Plus,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MARKETS, MARKET_CODES, type MarketCode } from "@/lib/markets";
import { PERMISSIONS, ROLES, ROLE_IDS, permissionsOf, type OrgUser, type RoleId } from "@/lib/rbac";
import { useCan, useSession, type Session } from "@/lib/session";
import {
  issueAccessLink,
  listAudit,
  listPendingActivations,
  revokeSessions,
  saveOffice,
  saveOrg,
  saveTeam,
  saveUser,
  setUserActive,
} from "@/lib/org-api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — EstateOS" },
      {
        name: "description",
        content:
          "Organization settings, offices, teams, people, roles and the audit log for your brokerage.",
      },
    ],
  }),
  component: Admin,
});

function Admin() {
  const session = useSession();
  const can = useCan();
  const router = useRouter();
  const reload = () => router.invalidate();

  const allowed = can("users.manage") || can("offices.manage") || can("org.manage");

  return (
    <AppShell
      title="Administration"
      subtitle={`${session.org.name} · ${session.offices.length} offices · ${session.users.length} people`}
    >
      {!allowed ? (
        <div className="panel p-8 text-center">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg">Administration is restricted</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your role ({ROLES[session.user.role].label}) does not include organization
            administration. Ask an owner or brokerage administrator for access.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="hierarchy" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            {can("audit.view") ? <TabsTrigger value="audit">Audit</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="hierarchy" className="space-y-6">
            <Hierarchy session={session} reload={reload} />
          </TabsContent>
          <TabsContent value="people" className="space-y-6">
            <People session={session} reload={reload} />
          </TabsContent>
          <TabsContent value="roles" className="space-y-6">
            <RoleMatrix />
          </TabsContent>
          <TabsContent value="organization" className="space-y-6">
            <OrgSettings session={session} reload={reload} />
          </TabsContent>
          <TabsContent value="audit" className="space-y-6">
            <AuditLog />
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ hierarchy */

function Hierarchy({ session, reload }: { session: Session; reload: () => void }) {
  const can = useCan();
  const [office, setOffice] = useState<Partial<OfficeForm> | null>(null);
  const [team, setTeam] = useState<Partial<TeamForm> | null>(null);
  const { offices, teams, users } = session;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Offices" value={String(offices.length)} icon={Building2} />
        <StatCard label="Teams" value={String(teams.length)} icon={UsersRound} />
        <StatCard label="People" value={String(users.length)} icon={UsersRound} />
        <StatCard
          label="Active agents"
          value={String(users.filter((u) => u.role === "agent" && u.active).length)}
          icon={UsersRound}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {can("offices.manage") ? (
          <Button onClick={() => setOffice({})}>
            <Plus className="size-4" /> New office
          </Button>
        ) : null}
        {can("teams.manage") ? (
          <Button variant="outline" onClick={() => setTeam({ officeId: offices[0]?.id ?? "" })}>
            <Plus className="size-4" /> New team
          </Button>
        ) : null}
      </div>

      <div className="space-y-4">
        {offices.map((o) => {
          const officeTeams = teams.filter((t) => t.officeId === o.id);
          const officeUsers = users.filter((u) => u.officeId === o.id);
          return (
            <section key={o.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-secondary">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-40 flex-1">
                  <h2 className="font-display text-lg">
                    {o.name}{" "}
                    <span className="text-base">{MARKETS[o.market as MarketCode]?.flag}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {o.city} · {o.jurisdiction || MARKETS[o.market as MarketCode]?.name} ·{" "}
                    {o.timezone} · {officeUsers.length} people
                  </p>
                </div>
                {!o.active ? <Badge variant="outline">Inactive</Badge> : null}
                {can("offices.manage") ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOffice({ ...o, market: o.market as MarketCode })}
                  >
                    Edit
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 space-y-3 border-l border-border pl-4">
                {officeTeams.map((t) => {
                  const members = officeUsers.filter((u) => u.teamId === t.id);
                  const manager = users.find((u) => u.id === t.managerId);
                  return (
                    <div key={t.id} className="rounded-lg bg-secondary/50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ChevronRight className="size-4 text-muted-foreground" />
                        <p className="font-medium">{t.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {members.length} members · manager {manager?.name ?? "unassigned"}
                        </span>
                        {can("teams.manage") ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto"
                            onClick={() => setTeam(t)}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
                      <ul className="mt-2 flex flex-wrap gap-2 pl-8">
                        {members.map((m) => (
                          <li key={m.id}>
                            <Badge variant="secondary" className={m.active ? "" : "opacity-50"}>
                              {m.name} · {ROLES[m.role].label}
                            </Badge>
                          </li>
                        ))}
                        {members.length === 0 ? (
                          <li className="text-xs text-muted-foreground">No members yet</li>
                        ) : null}
                      </ul>
                    </div>
                  );
                })}

                <UnassignedRow users={officeUsers.filter((u) => !u.teamId)} />
              </div>
            </section>
          );
        })}
      </div>

      {office ? (
        <OfficeDialog initial={office} onClose={() => setOffice(null)} reload={reload} />
      ) : null}
      {team ? (
        <TeamDialog
          session={session}
          initial={team}
          onClose={() => setTeam(null)}
          reload={reload}
        />
      ) : null}
    </>
  );
}

function UnassignedRow({ users }: { users: Session["users"] }) {
  if (users.length === 0) return null;
  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Office level</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {users.map((u) => (
          <li key={u.id}>
            <Badge variant="outline" className={u.active ? "" : "opacity-50"}>
              {u.name} · {ROLES[u.role].label}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------------------- people */

function People({ session, reload }: { session: Session; reload: () => void }) {
  const can = useCan();
  const pending = useQuery({
    queryKey: ["pending-activations", session.users.length],
    queryFn: () => listPendingActivations(),
    enabled: can("users.manage"),
  });
  const [link, setLink] = useState<{ name: string; email: string; url: string } | null>(null);
  const [editing, setEditing] = useState<Partial<UserForm> | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleId | "all">("all");

  const rows = session.users.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      `${u.name} ${u.email} ${u.title}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="w-56"
          aria-label="Search people"
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleId | "all")}>
          <SelectTrigger className="w-[200px]" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_IDS.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLES[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {can("users.manage") ? (
          <Button
            className="ml-auto"
            onClick={() => setEditing({ officeId: session.offices[0]?.id ?? "", role: "agent" })}
          >
            <UserPlus className="size-4" /> Add person
          </Button>
        ) : null}
      </div>

      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Office / Team</TableHead>
              <TableHead>Reports to</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLES[u.role].label}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">Scope: {ROLES[u.role].scope}</p>
                </TableCell>
                <TableCell className="text-sm">
                  {session.offices.find((o) => o.id === u.officeId)?.name ?? "—"}
                  <p className="text-xs text-muted-foreground">
                    {session.teams.find((t) => t.id === u.teamId)?.name ?? "Office level"}
                  </p>
                </TableCell>
                <TableCell className="text-sm">
                  {session.users.find((m) => m.id === u.managerId)?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? "default" : "outline"}>
                    {u.active ? "Active" : "Disabled"}
                  </Badge>
                  {pending.data?.includes(u.id) ? (
                    <p className="mt-1 text-xs text-muted-foreground">Invitation pending</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {u.lastLoginAt
                        ? `Last in ${new Date(u.lastLoginAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {can("users.manage") ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const kind = pending.data?.includes(u.id) ? "activation" : "reset";
                          try {
                            const issued = await issueAccessLink({
                              data: { userId: u.id, kind },
                            });
                            setLink({
                              name: issued.name,
                              email: issued.email,
                              url: `${window.location.origin}${issued.path}`,
                            });
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Could not issue link",
                            );
                          }
                        }}
                      >
                        {pending.data?.includes(u.id) ? "Invite" : "Reset link"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          run(
                            () => revokeSessions({ data: { userId: u.id } }),
                            "Sessions revoked",
                            reload,
                          )
                        }
                      >
                        Sign out
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await run(
                            () => setUserActive({ data: { userId: u.id, active: !u.active } }),
                            u.active ? "User disabled" : "User enabled",
                            reload,
                          );
                        }}
                      >
                        {u.active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing ? (
        <UserDialog
          session={session}
          initial={editing}
          onClose={() => setEditing(null)}
          reload={reload}
        />
      ) : null}

      {link ? <AccessLinkDialog link={link} onClose={() => setLink(null)} /> : null}
    </>
  );
}

/* ---------------------------------------------------------------------- roles */

function RoleMatrix() {
  return (
    <div className="panel overflow-x-auto p-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-56">Permission</TableHead>
            {ROLE_IDS.map((r) => (
              <TableHead key={r} className="whitespace-nowrap text-center text-xs">
                {ROLES[r].label}
                <span className="block font-normal text-muted-foreground">{ROLES[r].scope}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {PERMISSIONS.map((p) => (
            <TableRow key={p}>
              <TableCell className="font-mono text-xs">{p}</TableCell>
              {ROLE_IDS.map((r) => (
                <TableCell key={r} className="text-center">
                  {permissionsOf(r).includes(p) ? (
                    <span className="text-accent" aria-label="allowed">
                      ●
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30" aria-label="denied">
                      –
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* --------------------------------------------------------------- organization */

function OrgSettings({ session, reload }: { session: Session; reload: () => void }) {
  const can = useCan();
  const { org } = session;
  const [form, setForm] = useState({
    name: org.name,
    timezone: org.timezone,
    reportingCurrency: org.reportingCurrency,
    licence: org.licence,
    dataResidency: org.dataResidency,
    slaFirstResponseMinutes: org.slaFirstResponseMinutes,
    workingHoursStart: org.workingHoursStart,
    workingHoursEnd: org.workingHoursEnd,
  });
  const disabled = !can("org.manage");

  return (
    <form
      className="panel max-w-2xl space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        await run(() => saveOrg({ data: form }), "Organization updated", reload);
      }}
    >
      <Field label="Organization name">
        <Input
          value={form.name}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Primary market (country pack)">
        <Input
          value={`${MARKETS[org.primaryMarket as MarketCode]?.flag ?? ""} ${
            MARKETS[org.primaryMarket as MarketCode]?.name ?? org.primaryMarket
          } · ${org.jurisdiction || "no jurisdiction set"}`}
          readOnly
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Set when the organization was provisioned. Changing it re-bases currency, compliance and
          transaction templates, so it is a platform operation.
        </p>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Time zone">
          <Input
            value={form.timezone}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          />
        </Field>
        <Field label="Reporting currency">
          <Input
            value={form.reportingCurrency}
            maxLength={3}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, reportingCurrency: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="Licence / registration">
          <Input
            value={form.licence}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, licence: e.target.value })}
          />
        </Field>
        <Field label="Data residency">
          <Input
            value={form.dataResidency}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, dataResidency: e.target.value })}
          />
        </Field>
        <Field label="Working day starts">
          <Input
            type="time"
            value={form.workingHoursStart}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, workingHoursStart: e.target.value })}
          />
        </Field>
        <Field label="Working day ends">
          <Input
            type="time"
            value={form.workingHoursEnd}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, workingHoursEnd: e.target.value })}
          />
        </Field>
        <Field label="First response SLA (minutes)">
          <Input
            type="number"
            min={1}
            max={1440}
            value={form.slaFirstResponseMinutes}
            disabled={disabled}
            onChange={(e) =>
              setForm({ ...form, slaFirstResponseMinutes: Number(e.target.value) || 1 })
            }
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        Enabled markets:{" "}
        {org.enabledMarkets.map((m) => MARKETS[m as MarketCode]?.name ?? m).join(", ")}. Offices
        pick their own country pack, so one organization can run Pakistan, UAE, UK and US desks side
        by side.
      </p>
      <Button type="submit" disabled={disabled}>
        Save organization
      </Button>
    </form>
  );
}

/* ---------------------------------------------------------------------- audit */

function AuditLog() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit"],
    queryFn: () => listAudit(),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading audit log…</p>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  if (!data?.length)
    return (
      <div className="panel p-8 text-center text-sm text-muted-foreground">
        <History className="mx-auto mb-2 size-6" />
        No audited changes yet. Create an office or change a role and it lands here.
      </div>
    );

  return (
    <div className="panel overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-xs">
                {new Date(entry.at).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm">{entry.actorName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{entry.action}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">{entry.entity}</TableCell>
              <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                {entry.before ? `${entry.before} → ` : ""}
                {entry.after}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{entry.ip}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* -------------------------------------------------------------------- dialogs */

type OfficeForm = {
  id: string;
  name: string;
  market: MarketCode;
  city: string;
  timezone: string;
  jurisdiction: string;
  active: boolean;
};

function OfficeDialog({
  initial,
  onClose,
  reload,
}: {
  initial: Partial<OfficeForm>;
  onClose: () => void;
  reload: () => void;
}) {
  const [form, setForm] = useState<OfficeForm>({
    id: initial.id ?? "",
    name: initial.name ?? "",
    market: initial.market ?? "US",
    city: initial.city ?? "",
    timezone: initial.timezone ?? "America/Chicago",
    jurisdiction: initial.jurisdiction ?? "",
    active: initial.active ?? true,
  });

  return (
    <FormDialog
      title={initial.id ? "Edit office" : "New office"}
      description="Offices carry their own country pack, so currency, area units and compliance follow the market."
      onClose={onClose}
      onSubmit={() =>
        run(
          () => saveOffice({ data: { ...form, id: form.id || undefined } }),
          "Office saved",
          reload,
          onClose,
        )
      }
    >
      <Field label="Office name">
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Market">
        <Select
          value={form.market}
          onValueChange={(v) =>
            setForm({
              ...form,
              market: v as MarketCode,
              jurisdiction: MARKETS[v as MarketCode].jurisdictions[0] ?? "",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MARKET_CODES.map((c) => (
              <SelectItem key={c} value={c}>
                {MARKETS[c].flag} {MARKETS[c].name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Jurisdiction">
        <Select
          value={form.jurisdiction || MARKETS[form.market].jurisdictions[0] || ""}
          onValueChange={(v) => setForm({ ...form, jurisdiction: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MARKETS[form.market].jurisdictions.map((j) => (
              <SelectItem key={j} value={j}>
                {j}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City">
          <Input
            required
            value={form.city}
            placeholder={MARKETS[form.market].cityPlaceholder}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>
        <Field label="Time zone">
          <Input
            required
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} />
        Active
      </label>
    </FormDialog>
  );
}

type TeamForm = {
  id: string;
  officeId: string;
  name: string;
  managerId: string | null;
  active: boolean;
};

function TeamDialog({
  session,
  initial,
  onClose,
  reload,
}: {
  session: Session;
  initial: Partial<TeamForm>;
  onClose: () => void;
  reload: () => void;
}) {
  const [form, setForm] = useState<TeamForm>({
    id: initial.id ?? "",
    officeId: initial.officeId ?? session.offices[0]?.id ?? "",
    name: initial.name ?? "",
    managerId: initial.managerId ?? null,
    active: initial.active ?? true,
  });

  const candidates = session.users.filter(
    (u) => u.officeId === form.officeId && ["manager", "admin", "owner", "pm"].includes(u.role),
  );

  return (
    <FormDialog
      title={initial.id ? "Edit team" : "New team"}
      description="Teams sit inside an office. The manager sees every record belonging to the team."
      onClose={onClose}
      onSubmit={() =>
        run(
          () => saveTeam({ data: { ...form, id: form.id || undefined } }),
          "Team saved",
          reload,
          onClose,
        )
      }
    >
      <Field label="Team name">
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Office">
        <Select value={form.officeId} onValueChange={(v) => setForm({ ...form, officeId: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {session.offices.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Manager">
        <Select
          value={form.managerId ?? "none"}
          onValueChange={(v) => setForm({ ...form, managerId: v === "none" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {candidates.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} · {ROLES[u.role].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} />
        Active
      </label>
    </FormDialog>
  );
}

type UserForm = Pick<
  OrgUser,
  "id" | "name" | "email" | "title" | "role" | "officeId" | "teamId" | "managerId" | "active"
>;

function UserDialog({
  session,
  initial,
  onClose,
  reload,
}: {
  session: Session;
  initial: Partial<UserForm>;
  onClose: () => void;
  reload: () => void;
}) {
  const [form, setForm] = useState<UserForm>({
    id: initial.id ?? "",
    name: initial.name ?? "",
    email: initial.email ?? "",
    title: initial.title ?? "",
    role: initial.role ?? "agent",
    officeId: initial.officeId ?? session.offices[0]?.id ?? "",
    teamId: initial.teamId ?? null,
    managerId: initial.managerId ?? null,
    active: initial.active ?? true,
  });

  const officeTeams = session.teams.filter((t) => t.officeId === form.officeId);
  const managers = session.users.filter((u) => u.id !== form.id && u.role !== "agent");

  return (
    <FormDialog
      title={initial.id ? `Edit ${initial.name}` : "Add person"}
      description="Role decides what they can do; office, team and reporting line decide what they can see."
      onClose={onClose}
      onSubmit={() =>
        run(
          () => saveUser({ data: { ...form, id: form.id || undefined } }),
          "Person saved",
          reload,
          onClose,
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Job title">
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Role">
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as RoleId })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_IDS.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLES[r].label} · sees {ROLES[r].scope}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Office">
          <Select
            value={form.officeId ?? "none"}
            onValueChange={(v) =>
              setForm({ ...form, officeId: v === "none" ? null : v, teamId: null })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No office</SelectItem>
              {session.offices.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Team">
          <Select
            value={form.teamId ?? "none"}
            onValueChange={(v) => setForm({ ...form, teamId: v === "none" ? null : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Office level</SelectItem>
              {officeTeams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Reports to">
        <Select
          value={form.managerId ?? "none"}
          onValueChange={(v) => setForm({ ...form, managerId: v === "none" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nobody</SelectItem>
            {managers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} · {ROLES[u.role].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} />
        Active
      </label>
    </FormDialog>
  );
}

/* --------------------------------------------------------------------- shared */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FormDialog({
  title,
  description,
  children,
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            await onSubmit();
            setBusy(false);
          }}
        >
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The single-use link an administrator delivers by hand.
 * ponytail: hand-delivery only until email is connected (PRD 79A) — then this
 * dialog disappears and the invitation is simply sent.
 */
function AccessLinkDialog({
  link,
  onClose,
}: {
  link: { name: string; email: string; url: string };
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Single-use link for {link.name}</DialogTitle>
          <DialogDescription>
            Valid for seven days, usable once. Send it to {link.email} yourself — EstateOS cannot
            email it until the messaging integrations are connected.
          </DialogDescription>
        </DialogHeader>
        <Input readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(link.url);
              toast.success("Link copied");
            }}
          >
            Copy link
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Server functions throw on a failed permission check — surface that, don't swallow it. */
async function run(
  fn: () => Promise<unknown>,
  success: string,
  reload: () => void,
  onDone?: () => void,
) {
  try {
    await fn();
    toast.success(success);
    reload();
    onDone?.();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Something went wrong");
  }
}
