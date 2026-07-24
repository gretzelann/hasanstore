import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace } from "@/lib/roles";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireInternalSession();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      members: { include: { user: { select: { name: true, email: true, status: true } } } },
    },
  });
  if (!client) notFound();

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <Link href="/clients" className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
        ← All clients
      </Link>
      <div className="flex items-center justify-between mt-3 mb-8">
        <h1 className="text-2xl font-semibold text-[var(--ink)]">{client.name}</h1>
        {canManageWorkspace(session.globalRole) ? (
          <Link
            href={`/clients/${client.id}/onboarding`}
            className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90"
          >
            Invite contact
          </Link>
        ) : null}
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">Projects</h2>
        {client.projects.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">No projects yet.</p>
        ) : (
          <ul className="space-y-2">
            {client.projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}/board`}
                  className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 text-sm hover:border-[var(--accent)] transition"
                >
                  <span className="font-medium text-[var(--ink)]">{p.name}</span>
                  <span className="text-xs text-[var(--ink-soft)] capitalize">{p.status.replace("_", " ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">
          Portal contacts
        </h2>
        {client.members.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">No portal contacts yet.</p>
        ) : (
          <ul className="space-y-2">
            {client.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--ink)]">{m.user.name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">{m.user.email}</p>
                </div>
                <span className="text-xs text-[var(--ink-soft)]">
                  {m.clientRole === "client_admin" ? "Client admin" : "Collaborator"}
                  {m.user.status === "invited" ? " · invited" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
