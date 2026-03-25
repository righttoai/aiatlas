import { EMPTY_FILTERS } from "@/lib/constants";
import { AtlasProject, FilterState } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

type SearchParamsLike = {
  get(name: string): string | null;
};

const PARTICIPATION_VISIBILITY_VALUES = ["all", "documented", "undocumented"] as const;
const FUNDING_PRESENCE_VALUES = ["all", "funded", "not-funded"] as const;
const SORT_VALUES = ["name-asc", "country-asc", "completeness-desc"] as const;

function splitList(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);
}

function encodeList(values: string[]) {
  return values.map((value) => encodeURIComponent(value)).join(",");
}

function parseEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T) {
  if (value && allowed.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

export function parseFiltersFromSearchParams(searchParams: SearchParamsLike) {
  return {
    q: searchParams.get("q") ?? EMPTY_FILTERS.q,
    regions: splitList(searchParams.get("regions")),
    countries: splitList(searchParams.get("countries")),
    categories: splitList(searchParams.get("categories")),
    tags: splitList(searchParams.get("tags")),
    organizationTypes: splitList(searchParams.get("organizationTypes")),
    technologyGroups: splitList(searchParams.get("technologyGroups")),
    activityStatusGroups: splitList(searchParams.get("activityStatusGroups")),
    participationModes: splitList(searchParams.get("participationModes")),
    participationVisibility: parseEnum(
      searchParams.get("participationVisibility"),
      PARTICIPATION_VISIBILITY_VALUES,
      EMPTY_FILTERS.participationVisibility
    ),
    fundingPresence: parseEnum(
      searchParams.get("fundingPresence"),
      FUNDING_PRESENCE_VALUES,
      EMPTY_FILTERS.fundingPresence
    ),
    sort: parseEnum(searchParams.get("sort"), SORT_VALUES, EMPTY_FILTERS.sort)
  } satisfies FilterState;
}

export function createSearchParamsFromFilters(filters: FilterState) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.regions.length) params.set("regions", encodeList(filters.regions));
  if (filters.countries.length) params.set("countries", encodeList(filters.countries));
  if (filters.categories.length) params.set("categories", encodeList(filters.categories));
  if (filters.tags.length) params.set("tags", encodeList(filters.tags));
  if (filters.organizationTypes.length) params.set("organizationTypes", encodeList(filters.organizationTypes));
  if (filters.technologyGroups.length) params.set("technologyGroups", encodeList(filters.technologyGroups));
  if (filters.activityStatusGroups.length) params.set("activityStatusGroups", encodeList(filters.activityStatusGroups));
  if (filters.participationModes.length) params.set("participationModes", encodeList(filters.participationModes));
  if (filters.participationVisibility !== "all") params.set("participationVisibility", filters.participationVisibility);
  if (filters.fundingPresence !== "all") params.set("fundingPresence", filters.fundingPresence);
  if (filters.sort !== "name-asc") params.set("sort", filters.sort);

  return params;
}

function includesAny(active: string[], value: string | null) {
  if (!active.length) return true;
  if (!value) return false;
  return active.includes(value);
}

function includesTag(active: string[], projectTags: string[]) {
  if (!active.length) return true;
  return active.every((tag) => projectTags.includes(tag));
}

function matchesSearch(project: AtlasProject, query: string) {
  if (!query.trim()) return true;

  const haystack = normalizeText(
    [
      project.projectName,
      project.category,
      project.secondaryCategory,
      project.city,
      project.country,
      project.countryNormalized,
      project.leadOrg,
      project.description,
      project.technology,
      project.technologyGroup,
      project.applicationDomain,
      project.participants,
      project.participationMethods,
      project.activityStatus,
      project.organizationType,
      project.participationMode,
      project.atlasDecision,
      project.reviewStatus,
      project.tags.join(" ")
    ]
      .filter(Boolean)
      .join(" ")
  );

  return haystack.includes(normalizeText(query));
}

export function sortProjects(projects: AtlasProject[], sort: FilterState["sort"]) {
  const sorted = [...projects];

  sorted.sort((a, b) => {
    if (sort === "country-asc") {
      const countryCompare = (a.countryNormalized ?? "").localeCompare(b.countryNormalized ?? "");
      if (countryCompare !== 0) return countryCompare;
      return a.projectName.localeCompare(b.projectName);
    }

    if (sort === "completeness-desc") {
      if (b.documentationCompleteness.score !== a.documentationCompleteness.score) {
        return b.documentationCompleteness.score - a.documentationCompleteness.score;
      }
      return a.projectName.localeCompare(b.projectName);
    }

    return a.projectName.localeCompare(b.projectName);
  });

  return sorted;
}

export function filterProjects(projects: AtlasProject[], filters: FilterState) {
  const filtered = projects.filter((project) => {
    if (!matchesSearch(project, filters.q)) return false;
    if (!includesAny(filters.regions, project.region)) return false;
    if (!includesAny(filters.countries, project.countryNormalized ?? project.country)) return false;
    if (!includesAny(filters.categories, project.category)) return false;
    if (!includesTag(filters.tags, project.tags)) return false;
    if (!includesAny(filters.organizationTypes, project.organizationType)) return false;
    if (!includesAny(filters.technologyGroups, project.technologyGroup)) return false;
    if (!includesAny(filters.activityStatusGroups, project.activityStatusGroup)) return false;
    if (!includesAny(filters.participationModes, project.participationModeGroup)) return false;

    if (filters.participationVisibility === "documented" && !project.participationDocumented) return false;
    if (filters.participationVisibility === "undocumented" && project.participationDocumented) return false;
    if (filters.fundingPresence === "funded" && !project.funding) return false;
    if (filters.fundingPresence === "not-funded" && project.funding) return false;

    return true;
  });

  return sortProjects(filtered, filters.sort);
}

export function groupProjectsByCoordinates(projects: AtlasProject[]) {
  const groups = new Map<
    string,
    {
      id: string;
      latitude: number;
      longitude: number;
      label: string;
      projects: AtlasProject[];
    }
  >();

  for (const project of projects) {
    if (!project.coordinates) continue;
    const [longitude, latitude] = project.coordinates;
    const id = `${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
    const label = [project.city, project.countryNormalized ?? project.country].filter(Boolean).join(", ");

    if (!groups.has(id)) {
      groups.set(id, {
        id,
        latitude,
        longitude,
        label,
        projects: []
      });
    }

    groups.get(id)!.projects.push(project);
  }

  return [...groups.values()].sort((a, b) => b.projects.length - a.projects.length);
}

export function getFacetValues(projects: AtlasProject[]) {
  function collect(values: Array<string | null | undefined>) {
    return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
      a.localeCompare(b)
    );
  }

  return {
    regions: collect(projects.map((project) => project.region)),
    countries: collect(projects.map((project) => project.countryNormalized ?? project.country)),
    categories: collect(projects.map((project) => project.category)),
    tags: collect(projects.flatMap((project) => project.tags)),
    organizationTypes: collect(projects.map((project) => project.organizationType)),
    technologyGroups: collect(projects.map((project) => project.technologyGroup)),
    activityStatusGroups: collect(projects.map((project) => project.activityStatusGroup)),
    participationModes: collect(projects.map((project) => project.participationModeGroup))
  };
}
