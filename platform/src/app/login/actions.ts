"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { isInternalRole } from "@/lib/roles";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user || user.status === "disabled") {
    return { error: "That email and password don't match an active account." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "That email and password don't match an active account." };
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    globalRole: user.globalRole as import("@/lib/roles").GlobalRole,
  });
  await setSessionCookie(token);
  await writeAuditLog({
    actorId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
  });

  redirect(isInternalRole(user.globalRole as import("@/lib/roles").GlobalRole) ? "/home" : "/portal/home");
}
