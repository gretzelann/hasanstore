"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4 bg-[var(--surface)] border border-[var(--rule)] rounded-xl p-6 shadow-sm">
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-[var(--rule)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          placeholder="you@vanguard.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-[var(--rule)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          placeholder="••••••••"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--accent)] text-white text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-60 transition"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
