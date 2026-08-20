import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchContact } from "@/lib/crm-api";

export const Route = createFileRoute("/contacts/$contactId")({
  loader: ({ params }) => fetchContact({ data: { contactId: params.contactId } }),
  head: () => ({ meta: [{ title: "Contact — EstateOS" }] }),
  component: ContactDetail,
});

function ContactDetail() {
  const { contact, leads, conversations } = Route.useLoaderData();

  return (
    <AppShell
      title={contact.name}
      subtitle={[contact.email, contact.phone].filter(Boolean).join(" · ") || "No contact details"}
      actions={
        <Button variant="outline" asChild>
          <Link to="/contacts">
            <ArrowLeft className="size-4" /> All contacts
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel space-y-2 p-5">
          <h2 className="font-display text-lg">Details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Type" value={contact.type} />
            <Row label="Preferred channel" value={contact.preferredChannel} />
            <Row label="City" value={contact.city || "—"} />
            <Row label="Region" value={contact.region || "—"} />
            <Row label="Added" value={new Date(contact.createdAt).toLocaleDateString()} />
          </dl>
          <div className="pt-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Consent</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {contact.optedOutAt ? (
                <Badge variant="outline">Opted out</Badge>
              ) : (
                <>
                  {contact.consentEmail ? <Badge variant="secondary">Email</Badge> : null}
                  {contact.consentWhatsapp ? <Badge variant="secondary">WhatsApp</Badge> : null}
                  {contact.consentSms ? <Badge variant="secondary">SMS</Badge> : null}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="font-display text-lg">Leads</h2>
          <ul className="mt-3 divide-y divide-border">
            {leads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-32 flex-1">
                  <span className="block font-medium capitalize">{lead.type}</span>
                  <span className="block text-xs text-muted-foreground">
                    {lead.source} · {new Date(lead.createdAt).toLocaleDateString()}
                  </span>
                </span>
                <Badge variant="secondary">{lead.status}</Badge>
              </li>
            ))}
            {leads.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No leads yet.</li>
            ) : null}
          </ul>

          <h2 className="mt-6 font-display text-lg">Conversations</h2>
          <ul className="mt-3 divide-y divide-border">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-32 flex-1">
                  <span className="block font-medium">{conversation.subject}</span>
                  <span className="block text-xs text-muted-foreground">
                    {conversation.channel} · {new Date(conversation.lastMessageAt).toLocaleString()}
                  </span>
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/inbox">Open in inbox</Link>
                </Button>
              </li>
            ))}
            {conversations.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No conversations yet.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}
