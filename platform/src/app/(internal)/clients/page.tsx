import Link from "next/link";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace } from "@/lib/roles";
import { NewClientForm } from "@/components/NewClientForm";

export default async function ClientsPage() {
  const session = await requireInternalSession();

  const clients = await prisma.client.findMany({
    include: { _count: { select: { projects: true, members: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">Clients</h1>
      <p className="text-sm text-[var(--ink-soft)] mb-6">Every client account and who has portal access.</p>

      {canManageWorkspace(session.globalRole) ? (
        <div className="mb-8">
          <NewClientForm />
        </div>
      ) : null}

      {clients.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">No clients yet.</p>
      ) : (
        <ul className="space-y-2">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)] transition"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{client.name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {client._count.projects} project{client._count.projects === 1 ? "" : "s"} ·{" "}
                    {client._count.members} contact{client._count.members === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-xs font-medium text-[var(--ink-soft)] capitalize">{client.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
