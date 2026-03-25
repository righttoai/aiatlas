import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { getProjects, getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Atlas",
  description: "Interactive atlas with map, filters, and record pages for documented participatory AI projects."
};

export default async function AtlasPage() {
  const [projects, stats] = await Promise.all([getProjects(), getStats()]);

  return (
    <div className="page-shell-wide py-2 sm:py-3">
      <AtlasExplorer projects={projects} stats={stats} />
    </div>
  );
}
