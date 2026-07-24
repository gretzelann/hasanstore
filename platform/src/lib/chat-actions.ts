"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireSession } from "./access";

const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
  parentMessageId: z.string().min(1).optional(),
});

/** Very small @mention parser: matches "@" followed by a member's first name (case-insensitive). */
async function extractMentionedUserIds(channelId: string, body: string): Promise<string[]> {
  const tokens = Array.from(body.matchAll(/@(\w[\w-]*)/g)).map((m) => m[1].toLowerCase());
  if (tokens.length === 0) return [];

  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: { user: { select: { id: true, name: true } } },
  });

  const matched = new Set<string>();
  for (const token of tokens) {
    const member = members.find((m) => m.user.name.split(" ")[0].toLowerCase() === token);
    if (member) matched.add(member.user.id);
  }
  return Array.from(matched);
}

export async function sendMessageAction(formData: FormData) {
  const session = await requireSession();
  const parsed = sendMessageSchema.safeParse({
    channelId: formData.get("channelId"),
    body: formData.get("body"),
    parentMessageId: formData.get("parentMessageId") || undefined,
  });
  if (!parsed.success) return;

  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId: parsed.data.channelId, userId: session.userId } },
  });
  if (!membership) return;

  const message = await prisma.message.create({
    data: {
      channelId: parsed.data.channelId,
      senderId: session.userId,
      body: parsed.data.body,
      parentMessageId: parsed.data.parentMessageId,
    },
  });

  await prisma.channelMember.update({
    where: { id: membership.id },
    data: { lastReadAt: message.createdAt },
  });

  const mentionedUserIds = await extractMentionedUserIds(parsed.data.channelId, parsed.data.body);
  if (mentionedUserIds.length > 0) {
    await prisma.mention.createMany({
      data: mentionedUserIds.map((mentionedUserId) => ({ messageId: message.id, mentionedUserId })),
    });
    await prisma.notification.createMany({
      data: mentionedUserIds
        .filter((id) => id !== session.userId)
        .map((userId) => ({
          userId,
          type: "mention",
          entityType: "message",
          entityId: message.id,
        })),
    });
  }

  revalidatePath(`/chat/${parsed.data.channelId}`);
  revalidatePath("/home");
  revalidatePath("/chat");
}

export async function toggleReactionAction(formData: FormData) {
  const session = await requireSession();
  const messageId = formData.get("messageId");
  const emoji = formData.get("emoji");
  const channelId = formData.get("channelId");
  if (typeof messageId !== "string" || typeof emoji !== "string" || typeof channelId !== "string") return;

  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId: session.userId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { messageId, userId: session.userId, emoji } });
  }

  revalidatePath(`/chat/${channelId}`);
}

export async function markChannelReadAction(channelId: string, userId: string) {
  await prisma.channelMember.updateMany({
    where: { channelId, userId },
    data: { lastReadAt: new Date() },
  });
}
