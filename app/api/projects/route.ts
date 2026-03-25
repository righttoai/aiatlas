import { NextRequest, NextResponse } from "next/server";
import { getProjects } from "@/lib/data";
import { filterProjects, parseFiltersFromSearchParams } from "@/lib/filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projects = await getProjects();
  const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
  const filtered = filterProjects(projects, filters);
  const limitValue = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitValue ? Number(limitValue) : filtered.length;
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, filtered.length)) : filtered.length;

  return NextResponse.json({
    total: projects.length,
    count: filtered.length,
    projects: filtered.slice(0, limit)
  });
}
