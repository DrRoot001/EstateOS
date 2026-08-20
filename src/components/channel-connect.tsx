import { useQuery } from "@tanstack/react-query";
import { Globe, Mail, MessageSquare, Phone, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { connectWebFormChannel, fetchChannels, removeChannel } from "@/lib/crm-api";
import { useCan } from "@/lib/session";

/**
 * The organization's channel connections (PRD 79A).
 * Website forms connect in one click here; email and WhatsApp need the platform
 * operator's app registrations first, and say so instead of pretending.
 */
export function ChannelConnect() {
  const can = useCan();
  const channels = useQuery({ queryKey: ["channels"], queryFn: () => fetchChannels() });
  const [connecting, setConnecting] = useState(false);
  const [snippetFor, setSnippetFor] = useState<{ label: string; publicKey: string } | null>(null);

  const rows = channels.data ?? [];
  const manage = can("integrations.manage");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ChannelCard
          icon={Globe}
          title="Website forms"
          state="Available now"
          tone="ready"
          description="Your contact form posts straight into EstateOS. No Google or Meta account needed — copy one snippet into your site and enquiries appear in the inbox as threads."
          action={
            manage ? (
              <Button size="sm" onClick={() => setConnecting(true)}>
                <Plus className="size-4" /> Create a form endpoint
              </Button>
            ) : null
          }
        />
        <ChannelCard
          icon={Mail}
          title="Email — Gmail or Microsoft 365"
          state="Not built yet"
          tone="blocked"
          description="Sign in with Google or Microsoft and pick the mailbox to share. Mail then arrives in the EstateOS inbox and your replies are sent from that same address."
          note="Not built yet. It needs two things: EstateOS registering its OAuth app with Google and Microsoft (keys in GOOGLE_OAUTH_CLIENT_ID / MICROSOFT_OAUTH_CLIENT_ID), then the sign-in, mailbox sync and send path on top."
        />
        <ChannelCard
          icon={MessageSquare}
          title="WhatsApp Business"
          state="Not built yet"
          tone="blocked"
          description="Meta's embedded signup: your admin picks the WhatsApp Business number, approves EstateOS, and messages start threading here — no phone left on someone's desk."
          note="Not built yet. It needs Meta Business verification and META_APP_ID / META_APP_SECRET, then embedded signup, the inbound webhook and the 24-hour session-window rules. The message and consent model underneath is ready."
        />
        <ChannelCard
          icon={Phone}
          title="SMS and voice — Twilio"
          state="Not built yet"
          tone="blocked"
          description="Bring your own Twilio account or use ours; numbers map to offices so each desk keeps its local line."
          note="Not built yet. Needs a Twilio account (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN), then the inbound webhook and send path."
        />
      </div>

      <div className="panel divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-display text-lg">Connected channels</h3>
          <Badge variant="secondary">{rows.length}</Badge>
        </div>
        {rows.map((channel) => (
          <div key={channel.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-40 flex-1">
              <p className="font-medium">{channel.label}</p>
              <p className="text-xs text-muted-foreground">
                {channel.kind} ·{" "}
                {channel.lastEventAt
                  ? `last message ${new Date(channel.lastEventAt).toLocaleString()}`
                  : "no messages yet"}
              </p>
            </div>
            <Badge variant={channel.status === "connected" ? "default" : "outline"}>
              {channel.status}
            </Badge>
            {channel.kind === "webform" && channel.publicKey ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSnippetFor({ label: channel.label, publicKey: channel.publicKey! })
                }
              >
                Show snippet
              </Button>
            ) : null}
            {manage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await removeChannel({ data: { channelId: channel.id } });
                  toast.success("Channel disconnected");
                  void channels.refetch();
                }}
              >
                Disconnect
              </Button>
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nothing connected yet. A website form takes about a minute.
          </p>
        ) : null}
      </div>

      {connecting ? (
        <ConnectWebForm
          onClose={() => setConnecting(false)}
          onConnected={(created) => {
            setConnecting(false);
            setSnippetFor(created);
            void channels.refetch();
          }}
        />
      ) : null}
      {snippetFor ? (
        <SnippetDialog channel={snippetFor} onClose={() => setSnippetFor(null)} />
      ) : null}
    </div>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  description,
  state,
  tone,
  note,
  action,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
  state: string;
  tone: "ready" | "blocked";
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel space-y-2 p-5">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="font-display text-lg">{title}</h3>
        <Badge variant={tone === "ready" ? "default" : "outline"} className="ml-auto">
          {state}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      {action}
    </div>
  );
}

function ConnectWebForm({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (created: { label: string; publicKey: string }) => void;
}) {
  const [label, setLabel] = useState("");

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a form endpoint</DialogTitle>
          <DialogDescription>
            EstateOS gives you a URL and a key. Point your existing contact form at it, or paste the
            snippet we generate — every submission becomes a contact, a lead and an inbox thread.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const created = await connectWebFormChannel({ data: { label } });
              toast.success("Form endpoint created");
              onConnected({ label: created.label, publicKey: created.publicKey });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not create endpoint");
            }
          }}
        >
          <div className="space-y-1.5">
            <Label>Where will it live?</Label>
            <Input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="acme-realty.com contact page"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create endpoint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SnippetDialog({
  channel,
  onClose,
}: {
  channel: { label: string; publicKey: string };
  onClose: () => void;
}) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const endpoint = `${origin}/api/forms/${channel.publicKey}`;

  const html = `<form action="${endpoint}" method="POST">
  <input name="name" placeholder="Your name" required />
  <input name="email" type="email" placeholder="Email" />
  <input name="phone" placeholder="Phone" />
  <textarea name="message" placeholder="How can we help?"></textarea>
  <button type="submit">Send</button>
</form>`;

  const fetchSnippet = `fetch("${endpoint}", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name, email, phone, message }),
});`;

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{channel.label}</DialogTitle>
          <DialogDescription>
            Either paste this form into your site, or post JSON from the form you already have. An
            email address or a phone number is required; anything else you send is kept on the
            message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Endpoint</Label>
            <Input readOnly value={endpoint} onFocus={(e) => e.currentTarget.select()} />
          </div>
          <div className="space-y-1.5">
            <Label>Plain HTML form</Label>
            <Textarea readOnly rows={8} value={html} className="font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label>Or post from your own JavaScript</Label>
            <Textarea readOnly rows={6} value={fetchSnippet} className="font-mono text-xs" />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(html);
              toast.success("Snippet copied");
            }}
          >
            Copy snippet
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
