import Link from "next/link";
import { ArrowRight, ExternalLink, Layers2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RIGHT_TO_AI, RIGHT_TO_AI_PROJECTS } from "@/lib/initiatives";
import type { AtlasStats } from "@/lib/types";

type InitiativeNetworkProps = {
  stats: AtlasStats;
};

export function InitiativeNetwork({ stats }: InitiativeNetworkProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border/55 bg-surface/95 px-5 py-7 sm:px-7 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),21rem] lg:items-end">
          <div className="space-y-5">
            <div className="meta-label">{RIGHT_TO_AI.label}</div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-balance text-4xl font-medium leading-tight text-foreground sm:text-5xl">
                {RIGHT_TO_AI.name}
              </h1>
              <p className="max-w-2xl text-base text-muted sm:text-lg">
                The nonprofit behind the Participatory AI Atlas and the AI Pluralism Index.
              </p>
            </div>
            <a
              href={RIGHT_TO_AI.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-surface-soft px-4 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-surface-strong hover:text-accent"
            >
              Visit The Right to AI
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border/45 bg-surface-soft px-4 py-4">
              <div className="meta-label">Records</div>
              <div className="mt-3 text-3xl font-semibold text-foreground">{stats.dataDerived.totalProjects}</div>
            </div>
            <div className="rounded-md border border-border/45 bg-surface-soft px-4 py-4">
              <div className="meta-label">Countries</div>
              <div className="mt-3 text-3xl font-semibold text-foreground">
                {stats.dataDerived.normalizedCountries}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {RIGHT_TO_AI_PROJECTS.map((project) => {
          const content = (
            <Card className="flex min-h-64 flex-col justify-between transition hover:border-border/80 hover:bg-surface-soft">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/65 bg-surface-soft text-accent">
                  <Layers2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="meta-label">{project.label}</div>
                  <h2 className="mt-2 text-3xl font-medium leading-tight text-foreground">{project.name}</h2>
                </div>
                <p className="max-w-md text-sm text-muted">{project.description}</p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent">
                {project.external ? "Open project" : "Explore atlas"}
                {project.external ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </span>
            </Card>
          );

          return project.external ? (
            <a key={project.id} href={project.href} target="_blank" rel="noreferrer">
              {content}
            </a>
          ) : (
            <Link key={project.id} href={project.href}>
              {content}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
