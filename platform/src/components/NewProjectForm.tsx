"use client";

import { useRef, useTransition } from "react";
import { createProjectAction } from "@/lib/board-actions";

export function NewProjectForm({ clients }: { clients: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  if (clients.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-faint)] border border-dashed border-[var(--rule)] rounded-lg px-4 py-3">
        Add a client first before starting a project.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => startTransition(() => createProjectAction(formData))}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4"
    >
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Client</label>
        <select
          name="clientId"
          required
          className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm bg-white"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-[2] min-w-[200px]">
        <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Project name</label>
        <input
          name="name"
          required
          placeholder="Q3 Website Redesign"
          className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Creating…" : "New project"}
      </button>
    </form>
  );
}
