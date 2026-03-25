import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getProjects } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/atlas",
    "/contribute"
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    lastModified: new Date(project.lastUpdated),
    changeFrequency: "monthly",
    priority: 0.6
  }));

  return [...staticRoutes, ...projectRoutes];
}
