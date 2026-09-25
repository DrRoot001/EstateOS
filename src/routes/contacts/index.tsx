import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Contact as ContactIcon, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchContacts, saveContact } from "@/lib/crm-api";
import { useCan } from "@/lib/session";

export const Route = createFileRoute("/contacts/")({
  head: () => ({
    meta: [
      { title: "Contacts — EstateOS" },
      {
        name: "description",
        content: "One canonical record per person, however many leads they generate.",
      },
    ],
  }),
  component: ContactsPage,
});

const TYPES = ["buyer", "seller", "tenant", "landlord", "investor", "vendor", "other"];

function ContactsPage() {
  const can = useCan();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const contacts = useQuery({
    queryKey: ["contacts", query],
    queryFn: () => fetchContacts({ data: { query } }),
  });

  const rows = contacts.data ?? [];

  return (
    <AppShell
      title="Contacts"
      subtitle="One person, one record — leads, conversations and viewings hang off it"
      actions={
        can("contacts.edit") ? (
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add contact
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or phone"
          className="max-w-sm"
          aria-label="Search contacts"
        />

        {rows.length === 0 && !contacts.isLoading ? (
          <EmptyState
            icon={ContactIcon}
            title="No contacts yet"
            description="Contacts appear automatically the moment someone submits your website form or messages you, and you can add one by hand at any time."
            action={{ label: "Open integrations setup", to: "/settings" }}
          />
        ) : (
          <div className="panel overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to="/contacts/$contactId"
                        params={{ contactId: c.id }}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.city || "—"}</p>
                    </TableCell>
                    <TableCell className="capitalize">{c.type}</TableCell>
                    <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                    <TableCell>
                      {c.optedOutAt ? (
                        <Badge variant="outline">Opted out</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {[
                            c.consentEmail && "email",
                            c.consentWhatsapp && "whatsapp",
                            c.consentSms && "sms",
                          ]
                            .filter(Boolean)
                            .join(", ") || "none"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {adding ? (
        <AddContact
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            void contacts.refetch();
          }}
        />
      ) : null}
    </AppShell>
  );
}

function AddContact({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "buyer",
    city: "",
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>
            If this person already exists under the same email or phone, EstateOS keeps the one
            record rather than creating a duplicate.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await saveContact({
                data: {
                  name: form.name,
                  email: form.email || null,
                  phone: form.phone || null,
                  type: form.type,
                  city: form.city,
                },
              });
              toast.success("Contact saved");
              onSaved();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save");
            }
          }}
        >
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save contact</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
