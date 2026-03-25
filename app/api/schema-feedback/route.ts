import { NextRequest, NextResponse } from "next/server";
import {
  getModerationErrorMessage,
  getModerationErrorStatus,
  submitSchemaFeedback
} from "@/lib/github-moderation";
import { validateSchemaFeedbackInput } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const item = validateSchemaFeedbackInput(payload);
    const result = await submitSchemaFeedback(item);

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
