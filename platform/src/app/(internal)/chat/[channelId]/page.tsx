import { notFound } from "next/navigation";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/MessageThread";
import { MessageComposer } from "@/components/MessageComposer";
import { LivePoll } from "@/components/LivePoll";
import { displayName } from "@/lib/channel-display";

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const session = await requireInternalSession();

  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId: session.userId } },
    include: {
      channel: {
        include: { members: { include: { user: { select: { id: true, name: true } } } } },
      },
    },
  });
  if (!membership) notFound();

  await prisma.channelMember.update({
    where: { id: membership.id },
    data: { lastReadAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { channelId, parentMessageId: null },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      sender: { select: { id: true, name: true } },
      reactions: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } }, reactions: true },
      },
    },
  });

  return (
    <>
      <LivePoll />
      <header className="border-b border-[var(--rule)] px-6 py-3.5 bg-[var(--surface)]">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          {membership.channel.type === "dm" || membership.channel.type === "group"
            ? displayName(membership.channel, session.userId)
            : `#${membership.channel.name}`}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">No messages yet — say hello.</p>
        ) : (
          messages.map((message) => (
            <MessageThread key={message.id} message={message} channelId={channelId} currentUserId={session.userId} />
          ))
        )}
      </div>

      <div className="border-t border-[var(--rule)] p-4 bg-[var(--surface)]">
        <MessageComposer channelId={channelId} />
      </div>
    </>
  );
}
