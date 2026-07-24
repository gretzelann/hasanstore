"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireInternalSession } from "./access";
import { hashPassword } from "./auth";
import { writeAuditLog } from "./audit";
import { canManageWorkspace, CLIENT_ROLES } from "./roles";

const createClientSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

export async function createClientAction(formData: FormData) {
  const session = await requireInternalSession();
  if (!canManageWorkspace(session.globalRole)) return;

  const parsed = createClientSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  const client = await prisma.client.create({ data: { name: parsed.data.name } });

  await writeAuditLog({
    actorId: session.userId,
    action: "client_created",
    entityType: "client",
    entityId: client.id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

function generateTempPassword() {
  return randomBytes(9).toString("base64url"); // 12 url-safe chars
}

const inviteContactSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  email: z.string().email(),
  clientRole: z.enum(CLIENT_ROLES),
});

export type InviteContactState = { error?: string; success?: { email: string; tempPassword: string } };

export async function inviteClientContactAction(
  _prev: InviteContactState,
  formData: FormData,
): Promise<InviteContactState> {
  const session = await requireInternalSession();
  if (!canManageWorkspace(session.globalRole)) {
    return { error: "You don't have permission to invite client contacts." };
  }

  const parsed = inviteContactSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    email: formData.get("email"),
    clientRole: formData.get("clientRole"),
  });
  if (!parsed.success) return { error: "Fill in a name, valid email, and role." };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { error: "That email is already in use." };

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      globalRole: "client",
      status: "invited",
      clientMemberships: {
        create: { clientId: parsed.data.clientId, clientRole: parsed.data.clientRole },
      },
    },
  });

  await prisma.client.update({
    where: { id: parsed.data.clientId },
    data: { status: "active" },
  });

  await writeAuditLog({
    actorId: session.userId,
    action: "client_invited",
    entityType: "client",
    entityId: parsed.data.clientId,
    metadata: { invitedUserId: user.id, email: user.email, clientRole: parsed.data.clientRole },
  });

  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { success: { email: user.email, tempPassword } };
}
