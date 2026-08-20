import { getRouteApi } from "@tanstack/react-router";
import type { Permission } from "@/lib/rbac";
import type { getSession } from "@/lib/org-api";

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type SessionOffice = Session["offices"][number];
export type SessionTeam = Session["teams"][number];
export type SessionMember = Session["users"][number];

const rootApi = getRouteApi("__root__");

/** Loaded once per navigation by the root route. Only call inside authenticated routes. */
export function useSession(): Session {
  const session = rootApi.useLoaderData();
  if (!session) throw new Error("useSession called outside an authenticated route");
  return session;
}

export function useCan(): (permission: Permission) => boolean {
  const { permissions } = useSession();
  return (permission) => permissions.includes(permission);
}
