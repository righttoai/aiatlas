import { FilterState } from "@/lib/types";

export const SITE_NAME = "Participatory AI Atlas";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const BRAND = {
  background: "#F8FAFC",
  foreground: "#0F172A",
  accent: "#0488D4"
} as const;

export const PAPER_REPORTED_STATS = {
  totalProjects: 115,
  normalizedCountries: 29,
  coreProjects: 63,
  cautiousProjects: 36,
  reviewCandidates: 16,
  readyProjects: 59
} as const;

export const MISSINGNESS_THRESHOLDS = {
  high: 70,
  medium: 30
} as const;

export const EMPTY_FILTERS: FilterState = {
  q: "",
  regions: [],
  countries: [],
  categories: [],
  tags: [],
  organizationTypes: [],
  technologyGroups: [],
  activityStatusGroups: [],
  participationModes: [],
  participationVisibility: "all",
  fundingPresence: "all",
  sort: "name-asc"
};

export const FILTER_PARAM_KEYS = [
  "q",
  "regions",
  "countries",
  "categories",
  "tags",
  "organizationTypes",
  "technologyGroups",
  "activityStatusGroups",
  "participationModes",
  "participationVisibility",
  "fundingPresence",
  "sort"
] as const;
