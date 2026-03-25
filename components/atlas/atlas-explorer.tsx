"use client";

import dynamic from "next/dynamic";
import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { FiltersPanel } from "@/components/atlas/filters-panel";
import { ProjectList } from "@/components/atlas/project-list";
import { Badge } from "@/components/ui/badge";
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
    loading: () => <Card className="h-[24rem] sm:h-[30rem] lg:h-[36rem] xl:h-[43rem]" />
  }
);

function AtlasExplorerInner({ projects, stats }: AtlasExplorerProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

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

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[15rem,minmax(0,1fr)]">
      <div className="order-2 xl:order-1">
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

      <div className="order-1 space-y-5 xl:order-2">
        <AtlasMap
          groups={grouped}
          selectedMarkerId={selectedMarkerId}
          onSelectMarker={setSelectedMarkerId}
          totalResults={filteredProjects.length}
          geocodedResults={geocodedCount}
        />

        {activeChips.length ? (
          <div className="flex flex-wrap gap-1.5">
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
  );
}

export function AtlasExplorer(props: AtlasExplorerProps) {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 xl:grid-cols-[15rem,minmax(0,1fr)]">
          <Card className="order-2 h-[32rem] xl:order-1" />
          <div className="order-1 space-y-5 xl:order-2">
            <Card className="h-36" />
            <Card className="h-[34rem]" />
            <Card className="h-[36rem]" />
          </div>
        </div>
      }
    >
      <AtlasExplorerInner {...props} />
    </Suspense>
  );
}
