import { NextRequest, NextResponse } from "next/server";
import { readRuntimeCollection } from "@/lib/runtime-store";
import { getProjectBySlug } from "@/lib/data";
import {
  getPublishedProjectIssues,
  getModerationErrorMessage,
  getModerationErrorStatus,
  submitProjectIssue
} from "@/lib/github-moderation";
import type { IssueItem } from "@/lib/types";
import { validateIssueInput } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dedupeIssues(items: IssueItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = [item.projectSlug, item.kind, item.title, item.detail, item.updatedAt].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const projectSlug = request.nextUrl.searchParams.get("projectSlug");
  const runtimeItems = await readRuntimeCollection<IssueItem>("issues");
  let githubItems: IssueItem[] = [];

  try {
    githubItems = await getPublishedProjectIssues(projectSlug ?? undefined);
  } catch (error) {
    console.error("Unable to load published GitHub issues", error);
  }

  const published = dedupeIssues(
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
    const item = validateIssueInput(payload);
    const project = await getProjectBySlug(item.projectSlug);
    const result = await submitProjectIssue(item, project?.projectName ?? item.projectSlug);
    const publishedItem: IssueItem = {
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
    console.error("Issue moderation error", error);
    return NextResponse.json(
      {
        ok: false,
        message: getModerationErrorMessage(error)
      },
      { status: getModerationErrorStatus(error) }
    );
  }
}
