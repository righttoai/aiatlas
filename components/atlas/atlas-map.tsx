"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  createCoordinates
} from "@vnedyalk0v/react19-simple-maps";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import worldAtlas from "world-atlas/countries-110m.json";
import type { Topology } from "topojson-specification";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AtlasProject } from "@/lib/types";
import { cn, truncate } from "@/lib/utils";

type MarkerGroup = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  projects: AtlasProject[];
};

type AtlasMapProps = {
  groups: MarkerGroup[];
  selectedMarkerId: string | null;
  onSelectMarker: (id: string | null) => void;
  totalResults: number;
  geocodedResults: number;
};

const WORLD_ATLAS = worldAtlas as unknown as Topology;
const DEFAULT_CENTER = createCoordinates(10, 18);
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const FOCUS_ZOOM = 2.1;

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function markerBaseRadius(count: number) {
  return Math.min(13.5, 5.1 + Math.log2(count + 1) * 2);
}

function markerDimension(value: number, zoom: number) {
  return Number((value / Math.pow(zoom, 0.72)).toFixed(2));
}

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom.toFixed(2))));
}

function projectPreview(project: AtlasProject) {
  const summary =
    project.description ??
    project.participationMethods ??
    project.participants ??
    project.technology ??
    project.note ??
    project.participatoryEvidence;

  return summary ? truncate(summary, 120) : "Details are limited in this record.";
}

