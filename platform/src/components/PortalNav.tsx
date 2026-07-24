"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/portal/home", label: "Overview" },
  { href: "/portal/approvals", label: "Approvals" },
] as const;

export function PortalNav({ name, clientName }: { name: string; clientName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--rule)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center">
              V
            </div>
            <span className="text-sm font-semibold text-[var(--ink)]">{clientName} portal</span>
          </div>
          <nav className="flex items-center gap-1">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  pathname === item.href
                    ? "bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium"
                    : "text-[var(--ink-soft)] hover:bg-[var(--paper)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--ink-soft)]">{name}</span>
          <form action="/api/logout" method="post">
            <button type="submit" className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] underline underline-offset-2">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
