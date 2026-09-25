import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ModuleReadinessPanel } from "@/components/module-readiness-panel";
import { MODULE_READINESS } from "@/lib/module-readiness";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — EstateOS" },
      { name: "description", content: "Everything that needs your attention, by severity." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <AppShell title="Notifications" subtitle="What needs attention">
      <div className="space-y-4">
        <ModuleReadinessPanel
          title="Notifications readiness"
          readiness={MODULE_READINESS.notifications}
        />
        <EmptyState
          icon={Bell}
          title="You are all caught up"
          description="Assignments, SLA breaches, offer responses, transaction deadlines and maintenance emergencies appear here, and can also be delivered by email, push, SMS or WhatsApp."
          note="This module stays empty until notification generation and delivery channels are implemented."
        />
      </div>
    </AppShell>
  );
}
