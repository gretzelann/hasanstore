import Link from "next/link";
import { requireClientSession, getAccessibleClientIds } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function PortalApprovalsPage() {
  const session = await requireClientSession();
  const clientIds = await getAccessibleClientIds(session);
  const where = clientIds === "all" ? {} : { clientId: { in: clientIds } };

  const cards = await prisma.card.findMany({
    where: { approvalState: "pending", isClientFacing: true, board: { project: where } },
    include: { board: { include: { project: { include: { client: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">Approvals</h1>
      <p className="text-sm text-[var(--ink-soft)] mb-6">Everything waiting on your decision.</p>

      {cards.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">Nothing waiting on you right now.</p>
      ) : (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/portal/projects/${card.board.project.id}/board/cards/${card.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)] transition"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{card.title}</p>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {card.board.project.client.name} · {card.board.project.name}
                  </p>
                </div>
                <span className="text-xs font-medium rounded-full px-2.5 py-1 bg-amber-50 text-amber-700">
                  Review
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
