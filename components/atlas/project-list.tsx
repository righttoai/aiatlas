"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AtlasProject } from "@/lib/types";
import { truncate } from "@/lib/utils";

type ProjectListProps = {
  projects: AtlasProject[];
  selectedSlugs: Set<string>;
  selectedLocationLabel: string | null;
  onClearSelection: () => void;
};

const DEFAULT_VISIBLE = 24;

export function ProjectList({
  projects,
  selectedSlugs,
  selectedLocationLabel,
  onClearSelection
}: ProjectListProps) {
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE);
  }, [projects.length, selectedLocationLabel]);

  const visibleProjects = useMemo(() => projects.slice(0, visibleCount), [projects, visibleCount]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Records</div>
          <h2 className="mt-1 text-[1.65rem] font-semibold leading-tight text-foreground sm:text-[1.95rem]">
            Project records
          </h2>
          <p className="mt-1 text-sm text-subtle">
            {projects.length} shown
            {selectedLocationLabel ? ` · ${selectedLocationLabel}` : ""}
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-subtle">
            These records include participatory AI projects and participation for AI: work on AI and work that helps shape AI systems, data, models, governance, and oversight.
          </p>
        </div>
        {selectedLocationLabel ? (
          <Button variant="secondary" size="sm" onClick={onClearSelection}>
            Clear focus
          </Button>
        ) : null}
      </div>

      {!projects.length ? (
        <Card>
          <h3 className="text-xl text-foreground">No matching records</h3>
          <p className="mt-3 text-sm text-subtle">Clear a filter or broaden the search.</p>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleProjects.map((project) => {
          const selected = selectedSlugs.has(project.slug);

          return (
            <Card key={project.slug} className={selected ? "border-accent/30 bg-surface-soft/92" : undefined}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selected ? (
                      <Badge variant="accent">
                        <Pin className="mr-1 h-3 w-3" />
                        Focus
                      </Badge>
                    ) : null}
                    {project.participationDocumented ? (
                      <Badge variant="success">Documented</Badge>
                    ) : (
                      <Badge variant="outline">Unspecified</Badge>
                    )}
                    {project.category ? <Badge variant="neutral">{project.category}</Badge> : null}
                  </div>

                  <div>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="text-xl font-medium leading-tight text-foreground transition hover:text-accent"
                    >
                      {project.projectName}
                    </Link>
                    <p className="mt-2 text-sm text-subtle">
                      {[project.city, project.countryNormalized ?? project.country].filter(Boolean).join(", ") ||
                        "Location not documented"}
                    </p>
                  </div>
                </div>

                {project.provenanceUrl ? (
                  <a
                    href={project.provenanceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md border border-border/50 bg-surface px-3 py-2 text-sm text-subtle transition hover:border-border/70 hover:bg-surface-soft hover:text-accent sm:w-auto sm:justify-start"
                  >
                    Source
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.13em] text-faint">Lead organization</div>
                  <div className="mt-1 text-muted">{project.leadOrg || "Not documented"}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.13em] text-faint">Organization type</div>
                  <div className="mt-1 text-muted">{project.organizationType}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.13em] text-faint">Start year</div>
                  <div className="mt-1 text-muted">{project.startYear ? project.startYear : "Not documented"}</div>
                </div>
              </div>

              {project.description ? (
                <p className="mt-5 text-sm text-muted">{truncate(project.description, 140)}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {project.technologyGroup ? <Badge variant="neutral">{project.technologyGroup}</Badge> : null}
                {project.activityStatusGroup ? <Badge variant="neutral">{project.activityStatusGroup}</Badge> : null}
              </div>

              <div className="mt-5 flex flex-col items-start gap-3 border-t border-border/45 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/projects/${project.slug}`} className="text-sm font-medium text-accent">
                  Open record
                </Link>
                {project.projectDocumentationLink ? (
                  <a
                    href={project.projectDocumentationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-subtle transition hover:text-accent"
                  >
                    Documentation
                  </a>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {visibleCount < projects.length ? (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={() => setVisibleCount((count) => count + DEFAULT_VISIBLE)}>
            Show more records
          </Button>
        </div>
      ) : null}
    </div>
  );
}
