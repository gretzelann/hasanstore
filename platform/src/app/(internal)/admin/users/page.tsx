import { notFound } from "next/navigation";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { RoleSelect } from "@/components/RoleSelect";

export default async function AdminUsersPage() {
  const session = await requireInternalSession();
  if (session.globalRole !== "admin") notFound();

  const [users, auditLog] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">Team &amp; permissions</h1>
        <p className="text-sm text-[var(--ink-soft)]">Internal users only — client contacts live under each client.</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">Users</h2>
        <ul className="space-y-2">
          {users
            .filter((u) => u.globalRole !== "client")
            .map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{u.name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">{u.email}</p>
                </div>
                <RoleSelect userId={u.id} currentRole={u.globalRole} disabled={u.id === session.userId} />
              </li>
            ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">
          Recent audit log
        </h2>
        <ul className="space-y-1.5">
          {auditLog.map((entry) => (
            <li key={entry.id} className="text-xs text-[var(--ink-soft)] flex items-baseline gap-2">
              <span className="text-[var(--ink-faint)] tabular-nums">{formatDateTime(entry.createdAt)}</span>
              <span className="font-medium text-[var(--ink)]">{entry.actor?.name ?? "System"}</span>
              <span>{entry.action.replace(/_/g, " ")}</span>
              <span className="text-[var(--ink-faint)]">
                {entry.entityType}
                {entry.entityId ? `:${entry.entityId.slice(0, 8)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
