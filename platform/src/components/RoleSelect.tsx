"use client";

import { useTransition } from "react";
import { updateUserRoleAction } from "@/lib/admin-actions";
import { GLOBAL_ROLES } from "@/lib/roles";

const INTERNAL_ROLES = GLOBAL_ROLES.filter((r) => r !== "client");

export function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData: FormData) => startTransition(() => updateUserRoleAction(formData))}
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      <input type="hidden" name="userId" value={userId} />
      <select
        name="globalRole"
        defaultValue={currentRole}
        disabled={disabled || isPending}
        className="rounded-lg border border-[var(--rule)] px-2.5 py-1.5 text-xs bg-white capitalize disabled:opacity-60"
      >
        {INTERNAL_ROLES.map((role) => (
          <option key={role} value={role}>
            {role.replace("_", " ")}
          </option>
        ))}
      </select>
    </form>
  );
}
