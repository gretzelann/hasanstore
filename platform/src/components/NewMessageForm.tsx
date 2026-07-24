"use client";

import { useState, useTransition } from "react";
import { startDirectMessageAction } from "@/lib/dm-actions";

export function NewMessageForm({ users }: { users: { id: string; name: string }[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <form
      action={(formData: FormData) => startTransition(() => startDirectMessageAction(formData))}
      className="space-y-4"
    >
      {selected.map((id) => (
        <input key={id} type="hidden" name="userIds" value={id} />
      ))}
      <div className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] divide-y divide-[var(--rule)] max-h-80 overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)] px-4 py-3">No other teammates yet.</p>
        ) : (
          users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-[var(--paper)]"
            >
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
                className="rounded"
              />
              <span className="text-[var(--ink)]">{u.name}</span>
            </label>
          ))
        )}
      </div>
      <button
        type="submit"
        disabled={selected.length === 0 || isPending}
        className="w-full rounded-lg bg-[var(--accent)] text-white text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Starting…" : selected.length > 1 ? "Start group chat" : "Start conversation"}
      </button>
    </form>
  );
}
