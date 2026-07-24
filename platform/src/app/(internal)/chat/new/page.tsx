import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { NewMessageForm } from "@/components/NewMessageForm";

export default async function NewMessagePage() {
  const session = await requireInternalSession();

  const users = await prisma.user.findMany({
    where: { globalRole: { not: "client" }, id: { not: session.userId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-md mx-auto px-8 py-10">
      <h1 className="text-lg font-semibold text-[var(--ink)] mb-1">New message</h1>
      <p className="text-sm text-[var(--ink-soft)] mb-6">
        Pick one person for a direct message, or several for a group.
      </p>
      <NewMessageForm users={users} />
    </div>
  );
}
