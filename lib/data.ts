import "server-only";

import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import type { AtlasProject, AtlasRelease, AtlasSchema, AtlasStats } from "@/lib/types";

const GENERATED_DATA_DIR = path.join(process.cwd(), "data", "generated");

async function readGeneratedJson<T>(fileName: "projects.json" | "stats.json" | "releases.json" | "schema.json") {
  const file = await fs.readFile(path.join(GENERATED_DATA_DIR, fileName), "utf8");
  return JSON.parse(file) as T;
}

export const getProjects = cache(async () => {
  return readGeneratedJson<AtlasProject[]>("projects.json");
});

export const getStats = cache(async () => {
  return readGeneratedJson<AtlasStats>("stats.json");
});

export const getReleases = cache(async () => {
  return readGeneratedJson<AtlasRelease[]>("releases.json");
});

export const getSchema = cache(async () => {
  return readGeneratedJson<AtlasSchema>("schema.json");
});

export async function getProjectBySlug(slug: string) {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getRelatedProjects(project: AtlasProject, limit = 4) {
  const projects = await getProjects();

  return projects
    .filter((candidate) => candidate.slug !== project.slug)
    .map((candidate) => {
      let score = 0;
      if (candidate.countryNormalized && candidate.countryNormalized === project.countryNormalized) score += 4;
      if (candidate.category && candidate.category === project.category) score += 3;
      if (candidate.region === project.region) score += 2;
      if (candidate.organizationType === project.organizationType) score += 1;
      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.projectName.localeCompare(b.candidate.projectName);
    })
    .slice(0, limit)
    .map((item) => item.candidate);
}
