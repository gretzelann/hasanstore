// Central definitions for the string-typed "enum" columns in schema.prisma.
// Keeping the union types here means the DB stays portable (SQLite has no
// native enum) while the app still gets exhaustive type checking.

export const GLOBAL_ROLES = ["admin", "pm", "team_member", "client"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const CLIENT_ROLES = ["client_admin", "client_collaborator"] as const;
export type ClientRole = (typeof CLIENT_ROLES)[number];

export const CARD_STATUSES = [
  "todo",
  "in_progress",
  "waiting_on_client",
  "approved",
  "done",
] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on Client",
  approved: "Approved",
  done: "Done",
};

export const DEFAULT_BOARD_COLUMNS: Array<{
  name: string;
  mapsToStatus: CardStatus;
  isClientVisible: boolean;
}> = [
  { name: "To Do", mapsToStatus: "todo", isClientVisible: true },
  { name: "In Progress", mapsToStatus: "in_progress", isClientVisible: true },
  { name: "Waiting on Client", mapsToStatus: "waiting_on_client", isClientVisible: true },
  { name: "Approved", mapsToStatus: "approved", isClientVisible: true },
  { name: "Done", mapsToStatus: "done", isClientVisible: true },
];

/** Internal roles that can see every channel/project, not just assigned ones. */
export function isInternalRole(role: GlobalRole): boolean {
  return role === "admin" || role === "pm" || role === "team_member";
}

export function isClientRole(role: GlobalRole): boolean {
  return role === "client";
}

/** Can manage clients, users, and see the audit log. */
export function canManageWorkspace(role: GlobalRole): boolean {
  return role === "admin" || role === "pm";
}

export function canCreateProjects(role: GlobalRole): boolean {
  return role === "admin" || role === "pm";
}

/** Can decide (approve / request changes) on a card's approval, for the given client. */
export function canDecideApproval(role: GlobalRole): boolean {
  return isClientRole(role);
}
