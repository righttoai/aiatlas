"use client";

import { Filter, RotateCcw, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FilterState } from "@/lib/types";

type ArrayFilterKey =
  | "regions"
  | "countries"
  | "categories"
  | "tags"
  | "organizationTypes"
  | "technologyGroups"
  | "activityStatusGroups"
  | "participationModes";

type Facets = {
  regions: string[];
  countries: string[];
  categories: string[];
  tags: string[];
  organizationTypes: string[];
  technologyGroups: string[];
  activityStatusGroups: string[];
  participationModes: string[];
};

type FiltersPanelProps = {
  filters: FilterState;
  facets: Facets;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onToggleArrayValue: (key: ArrayFilterKey, value: string) => void;
  onSetParticipationVisibility: (value: FilterState["participationVisibility"]) => void;
  onSetFundingPresence: (value: FilterState["fundingPresence"]) => void;
  onSetSort: (value: FilterState["sort"]) => void;
  onClear: () => void;
};

function FacetSection({
  title,
  values,
  active,
  onToggle,
  open = false
}: {
  title: string;
  values: string[];
  active: string[];
  onToggle: (value: string) => void;
  open?: boolean;
}) {
  if (!values.length) return null;

  return (
    <details open={open || active.length > 0} className="rounded-md border border-border/45 bg-surface px-3 py-3">
      <summary className="flex list-none items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs text-faint">{active.length || values.length}</span>
      </summary>
      <div className="mt-3 space-y-2">
        <div className="max-h-44 space-y-1.5 overflow-auto pr-1">
          {values.map((value) => {
            const checked = active.includes(value);

            return (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2 rounded-sm border border-transparent px-1.5 py-1 text-sm text-subtle transition hover:border-border/45 hover:bg-surface-soft hover:text-foreground"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(value)}
                  className="mt-0.5 h-4 w-4 rounded border-border bg-background text-accent focus:ring-accent"
                />
                <span className="flex-1">{value}</span>
              </label>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function FiltersPanel({
  filters,
  facets,
  resultCount,
  onSearchChange,
  onToggleArrayValue,
  onSetParticipationVisibility,
  onSetFundingPresence,
  onSetSort,
  onClear
}: FiltersPanelProps) {
  const activeCount =
    filters.regions.length +
    filters.countries.length +
    filters.categories.length +
    filters.tags.length +
    filters.organizationTypes.length +
    filters.technologyGroups.length +
    filters.activityStatusGroups.length +
    filters.participationModes.length +
    (filters.participationVisibility !== "all" ? 1 : 0) +
    (filters.fundingPresence !== "all" ? 1 : 0) +
    (filters.q.trim() ? 1 : 0);

  const advancedOpen =
    filters.countries.length > 0 ||
    filters.tags.length > 0 ||
    filters.organizationTypes.length > 0 ||
    filters.technologyGroups.length > 0 ||
    filters.activityStatusGroups.length > 0 ||
    filters.participationModes.length > 0 ||
    filters.participationVisibility !== "all" ||
    filters.fundingPresence !== "all";

  return (
    <Card className="overflow-hidden rounded-lg p-0 xl:sticky xl:top-24">
      <div className="border-b border-border/45 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              <Filter className="h-4 w-4 text-accent" />
              Filters
            </div>
            <p className="mt-1 text-xs text-faint">{resultCount} shown</p>
          </div>

          {activeCount ? (
            <Button variant="ghost" className="h-8 rounded-md px-2.5 text-xs" onClick={onClear}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 px-3 py-3">
        <section className="space-y-3 rounded-md border border-border/45 bg-surface-soft px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-faint">Query</div>
          <div className="space-y-2">
            <label htmlFor="atlas-search" className="meta-label">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <Input
                id="atlas-search"
                value={filters.q}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Project or place"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="atlas-sort" className="meta-label">
              Sort
            </label>
            <Select
              id="atlas-sort"
              value={filters.sort}
              onChange={(event) => onSetSort(event.target.value as FilterState["sort"])}
            >
              <option value="name-asc">Name</option>
              <option value="country-asc">Country</option>
              <option value="completeness-desc">Documentation completeness</option>
            </Select>
          </div>
        </section>

        <section className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-faint">Filters</div>
          <FacetSection
            title="Region"
            values={facets.regions}
            active={filters.regions}
            onToggle={(value) => onToggleArrayValue("regions", value)}
            open
          />
          <FacetSection
            title="Category"
            values={facets.categories}
            active={filters.categories}
            onToggle={(value) => onToggleArrayValue("categories", value)}
          />
        </section>

        <details open={advancedOpen} className="rounded-md border border-border/45 bg-surface-soft px-3 py-3">
          <summary className="list-none text-sm font-semibold text-foreground">
            More filters
          </summary>

          <div className="mt-4 space-y-3">
            <div className="grid gap-3">
              <div className="space-y-2">
                <label htmlFor="atlas-participation" className="meta-label">
                  Participation
                </label>
                <Select
                  id="atlas-participation"
                  value={filters.participationVisibility}
                  onChange={(event) =>
                    onSetParticipationVisibility(event.target.value as FilterState["participationVisibility"])
                  }
                >
                  <option value="all">All records</option>
                  <option value="documented">Only documented mechanisms</option>
                  <option value="undocumented">Only unspecified mechanisms</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="atlas-funding" className="meta-label">
                  Funding
                </label>
                <Select
                  id="atlas-funding"
                  value={filters.fundingPresence}
                  onChange={(event) => onSetFundingPresence(event.target.value as FilterState["fundingPresence"])}
                >
                  <option value="all">All records</option>
                  <option value="funded">Funding documented</option>
                  <option value="not-funded">Funding not documented</option>
                </Select>
              </div>
            </div>

            <FacetSection
              title="Country"
              values={facets.countries}
              active={filters.countries}
              onToggle={(value) => onToggleArrayValue("countries", value)}
            />
            <FacetSection
              title="Topics"
              values={facets.tags}
              active={filters.tags}
              onToggle={(value) => onToggleArrayValue("tags", value)}
            />
            <FacetSection
              title="Organization type"
              values={facets.organizationTypes}
              active={filters.organizationTypes}
              onToggle={(value) => onToggleArrayValue("organizationTypes", value)}
            />
            <FacetSection
              title="Technology group"
              values={facets.technologyGroups}
              active={filters.technologyGroups}
              onToggle={(value) => onToggleArrayValue("technologyGroups", value)}
            />
            <FacetSection
              title="Activity status"
              values={facets.activityStatusGroups}
              active={filters.activityStatusGroups}
              onToggle={(value) => onToggleArrayValue("activityStatusGroups", value)}
            />
            <FacetSection
              title="Participation mode"
              values={facets.participationModes}
              active={filters.participationModes}
              onToggle={(value) => onToggleArrayValue("participationModes", value)}
            />
          </div>
        </details>

      </div>
    </Card>
  );
}
