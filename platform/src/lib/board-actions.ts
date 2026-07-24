"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireInternalSession, requireSession, getAccessibleClientIds } from "./access";
import { writeAuditLog } from "./audit";
import { canCreateProjects, canDecideApproval, isInternalRole, DEFAULT_BOARD_COLUMNS } from "./roles";

const createProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

export async function createProjectAction(formData: FormData) {
  const session = await requireInternalSession();
  if (!canCreateProjects(session.globalRole)) return;

  const parsed = createProjectSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return;

  const project = await prisma.project.create({
    data: {
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      description: parsed.data.description,
      ownerId: session.userId,
      board: {
        create: {
          name: "Main board",
          columns: {
            create: DEFAULT_BOARD_COLUMNS.map((col, i) => ({
              name: col.name,
              position: i,
              mapsToStatus: col.mapsToStatus,
              isClientVisible: col.isClientVisible,
            })),
          },
        },
      },
    },
  });

  const channel = await prisma.channel.create({
    data: {
      type: "project",
      name: parsed.data.name,
      clientId: parsed.data.clientId,
      projectId: project.id,
      createdById: session.userId,
      members: { create: { userId: session.userId, role: "owner" } },
    },
  });

  await writeAuditLog({
    actorId: session.userId,
    action: "project_created",
    entityType: "project",
    entityId: project.id,
    metadata: { name: parsed.data.name, clientId: parsed.data.clientId, channelId: channel.id },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}/board`);
}

const createCardSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
  projectId: z.string().min(1),
});

export async function createCardAction(formData: FormData) {
  const session = await requireInternalSession();
  const parsed = createCardSchema.safeParse({
    boardId: formData.get("boardId"),
    columnId: formData.get("columnId"),
    title: formData.get("title"),
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) return;

  const cardCount = await prisma.card.count({ where: { columnId: parsed.data.columnId } });

  const card = await prisma.card.create({
    data: {
      boardId: parsed.data.boardId,
      columnId: parsed.data.columnId,
      title: parsed.data.title,
      createdById: session.userId,
      position: cardCount,
    },
  });

  await prisma.cardActivity.create({
    data: { cardId: card.id, actorId: session.userId, actionType: "created" },
  });

  revalidatePath(`/projects/${parsed.data.projectId}/board`);
}

const moveCardSchema = z.object({
  cardId: z.string().min(1),
  toColumnId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function moveCardAction(formData: FormData) {
  const session = await requireInternalSession();
  const parsed = moveCardSchema.safeParse({
    cardId: formData.get("cardId"),
    toColumnId: formData.get("toColumnId"),
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) return;

  const [card, toColumn] = await Promise.all([
    prisma.card.findUnique({ where: { id: parsed.data.cardId }, include: { column: true } }),
    prisma.boardColumn.findUnique({ where: { id: parsed.data.toColumnId } }),
  ]);
  if (!card || !toColumn || card.columnId === toColumn.id) return;

  const cardCount = await prisma.card.count({ where: { columnId: toColumn.id } });

  await prisma.card.update({
    where: { id: card.id },
    data: { columnId: toColumn.id, position: cardCount },
  });

  await prisma.cardActivity.create({
    data: {
      cardId: card.id,
      actorId: session.userId,
      actionType: "moved",
      fromValue: card.column.name,
      toValue: toColumn.name,
    },
  });

  revalidatePath(`/projects/${parsed.data.projectId}/board`);
}

const addCommentSchema = z.object({
  cardId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
  isInternal: z.string().optional(),
  redirectTo: z.string().min(1),
});

export async function addCommentAction(formData: FormData) {
  const session = await requireSession();
  const parsed = addCommentSchema.safeParse({
    cardId: formData.get("cardId"),
    body: formData.get("body"),
    isInternal: formData.get("isInternal") || undefined,
    redirectTo: formData.get("redirectTo"),
  });
  if (!parsed.success) return;

  // A client session can never write an internal-only comment, regardless of
  // what the form sends — this is the server-side half of the is_internal
  // enforcement described in the spec.
  const isInternal = isInternalRole(session.globalRole) && parsed.data.isInternal === "on";

  await prisma.cardComment.create({
    data: {
      cardId: parsed.data.cardId,
      authorId: session.userId,
      body: parsed.data.body,
      isInternal,
    },
  });

  await prisma.cardActivity.create({
    data: { cardId: parsed.data.cardId, actorId: session.userId, actionType: "commented" },
  });

  revalidatePath(parsed.data.redirectTo);
}

const requestApprovalSchema = z.object({
  cardId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function requestApprovalAction(formData: FormData) {
  const session = await requireInternalSession();
  const parsed = requestApprovalSchema.safeParse({
    cardId: formData.get("cardId"),
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) return;

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: { client: { include: { members: true } } },
  });
  if (!project) return;

  await prisma.card.update({
    where: { id: parsed.data.cardId },
    data: { approvalState: "pending" },
  });

  await prisma.approval.create({
    data: { cardId: parsed.data.cardId, requestedById: session.userId },
  });

  await prisma.cardActivity.create({
    data: { cardId: parsed.data.cardId, actorId: session.userId, actionType: "approval_requested" },
  });

  await prisma.notification.createMany({
    data: project.client.members.map((m) => ({
      userId: m.userId,
      type: "approval_requested",
      entityType: "card",
      entityId: parsed.data.cardId,
    })),
  });

  revalidatePath(`/projects/${parsed.data.projectId}/board`);
  revalidatePath(`/projects/${parsed.data.projectId}/board/cards/${parsed.data.cardId}`);
}

const decideApprovalSchema = z.object({
  cardId: z.string().min(1),
  projectId: z.string().min(1),
  decision: z.enum(["approved", "changes_requested"]),
  notes: z.string().trim().max(2000).optional(),
});

export async function decideApprovalAction(formData: FormData) {
  const session = await requireSession();
  if (!canDecideApproval(session.globalRole)) return;

  const parsed = decideApprovalSchema.safeParse({
    cardId: formData.get("cardId"),
    projectId: formData.get("projectId"),
    decision: formData.get("decision"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return;

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) return;
  const accessible = await getAccessibleClientIds(session);
  if (accessible !== "all" && !accessible.includes(project.clientId)) return;

  const approval = await prisma.approval.findFirst({
    where: { cardId: parsed.data.cardId, decision: "pending" },
    orderBy: { requestedAt: "desc" },
  });
  if (!approval) return;

  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      decision: parsed.data.decision,
      decidedById: session.userId,
      decidedAt: new Date(),
      notes: parsed.data.notes,
    },
  });

  await prisma.card.update({
    where: { id: parsed.data.cardId },
    data: { approvalState: parsed.data.decision },
  });

  await prisma.cardActivity.create({
    data: {
      cardId: parsed.data.cardId,
      actorId: session.userId,
      actionType: parsed.data.decision,
    },
  });

  await prisma.notification.create({
    data: {
      userId: project.ownerId,
      type: "approval_decided",
      entityType: "card",
      entityId: parsed.data.cardId,
    },
  });

  await writeAuditLog({
    actorId: session.userId,
    action: "approval_decided",
    entityType: "card",
    entityId: parsed.data.cardId,
    metadata: { decision: parsed.data.decision },
  });

  revalidatePath(`/portal/projects/${parsed.data.projectId}/board`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}/board/cards/${parsed.data.cardId}`);
  revalidatePath(`/projects/${parsed.data.projectId}/board`);
  revalidatePath("/portal/approvals");
}
