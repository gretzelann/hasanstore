# Vanguard Platform

Phase 0/1 implementation of the Slack-replacement + client project management
system described in [`../docs/vanguard-platform-spec.md`](../docs/vanguard-platform-spec.md).
Next.js (App Router) + Prisma, one codebase for the internal workspace and the
client portal, gated by role.

## What's here

- **Auth** — email/password, signed session cookie (jose), role-based route
  gating both in middleware (`src/proxy.ts`) and per-page
  (`src/lib/access.ts`) — defense in depth, not just a hidden nav item.
- **Chat** — department/project channels, DMs-ready schema, threads,
  reactions, @mentions with notifications, unread counts. Live updates are a
  4–6s background poll (`components/LivePoll.tsx`), a stand-in for the
  WebSocket gateway in the architecture spec — see "Known simplifications."
- **Boards** — native Kanban per project (To Do / In Progress / Waiting on
  Client / Approved / Done), drag-and-drop via the HTML5 DnD API, card
  activity timeline, comments with a server-enforced `isInternal` flag.
- **Approvals** — a PM requests approval on a card; the client decides
  (approve / request changes) from the portal. Every step writes to the
  card's activity log, so the trail is visible to both sides.
- **Clients & portal** — admin/PM creates a client and invites a contact
  (temporary password shown once — see below); the client only ever sees
  `/portal/*`, scoped to their own client's projects, with internal-only
  columns/comments filtered server-side.
- **Audit log** — append-only, written on login, role changes, client
  creation/invites, and approval decisions. Visible at `/admin/users`
  (admin only).

## Setup

```bash
npm install
cp .env.example .env        # then edit SESSION_SECRET
npm run db:push             # creates prisma/dev.db (SQLite)
npm run db:seed             # seeds demo accounts + a sample client/project
npm run dev
```

Seed accounts (all share one password — printed by the seed script):

| Role | Email |
|---|---|
| Admin | `admin@vanguard.dev` |
| PM | `pm@vanguard.dev` |
| Team member | `team@vanguard.dev` |
| Client (Bluebird Bakery) | `client@bluebird.dev` |

To wipe and reseed: `npm run db:reset`.

## Known simplifications (intentional, see spec for the real Phase 1/2 scope)

- **No WebSocket gateway yet.** Chat/board views refresh via polling
  (`LivePoll`), not the Redis-backed realtime layer in the architecture
  diagram. Swap it in without touching data model or permissions.
- **No email provider wired up.** Client invites generate a temporary
  password shown once in the UI instead of a signed emailed invite link.
  `inviteClientContactAction` in `src/lib/client-actions.ts` is the place to
  swap in real email delivery.
- **Client scoping is per-client, not per-project.** A Client Collaborator
  today sees every project under their client, same as a Client Admin — the
  spec's narrower per-project scoping needs a `client_member_projects` join
  table, deferred until there's a real need for it.
- **SQLite in dev, Postgres in production.** `prisma/schema.prisma` uses
  `provider = "sqlite"` so this runs with zero external infra. Swap to
  `postgresql` + a real connection string in `prisma.config.ts` for
  production (the string-typed "enum" columns can become native Postgres
  enums at that point if desired).
- **No file uploads yet.** `File`/`CardAttachment`/`MessageAttachment`
  tables exist in the schema; the upload UI and object-storage wiring
  (Cloudflare R2 per the spec) aren't built yet.
