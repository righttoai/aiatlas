import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Link2 } from "lucide-react";
import { CommunityPanel } from "@/components/projects/community-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProjectBySlug, getProjects, getRelatedProjects } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Record not found"
    };
  }

  return {
    title: project.projectName,
    description:
      project.description ??
      `Project record for ${project.projectName}.`
  };
}

function normalizeExternalLink(href: string) {
  try {
    const url = new URL(href);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.host}${pathname}${url.search}`.toLowerCase();
  } catch {
    return href.trim().replace(/\/+$/, "").toLowerCase();
  }
}

function DetailRow({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/70 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm text-faint">{label}</dt>
      <dd className="max-w-none text-left text-sm text-muted sm:max-w-[62%] sm:text-right">{value}</dd>
    </div>
  );
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const relatedProjects = await getRelatedProjects(project);
  const location =
    [project.city, project.countryNormalized ?? project.country].filter(Boolean).join(", ") || "Location not documented";
  const externalLinks: Array<{ label: string; href: string }> = [];
  const seenLinks = new Set<string>();

  function addLink(label: string, href: string | null | undefined) {
    if (!href) return;
    const normalized = normalizeExternalLink(href);
    if (seenLinks.has(normalized)) return;
    seenLinks.add(normalized);
    externalLinks.push({ label, href });
  }

  addLink("Source", project.provenanceUrl);
  addLink("Documentation", project.projectDocumentationLink);
  project.additionalLinks.forEach((href, index) => {
    addLink(`Link ${index + 1}`, href);
  });

  return (
    <div className="page-shell space-y-12 py-10 sm:py-14">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr),22rem] lg:items-start">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {project.category ? <Badge variant="accent">{project.category}</Badge> : null}
            {project.secondaryCategory ? <Badge variant="outline">{project.secondaryCategory}</Badge> : null}
            <Badge variant={project.participationDocumented ? "success" : "outline"}>
              {project.participationDocumented ? "Participation documented" : "Mechanism unspecified"}
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="max-w-4xl text-balance text-4xl font-medium leading-tight sm:text-5xl">
              {project.projectName}
            </h1>
            <p className="text-base text-subtle sm:text-lg">{location}</p>
            {project.description ? <p className="max-w-3xl text-base text-muted sm:text-lg">{project.description}</p> : null}
          </div>

          {project.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {project.provenanceUrl ? (
              <a
                href={project.provenanceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface px-4 py-2 text-sm text-foreground transition hover:border-border hover:bg-surface-soft hover:text-accent"
              >
                Source
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
            {project.projectDocumentationLink ? (
              <a
                href={project.projectDocumentationLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface px-4 py-2 text-sm text-foreground transition hover:border-border hover:bg-surface-soft hover:text-accent"
              >
                Documentation
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <Card>
          <div className="meta-label">Overview</div>
          <dl className="mt-5 space-y-3">
            <DetailRow label="Region" value={project.region} />
            <DetailRow label="Lead organization" value={project.leadOrg || "Not documented"} />
            <DetailRow label="Organization type" value={project.organizationType} />
            <DetailRow label="Technology group" value={project.technologyGroup} />
            <DetailRow label="Activity status" value={project.activityStatus || project.activityStatusGroup} />
            <DetailRow label="Start year" value={project.startYear ? project.startYear.toString() : "Not documented"} />
            <DetailRow label="Last updated" value={formatDate(project.lastUpdated)} />
          </dl>
        </Card>
      </section>

      <section className={`grid gap-6 ${externalLinks.length ? "lg:grid-cols-[1fr,1fr]" : ""}`}>
        <Card>
          <div className="meta-label">Details</div>
          <dl className="mt-5 space-y-3">
            <DetailRow label="Participation mode" value={project.participationMode || "Not documented"} />
            <DetailRow label="Participation group" value={project.participationModeGroup} />
            <DetailRow label="Technology description" value={project.technology || "Not documented"} />
            <DetailRow label="Funding" value={project.funding || "Not documented"} />
            <DetailRow label="Region of activity" value={project.regionProjectActivity || "Not documented"} />
          </dl>
        </Card>

        {externalLinks.length ? (
          <Card>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              Links
            </div>

            <div className="mt-5 space-y-3">
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 rounded-md border border-border/50 bg-surface-soft px-4 py-3 text-sm text-foreground transition hover:border-border/70 hover:bg-surface-strong"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-4 w-4 text-accent" />
                </a>
              ))}
            </div>
          </Card>
        ) : null}
      </section>

      <CommunityPanel projectSlug={project.slug} projectName={project.projectName} />

      {relatedProjects.length ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-medium text-foreground">Related records</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {relatedProjects.map((related) => (
              <Card key={related.slug}>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {related.category ? <Badge variant="neutral">{related.category}</Badge> : null}
                    <Badge variant="outline">{related.region}</Badge>
                  </div>
                  <Link
                    href={`/projects/${related.slug}`}
                    className="text-lg font-medium leading-tight text-foreground transition hover:text-accent"
                  >
                    {related.projectName}
                  </Link>
                  <p className="text-sm text-subtle">
                    {[related.city, related.countryNormalized ?? related.country].filter(Boolean).join(", ") ||
                      "Location not documented"}
                  </p>
                  <Link href={`/projects/${related.slug}`} className="text-sm font-medium text-accent">
                    Open record
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
