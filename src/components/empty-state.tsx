import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The honest alternative to fixture data (PRD 7.6): say what this screen will
 * hold, and name the thing that fills it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  note,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; to: NonNullable<LinkProps["to"]> };
  note?: string;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h2 className="font-display text-lg">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Button asChild className="mt-1">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      ) : null}
      {note ? <p className="max-w-md text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
