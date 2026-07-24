import Link from "next/link";
import { requireInternalSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canCreateProjects } from "@/lib/roles";
import { NewProjectForm } from "@/components/NewProjectForm";

export default async function ProjectsPage() {
  const session = await requireInternalSession();

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Projects</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Every client engagement, one board each.</p>
        </div>
      </div>

      {canCreateProjects(session.globalRole) ? (
        <div className="mb-8">
          <NewProjectForm clients={clients} />
        </div>
      ) : null}

      {projects.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">No projects yet.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}/board`}
                className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)] transition"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{project.name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">{project.client.name}</p>
                </div>
                <span className="text-xs font-medium text-[var(--ink-soft)] capitalize">
                  {project.status.replace("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
