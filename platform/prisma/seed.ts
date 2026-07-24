import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

try {
  process.loadEnvFile();
} catch {
  // .env is optional
}

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = "vanguard-dev-123";

async function main() {
  console.log("Seeding dev database…");
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: { name: "Ada Admin", email: "admin@vanguard.dev", passwordHash, globalRole: "admin" },
  });
  const pm = await prisma.user.create({
    data: { name: "Priya PM", email: "pm@vanguard.dev", passwordHash, globalRole: "pm" },
  });
  const teamMember = await prisma.user.create({
    data: { name: "Theo Teammate", email: "team@vanguard.dev", passwordHash, globalRole: "team_member" },
  });

  const general = await prisma.channel.create({
    data: {
      type: "department",
      name: "general",
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id, role: "owner" },
          { userId: pm.id },
          { userId: teamMember.id },
        ],
      },
    },
  });
  await prisma.channel.create({
    data: {
      type: "department",
      name: "design",
      createdById: admin.id,
      members: {
        create: [{ userId: admin.id, role: "owner" }, { userId: teamMember.id }],
      },
    },
  });

  const client = await prisma.client.create({
    data: { name: "Bluebird Bakery", status: "active" },
  });
  const clientContact = await prisma.user.create({
    data: {
      name: "Casey Client",
      email: "client@bluebird.dev",
      passwordHash,
      globalRole: "client",
      clientMemberships: { create: { clientId: client.id, clientRole: "client_admin" } },
    },
  });

  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      name: "Website Relaunch",
      description: "Full redesign of the marketing site ahead of the fall campaign.",
      ownerId: pm.id,
      board: {
        create: {
          name: "Main board",
          columns: {
            create: [
              { name: "To Do", position: 0, mapsToStatus: "todo", isClientVisible: true },
              { name: "In Progress", position: 1, mapsToStatus: "in_progress", isClientVisible: true },
              { name: "Waiting on Client", position: 2, mapsToStatus: "waiting_on_client", isClientVisible: true },
              { name: "Approved", position: 3, mapsToStatus: "approved", isClientVisible: true },
              { name: "Done", position: 4, mapsToStatus: "done", isClientVisible: true },
              { name: "Internal QA", position: 5, mapsToStatus: "in_progress", isClientVisible: false },
            ],
          },
        },
      },
    },
    include: { board: { include: { columns: true } } },
  });

  const projectChannel = await prisma.channel.create({
    data: {
      type: "project",
      name: project.name,
      clientId: client.id,
      projectId: project.id,
      createdById: pm.id,
      members: {
        create: [{ userId: pm.id, role: "owner" }, { userId: teamMember.id }, { userId: admin.id }],
      },
    },
  });

  const columns = Object.fromEntries(project.board!.columns.map((c) => [c.mapsToStatus + (c.isClientVisible ? "" : ":internal"), c]));

  const kickoff = await prisma.card.create({
    data: {
      boardId: project.board!.id,
      columnId: columns["done"].id,
      title: "Kickoff call & discovery notes",
      createdById: pm.id,
      assigneeId: pm.id,
      position: 0,
    },
  });
  await prisma.cardActivity.create({ data: { cardId: kickoff.id, actorId: pm.id, actionType: "created" } });

  const wireframes = await prisma.card.create({
    data: {
      boardId: project.board!.id,
      columnId: columns["in_progress"].id,
      title: "Draft homepage wireframes",
      priority: "high",
      createdById: pm.id,
      assigneeId: teamMember.id,
      position: 0,
    },
  });
  await prisma.cardActivity.create({ data: { cardId: wireframes.id, actorId: pm.id, actionType: "created" } });

  const homepageCopy = await prisma.card.create({
    data: {
      boardId: project.board!.id,
      columnId: columns["waiting_on_client"].id,
      title: "Homepage copy — v1",
      description: "First pass on hero, value props, and footer copy.",
      priority: "medium",
      createdById: pm.id,
      assigneeId: pm.id,
      approvalState: "pending",
      position: 0,
    },
  });
  await prisma.approval.create({ data: { cardId: homepageCopy.id, requestedById: pm.id } });
  await prisma.cardActivity.create({ data: { cardId: homepageCopy.id, actorId: pm.id, actionType: "created" } });
  await prisma.cardActivity.create({ data: { cardId: homepageCopy.id, actorId: pm.id, actionType: "approval_requested" } });
  await prisma.cardComment.create({
    data: { cardId: homepageCopy.id, authorId: pm.id, body: "First draft is ready for your review — see attached copy doc.", isInternal: false },
  });
  await prisma.cardComment.create({
    data: { cardId: homepageCopy.id, authorId: teamMember.id, body: "Heads up, legal still needs to sign off on the pricing claim in paragraph 2.", isInternal: true },
  });
  await prisma.notification.create({
    data: { userId: clientContact.id, type: "approval_requested", entityType: "card", entityId: homepageCopy.id },
  });

  const logoRefresh = await prisma.card.create({
    data: {
      boardId: project.board!.id,
      columnId: columns["approved"].id,
      title: "Logo refresh",
      priority: "low",
      createdById: pm.id,
      approvalState: "approved",
      position: 0,
    },
  });
  const logoApproval = await prisma.approval.create({
    data: { cardId: logoRefresh.id, requestedById: pm.id, decision: "approved", decidedById: clientContact.id, decidedAt: new Date() },
  });
  await prisma.cardActivity.create({ data: { cardId: logoRefresh.id, actorId: pm.id, actionType: "created" } });
  await prisma.cardActivity.create({ data: { cardId: logoRefresh.id, actorId: pm.id, actionType: "approval_requested" } });
  await prisma.cardActivity.create({ data: { cardId: logoRefresh.id, actorId: clientContact.id, actionType: "approved" } });
  void logoApproval;

  const internalQaCard = await prisma.card.create({
    data: {
      boardId: project.board!.id,
      columnId: columns["in_progress:internal"].id,
      title: "Cross-browser QA pass",
      priority: "medium",
      createdById: teamMember.id,
      assigneeId: teamMember.id,
      isClientFacing: false,
      position: 0,
    },
  });
  await prisma.cardActivity.create({ data: { cardId: internalQaCard.id, actorId: teamMember.id, actionType: "created" } });

  const generalMsg1 = await prisma.message.create({
    data: { channelId: general.id, senderId: admin.id, body: "Welcome to the new workspace — this replaces Slack for internal chat." },
  });
  await prisma.channelMember.updateMany({ where: { channelId: general.id, userId: admin.id }, data: { lastReadAt: generalMsg1.createdAt } });

  const generalMsg2 = await prisma.message.create({
    data: { channelId: general.id, senderId: pm.id, body: "@Theo can you take a look at the Bluebird wireframes today?" },
  });
  await prisma.mention.create({ data: { messageId: generalMsg2.id, mentionedUserId: teamMember.id } });
  await prisma.notification.create({
    data: { userId: teamMember.id, type: "mention", entityType: "message", entityId: generalMsg2.id },
  });

  await prisma.message.create({
    data: { channelId: projectChannel.id, senderId: pm.id, body: "Homepage copy is up for client review — flagged in the Bluebird board." },
  });

  await prisma.auditLog.createMany({
    data: [
      { actorId: admin.id, action: "client_created", entityType: "client", entityId: client.id, metadata: JSON.stringify({ name: client.name }) },
      { actorId: pm.id, action: "project_created", entityType: "project", entityId: project.id, metadata: JSON.stringify({ name: project.name }) },
      { actorId: pm.id, action: "client_invited", entityType: "client", entityId: client.id, metadata: JSON.stringify({ invitedUserId: clientContact.id, email: clientContact.email }) },
    ],
  });

  console.log("\nSeeded accounts (all share one dev password):");
  console.log(`  Password: ${DEV_PASSWORD}`);
  console.log(`  Admin:        ${admin.email}`);
  console.log(`  PM:           ${pm.email}`);
  console.log(`  Team member:  ${teamMember.email}`);
  console.log(`  Client:       ${clientContact.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
