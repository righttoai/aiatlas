import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { getProjects, getStats } from "@/lib/data";

export default async function HomePage() {
  const [projects, stats] = await Promise.all([getProjects(), getStats()]);

  return (
    <div className="page-shell-wide py-2 sm:py-3">
      <section id="atlas-explorer">
        <AtlasExplorer projects={projects} stats={stats} />
      </section>
    </div>
  );
}
