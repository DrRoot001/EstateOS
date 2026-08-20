import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon: LucideIcon;
  hint?: string;
  className?: string;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className={cn("panel p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className="grid size-8 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl leading-none text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta ? (
          <span className={positive ? "font-medium text-success" : "font-medium text-destructive"}>
            {delta}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
