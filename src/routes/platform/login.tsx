import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { platformSignIn } from "@/lib/platform-api";

export const Route = createFileRoute("/platform/login")({
  head: () => ({
    meta: [{ title: "Platform Console — EstateOS" }, { name: "robots", content: "noindex" }],
  }),
  component: PlatformLogin,
});

function PlatformLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4 text-sidebar-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-xl">EstateOS</p>
            <p className="text-xs text-sidebar-foreground/70">Platform Console</p>
          </div>
        </div>

        <form
          className="space-y-4 rounded-xl bg-background p-6 text-foreground shadow-lg"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await platformSignIn({ data: { email, password } });
              await router.invalidate();
              await router.navigate({ to: "/platform" });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not sign in");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Platform staff email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-xs text-muted-foreground">
            This console manages customer organizations. It holds no customer records: reading a
            tenant's data requires a consented support session, which EstateOS does not grant yet.
          </p>
        </form>
      </div>
    </main>
  );
}
