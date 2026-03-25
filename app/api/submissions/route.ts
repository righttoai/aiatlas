import { NextRequest, NextResponse } from "next/server";
import {
  getModerationErrorMessage,
  getModerationErrorStatus,
  submitProjectContribution
} from "@/lib/github-moderation";
import { validateSubmissionInput } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const item = validateSubmissionInput(payload);
    const result = await submitProjectContribution(item);

    return NextResponse.json(
      {
        ok: true,
        itemId: item.id,
        issueUrl: result.issueUrl,
        pullRequestUrl: result.pullRequestUrl
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission moderation error", error);
    return NextResponse.json(
      {
        ok: false,
        message: getModerationErrorMessage(error)
      },
      { status: getModerationErrorStatus(error) }
    );
  }
}
