import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Building2, Download, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
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
import {
  exportOrg,
  getPlatformSession,
  inviteStaff,
  platformSignOut,
  provisionOrg,
  reissueOwnerLink,
  setOrgStatus,
  updateOrgEntitlements,
} from "@/lib/platform-api";
import { PLATFORM_ROLE_IDS, PLATFORM_ROLE_LABELS, type PlatformRole } from "@/lib/platform-roles";

export const Route = createFileRoute("/platform/")({
  loader: async () => {
    const session = await getPlatformSession();
    if (!session) throw redirect({ to: "/platform/login" });
    return session;
  },
  head: () => ({
    meta: [{ title: "Platform Console — EstateOS" }, { name: "robots", content: "noindex" }],
  }),
  component: PlatformConsole,
});

type Session = Awaited<ReturnType<typeof getPlatformSession>>;
type Org = NonNullable<Session>["organizations"][number];

function PlatformConsole() {
  const session = Route.useLoaderData();
  const router = useRouter();
  const reload = () => router.invalidate();
  const [provisioning, setProvisioning] = useState(false);
  const [link, setLink] = useState<{ name: string; email: string; url: string } | null>(null);

  const orgs = session.organizations;
  const seatsUsed = orgs.reduce((sum, o) => sum + o.seatsUsed, 0);
  const seatsSold = orgs.reduce((sum, o) => sum + o.seatLimit, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4">
          <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-40 flex-1 leading-tight">
            <p className="font-display text-lg">EstateOS Platform Console</p>
            <p className="text-xs text-sidebar-foreground/70">
              {session.user.name} · {PLATFORM_ROLE_LABELS[session.user.role]}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await platformSignOut({});
              await router.navigate({ to: "/platform/login" });
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Organizations" value={String(orgs.length)} icon={Building2} />
          <StatCard
            label="Active"
            value={String(orgs.filter((o) => o.status === "active").length)}
            icon={Building2}
            hint={`${orgs.filter((o) => o.status === "suspended").length} suspended`}
          />
          <StatCard
            label="Seats in use"
            value={String(seatsUsed)}
            icon={UsersRound}
            hint={`${seatsSold} sold`}
          />
          <StatCard
            label="Owners not activated"
            value={String(orgs.filter((o) => o.owner && !o.owner.activated).length)}
            icon={UsersRound}
            hint="invitation outstanding"
          />
        </section>

        <Tabs defaultValue="organizations" className="space-y-5">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="staff">Platform staff</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            {session.can.provision ? (
              <Button onClick={() => setProvisioning(true)}>
                <Plus className="size-4" /> New organization
              </Button>
            ) : null}

            <div className="panel overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((org) => (
                    <OrgRow
                      key={org.id}
                      org={org}
                      can={session.can}
                      reload={reload}
                      onLink={setLink}
                    />
                  ))}
                  {orgs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No customer organizations yet. Provision one to get started.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              This console shows counts and health only. Customer records — contacts, leads,
              conversations, documents — are never readable from here (PRD 8B.3). Consented support
              sessions (PLAT 005) are not built yet.
            </p>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <PlatformStaff session={session} reload={reload} onLink={setLink} />
          </TabsContent>
        </Tabs>
      </main>

      {provisioning ? (
        <ProvisionDialog onClose={() => setProvisioning(false)} reload={reload} onLink={setLink} />
      ) : null}
      {link ? <LinkDialog link={link} onClose={() => setLink(null)} /> : null}
    </div>
  );
}

type LinkSetter = (link: { name: string; email: string; url: string }) => void;

