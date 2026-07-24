"use client";

import { useActionState } from "react";
import { inviteClientContactAction, type InviteContactState } from "@/lib/client-actions";

const initialState: InviteContactState = {};

export function InviteContactForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(inviteClientContactAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
        <p className="text-sm font-medium text-emerald-800">Contact created</p>
        <p className="text-sm text-emerald-900">
          Share these credentials with <strong>{state.success.email}</strong> through a secure channel — not this
          screen, it won't be shown again:
        </p>
        <p className="font-mono text-sm bg-white border border-emerald-200 rounded px-3 py-2 inline-block">
          {state.success.tempPassword}
        </p>
        <p className="text-xs text-emerald-800">
          This is a stand-in for a signed email invite link (Phase 1 wiring — see spec §4). For now, relay the
          temporary password directly.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-5">
      <input type="hidden" name="clientId" value={clientId} />
      <div>
        <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Name</label>
        <input name="name" required className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Role</label>
        <select name="clientRole" className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm bg-white">
          <option value="client_admin">Client admin (can invite others)</option>
          <option value="client_collaborator">Collaborator</option>
        </select>
      </div>
      {state.error ? <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create contact"}
      </button>
    </form>
  );
}
