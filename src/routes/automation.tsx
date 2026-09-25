import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ModuleReadinessPanel } from "@/components/module-readiness-panel";
import { MODULE_READINESS } from "@/lib/module-readiness";

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
      <div className="space-y-4">
        <ModuleReadinessPanel title="Automation readiness" readiness={MODULE_READINESS.automation} />
        <EmptyState
          icon={Workflow}
          title="No automations yet"
          description="Automations react to events — a lead arrives, an SLA is breached, a viewing completes — and run conditions and actions you define, with a version history per rule."
          note="This module stays empty until event streaming and rule execution are implemented."
        />
      </div>
    </AppShell>
  );
}
