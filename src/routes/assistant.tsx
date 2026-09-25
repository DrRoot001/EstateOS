import { createFileRoute } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ModuleReadinessPanel } from "@/components/module-readiness-panel";
import { MODULE_READINESS } from "@/lib/module-readiness";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — EstateOS" },
      { name: "description", content: "Ask about your pipeline, properties and transactions." },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <AppShell title="AI Assistant" subtitle="Copilot">
      <div className="space-y-4">
        <ModuleReadinessPanel title="AI readiness" readiness={MODULE_READINESS.assistant} />
        <EmptyState
          icon={Sparkle}
          title="AI is not configured"
          description="The copilot answers questions about your own records, drafts replies, summarises conversations and explains why a lead was routed the way it was."
          note="Set ANTHROPIC_API_KEY and AI_ENABLED only after runtime model integration and permission boundaries are in place."
        />
      </div>
    </AppShell>
  );
}
