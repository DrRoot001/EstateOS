import { createFileRoute } from "@tanstack/react-router";
import { ChartNoAxesColumn } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";

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
      <EmptyState
        icon={ChartNoAxesColumn}
        title="Nothing to report yet"
        description="Revenue, source ROI, conversion funnel, response times and agent performance are computed from your own records — none of it is estimated or sampled."
        note="Reporting turns on as soon as leads, viewings and transactions carry real data."
      />
    </AppShell>
  );
}
