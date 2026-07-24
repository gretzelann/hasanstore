import Link from "next/link";
import {
  addCommentAction,
  requestApprovalAction,
  decideApprovalAction,
} from "@/lib/board-actions";
import { CARD_STATUS_LABELS, type CardStatus } from "@/lib/roles";

type Comment = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  author: { name: string };
};
type Activity = {
  id: string;
  actionType: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: Date;
  actor: { name: string };
};
type CardData = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  approvalState: string;
  column: { name: string; mapsToStatus: string };
  assignee: { name: string } | null;
};

export function CardDetail({
  projectId,
  card,
  comments,
  activity,
  isInternalViewer,
  canRequestApproval,
  canDecideApproval,
  redirectTo,
  backHref,
  backLabel,
}: {
  projectId: string;
  card: CardData;
  comments: Comment[];
  activity: Activity[];
  isInternalViewer: boolean;
  canRequestApproval: boolean;
  canDecideApproval: boolean;
  redirectTo: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <Link href={backHref} className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
        ← {backLabel}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-[var(--ink)]">{card.title}</h1>
        <ApprovalBadge state={card.approvalState} />
      </div>

      <div className="flex flex-wrap gap-2 mt-3 text-xs text-[var(--ink-soft)]">
        <span className="rounded-full bg-[var(--surface)] border border-[var(--rule)] px-2.5 py-1">
          {CARD_STATUS_LABELS[card.column.mapsToStatus as CardStatus] ?? card.column.name}
        </span>
        <span className="rounded-full bg-[var(--surface)] border border-[var(--rule)] px-2.5 py-1 capitalize">
          {card.priority} priority
        </span>
        {card.assignee ? (
          <span className="rounded-full bg-[var(--surface)] border border-[var(--rule)] px-2.5 py-1">
            {card.assignee.name}
          </span>
        ) : null}
      </div>

      {card.description ? <p className="text-sm text-[var(--ink)] mt-4">{card.description}</p> : null}

      {canRequestApproval ? (
        <form action={requestApprovalAction} className="mt-6">
          <input type="hidden" name="cardId" value={card.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90"
          >
            Request client approval
          </button>
        </form>
      ) : null}

      {canDecideApproval ? (
        <form action={decideApprovalAction} className="mt-6 rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4 space-y-3">
          <input type="hidden" name="cardId" value={card.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <p className="text-sm font-medium text-[var(--ink)]">This deliverable is waiting on your decision</p>
          <textarea
            name="notes"
            rows={2}
            placeholder="Notes for the team (optional)"
            className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              name="decision"
              value="approved"
              className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:opacity-90"
            >
              Approve
            </button>
            <button
              type="submit"
              name="decision"
              value="changes_requested"
              className="rounded-lg bg-white border border-[var(--rule)] text-[var(--ink)] text-sm font-medium px-4 py-2 hover:border-[var(--accent)]"
            >
              Request changes
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">Comments</h2>
        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)]">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--ink)]">{c.author.name}</span>
                  <span className="text-xs text-[var(--ink-faint)]">{formatDateTime(c.createdAt)}</span>
                  {c.isInternal ? (
                    <span className="text-[10px] font-semibold rounded px-1.5 py-0.5 bg-slate-100 text-slate-600">
                      Internal only
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{c.body}</p>
              </div>
            ))
          )}
        </div>
        <form action={addCommentAction} className="space-y-2">
          <input type="hidden" name="cardId" value={card.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <textarea
            name="body"
            required
            rows={2}
            placeholder={isInternalViewer ? "Add a comment…" : "Add a comment for the team…"}
            className="w-full rounded-lg border border-[var(--rule)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="flex items-center justify-between">
            {isInternalViewer ? (
              <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                <input type="checkbox" name="isInternal" className="rounded" />
                Internal only (hidden from client)
              </label>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90"
            >
              Comment
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">Activity</h2>
        <ul className="space-y-2">
          {activity.map((a) => (
            <li key={a.id} className="text-xs text-[var(--ink-faint)]">
              <span className="font-medium text-[var(--ink-soft)]">{a.actor.name}</span>{" "}
              {describeActivity(a)} <span>· {formatDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ApprovalBadge({ state }: { state: string }) {
  if (state === "none") return null;
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    changes_requested: "bg-red-50 text-red-700",
  };
  const label: Record<string, string> = {
    pending: "Awaiting client decision",
    approved: "Approved",
    changes_requested: "Changes requested",
  };
  return (
    <span className={`text-xs font-medium rounded-full px-3 py-1.5 whitespace-nowrap ${map[state]}`}>
      {label[state]}
    </span>
  );
}

function describeActivity(a: Activity) {
  switch (a.actionType) {
    case "created":
      return "created this card";
    case "moved":
      return `moved this from ${a.fromValue} to ${a.toValue}`;
    case "commented":
      return "commented";
    case "approval_requested":
      return "requested client approval";
    case "approved":
      return "approved this deliverable";
    case "changes_requested":
      return "requested changes";
    default:
      return a.actionType;
  }
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
