import type { AtlasProject } from "@/lib/types";

export type ProjectExternalLink = {
  label: string;
  href: string;
  kind: "documentation" | "evidence" | "supporting";
  sourceType: string | null;
};

const PLACEHOLDER_URLS = new Set(["not available", "n/a", "na", "none", "null", "undefined"]);

const SOURCE_TYPE_LABELS = new Map<string, string>([
  ["abstract", "Abstract"],
  ["about_page", "About page"],
  ["announcement", "Announcement"],
  ["app_page", "App page"],
  ["case_study", "Case study"],
  ["conference_slides", "Conference slides"],
  ["funding_record", "Funding record"],
  ["guide_page", "Guide"],
  ["guide_pdf", "Guide"],
  ["methods_page", "Methods note"],
  ["official_blog", "Official blog"],
  ["official_news", "Project update"],
  ["official_research_page", "Research page"],
  ["official_site", "Official page"],
  ["official_summary", "Official summary"],
  ["organization_news", "Organization news"],
  ["organization_site", "Organization page"],
  ["paper_html", "Research paper"],
  ["paper_page", "Research paper"],
  ["paper_pdf", "Research paper"],
  ["platform_page", "Platform"],
  ["policy_page", "Policy page"],
  ["preprint", "Preprint"],
  ["profile_page", "Profile"],
  ["program_article", "Program article"],
  ["program_page", "Program page"],
  ["program_site", "Program site"],
  ["prototype_page", "Prototype"],
  ["publication_page", "Publication"],
  ["pubmed_record", "PubMed record"],
  ["registry_record", "Registry record"],
  ["report_page", "Report"],
  ["report_pdf", "Report"],
  ["repository", "Repository"],
  ["resource_page", "Resource"],
  ["summary_page", "Summary"]
]);

const EVIDENCE_SOURCE_TYPES = new Set([
  "abstract",
  "announcement",
  "case_study",
  "conference_slides",
  "guide_page",
  "guide_pdf",
  "methods_page",
  "official_blog",
  "official_news",
  "official_research_page",
  "official_summary",
  "organization_news",
  "paper_html",
  "paper_page",
  "paper_pdf",
  "policy_page",
  "preprint",
  "program_article",
  "program_page",
  "program_site",
  "publication_page",
  "pubmed_record",
  "report_page",
  "report_pdf",
  "resource_page",
  "summary_page",
  "university_news"
]);

function cleanSourceType(type: string | null | undefined) {
  const cleaned = type?.trim();
  if (!cleaned) return null;
  if (PLACEHOLDER_URLS.has(cleaned.toLowerCase())) return null;
  return cleaned;
}

export function cleanExternalHref(href: string | null | undefined) {
  const cleaned = href?.trim();
  if (!cleaned) return null;
  if (PLACEHOLDER_URLS.has(cleaned.toLowerCase())) return null;

  try {
    const url = new URL(cleaned);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return cleaned;
  } catch {
    return null;
  }
}

export function normalizeExternalLink(href: string) {
  try {
    const url = new URL(href);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.host}${pathname}${url.search}`.toLowerCase();
  } catch {
    return href.trim().replace(/\/+$/, "").toLowerCase();
  }
}

export function sameExternalLink(left: string | null | undefined, right: string | null | undefined) {
  const cleanLeft = cleanExternalHref(left);
  const cleanRight = cleanExternalHref(right);
  if (!cleanLeft || !cleanRight) return false;
  return normalizeExternalLink(cleanLeft) === normalizeExternalLink(cleanRight);
}

export function sourceTypeLabel(sourceType: string | null | undefined) {
  const cleaned = cleanSourceType(sourceType);
  if (!cleaned) return "Supporting source";

  const mapped = SOURCE_TYPE_LABELS.get(cleaned);
  if (mapped) return mapped;

  return cleaned
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sourceTypeForHref(project: AtlasProject, href: string) {
  const normalized = normalizeExternalLink(href);
  const match = project.sourceLinks.find((link) => {
    const cleanHref = cleanExternalHref(link.url);
    return cleanHref ? normalizeExternalLink(cleanHref) === normalized : false;
  });

  return cleanSourceType(match?.type);
}

export function getProjectDocumentationLink(project: AtlasProject) {
  const href = cleanExternalHref(project.officialUrl) ?? cleanExternalHref(project.projectDocumentationLink);
  if (!href) return null;

  return {
    href,
    label: "Project documentation",
    sourceType: sourceTypeForHref(project, href)
  };
}

export function getPrimaryEvidenceLink(project: AtlasProject) {
  const documentationLink = getProjectDocumentationLink(project);
  const documentationHref = documentationLink?.href ?? null;
  const provenanceHref = cleanExternalHref(project.provenanceUrl);
  const provenanceSourceType = sourceTypeForHref(project, project.provenanceUrl);
  const candidates = project.sourceLinks.map((link) => ({
    href: cleanExternalHref(link.url),
    sourceType: cleanSourceType(link.type)
  }));
  const seen = new Set<string>();

  if (provenanceHref && (!documentationHref || !sameExternalLink(provenanceHref, documentationHref))) {
    return {
      href: provenanceHref,
      label: "Evidence source",
      sourceType: provenanceSourceType
    };
  }

  for (const candidate of candidates) {
    if (!candidate.href) continue;
    if (documentationHref && sameExternalLink(candidate.href, documentationHref)) continue;
    if (!candidate.sourceType || !EVIDENCE_SOURCE_TYPES.has(candidate.sourceType)) continue;

    const normalized = normalizeExternalLink(candidate.href);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    return {
      href: candidate.href,
      label: "Evidence source",
      sourceType: candidate.sourceType
    };
  }

  return null;
}

export function buildProjectExternalLinks(project: AtlasProject) {
  const links: ProjectExternalLink[] = [];
  const seen = new Set<string>();

  function addLink(
    label: string,
    href: string | null | undefined,
    kind: ProjectExternalLink["kind"],
    sourceType?: string | null
  ) {
    const cleanHref = cleanExternalHref(href);
    if (!cleanHref) return;

    const normalized = normalizeExternalLink(cleanHref);
    if (seen.has(normalized)) return;

    seen.add(normalized);
    links.push({
      label,
      href: cleanHref,
      kind,
      sourceType: cleanSourceType(sourceType)
    });
  }

  const documentationLink = getProjectDocumentationLink(project);
  addLink("Project documentation", documentationLink?.href, "documentation", documentationLink?.sourceType);

  addLink(
    "Evidence source",
    project.provenanceUrl,
    "evidence",
    sourceTypeForHref(project, project.provenanceUrl)
  );

  project.sourceLinks.forEach((link) => {
    addLink(sourceTypeLabel(link.type), link.url, "supporting", link.type);
  });

  project.additionalLinks.forEach((href) => {
    addLink("Supporting source", href, "supporting", sourceTypeForHref(project, href));
  });

  return links;
}
