import Link from "next/link";
import { requireClientSession, getAccessibleClientIds } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function PortalHomePage() {
  const session = await requireClientSession();
  const clientIds = await getAccessibleClientIds(session);
  const where = clientIds === "all" ? {} : { clientId: { in: clientIds } };

  const [projects, pendingCards, recentActivity] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.card.findMany({
      where: { approvalState: "pending", isClientFacing: true, board: { project: where } },
      include: { board: { include: { project: { include: { client: true } } } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.cardActivity.findMany({
      where: {
        actionType: { in: ["approval_requested", "approved", "changes_requested", "moved", "created"] },
        card: { isClientFacing: true, board: { project: where } },
      },
      include: {
        actor: { select: { name: true } },
        card: { select: { title: true, board: { select: { project: { select: { id: true, name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Welcome back, {session.name.split(" ")[0]}</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Here's where things stand across your projects.</p>
      </div>

      {pendingCards.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-medium text-amber-900">
            {pendingCards.length} item{pendingCards.length === 1 ? "" : "s"} waiting on your review
          </p>
          <Link href="/portal/approvals" className="text-sm text-amber-800 underline underline-offset-2">
            Review now →
          </Link>
        </div>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">Your projects</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">No projects yet.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/portal/projects/${p.id}/board`}
                  className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)] transition"
                >
                  <span className="text-sm font-medium text-[var(--ink)]">{p.name}</span>
                  <span className="text-xs text-[var(--ink-soft)] capitalize">{p.status.replace("_", " ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">Nothing yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((a) => (
              <li key={a.id} className="text-sm text-[var(--ink-soft)]">
                <span className="font-medium text-[var(--ink)]">{a.actor.name}</span> {describe(a.actionType)}{" "}
                <Link
                  href={`/portal/projects/${a.card.board.project.id}/board`}
                  className="text-[var(--accent-ink)] hover:underline"
                >
                  {a.card.title}
                </Link>
                <span className="text-[var(--ink-faint)]"> · {a.card.board.project.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function describe(actionType: string) {
  switch (actionType) {
    case "created":
      return "added";
    case "moved":
      return "updated the status of";
    case "approval_requested":
      return "requested your approval on";
    case "approved":
      return "— you approved";
    case "changes_requested":
      return "— you requested changes on";
    default:
      return actionType;
  }
}
