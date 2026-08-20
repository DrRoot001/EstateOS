import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";

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
      <EmptyState
        icon={CalendarDays}
        title="No viewings scheduled"
        description="Viewings booked against a lead and a property appear here, synced both ways with the Google or Outlook calendar each agent connects."
        note="Viewing management is PRD module 10; calendar sync is part of the integration work in Phase 4."
      />
    </AppShell>
  );
}
