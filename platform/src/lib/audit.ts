import "server-only";
import { prisma } from "./prisma";

type AuditEntry = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/** Append-only. Never update or delete audit log rows — that's what makes them trustworthy. */
export async function writeAuditLog(entry: AuditEntry) {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    },
  });
}
