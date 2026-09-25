export type ModuleStatus = "ready" | "partial" | "planned";

export type ModuleReadiness = {
  status: ModuleStatus;
  whatWorksNow: string[];
  nextRequired: string[];
};

export const MODULE_READINESS = {
  dashboard: {
    status: "partial",
    whatWorksNow: [
      "Role-scoped organization stats",
      "Setup checklist and truthful empty states",
      "Pipeline counters once lead data exists",
    ],
    nextRequired: [
      "Priority queue for overdue and unassigned work",
      "Downstream module signals from viewings/offers/transactions",
    ],
  },
  inbox: {
    status: "partial",
    whatWorksNow: [
      "Threaded inbox with open/closed conversations",
      "Inbound webform intake to contact + lead + thread",
      "Consent checks before outbound replies are queued",
    ],
    nextRequired: [
      "Provider-backed outbound delivery for email/WhatsApp/SMS",
      "Delivery retry and reconciliation jobs",
    ],
  },
  contacts: {
    status: "ready",
    whatWorksNow: [
      "Canonical contact records",
      "Contact detail with lead and conversation context",
    ],
    nextRequired: [],
  },
  leads: {
    status: "ready",
    whatWorksNow: [
      "Lead pipeline stages with edits",
      "Scoring, routing and SLA timestamps",
      "Lead-to-listing matching detail",
    ],
    nextRequired: [],
  },
  properties: {
    status: "ready",
    whatWorksNow: [
      "Property + listing lifecycle",
      "Latest non-withdrawn listing per property in inventory",
      "Lead matching against live listings",
    ],
    nextRequired: [],
  },
  calendar: {
    status: "planned",
    whatWorksNow: [],
    nextRequired: [
      "Viewing booking and assignment workflow",
      "Calendar provider sync and confirmations",
    ],
  },
  offers: {
    status: "planned",
    whatWorksNow: [],
    nextRequired: [
      "Offer and counteroffer timeline",
      "Approval workflow and acceptance handoff to transactions",
    ],
  },
  reports: {
    status: "planned",
    whatWorksNow: [],
    nextRequired: [
      "KPI aggregation and report filters",
      "Revenue, funnel and team performance analytics",
    ],
  },
  automation: {
    status: "planned",
    whatWorksNow: [],
    nextRequired: [
      "Event stream and rule engine",
      "Trigger/condition/action execution history",
    ],
  },
  notifications: {
    status: "planned",
    whatWorksNow: [],
    nextRequired: [
      "Notification model and severity queue",
      "Channel delivery preferences and dispatch",
    ],
  },
  assistant: {
    status: "planned",
    whatWorksNow: [],
    nextRequired: [
      "Runtime model integration behind environment config",
      "Permission-scoped AI actions over organization data",
    ],
  },
} satisfies Record<string, ModuleReadiness>;

export type ModuleKey = keyof typeof MODULE_READINESS;

export function moduleStatusLabel(status: ModuleStatus) {
  return status === "ready" ? "Live" : status === "partial" ? "Partial" : "Planned";
}
