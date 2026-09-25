import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ModuleReadinessPanel } from "@/components/module-readiness-panel";
import { MODULE_READINESS } from "@/lib/module-readiness";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — EstateOS" },
      { name: "description", content: "Viewings and appointments synced with Google and Outlook." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AppShell title="Calendar" subtitle="Viewings and appointments">
      <div className="space-y-4">
        <ModuleReadinessPanel title="Calendar readiness" readiness={MODULE_READINESS.calendar} />
        <EmptyState
          icon={CalendarDays}
          title="No viewings scheduled"
          description="Viewings booked against a lead and a property appear here, synced both ways with the Google or Outlook calendar each agent connects."
          note="This module stays empty until viewing workflows and provider sync are implemented."
        />
      </div>
    </AppShell>
  );
}
