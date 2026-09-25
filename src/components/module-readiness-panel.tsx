import { Badge } from "@/components/ui/badge";
import { moduleStatusLabel, type ModuleReadiness } from "@/lib/module-readiness";

export function ModuleReadinessPanel({
  title,
  readiness,
}: {
  title: string;
  readiness: ModuleReadiness;
}) {
  return (
    <section className="panel space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg">{title}</h2>
        <Badge variant={readiness.status === "ready" ? "default" : "outline"}>
          {moduleStatusLabel(readiness.status)}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">What works now</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {readiness.whatWorksNow.length ? (
              readiness.whatWorksNow.map((line) => <li key={line}>• {line}</li>)
            ) : (
              <li className="text-muted-foreground">Nothing user-facing in production yet.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Next required setup
          </p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {readiness.nextRequired.length ? (
              readiness.nextRequired.map((line) => <li key={line}>• {line}</li>)
            ) : (
              <li className="text-muted-foreground">No blocking gaps listed for this module.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
