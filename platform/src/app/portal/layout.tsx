import { requireClientSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PortalNav } from "@/components/PortalNav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClientSession();

  const memberships = await prisma.clientMember.findMany({
    where: { userId: session.userId },
    include: { client: { select: { name: true } } },
  });
  const clientName = memberships.length === 1 ? memberships[0].client.name : "Your";

  return (
    <div className="min-h-screen">
      <PortalNav name={session.name} clientName={clientName} />
      <main>{children}</main>
    </div>
  );
}
