import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/automation")({
  head: () => ({
    meta: [
      { title: "Automation — EstateOS" },
      {
        name: "description",
        content: "Trigger, condition and action automation for your brokerage.",
      },
    ],
  }),
  component: AutomationPage,
});

function AutomationPage() {
  return (
    <AppShell title="Automation" subtitle="Rules engine">
      <EmptyState
        icon={Workflow}
        title="No automations yet"
        description="Automations react to events — a lead arrives, an SLA is breached, a viewing completes — and run conditions and actions you define, with a version history per rule."
        note="The automation engine is PRD module 17. It needs the event stream from Phase 4 and 5 before a rule can fire."
      />
    </AppShell>
  );
}
