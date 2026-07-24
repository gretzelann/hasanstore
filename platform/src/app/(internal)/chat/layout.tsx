import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ChannelList } from "@/components/ChannelList";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await requireInternalSession();

  const memberships = await prisma.channelMember.findMany({
    where: { userId: session.userId },
    include: {
      channel: {
        include: { members: { include: { user: { select: { id: true, name: true } } } } },
      },
    },
    orderBy: { channel: { name: "asc" } },
  });

  const unread = await Promise.all(
    memberships.map(async (m) => ({
      channelId: m.channelId,
      count: await prisma.message.count({
        where: {
          channelId: m.channelId,
          senderId: { not: session.userId },
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
        },
      }),
    })),
  );
  const unreadByChannel = Object.fromEntries(unread.map((u) => [u.channelId, u.count]));

  const groups = {
    department: memberships.filter((m) => m.channel.type === "department"),
    client: memberships.filter((m) => m.channel.type === "client"),
    project: memberships.filter((m) => m.channel.type === "project"),
    dm: memberships.filter((m) => m.channel.type === "dm" || m.channel.type === "group"),
  };

  return (
    <div className="flex h-screen">
      <ChannelList groups={groups} unreadByChannel={unreadByChannel} currentUserId={session.userId} />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
