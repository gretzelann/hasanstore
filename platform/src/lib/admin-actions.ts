"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireInternalSession } from "./access";
import { writeAuditLog } from "./audit";
import { GLOBAL_ROLES } from "./roles";

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  globalRole: z.enum(GLOBAL_ROLES),
});

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireInternalSession();
  if (session.globalRole !== "admin") return;

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    globalRole: formData.get("globalRole"),
  });
  if (!parsed.success) return;

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target || target.globalRole === parsed.data.globalRole) return;

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { globalRole: parsed.data.globalRole },
  });

  await writeAuditLog({
    actorId: session.userId,
    action: "role_changed",
    entityType: "user",
    entityId: target.id,
    metadata: { from: target.globalRole, to: parsed.data.globalRole },
  });

  revalidatePath("/admin/users");
}
