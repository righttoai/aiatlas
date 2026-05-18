import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { InitiativeStrip } from "@/components/initiatives/initiative-strip";
import { getProjects, getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Atlas",
  description: "Interactive atlas with map, filters, and record pages for documented participatory AI projects."
};

export default async function AtlasPage() {
  const [projects, stats] = await Promise.all([getProjects(), getStats()]);

  return (
    <div className="page-shell-wide space-y-4 py-2 sm:space-y-5 sm:py-3">
      <InitiativeStrip stats={stats} />
      <AtlasExplorer projects={projects} stats={stats} />
    </div>
  );
}
