import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  // Lead statuses
  New: "bg-info/12 text-info border-info/25",
  Contacted: "bg-muted text-muted-foreground border-border",
  Qualified: "bg-primary/12 text-primary border-primary/25",
  "Viewing Scheduled": "bg-accent/15 text-accent border-accent/30",
  "Offer Sent": "bg-warning/18 text-warning-foreground border-warning/40",
  Negotiation: "bg-warning/18 text-warning-foreground border-warning/40",
  "Closed Won": "bg-success/15 text-success border-success/30",
  "Closed Lost": "bg-destructive/10 text-destructive border-destructive/25",
  // Property statuses
  Available: "bg-success/15 text-success border-success/30",
  Reserved: "bg-warning/18 text-warning-foreground border-warning/40",
  "Under Contract": "bg-accent/15 text-accent border-accent/30",
  Sold: "bg-muted text-muted-foreground border-border",
  // Offers / viewings
  Draft: "bg-muted text-muted-foreground border-border",
  Sent: "bg-info/12 text-info border-info/25",
  Reviewing: "bg-primary/12 text-primary border-primary/25",
  Negotiating: "bg-warning/18 text-warning-foreground border-warning/40",
  Accepted: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/25",
  Confirmed: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/18 text-warning-foreground border-warning/40",
  Completed: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/25",
  High: "bg-destructive/10 text-destructive border-destructive/25",
  Medium: "bg-warning/18 text-warning-foreground border-warning/40",
  Low: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", tone[status] ?? "bg-muted", className)}
    >
      {status}
    </Badge>
  );
}

export function ScoreDot({ score }: { score: number }) {
  const label = score >= 85 ? "Hot" : score >= 65 ? "Warm" : "Cold";
  const color =
    score >= 85 ? "bg-destructive" : score >= 65 ? "bg-accent" : "bg-muted-foreground/50";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-2 rounded-full", color)} />
      {score} · {label}
    </span>
  );
}
