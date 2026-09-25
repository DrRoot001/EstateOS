import { createFileRoute } from "@tanstack/react-router";
import { FileSignature } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ModuleReadinessPanel } from "@/components/module-readiness-panel";
import { MODULE_READINESS } from "@/lib/module-readiness";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers — EstateOS" },
      { name: "description", content: "Offer workspace with counteroffer history and approvals." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  return (
    <AppShell title="Offers" subtitle="Offer workspace">
      <div className="space-y-4">
        <ModuleReadinessPanel title="Offers readiness" readiness={MODULE_READINESS.offers} />
        <EmptyState
          icon={FileSignature}
          title="No offers yet"
          description="Submitted offers, counteroffers and their approval trail live here, and an accepted offer opens a transaction."
          note="This module stays empty until offer and approval workflows are implemented."
        />
      </div>
    </AppShell>
  );
}
