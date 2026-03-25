import { NextRequest, NextResponse } from "next/server";
import { readRuntimeCollection } from "@/lib/runtime-store";
import { getProjectBySlug } from "@/lib/data";
import {
  getModerationErrorMessage,
  getModerationErrorStatus,
  submitProjectIssue
} from "@/lib/github-moderation";
import type { IssueItem } from "@/lib/types";
import { validateIssueInput } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectSlug = request.nextUrl.searchParams.get("projectSlug");
  const items = await readRuntimeCollection<IssueItem>("issues");

  const published = items
    .filter((item) => item.public && item.status === "published")
    .filter((item) => (projectSlug ? item.projectSlug === projectSlug : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json({ items: published });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const item = validateIssueInput(payload);
    const project = await getProjectBySlug(item.projectSlug);
    const result = await submitProjectIssue(item, project?.projectName ?? item.projectSlug);

    return NextResponse.json(
      {
        ok: true,
        itemId: item.id,
        issueUrl: result.issueUrl
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
