import { notFound } from "next/navigation";
import Link from "next/link";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { Board } from "@/components/Board";
import { LivePoll } from "@/components/LivePoll";

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireInternalSession();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      board: {
        include: {
          columns: {
            orderBy: { position: "asc" },
            include: {
              cards: {
                orderBy: { position: "asc" },
                include: { assignee: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!project || !project.board) notFound();

  return (
    <div className="flex flex-col h-screen">
      <LivePoll intervalMs={6000} />
      <header className="border-b border-[var(--rule)] bg-[var(--surface)] px-6 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--ink-faint)]">{project.client.name}</p>
          <h1 className="text-sm font-semibold text-[var(--ink)]">{project.name}</h1>
        </div>
        <Link href="/projects" className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
          All projects
        </Link>
      </header>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <Board project={project} board={project.board} />
      </div>
    </div>
  );
}
