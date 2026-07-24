"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { displayName } from "@/lib/channel-display";

type ChannelRow = {
  channelId: string;
  channel: {
    id: string;
    name: string;
    type: string;
    members: { user: { id: string; name: string } }[];
  };
};

export function ChannelList({
  groups,
  unreadByChannel,
  currentUserId,
}: {
  groups: {
    department: ChannelRow[];
    client: ChannelRow[];
    project: ChannelRow[];
    dm: ChannelRow[];
  };
  unreadByChannel: Record<string, number>;
  currentUserId: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--rule)] bg-[var(--surface)] h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-4 border-b border-[var(--rule)] flex items-center justify-between">
        <h1 className="text-sm font-semibold text-[var(--ink)]">Chat</h1>
        <Link href="/chat/new" className="text-xs font-medium text-[var(--accent-ink)] hover:underline">
          + New
        </Link>
      </div>
      <nav className="px-2 py-3 space-y-4">
        <ChannelGroup label="Departments" rows={groups.department} unreadByChannel={unreadByChannel} pathname={pathname} currentUserId={currentUserId} />
        <ChannelGroup label="Clients" rows={groups.client} unreadByChannel={unreadByChannel} pathname={pathname} currentUserId={currentUserId} />
        <ChannelGroup label="Projects" rows={groups.project} unreadByChannel={unreadByChannel} pathname={pathname} currentUserId={currentUserId} />
        <ChannelGroup label="Direct messages" rows={groups.dm} unreadByChannel={unreadByChannel} pathname={pathname} currentUserId={currentUserId} />
      </nav>
    </aside>
  );
}

function ChannelGroup({
  label,
  rows,
  unreadByChannel,
  pathname,
  currentUserId,
}: {
  label: string;
  rows: ChannelRow[];
  unreadByChannel: Record<string, number>;
  pathname: string | null;
  currentUserId: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-1">{label}</p>
      <ul className="space-y-0.5">
        {rows.map(({ channel }) => {
          const active = pathname === `/chat/${channel.id}`;
          const unread = unreadByChannel[channel.id] ?? 0;
          const channelLabel = displayName(channel, currentUserId);
          return (
            <li key={channel.id}>
              <Link
                href={`/chat/${channel.id}`}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium"
                    : "text-[var(--ink-soft)] hover:bg-[var(--paper)]"
                }`}
              >
                <span className="truncate">
                  {channel.type === "dm" || channel.type === "group" ? channelLabel : `#${channelLabel}`}
                </span>
                {unread > 0 ? (
                  <span className="rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold px-1.5 py-0.5 ml-2">
                    {unread}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
