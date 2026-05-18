import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { RIGHT_TO_AI, RIGHT_TO_AI_PROJECTS } from "@/lib/initiatives";
import type { AtlasStats } from "@/lib/types";

type InitiativeStripProps = {
  stats: AtlasStats;
};

const indexProject = RIGHT_TO_AI_PROJECTS.find((project) => project.id === "ai-pluralism-index");

export function InitiativeStrip({ stats }: InitiativeStripProps) {
  return (
    <section className="rounded-lg border border-border/55 bg-surface/95 px-4 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-center">
        <div className="space-y-2">
          <div className="meta-label">{RIGHT_TO_AI.name} project</div>
          <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Participatory AI Atlas
          </h1>
          <p className="max-w-3xl text-sm text-subtle">
            A Right to AI project mapping {stats.dataDerived.totalProjects} participatory AI records across{" "}
            {stats.dataDerived.normalizedCountries} countries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/initiatives"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-surface-soft hover:text-accent"
          >
            View projects
            <ArrowRight className="h-4 w-4" />
          </Link>
          {indexProject ? (
            <a
              href={indexProject.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-surface-soft hover:text-accent"
            >
              AI Pluralism Index
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
