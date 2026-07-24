"use client";

import { useTransition } from "react";
import { createClientAction } from "@/lib/client-actions";

export function NewClientForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData: FormData) => startTransition(() => createClientAction(formData))}
      className="flex items-end gap-3 rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4"
    >
      <div className="flex-1">
        <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">New client name</label>
        <input
          name="name"
          required
          placeholder="Acme Corp"
          className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add client"}
      </button>
    </form>
  );
}