export function AtlasMap({
  groups,
  selectedMarkerId,
  onSelectMarker,
  totalResults,
  geocodedResults
}: AtlasMapProps) {
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedMarkerId) ?? null,
    [groups, selectedMarkerId]
  );
  const orderedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.id === selectedMarkerId) return 1;
      if (b.id === selectedMarkerId) return -1;
      if (a.projects.length !== b.projects.length) return a.projects.length - b.projects.length;
      return a.label.localeCompare(b.label);
    });
  }, [groups, selectedMarkerId]);
  const selectedProjects = useMemo(() => selectedGroup?.projects.slice(0, 3) ?? [], [selectedGroup]);
  const [mapPosition, setMapPosition] = useState({
    coordinates: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM
  });

  useEffect(() => {
    if (!selectedGroup) return;

    setMapPosition((current) => ({
      coordinates: createCoordinates(selectedGroup.longitude, selectedGroup.latitude),
      zoom: current.zoom >= FOCUS_ZOOM ? current.zoom : FOCUS_ZOOM
    }));
  }, [selectedGroup]);

  function adjustZoom(delta: number) {
    setMapPosition((current) => ({
      ...current,
      zoom: clampZoom(current.zoom + delta)
    }));
  }

  function resetView() {
    setMapPosition({
      coordinates: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    });
    onSelectMarker(null);
  }

  return (
    <Card className="overflow-hidden rounded-lg border-border/45 p-0 shadow-none">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-3 p-2.5 sm:p-3">
          <div className="pointer-events-auto rounded-md border border-border/45 bg-surface/96 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Map</div>
            <p className="mt-1 text-sm font-medium text-foreground">{geocodedResults} mapped · {totalResults} shown</p>
          </div>
        </div>

        <div
          className="h-[18.5rem] w-full sm:h-[24rem] md:h-[30rem] lg:h-[44rem] xl:h-[50rem]"
          style={{
            backgroundColor: "rgb(var(--map-ocean))",
            backgroundImage: "linear-gradient(180deg, rgb(var(--map-ocean)), rgb(var(--map-ocean) / 0.9))"
          }}
          role="img"
          aria-label="World map with grouped participatory AI project markers."
        >
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 165 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup
              center={mapPosition.coordinates}
              zoom={mapPosition.zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onMoveEnd={(position) =>
                setMapPosition({
                  coordinates: position.coordinates,
                  zoom: clampZoom(position.zoom)
                })
              }
            >
              <Geographies geography={WORLD_ATLAS}>
                {({ geographies }) =>
                  geographies.map((geo, index) => (
                    <Geography
                      key={String(geo.id ?? index)}
                      geography={geo}
                      fill="rgb(var(--map-land))"
                      stroke="rgb(var(--map-stroke) / 0.86)"
                      strokeWidth={0.64}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "rgb(var(--map-land-hover))", outline: "none" },
                        pressed: { outline: "none" }
                      }}
                    />
                  ))
                }
              </Geographies>

              {orderedGroups.map((group) => {
                const selected = group.id === selectedMarkerId;
                const baseRadius = markerBaseRadius(group.projects.length);
                const radius = markerDimension(baseRadius, mapPosition.zoom);
                const haloRadius = markerDimension(baseRadius + (selected ? 3.4 : 2.1), mapPosition.zoom);
                const hitRadius = markerDimension(baseRadius + (selected ? 5.6 : 4.2), mapPosition.zoom);
                const innerStrokeWidth = markerDimension(selected ? 1.75 : 1.2, mapPosition.zoom);
                const haloStrokeWidth = markerDimension(selected ? 1.35 : 0.95, mapPosition.zoom);
                const countFontSize = clampValue(markerDimension(10.5, mapPosition.zoom), 5.6, 10.5);
                const countTextY = clampValue(markerDimension(3.7, mapPosition.zoom), 2.4, 4.2);
                const label = `${group.label || "Unknown location"}: ${group.projects.length} project${group.projects.length === 1 ? "" : "s"}`;
                const toggleSelection = () => onSelectMarker(selected ? null : group.id);

                return (
                  <Marker key={group.id} coordinates={createCoordinates(group.longitude, group.latitude)}>
                    <g className="cursor-pointer">
                      <circle
                        role="button"
                        aria-label={label}
                        aria-pressed={selected}
                        tabIndex={0}
                        onClick={toggleSelection}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleSelection();
                          }
                        }}
                        r={hitRadius}
                        fill="transparent"
                        stroke="transparent"
                      />
                      <circle
                        pointerEvents="none"
                        r={haloRadius}
                        fill="rgb(var(--accent) / 0.16)"
                        stroke={selected ? "rgb(var(--foreground) / 0.9)" : "rgb(var(--accent) / 0.36)"}
                        strokeWidth={haloStrokeWidth}
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle
                        pointerEvents="none"
                        r={radius}
                        fill="rgb(var(--accent))"
                        stroke="rgb(var(--accent-foreground))"
                        strokeWidth={innerStrokeWidth}
                        vectorEffect="non-scaling-stroke"
                      />
                      {group.projects.length > 1 ? (
                        <text
                          pointerEvents="none"
                          y={countTextY}
                          textAnchor="middle"
                          className="pointer-events-none select-none font-bold"
                          style={{ fontSize: `${countFontSize}px` }}
                          fill="rgb(var(--accent-foreground))"
                        >
                          {group.projects.length}
                        </text>
                      ) : null}
                      <title>{label}</title>
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {!groups.length ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="rounded-md border border-border/45 bg-surface/96 px-5 py-3 text-center">
                <p className="text-sm text-muted">No geocoded records match the current filters.</p>
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2.5 p-2 sm:flex-row sm:items-end sm:p-3">
            {selectedGroup ? (
              <div
                className={cn(
                  "pointer-events-auto w-full rounded-md border border-border/45 bg-surface/97 p-3 sm:max-w-[28rem]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{selectedGroup.label || "Selected location"}</div>
                    <p className="mt-1 text-sm text-subtle">
                      {selectedGroup.projects.length} record{selectedGroup.projects.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => onSelectMarker(null)}
                    aria-label="Clear selected point"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 max-h-[14rem] space-y-2.5 overflow-auto pr-1 sm:max-h-[18rem]">
                  {selectedProjects.map((project) => {
                    const meta = [project.category, project.participationModeGroup, project.activityStatusGroup]
                      .filter(Boolean)
                      .join(" · ");
                    const detail = project.leadOrg || project.organizationType;

                    return (
                      <div key={project.slug} className="rounded-sm border border-border/45 bg-surface-soft/82 p-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/projects/${project.slug}`}
                              className="block text-sm font-medium leading-snug text-foreground transition hover:text-accent"
                            >
                              {project.projectName}
                            </Link>
                            <p className="mt-1 text-xs text-subtle">{detail}</p>
                          </div>
                          {project.category ? <Badge variant="outline" className="shrink-0">{project.category}</Badge> : null}
                        </div>

                        {meta ? <p className="mt-2 text-xs text-faint">{meta}</p> : null}
                        <p className="mt-2 text-sm text-muted">{projectPreview(project)}</p>

                        <div className="mt-3 flex items-center gap-3">
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
                              Source
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedGroup.projects.length > selectedProjects.length ? (
                  <p className="mt-3 text-xs text-subtle">
                    +{selectedGroup.projects.length - selectedProjects.length} more in the records list below.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="pointer-events-auto flex w-full items-center justify-between gap-2 self-end rounded-md border border-border/45 bg-surface/96 px-2 py-2 sm:ml-auto sm:w-auto sm:justify-start sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-md p-0 sm:h-11 sm:w-11"
                onClick={() => adjustZoom(-0.35)}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-md p-0 sm:h-11 sm:w-11"
                onClick={() => adjustZoom(0.35)}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="h-9 rounded-md px-3 text-xs sm:px-4" onClick={resetView}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
