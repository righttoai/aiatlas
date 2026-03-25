import { NextRequest, NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/data";
import {
  getModerationErrorMessage,
  getModerationErrorStatus,
  submitRedactionRequest
} from "@/lib/github-moderation";
import { validateRedactionInput } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const item = validateRedactionInput(payload);
    const project = await getProjectBySlug(item.projectSlug);
    const result = await submitRedactionRequest(item, project?.projectName ?? item.projectSlug);

    return NextResponse.json(
      {
        ok: true,
        itemId: item.id,
        issueUrl: result.issueUrl
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: getModerationErrorMessage(error)
      },
      { status: getModerationErrorStatus(error) }
    );
  }
}
