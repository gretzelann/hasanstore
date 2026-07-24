import Link from "next/link";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { CARD_STATUS_LABELS, type CardStatus } from "@/lib/roles";

export default async function HomePage() {
  const session = await requireInternalSession();

  const [channelMemberships, assignedCards, pendingApprovals] = await Promise.all([
    prisma.channelMember.findMany({
      where: { userId: session.userId },
      include: { channel: true },
    }),
    prisma.card.findMany({
      where: { assigneeId: session.userId, column: { mapsToStatus: { not: "done" } } },
      include: { column: true, board: { include: { project: { include: { client: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.card.findMany({
      where: { approvalState: "pending" },
      include: { board: { include: { project: { include: { client: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const unreadChannels = await Promise.all(
    channelMemberships.map(async (m) => {
      const unreadCount = await prisma.message.count({
        where: {
          channelId: m.channelId,
          senderId: { not: session.userId },
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
        },
      });
      return { channel: m.channel, unreadCount };
    }),
  );
  const unread = unreadChannels.filter((c) => c.unreadCount > 0).sort((a, b) => b.unreadCount - a.unreadCount);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Good to see you, {session.name.split(" ")[0]}</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Everything that needs your attention, in one place.</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">
          Unread ({unread.length})
        </h2>
        {unread.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">You're caught up.</p>
        ) : (
          <ul className="space-y-1.5">
            {unread.map(({ channel, unreadCount }) => (
              <li key={channel.id}>
                <Link
                  href={`/chat/${channel.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 text-sm hover:border-[var(--accent)] transition"
                >
                  <span className="font-medium text-[var(--ink)]">#{channel.name}</span>
                  <span className="rounded-full bg-[var(--accent)] text-white text-xs font-semibold px-2 py-0.5">
                    {unreadCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">
          Assigned to you ({assignedCards.length})
        </h2>
        {assignedCards.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">Nothing assigned right now.</p>
        ) : (
          <ul className="space-y-1.5">
            {assignedCards.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/projects/${card.board.project.id}/board`}
                  className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 text-sm hover:border-[var(--accent)] transition"
                >
                  <span>
                    <span className="font-medium text-[var(--ink)]">{card.title}</span>
                    <span className="text-[var(--ink-faint)]"> · {card.board.project.client.name}</span>
                  </span>
                  <StatusPill status={card.column.mapsToStatus as CardStatus} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">
          Pending client approval ({pendingApprovals.length})
        </h2>
        {pendingApprovals.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">Nothing waiting on a client decision.</p>
        ) : (
          <ul className="space-y-1.5">
            {pendingApprovals.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/projects/${card.board.project.id}/board`}
                  className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 text-sm hover:border-[var(--accent)] transition"
                >
                  <span>
                    <span className="font-medium text-[var(--ink)]">{card.title}</span>
                    <span className="text-[var(--ink-faint)]"> · {card.board.project.client.name}</span>
                  </span>
                  <StatusPill status="waiting_on_client" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: CardStatus }) {
  const colors: Record<CardStatus, string> = {
    todo: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-50 text-blue-700",
    waiting_on_client: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    done: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-xs font-medium rounded-full px-2.5 py-1 whitespace-nowrap ${colors[status]}`}>
      {CARD_STATUS_LABELS[status]}
    </span>
  );
}
