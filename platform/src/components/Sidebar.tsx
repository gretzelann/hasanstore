import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/projects", label: "Projects" },
  { href: "/clients", label: "Clients" },
] as const;

export function Sidebar({ session }: { session: SessionPayload }) {
  return (
    <aside className="w-56 shrink-0 border-r border-[var(--rule)] bg-[var(--surface)] flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-[var(--rule)] flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center">
          V
        </div>
        <span className="font-semibold text-sm text-[var(--ink)]">Vanguard</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-[var(--ink-soft)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)] transition"
          >
            {item.label}
          </Link>
        ))}
        {session.globalRole === "admin" ? (
          <Link
            href="/admin/users"
            className="block rounded-md px-3 py-2 text-sm text-[var(--ink-soft)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)] transition"
          >
            Admin
          </Link>
        ) : null}
      </nav>

      <div className="px-4 py-3 border-t border-[var(--rule)]">
        <p className="text-sm font-medium text-[var(--ink)] truncate">{session.name}</p>
        <p className="text-xs text-[var(--ink-faint)] truncate mb-2">{session.email}</p>
        <form action="/api/logout" method="post">
          <button
            type="submit"
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] underline underline-offset-2"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
