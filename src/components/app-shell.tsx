import { Link, useRouter, useRouterState, type LinkProps } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  FileSignature,
  Gauge,
  Home,
  MessagesSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkle,
  Contact,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { MarketSwitcher } from "@/components/market-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, signOutEverywhere } from "@/lib/auth-api";
import { MODULE_READINESS, moduleStatusLabel, type ModuleKey } from "@/lib/module-readiness";
import { ROLES, type Permission } from "@/lib/rbac";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

/** `perm` lists the permissions that unlock the item — any one is enough (PRD 10). */
const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: Home, moduleKey: "dashboard" },
  {
    to: "/inbox",
    label: "Inbox",
    icon: MessagesSquare,
    perm: ["contacts.view"],
    moduleKey: "inbox",
  },
  {
    to: "/contacts",
    label: "Contacts",
    icon: Contact,
    perm: ["contacts.view"],
    moduleKey: "contacts",
  },
  { to: "/leads", label: "Leads", icon: Gauge, perm: ["leads.view"], moduleKey: "leads" },
  {
    to: "/properties",
    label: "Properties",
    icon: Building2,
    perm: ["properties.view"],
    moduleKey: "properties",
  },
  {
    to: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    perm: ["viewings.manage"],
    moduleKey: "calendar",
  },
  {
    to: "/offers",
    label: "Offers",
    icon: FileSignature,
    perm: ["offers.view"],
    moduleKey: "offers",
  },
  {
    to: "/reports",
    label: "Reports",
    icon: ChartNoAxesColumn,
    perm: ["reports.team", "reports.organization"],
    moduleKey: "reports",
  },
  {
    to: "/automation",
    label: "Automation",
    icon: Workflow,
    perm: ["automation.manage"],
    moduleKey: "automation",
  },
  { to: "/assistant", label: "AI Assistant", icon: Sparkle, moduleKey: "assistant" },
];

const secondary: NavItem[] = [
  {
    to: "/admin",
    label: "Administration",
    icon: ShieldCheck,
    perm: ["users.manage", "offices.manage", "org.manage"],
  },
  { to: "/notifications", label: "Notifications", icon: Bell, moduleKey: "notifications" },
  { to: "/settings", label: "Settings", icon: Settings },
];

type NavItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: typeof Home;
  perm?: Permission[];
  moduleKey?: ModuleKey;
};

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const { user, org, offices, permissions } = useSession();

  const isActive = (target: LinkProps["to"]) => {
    const to = String(target ?? "");
    return to === "/" ? pathname === "/" : pathname.startsWith(to);
  };
  const allowed = (item: NavItem) => !item.perm || item.perm.some((p) => permissions.includes(p));
  const primaryNav = nav.filter(allowed);
  const secondaryNav = secondary.filter(allowed);
  const office = offices.find((o) => o.id === user.officeId);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-lg">{org.name}</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/60">
              EstateOS · {office?.name ?? "Organization"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {primaryNav.map((item) => (
            // Keep planned/partial modules visible but explicitly marked.
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(item.to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">{item.label}</span>
                {item.moduleKey && MODULE_READINESS[item.moduleKey].status !== "ready" ? (
                  <span className="rounded-full border border-sidebar-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/80">
                    {moduleStatusLabel(MODULE_READINESS[item.moduleKey].status)}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
          <div className="my-3 h-px bg-sidebar-border" />
          {secondaryNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(item.to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="m-3 rounded-xl bg-sidebar-accent/70 p-4">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <Sparkle className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Plan</span>
          </div>
          <p className="mt-2 font-display text-lg capitalize text-sidebar-accent-foreground">
            {org.plan}
          </p>
          <p className="text-xs text-sidebar-foreground/70">
            {org.seatsUsed} of {org.seatLimit} seats used · first response SLA{" "}
            {org.slaFirstResponseMinutes} min
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 lg:px-8">
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-xl text-foreground lg:text-2xl">{title}</h1>
              {subtitle ? (
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <div className="hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground md:flex">
              <Search className="size-3.5" />
              Global search lands in the search module
            </div>
            {actions}
            <MarketSwitcher />
            <Link to="/notifications">
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-secondary">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden leading-tight xl:block">
                    <span className="block text-sm font-medium">{user.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {ROLES[user.role].label}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-sm font-medium">{user.name}</span>
                  <span className="block text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Account and settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOutEverywhere({});
                    await router.navigate({ to: "/login" });
                  }}
                >
                  Sign out everywhere
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut({});
                    await router.navigate({ to: "/login" });
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs",
                  isActive(item.to)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {item.label}
                  {item.moduleKey && MODULE_READINESS[item.moduleKey].status !== "ready"
                    ? ` · ${moduleStatusLabel(MODULE_READINESS[item.moduleKey].status)}`
                    : ""}
                </span>
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
