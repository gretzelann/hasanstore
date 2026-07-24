import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(isInternalRole(session.globalRole) ? "/home" : "/portal/home");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)] text-white font-semibold text-sm mb-4">
            V
          </div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Sign in to Vanguard</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Team workspace &amp; client portal</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
