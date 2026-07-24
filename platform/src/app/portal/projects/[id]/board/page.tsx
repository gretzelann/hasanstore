import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClientSession, assertClientAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { CARD_STATUS_LABELS, type CardStatus } from "@/lib/roles";

export default async function PortalProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClientSession();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      board: {
        include: {
          columns: {
            where: { isClientVisible: true },
            orderBy: { position: "asc" },
            include: {
              cards: {
                where: { isClientFacing: true },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });
  if (!project || !project.board) notFound();
  await assertClientAccess(session, project.clientId);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <p className="text-xs text-[var(--ink-faint)]">{project.client.name}</p>
      <h1 className="text-xl font-semibold text-[var(--ink)] mb-6">{project.name}</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {project.board.columns.map((column) => (
          <div key={column.id} className="w-64 shrink-0">
            <h3 className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-2 px-1">
              {CARD_STATUS_LABELS[column.mapsToStatus as CardStatus] ?? column.name}
            </h3>
            <div className="space-y-2">
              {column.cards.length === 0 ? (
                <p className="text-xs text-[var(--ink-faint)] px-1">Nothing here</p>
              ) : (
                column.cards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/portal/projects/${project.id}/board/cards/${card.id}`}
                    className="block rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5 text-sm shadow-sm hover:border-[var(--accent)] transition"
                  >
                    <p className="font-medium text-[var(--ink)]">{card.title}</p>
                    {card.approvalState === "pending" ? (
                      <span className="inline-block mt-1.5 text-[10px] font-medium rounded px-1.5 py-0.5 bg-amber-50 text-amber-700">
                        Awaiting your review
                      </span>
                    ) : null}
                    {card.approvalState === "approved" ? (
                      <span className="inline-block mt-1.5 text-[10px] font-medium rounded px-1.5 py-0.5 bg-emerald-50 text-emerald-700">
                        Approved
                      </span>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
