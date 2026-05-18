import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { InitiativeStrip } from "@/components/initiatives/initiative-strip";
import { getProjects, getStats } from "@/lib/data";

export default async function HomePage() {
  const [projects, stats] = await Promise.all([getProjects(), getStats()]);

  return (
    <div className="page-shell-wide space-y-4 py-2 sm:space-y-5 sm:py-3">
      <InitiativeStrip stats={stats} />
      <section id="atlas-explorer">
        <AtlasExplorer projects={projects} stats={stats} />
      </section>
    </div>
  );
}
