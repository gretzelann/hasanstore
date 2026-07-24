import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace } from "@/lib/roles";
import { InviteContactForm } from "@/components/InviteContactForm";

export default async function ClientOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireInternalSession();
  const { id } = await params;
  if (!canManageWorkspace(session.globalRole)) notFound();

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div className="max-w-lg mx-auto px-8 py-10">
      <Link href={`/clients/${client.id}`} className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
        ← {client.name}
      </Link>
      <h1 className="text-xl font-semibold text-[var(--ink)] mt-3 mb-1">Invite a client contact</h1>
      <p className="text-sm text-[var(--ink-soft)] mb-6">
        They'll get portal access scoped to {client.name} only — never internal channels or other clients.
      </p>
      <InviteContactForm clientId={client.id} />
    </div>
  );
}
