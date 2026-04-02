"use client";

import dynamic from "next/dynamic";
import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { FiltersPanel } from "@/components/atlas/filters-panel";
import { ProjectList } from "@/components/atlas/project-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EMPTY_FILTERS } from "@/lib/constants";
import {
  createSearchParamsFromFilters,
  filterProjects,
  getFacetValues,
  groupProjectsByCoordinates,
  parseFiltersFromSearchParams
} from "@/lib/filters";
import type { AtlasProject, AtlasStats, FilterState } from "@/lib/types";

type AtlasExplorerProps = {
  projects: AtlasProject[];
  stats: AtlasStats;
};

type ArrayFilterKey =
  | "regions"
  | "countries"
  | "categories"
  | "tags"
  | "organizationTypes"
  | "technologyGroups"
  | "activityStatusGroups"
  | "participationModes";

type ActiveChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

const AtlasMap = dynamic(
  () => import("@/components/atlas/atlas-map").then((module) => module.AtlasMap),
  {
    ssr: false,
    loading: () => <Card className="h-[18.5rem] sm:h-[24rem] md:h-[30rem] lg:h-[44rem] xl:h-[50rem]" />
  }
);

function AtlasExplorerInner({ projects }: AtlasExplorerProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);
  const facets = useMemo(() => getFacetValues(projects), [projects]);
  const filteredProjects = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const grouped = useMemo(() => groupProjectsByCoordinates(filteredProjects), [filteredProjects]);
  const geocodedCount = useMemo(
    () => filteredProjects.filter((project) => Boolean(project.coordinates)).length,
    [filteredProjects]
  );

  useEffect(() => {
    if (selectedMarkerId && !grouped.some((group) => group.id === selectedMarkerId)) {
      setSelectedMarkerId(null);
    }
  }, [grouped, selectedMarkerId]);

  const selectedGroup = useMemo(
    () => grouped.find((group) => group.id === selectedMarkerId) ?? null,
    [grouped, selectedMarkerId]
  );

  const selectedSlugs = useMemo(() => {
    if (!selectedGroup) return new Set<string>();
    return new Set(selectedGroup.projects.map((project) => project.slug));
  }, [selectedGroup]);

  const orderedProjects = useMemo(() => {
    if (!selectedSlugs.size) return filteredProjects;

    const focused = filteredProjects.filter((project) => selectedSlugs.has(project.slug));
    const remaining = filteredProjects.filter((project) => !selectedSlugs.has(project.slug));
    return [...focused, ...remaining];
  }, [filteredProjects, selectedSlugs]);

  function replaceFilters(next: FilterState) {
    const params = createSearchParamsFromFilters(next);
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function updateFilters(partial: Partial<FilterState>) {
    replaceFilters({
      ...filters,
      ...partial
    });
  }

  function toggleArrayValue(key: ArrayFilterKey, value: string) {
    const current = filters[key];
    updateFilters({
      [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    } as Pick<FilterState, ArrayFilterKey>);
  }

  function removeChip(key: ArrayFilterKey, value: string) {
    updateFilters({
      [key]: filters[key].filter((item) => item !== value)
    } as Pick<FilterState, ArrayFilterKey>);
  }

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];

    const arrayEntries: Array<[ArrayFilterKey, string[]]> = [
      ["regions", filters.regions],
      ["countries", filters.countries],
      ["categories", filters.categories],
      ["tags", filters.tags],
      ["organizationTypes", filters.organizationTypes],
      ["technologyGroups", filters.technologyGroups],
      ["activityStatusGroups", filters.activityStatusGroups],
      ["participationModes", filters.participationModes]
    ];

    arrayEntries.forEach(([key, values]) => {
      values.forEach((value) => {
        chips.push({
          id: `${key}:${value}`,
          label: value,
          onRemove: () => removeChip(key, value)
        });
      });
    });

    if (filters.participationVisibility !== "all") {
      chips.push({
        id: `participationVisibility:${filters.participationVisibility}`,
        label:
          filters.participationVisibility === "documented"
            ? "Documented only"
            : "Unspecified only",
        onRemove: () => updateFilters({ participationVisibility: EMPTY_FILTERS.participationVisibility })
      });
    }

    if (filters.fundingPresence !== "all") {
      chips.push({
        id: `fundingPresence:${filters.fundingPresence}`,
        label: filters.fundingPresence === "funded" ? "Funding documented" : "Funding missing",
        onRemove: () => updateFilters({ fundingPresence: EMPTY_FILTERS.fundingPresence })
      });
    }

    if (filters.q.trim()) {
      chips.push({
        id: `q:${filters.q}`,
        label: `Search: ${filters.q}`,
        onRemove: () => updateFilters({ q: EMPTY_FILTERS.q })
      });
    }

    return chips;
  }, [filters]);
  const activeFilterCount = activeChips.length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="xl:hidden">
        <Card className="p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
                Explore
              </div>
              <p className="mt-1 text-sm text-subtle">
                {filteredProjects.length} shown · {geocodedCount} mapped
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMobileFiltersOpen((open) => !open)}
              aria-expanded={mobileFiltersOpen}
              aria-controls="atlas-mobile-filters"
            >
              <Filter className="mr-2 h-4 w-4" />
              {mobileFiltersOpen ? "Hide filters" : "Show filters"}
              {activeFilterCount ? ` (${activeFilterCount})` : ""}
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[15rem,minmax(0,1fr)]">
        <div
          id="atlas-mobile-filters"
          className={`${mobileFiltersOpen ? "block" : "hidden"} order-1 xl:order-1 xl:block`}
        >
          <FiltersPanel
            filters={filters}
            facets={facets}
            resultCount={filteredProjects.length}
            onSearchChange={(value) => updateFilters({ q: value })}
            onToggleArrayValue={toggleArrayValue}
            onSetParticipationVisibility={(value) => updateFilters({ participationVisibility: value })}
            onSetFundingPresence={(value) => updateFilters({ fundingPresence: value })}
            onSetSort={(value) => updateFilters({ sort: value })}
            onClear={() => replaceFilters(EMPTY_FILTERS)}
          />
        </div>

        <div className="order-2 space-y-4 sm:space-y-5 xl:order-2">
          <AtlasMap
            groups={grouped}
            selectedMarkerId={selectedMarkerId}
            onSelectMarker={setSelectedMarkerId}
            totalResults={filteredProjects.length}
            geocodedResults={geocodedCount}
          />

          {activeChips.length ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onRemove}
                  className="surface-chip inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] transition"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          ) : null}

          <ProjectList
            projects={orderedProjects}
            selectedSlugs={selectedSlugs}
            selectedLocationLabel={selectedGroup?.label ?? null}
            onClearSelection={() => setSelectedMarkerId(null)}
          />
        </div>
      </div>
    </div>
  );
}

export function AtlasExplorer(props: AtlasExplorerProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 sm:space-y-5">
          <Card className="h-[4.75rem] xl:hidden" />
          <div className="grid gap-4 xl:grid-cols-[15rem,minmax(0,1fr)]">
            <Card className="hidden h-[32rem] xl:block" />
            <div className="space-y-4 sm:space-y-5">
              <Card className="h-[18.5rem] sm:h-[24rem] md:h-[30rem] lg:h-[44rem] xl:h-[50rem]" />
              <Card className="h-[24rem] sm:h-[32rem]" />
              <Card className="h-[36rem]" />
            </div>
          </div>
        </div>
      }
    >
      <AtlasExplorerInner {...props} />
    </Suspense>
  );
}
