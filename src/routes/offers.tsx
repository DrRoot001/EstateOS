import { createFileRoute } from "@tanstack/react-router";
import { FileSignature } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";

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
      <EmptyState
        icon={FileSignature}
        title="No offers yet"
        description="Submitted offers, counteroffers and their approval trail live here, and an accepted offer opens a transaction."
        note="The offer workspace is PRD module 11, scheduled after the pipeline lands."
      />
    </AppShell>
  );
}
