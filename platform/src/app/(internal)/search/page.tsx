import Link from "next/link";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireInternalSession();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [messages, cards, projects, clients] = query
    ? await Promise.all([
        prisma.message.findMany({
          where: { body: { contains: query }, deletedAt: null },
          include: { sender: { select: { name: true } }, channel: { select: { id: true, name: true, type: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.card.findMany({
          where: { OR: [{ title: { contains: query } }, { description: { contains: query } }] },
          include: { board: { select: { project: { select: { id: true, name: true, client: { select: { name: true } } } } } } },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        prisma.project.findMany({
          where: { name: { contains: query } },
          include: { client: { select: { name: true } } },
          take: 10,
        }),
        prisma.client.findMany({ where: { name: { contains: query } }, take: 10 }),
      ])
    : [[], [], [], []];

  const totalResults = messages.length + cards.length + projects.length + clients.length;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">Search</h1>
      <p className="text-sm text-[var(--ink-soft)] mb-6">Messages, cards, projects, and clients — in one box.</p>

      <form className="mb-8">
        <input
          type="text"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Search everything…"
          className="w-full rounded-lg border border-[var(--rule)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
      </form>

      {!query ? (
        <p className="text-sm text-[var(--ink-faint)]">Start typing to search.</p>
      ) : totalResults === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">No results for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="space-y-8">
          {clients.length > 0 ? (
            <ResultGroup label="Clients">
              {clients.map((c) => (
                <ResultRow key={c.id} href={`/clients/${c.id}`} title={c.name} />
              ))}
            </ResultGroup>
          ) : null}

          {projects.length > 0 ? (
            <ResultGroup label="Projects">
              {projects.map((p) => (
                <ResultRow key={p.id} href={`/projects/${p.id}/board`} title={p.name} subtitle={p.client.name} />
              ))}
            </ResultGroup>
          ) : null}

          {cards.length > 0 ? (
            <ResultGroup label="Cards">
              {cards.map((c) => (
                <ResultRow
                  key={c.id}
                  href={`/projects/${c.board.project.id}/board/cards/${c.id}`}
                  title={c.title}
                  subtitle={`${c.board.project.client.name} · ${c.board.project.name}`}
                />
              ))}
            </ResultGroup>
          ) : null}

          {messages.length > 0 ? (
            <ResultGroup label="Messages">
              {messages.map((m) => (
                <ResultRow
                  key={m.id}
                  href={`/chat/${m.channel.id}`}
                  title={m.body}
                  subtitle={`${m.sender.name} in ${m.channel.type === "dm" || m.channel.type === "group" ? m.channel.name : `#${m.channel.name}`}`}
                />
              ))}
            </ResultGroup>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-3">{label}</h2>
      <ul className="space-y-1.5">{children}</ul>
    </section>
  );
}

function ResultRow({ href, title, subtitle }: { href: string; title: string; subtitle?: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 hover:border-[var(--accent)] transition"
      >
        <p className="text-sm font-medium text-[var(--ink)] truncate">{title}</p>
        {subtitle ? <p className="text-xs text-[var(--ink-faint)] truncate">{subtitle}</p> : null}
      </Link>
    </li>
  );
}
