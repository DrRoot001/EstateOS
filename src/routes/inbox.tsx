import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Mail, MessageSquare, Phone, Send, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  closeConversation,
  fetchConversation,
  fetchConversations,
  replyToConversation,
} from "@/lib/crm-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — EstateOS" },
      {
        name: "description",
        content:
          "Every enquiry from your website, email and WhatsApp in one thread per person — read and answered inside EstateOS.",
      },
    ],
  }),
  component: InboxPage,
});

const CHANNEL_ICON = {
  webform: Globe,
  email: Mail,
  whatsapp: MessageSquare,
  sms: Phone,
} as const;

function InboxPage() {
  const [status, setStatus] = useState("open");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["conversations", status],
    queryFn: () => fetchConversations({ data: { status } }),
    refetchInterval: 15_000,
  });

  const conversations = list.data ?? [];
  const selectedId = openId ?? conversations[0]?.id ?? null;

  return (
    <AppShell
      title="Inbox"
      subtitle="Website, email and WhatsApp enquiries, threaded by person"
      actions={
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {conversations.length === 0 && !list.isLoading ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Connect a website form, an inbox or WhatsApp and every enquiry lands here as a thread against the person who sent it — answered from EstateOS, not from Gmail."
          action={{ label: "Connect a channel", to: "/settings" }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
          <section className="panel divide-y divide-border overflow-hidden">
            {conversations.map((c) => {
              const Icon = CHANNEL_ICON[c.channel as keyof typeof CHANNEL_ICON] ?? MessageSquare;
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenId(c.id)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-secondary/60",
                    selectedId === c.id && "bg-secondary",
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", c.unread && "font-semibold")}>
                        {c.contact.name}
                      </span>
                      {c.leadStatus ? (
                        <Badge variant="secondary" className="shrink-0">
                          {c.leadStatus}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.subject}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(c.lastMessageAt).toLocaleString()}
                    </span>
                  </span>
                </button>
              );
            })}
          </section>

          {selectedId ? (
            <Thread conversationId={selectedId} onChanged={() => list.refetch()} />
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function Thread({ conversationId, onChanged }: { conversationId: string; onChanged: () => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const thread = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation({ data: { conversationId } }),
  });

  if (!thread.data) return <div className="panel p-6 text-sm text-muted-foreground">Loading…</div>;
  const { conversation, contact, messages } = thread.data;

  return (
    <section className="panel flex min-h-[60vh] flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="min-w-40 flex-1">
          <h2 className="font-display text-lg">{contact.name}</h2>
          <p className="text-xs text-muted-foreground">
            {[contact.email, contact.phone].filter(Boolean).join(" · ") || "no contact details"} ·{" "}
            {conversation.channel}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/contacts/$contactId" params={{ contactId: contact.id }}>
            Open contact
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await closeConversation({
              data: {
                conversationId,
                status: conversation.status === "closed" ? "open" : "closed",
              },
            });
            await thread.refetch();
            onChanged();
          }}
        >
          {conversation.status === "closed" ? "Reopen" : "Close"}
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-xl p-3 text-sm",
              m.direction === "inbound"
                ? "bg-secondary"
                : "ml-auto bg-primary text-primary-foreground",
            )}
          >
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p
              className={cn(
                "mt-1.5 text-[11px]",
                m.direction === "inbound" ? "text-muted-foreground" : "text-primary-foreground/70",
              )}
            >
              {m.authorName || "—"} · {new Date(m.at).toLocaleString()}
              {m.direction === "outbound" ? ` · ${m.deliveryStatus}` : ""}
            </p>
            {m.deliveryError ? (
              <p className="mt-1 text-[11px] text-amber-200">{m.deliveryError}</p>
            ) : null}
          </div>
        ))}
      </div>

      <form
        className="space-y-2 border-t border-border p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const result = await replyToConversation({ data: { conversationId, body } });
            setBody("");
            await thread.refetch();
            onChanged();
            toast.success(
              result.error ? "Reply saved to the thread" : "Reply queued for delivery",
              result.error ? { description: result.error } : undefined,
            );
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not send");
          } finally {
            setBusy(false);
          }
        }}
      >
        {contact.optedOut ? (
          <p className="text-sm text-destructive">
            This person has opted out. EstateOS will not send them anything.
          </p>
        ) : null}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Reply on ${conversation.channel}…`}
          rows={3}
          required
          disabled={contact.optedOut}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || contact.optedOut}>
            <Send className="size-4" /> {busy ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </section>
  );
}
