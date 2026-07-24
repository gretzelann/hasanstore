"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireInternalSession } from "./access";

/**
 * Finds an existing DM/group channel with exactly this set of participants,
 * or creates one. The channel's stored `name` is never shown for dm/group
 * types — the UI computes a per-viewer label (the *other* participants'
 * names) instead, since a fixed name would be wrong for everyone but the
 * creator.
 */
export async function startDirectMessageAction(formData: FormData) {
  const session = await requireInternalSession();
  const otherUserIds = formData
    .getAll("userIds")
    .filter((v): v is string => typeof v === "string");
  const uniqueOthers = Array.from(new Set(otherUserIds)).filter((id) => id !== session.userId);
  if (uniqueOthers.length === 0) return;

  const participantIds = Array.from(new Set([session.userId, ...uniqueOthers])).sort();
  const type = uniqueOthers.length === 1 ? "dm" : "group";

  const candidates = await prisma.channel.findMany({
    where: { type },
    include: { members: { select: { userId: true } } },
  });
  const existing = candidates.find((c) => {
    const ids = c.members.map((m) => m.userId).sort();
    return ids.length === participantIds.length && ids.every((id, i) => id === participantIds[i]);
  });

  if (existing) {
    revalidatePath("/chat", "layout");
    redirect(`/chat/${existing.id}`);
  }

  const others = await prisma.user.findMany({ where: { id: { in: uniqueOthers } } });
  const channel = await prisma.channel.create({
    data: {
      type,
      name: others.map((u) => u.name).join(", "),
      createdById: session.userId,
      members: { create: participantIds.map((userId) => ({ userId })) },
    },
  });

  // The channel list lives in the shared /chat layout, which the App
  // Router won't refetch on a same-layout navigation by itself — without
  // this, a brand-new channel wouldn't show up in the sidebar until some
  // unrelated navigation happened to remount it.
  revalidatePath("/chat", "layout");
  redirect(`/chat/${channel.id}`);
}
