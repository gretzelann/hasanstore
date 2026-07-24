"use client";

import { useRef, useTransition } from "react";
import { sendMessageAction } from "@/lib/chat-actions";

export function MessageComposer({
  channelId,
  parentMessageId,
  autoFocus,
  placeholder,
}: {
  channelId: string;
  parentMessageId?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        startTransition(async () => {
          await sendMessageAction(formData);
          formRef.current?.reset();
        });
      }}
      className="flex items-end gap-2"
    >
      <input type="hidden" name="channelId" value={channelId} />
      {parentMessageId ? <input type="hidden" name="parentMessageId" value={parentMessageId} /> : null}
      <textarea
        name="body"
        required
        rows={1}
        autoFocus={autoFocus}
        placeholder={placeholder ?? "Message… use @name to mention someone"}
        className="flex-1 resize-none rounded-lg border border-[var(--rule)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-60"
      >
        Send
      </button>
    </form>
  );
}
