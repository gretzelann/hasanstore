import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function Index() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(isInternalRole(session.globalRole) ? "/home" : "/portal/home");
}
