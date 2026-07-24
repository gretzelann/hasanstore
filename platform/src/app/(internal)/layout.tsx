import { requireInternalSession } from "@/lib/access";
import { Sidebar } from "@/components/Sidebar";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireInternalSession();

  return (
    <div className="flex min-h-screen">
      <Sidebar session={session} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
