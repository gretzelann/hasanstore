"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { moveCardAction, createCardAction } from "@/lib/board-actions";
import { CARD_STATUS_LABELS, type CardStatus } from "@/lib/roles";

type CardRow = {
  id: string;
  title: string;
  priority: string;
  approvalState: string;
  dueDate: Date | null;
  assignee: { id: string; name: string } | null;
};
type ColumnRow = {
  id: string;
  name: string;
  mapsToStatus: string;
  cards: CardRow[];
};

export function Board({
  project,
  board,
}: {
  project: { id: string };
  board: { id: string; columns: ColumnRow[] };
}) {
  const [, startTransition] = useTransition();
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  function handleDrop(columnId: string) {
    setDragOverColumn(null);
    if (!dragCardId) return;
    const cardId = dragCardId;
    setDragCardId(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("cardId", cardId);
      formData.set("toColumnId", columnId);
      formData.set("projectId", project.id);
      await moveCardAction(formData);
    });
  }

  return (
    <div className="flex gap-4 h-full px-6 py-5 min-w-max">
      {board.columns.map((column) => (
        <div
          key={column.id}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(column.id);
          }}
          onDragLeave={() => setDragOverColumn((c) => (c === column.id ? null : c))}
          onDrop={() => handleDrop(column.id)}
          className={`w-72 shrink-0 flex flex-col rounded-xl border bg-[var(--paper)] transition ${
            dragOverColumn === column.id ? "border-[var(--accent)]" : "border-[var(--rule)]"
          }`}
        >
          <div className="px-3 py-2.5 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide">
              {CARD_STATUS_LABELS[column.mapsToStatus as CardStatus] ?? column.name}
            </h3>
            <span className="text-xs text-[var(--ink-faint)]">{column.cards.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-2">
            {column.cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => setDragCardId(card.id)}
                onDragEnd={() => setDragCardId(null)}
              >
                <CardPill projectId={project.id} card={card} />
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-[var(--rule)]">
            <NewCardInline boardId={board.id} columnId={column.id} projectId={project.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardPill({ projectId, card }: { projectId: string; card: CardRow }) {
  const priorityColor: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-50 text-blue-700",
    high: "bg-amber-50 text-amber-700",
    urgent: "bg-red-50 text-red-700",
  };

  return (
    <Link
      href={`/projects/${projectId}/board/cards/${card.id}`}
      className="block rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5 text-sm shadow-sm hover:border-[var(--accent)] transition cursor-grab active:cursor-grabbing"
    >
      <p className="font-medium text-[var(--ink)] mb-1.5">{card.title}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 capitalize ${priorityColor[card.priority]}`}>
            {card.priority}
          </span>
          {card.approvalState === "pending" ? (
            <span className="text-[10px] font-medium rounded px-1.5 py-0.5 bg-amber-50 text-amber-700">
              Awaiting client
            </span>
          ) : null}
          {card.approvalState === "approved" ? (
            <span className="text-[10px] font-medium rounded px-1.5 py-0.5 bg-emerald-50 text-emerald-700">
              Approved
            </span>
          ) : null}
        </div>
        {card.assignee ? (
          <span
            title={card.assignee.name}
            className="w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-[9px] font-semibold flex items-center justify-center shrink-0"
          >
            {card.assignee.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function NewCardInline({ boardId, columnId, projectId }: { boardId: string; columnId: string; projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");

  return (
    <form
      action={(formData: FormData) =>
        startTransition(async () => {
          await createCardAction(formData);
          setValue("");
        })
      }
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="columnId" value={columnId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="+ Add a card"
        disabled={isPending}
        className="w-full rounded-md px-2 py-1.5 text-sm bg-transparent hover:bg-[var(--surface)] focus:bg-[var(--surface)] border border-transparent focus:border-[var(--rule)] outline-none transition"
      />
    </form>
  );
}