function OrgRow({
  org,
  can,
  reload,
  onLink,
}: {
  org: Org;
  can: NonNullable<Session>["can"];
  reload: () => void;
  onLink: LinkSetter;
}) {
  const [editing, setEditing] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const pack = MARKETS[org.primaryMarket as MarketCode];

  return (
    <>
      <TableRow>
        <TableCell>
          <p className="font-medium">{org.name}</p>
          <p className="text-xs text-muted-foreground">
            {org.jurisdiction || "—"} · since {new Date(org.createdAt).toLocaleDateString()}
          </p>
        </TableCell>
        <TableCell className="whitespace-nowrap text-sm">
          {pack?.flag} {org.primaryMarket} · {org.reportingCurrency}
        </TableCell>
        <TableCell className="text-sm capitalize">{org.plan}</TableCell>
        <TableCell className="text-sm">
          {org.seatsUsed}/{org.seatLimit} seats
          <p className="text-xs text-muted-foreground">
            {org.offices} offices · {org.teams} teams
          </p>
        </TableCell>
        <TableCell className="text-sm">
          {org.owner ? (
            <>
              {org.owner.name}
              <p className="text-xs text-muted-foreground">
                {org.owner.activated ? org.owner.email : "invitation pending"}
              </p>
            </>
          ) : (
            <span className="text-muted-foreground">none</span>
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant={
              org.status === "active"
                ? "default"
                : org.status === "suspended"
                  ? "secondary"
                  : "outline"
            }
          >
            {org.status}
          </Badge>
          <p className="mt-1 text-xs text-muted-foreground">
            {org.lastActivityAt
              ? `active ${new Date(org.lastActivityAt).toLocaleDateString()}`
              : "no activity"}
          </p>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-wrap justify-end gap-1">
            {can.update ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  Plan
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const issued = await reissueOwnerLink({ data: { organizationId: org.id } });
                      onLink({
                        name: issued.name,
                        email: issued.email,
                        url: `${window.location.origin}${issued.path}`,
                      });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not issue link");
                    }
                  }}
                >
                  Owner link
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const data = await exportOrg({ data: { organizationId: org.id } });
                      download(`${org.name.replace(/\W+/g, "-").toLowerCase()}-export.json`, data);
                      toast.success("Export downloaded");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not export");
                    }
                  }}
                >
                  <Download className="size-3.5" /> Export
                </Button>
              </>
            ) : null}
            {can.lifecycle && org.status !== "terminated" ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    run(
                      () =>
                        setOrgStatus({
                          data: {
                            organizationId: org.id,
                            status: org.status === "active" ? "suspended" : "active",
                          },
                        }),
                      org.status === "active" ? "Organization suspended" : "Organization resumed",
                      reload,
                    )
                  }
                >
                  {org.status === "active" ? "Suspend" : "Resume"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setTerminating(true)}>
                  Terminate
                </Button>
              </>
            ) : null}
          </div>
        </TableCell>
      </TableRow>

      {editing ? (
        <EntitlementsDialog org={org} onClose={() => setEditing(false)} reload={reload} />
      ) : null}
      {terminating ? (
        <TerminateDialog org={org} onClose={() => setTerminating(false)} reload={reload} />
      ) : null}
    </>
  );
}

