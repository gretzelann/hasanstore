"use client";

import { useState } from "react";
import { toggleReactionAction } from "@/lib/chat-actions";
import { MessageComposer } from "./MessageComposer";

const QUICK_EMOJI = ["👍", "✅", "👀"];

type Reaction = { id: string; emoji: string; userId: string };
type Sender = { id: string; name: string };
type ReplyMessage = {
  id: string;
  body: string;
  createdAt: Date;
  sender: Sender;
  reactions: Reaction[];
};
type RootMessage = ReplyMessage & { replies: ReplyMessage[] };

export function MessageThread({
  message,
  channelId,
  currentUserId,
}: {
  message: RootMessage;
  channelId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <MessageRow message={message} channelId={channelId} currentUserId={currentUserId} />
      {message.replies.length > 0 || open ? (
        <div className="ml-11 mt-1.5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-xs font-medium text-[var(--accent-ink)] hover:underline mb-2"
          >
            {open ? "Hide thread" : `${message.replies.length} ${message.replies.length === 1 ? "reply" : "replies"}`}
          </button>
          {open ? (
            <div className="space-y-3 border-l-2 border-[var(--rule)] pl-4">
              {message.replies.map((reply) => (
                <MessageRow key={reply.id} message={reply} channelId={channelId} currentUserId={currentUserId} compact />
              ))}
              <MessageComposer
                channelId={channelId}
                parentMessageId={message.id}
                placeholder="Reply in thread…"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-11 mt-1.5 text-xs font-medium text-[var(--ink-faint)] hover:text-[var(--accent-ink)]"
        >
          Reply in thread
        </button>
      )}
    </div>
  );
}

function MessageRow({
  message,
  channelId,
  currentUserId,
  compact,
}: {
  message: ReplyMessage;
  channelId: string;
  currentUserId: string;
  compact?: boolean;
}) {
  const grouped = groupReactions(message.reactions);

  return (
    <div className="flex gap-3">
      <div
        className={`shrink-0 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold flex items-center justify-center ${
          compact ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-xs"
        }`}
      >
        {initials(message.sender.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">{message.sender.name}</span>
          <span className="text-xs text-[var(--ink-faint)]">{formatTime(message.createdAt)}</span>
        </div>
        <p className="text-sm text-[var(--ink)] whitespace-pre-wrap break-words">{message.body}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {grouped.map(({ emoji, count, mine }) => (
            <ReactionButton
              key={emoji}
              emoji={emoji}
              count={count}
              mine={mine}
              messageId={message.id}
              channelId={channelId}
            />
          ))}
          {QUICK_EMOJI.filter((e) => !grouped.some((g) => g.emoji === e)).map((emoji) => (
            <ReactionButton key={emoji} emoji={emoji} count={0} mine={false} messageId={message.id} channelId={channelId} ghost />
          ))}
        </div>
      </div>
    </div>
  );

  function groupReactions(reactions: Reaction[]) {
    const byEmoji = new Map<string, Reaction[]>();
    for (const r of reactions) {
      byEmoji.set(r.emoji, [...(byEmoji.get(r.emoji) ?? []), r]);
    }
    return Array.from(byEmoji.entries()).map(([emoji, rs]) => ({
      emoji,
      count: rs.length,
      mine: rs.some((r) => r.userId === currentUserId),
    }));
  }
}

function ReactionButton({
  emoji,
  count,
  mine,
  messageId,
  channelId,
  ghost,
}: {
  emoji: string;
  count: number;
  mine: boolean;
  messageId: string;
  channelId: string;
  ghost?: boolean;
}) {
  return (
    <form action={toggleReactionAction}>
      <input type="hidden" name="messageId" value={messageId} />
      <input type="hidden" name="channelId" value={channelId} />
      <input type="hidden" name="emoji" value={emoji} />
      <button
        type="submit"
        className={`text-xs rounded-full px-2 py-0.5 border transition ${
          ghost
            ? "border-transparent text-[var(--ink-faint)] hover:border-[var(--rule)]"
            : mine
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
              : "border-[var(--rule)] text-[var(--ink-soft)] hover:border-[var(--accent)]"
        }`}
      >
        {emoji} {count > 0 ? count : ""}
      </button>
    </form>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
