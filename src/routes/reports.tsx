import { createFileRoute } from "@tanstack/react-router";
import { ChartNoAxesColumn } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ModuleReadinessPanel } from "@/components/module-readiness-panel";
import { MODULE_READINESS } from "@/lib/module-readiness";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — EstateOS" },
      {
        name: "description",
        content: "Revenue, source ROI, funnel and agent performance analytics.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Analytics">
      <div className="space-y-4">
        <ModuleReadinessPanel title="Reporting readiness" readiness={MODULE_READINESS.reports} />
        <EmptyState
          icon={ChartNoAxesColumn}
          title="Nothing to report yet"
          description="Revenue, source ROI, conversion funnel, response times and agent performance are computed from your own records — none of it is estimated or sampled."
          note="Reporting turns on as soon as the reporting engine and completed workflow data are available."
        />
      </div>
    </AppShell>
  );
}