function ProvisionDialog({
  onClose,
  reload,
  onLink,
}: {
  onClose: () => void;
  reload: () => void;
  onLink: LinkSetter;
}) {
  const [form, setForm] = useState({
    name: "",
    primaryMarket: "US" as MarketCode,
    jurisdiction: MARKETS.US.jurisdictions[0] ?? "",
    timezone: "UTC",
    plan: "trial",
    seatLimit: 10,
    licence: "",
    dataResidency: "",
    ownerName: "",
    ownerEmail: "",
  });
  const [busy, setBusy] = useState(false);
  const pack = MARKETS[form.primaryMarket];

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New customer organization</DialogTitle>
          <DialogDescription>
            The market you pick binds the country pack: currency, area units, address shape,
            compliance regime and transaction templates. The owner receives a single-use activation
            link and sets their own password.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const result = await provisionOrg({ data: form });
              onLink({
                name: form.ownerName,
                email: form.ownerEmail,
                url: `${window.location.origin}${result.activationPath}`,
              });
              toast.success(`${result.organization.name} provisioned`);
              reload();
              onClose();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not provision");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Company name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Realty"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country">
              <Select
                value={form.primaryMarket}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    primaryMarket: v as MarketCode,
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
                value={form.jurisdiction}
                onValueChange={(v) => setForm({ ...form, jurisdiction: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pack.jurisdictions.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Time zone">
              <Input
                required
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                placeholder="Asia/Karachi"
              />
            </Field>
            <Field label={`Licence (${pack.name})`}>
              <Input
                value={form.licence}
                onChange={(e) => setForm({ ...form, licence: e.target.value })}
              />
            </Field>
            <Field label="Plan">
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["trial", "starter", "growth", "enterprise"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Seat limit">
              <Input
                type="number"
                min={1}
                required
                value={form.seatLimit}
                onChange={(e) => setForm({ ...form, seatLimit: Number(e.target.value) || 1 })}
              />
            </Field>
          </div>

          <Field label="Data residency">
            <Input
              value={form.dataResidency}
              onChange={(e) => setForm({ ...form, dataResidency: e.target.value })}
              placeholder="eu-west, me-central, us-east"
            />
          </Field>

          <div className="rounded-lg bg-secondary/60 p-3">
            <p className="text-sm font-medium">Organization Owner</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Their first administrator. They create everyone else inside the company.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                />
              </Field>
              <Field label="Work email">
                <Input
                  required
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Provisioning…" : "Provision organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EntitlementsDialog({
  org,
  onClose,
  reload,
}: {
  org: Org;
  onClose: () => void;
  reload: () => void;
}) {
  const [form, setForm] = useState({
    plan: org.plan,
    seatLimit: org.seatLimit,
    licence: org.licence,
    dataResidency: "",
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{org.name} — plan and seats</DialogTitle>
          <DialogDescription>
            The organization cannot exceed its seat limit; attempts return an upgrade message rather
            than failing silently.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await run(
              () => updateOrgEntitlements({ data: { organizationId: org.id, ...form } }),
              "Plan updated",
              reload,
              onClose,
            );
          }}
        >
          <Field label="Plan">
            <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["trial", "starter", "growth", "enterprise"].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={`Seat limit (${org.seatsUsed} in use)`}>
            <Input
              type="number"
              min={1}
              value={form.seatLimit}
              onChange={(e) => setForm({ ...form, seatLimit: Number(e.target.value) || 1 })}
            />
          </Field>
          <Field label="Licence / registration">
            <Input
              value={form.licence}
              onChange={(e) => setForm({ ...form, licence: e.target.value })}
            />
          </Field>
          <Field label="Data residency">
            <Input
              value={form.dataResidency}
              onChange={(e) => setForm({ ...form, dataResidency: e.target.value })}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TerminateDialog({
  org,
  onClose,
  reload,
}: {
  org: Org;
  onClose: () => void;
  reload: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terminate {org.name}</DialogTitle>
          <DialogDescription>
            Every member is signed out and cannot sign back in. Data is retained for the contractual
            window, so export first. Type the organization name to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={async () => {
              const data = await exportOrg({ data: { organizationId: org.id } });
              download(`${org.name.replace(/\W+/g, "-").toLowerCase()}-export.json`, data);
            }}
          >
            <Download className="size-4" /> Download export first
          </Button>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={org.name}
            aria-label="Organization name"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={confirmation !== org.name}
            onClick={() =>
              run(
                () =>
                  setOrgStatus({
                    data: { organizationId: org.id, status: "terminated", confirmation },
                  }),
                "Organization terminated",
                reload,
                onClose,
              )
            }
          >
            Terminate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlatformStaff({
  session,
  reload,
  onLink,
}: {
  session: NonNullable<Session>;
  reload: () => void;
  onLink: LinkSetter;
}) {
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "admin" as PlatformRole });

  return (
    <>
      {session.can.staff ? (
        <Button onClick={() => setInviting(true)}>
          <Plus className="size-4" /> Invite platform staff
        </Button>
      ) : null}

      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sign in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {session.team.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {PLATFORM_ROLE_LABELS[member.role as PlatformRole] ?? member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={member.active ? "default" : "outline"}>
                    {member.activated ? "Active" : "Invitation pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Platform Support is read-only by design: it can see organization health but cannot
        provision, change plans or run lifecycle actions.
      </p>

      {inviting ? (
        <Dialog open onOpenChange={(open) => (open ? null : setInviting(false))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite platform staff</DialogTitle>
              <DialogDescription>
                Platform accounts are separate from every customer organization and can never be
                created from inside one.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const issued = await inviteStaff({ data: form });
                  onLink({
                    name: issued.name,
                    email: issued.email,
                    url: `${window.location.origin}${issued.path}`,
                  });
                  setForm({ name: "", email: "", role: "admin" });
                  setInviting(false);
                  reload();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not invite");
                }
              }}
            >
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
              <Field label="Role">
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as PlatformRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_ROLE_IDS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {PLATFORM_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviting(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send invitation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function LinkDialog({
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
          <DialogTitle>Activation link for {link.name}</DialogTitle>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function download(filename: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function run(
  fn: () => Promise<unknown>,
  success: string,
  reload: () => void,
  done?: () => void,
) {
  try {
    await fn();
    toast.success(success);
    reload();
    done?.();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Something went wrong");
  }
}
