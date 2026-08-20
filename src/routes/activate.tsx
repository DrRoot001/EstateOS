import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inspectAuthToken, setPasswordWithToken } from "@/lib/auth-api";

/** Activation and password reset share one page: both end in "set a password". */
export const Route = createFileRoute("/activate")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps }) => {
    if (!deps.token) return { valid: false as const };
    return inspectAuthToken({ data: { token: deps.token } });
  },
  head: () => ({
    meta: [{ title: "Set your password — EstateOS" }, { name: "robots", content: "noindex" }],
  }),
  component: ActivatePage,
});

function ActivatePage() {
  const info = Route.useLoaderData();
  const { token } = Route.useSearch();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <p className="font-display text-xl">EstateOS</p>
        </div>

        {!info.valid ? (
          <div className="panel space-y-3 p-6">
            <h1 className="font-display text-lg">This link is not valid</h1>
            <p className="text-sm text-muted-foreground">
              Activation and reset links are single use and expire after seven days. Ask your
              organization administrator to issue a new one.
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form
            className="panel space-y-4 p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              if (password !== confirm) {
                setError("Both passwords must match");
                return;
              }
              setBusy(true);
              setError(null);
              try {
                const result = await setPasswordWithToken({ data: { token, password } });
                await router.invalidate();
                // Platform staff land in the console, members in their workspace.
                await router.navigate({
                  to: result.audience === "platform" ? "/platform" : "/",
                });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not set your password");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div>
              <h1 className="font-display text-lg">
                {info.kind === "activation" ? "Activate your account" : "Choose a new password"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {info.name} · {info.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least 12 characters, including a letter and a number.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Set password and sign in"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
