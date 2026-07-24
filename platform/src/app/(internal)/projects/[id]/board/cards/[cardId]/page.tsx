import { notFound } from "next/navigation";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canCreateProjects } from "@/lib/roles";
import { CardDetail } from "@/components/CardDetail";

export default async function InternalCardPage({
  params,
}: {
  params: Promise<{ id: string; cardId: string }>;
}) {
  const session = await requireInternalSession();
  const { id, cardId } = await params;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      column: true,
      board: { select: { projectId: true } },
      assignee: { select: { name: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
      activity: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!card || card.board.projectId !== id) notFound();

  return (
    <CardDetail
      projectId={id}
      card={card}
      comments={card.comments}
      activity={card.activity}
      isInternalViewer
      canRequestApproval={
        canCreateProjects(session.globalRole) &&
        (card.approvalState === "none" || card.approvalState === "changes_requested")
      }
      canDecideApproval={false}
      redirectTo={`/projects/${id}/board/cards/${cardId}`}
      backHref={`/projects/${id}/board`}
      backLabel="Back to board"
    />
  );
}
