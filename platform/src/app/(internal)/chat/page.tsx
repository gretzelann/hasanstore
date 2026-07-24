import Link from "next/link";
import { redirect } from "next/navigation";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function ChatIndexPage() {
  const session = await requireInternalSession();

  const firstChannel = await prisma.channelMember.findFirst({
    where: { userId: session.userId },
    orderBy: { joinedAt: "asc" },
  });

  if (firstChannel) redirect(`/chat/${firstChannel.channelId}`);

  return (
    <div className="max-w-lg mx-auto px-8 py-16 text-center">
      <h1 className="text-lg font-semibold text-[var(--ink)]">No channels yet</h1>
      <p className="text-sm text-[var(--ink-soft)] mt-2">
        Ask an admin to add you to a department or project channel.
      </p>
      <Link href="/home" className="inline-block mt-4 text-sm text-[var(--accent-ink)] underline">
        Back to home
      </Link>
    </div>
  );
}
