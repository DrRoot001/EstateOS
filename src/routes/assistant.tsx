import { createFileRoute } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";

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
      <EmptyState
        icon={Sparkle}
        title="AI is not configured"
        description="The copilot answers questions about your own records, drafts replies, summarises conversations and explains why a lead was routed the way it was."
        note="Set ANTHROPIC_API_KEY and AI_ENABLED in the environment to switch it on (PRD 61A). Until then EstateOS will not invent an answer."
      />
    </AppShell>
  );
}
