import { NextRequest, NextResponse } from "next/server";
import { readRuntimeCollection } from "@/lib/runtime-store";
import { getProjectBySlug } from "@/lib/data";
import {
  getPublishedProjectAnnotations,
  getModerationErrorMessage,
  getModerationErrorStatus,
  submitProjectAnnotation
} from "@/lib/github-moderation";
import type { AnnotationItem } from "@/lib/types";
import { validateAnnotationInput } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dedupeAnnotations(items: AnnotationItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = [item.projectSlug, item.note, item.evidenceUrl ?? "", item.updatedAt].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const projectSlug = request.nextUrl.searchParams.get("projectSlug");
  const runtimeItems = await readRuntimeCollection<AnnotationItem>("annotations");
  let githubItems: AnnotationItem[] = [];

  try {
    githubItems = await getPublishedProjectAnnotations(projectSlug ?? undefined);
  } catch (error) {
    console.error("Unable to load published GitHub annotations", error);
  }

  const published = dedupeAnnotations(
    [...runtimeItems, ...githubItems]
      .filter((item) => item.public && item.status === "published")
      .filter((item) => (projectSlug ? item.projectSlug === projectSlug : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );

  return NextResponse.json({ items: published });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const item = validateAnnotationInput(payload);
    const project = await getProjectBySlug(item.projectSlug);
    const result = await submitProjectAnnotation(item, project?.projectName ?? item.projectSlug);
    const publishedItem: AnnotationItem = {
      ...item,
      status: "published"
    };

    return NextResponse.json(
      {
        ok: true,
        itemId: item.id,
        issueUrl: result.issueUrl,
        item: publishedItem
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Annotation moderation error", error);
    return NextResponse.json(
      {
        ok: false,
        message: getModerationErrorMessage(error)
      },
      { status: getModerationErrorStatus(error) }
    );
  }
}
