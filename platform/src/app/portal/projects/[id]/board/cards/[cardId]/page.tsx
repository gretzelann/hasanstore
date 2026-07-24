import { notFound } from "next/navigation";
import { requireClientSession, assertClientAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { CardDetail } from "@/components/CardDetail";

export default async function PortalCardPage({
  params,
}: {
  params: Promise<{ id: string; cardId: string }>;
}) {
  const session = await requireClientSession();
  const { id, cardId } = await params;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      column: true,
      board: { select: { projectId: true, project: { select: { clientId: true } } } },
      assignee: { select: { name: true } },
      comments: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
      activity: {
        where: { actionType: { in: ["created", "moved", "approval_requested", "approved", "changes_requested"] } },
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!card || card.board.projectId !== id || !card.isClientFacing) notFound();
  await assertClientAccess(session, card.board.project.clientId);

  return (
    <CardDetail
      projectId={id}
      card={card}
      comments={card.comments}
      activity={card.activity}
      isInternalViewer={false}
      canRequestApproval={false}
      canDecideApproval={card.approvalState === "pending"}
      redirectTo={`/portal/projects/${id}/board/cards/${cardId}`}
      backHref={`/portal/projects/${id}/board`}
      backLabel="Back to board"
    />
  );
}
