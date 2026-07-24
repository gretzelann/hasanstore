import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./auth";
import { isInternalRole } from "./roles";
import { prisma } from "./prisma";

/**
 * Fetches the session or redirects to /login. Use in server components and
 * route handlers that require *some* authenticated user, internal or client.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Requires an internal session (admin / pm / team_member). Client sessions
 * are bounced to the portal rather than a bare 403 — the internal app and
 * the client portal are different destinations, not different error pages.
 */
export async function requireInternalSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!isInternalRole(session.globalRole)) {
    redirect("/portal/home");
  }
  return session;
}

/**
 * Requires a client session. Internal users get bounced to the internal
 * home rather than the portal.
 */
export async function requireClientSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (isInternalRole(session.globalRole)) {
    redirect("/home");
  }
  return session;
}

/**
 * Client ids the current user may see. Internal roles (admin/pm/team_member)
 * see everything, matching the "internal team sees a broader admin view"
 * requirement. Client-role users are scoped to clients they're a member of.
 *
 * NOTE (documented simplification): the schema scopes client access per
 * *client*, not per *project*. The spec's "Client Collaborator: specific
 * projects only" is a narrower scope than what this MVP enforces — today a
 * Client Collaborator sees every project under their client, same as a
 * Client Admin. Per-project client scoping is a Phase 2 addition (a
 * client_member_projects join table) once there's a real need for it.
 */
export async function getAccessibleClientIds(session: SessionPayload): Promise<string[] | "all"> {
  if (isInternalRole(session.globalRole)) return "all";
  const memberships = await prisma.clientMember.findMany({
    where: { userId: session.userId },
    select: { clientId: true },
  });
  return memberships.map((m) => m.clientId);
}

export async function assertClientAccess(session: SessionPayload, clientId: string): Promise<void> {
  const accessible = await getAccessibleClientIds(session);
  if (accessible === "all") return;
  if (!accessible.includes(clientId)) {
    redirect("/portal/home");
  }
}
