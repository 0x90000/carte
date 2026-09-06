import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { invalidateInvitationCache } from "@/lib/public-invitation";
import {
  LIFETIME_DAILY_PUBLISH_LIMIT,
  PublishInvitationError,
  isTestPublishBypassEnabled,
  publishInvitationWithoutPaymentForTest,
  publishInvitationWithLifetimeAccess,
} from "@/lib/publishing";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(code: string, message: string, status: number, data?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: { code, message }, ...(data ? { data } : {}) }, { status });
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Sign in before publishing.", 401);
  }

  const { id } = await context.params;
  try {
    const published = isTestPublishBypassEnabled()
      ? await publishInvitationWithoutPaymentForTest(session.user.id, id)
      : await publishInvitationWithLifetimeAccess(session.user.id, id);
    await invalidateInvitationCache(published.slug);
    return NextResponse.json({ success: true, data: { published: true, ...published } });
  } catch (error) {
    if (error instanceof PublishInvitationError) {
      switch (error.code) {
        case "INVITATION_NOT_FOUND":
          return errorResponse(error.code, "Invitation not found.", 404);
        case "INVITATION_ALREADY_PUBLISHED":
          return errorResponse(error.code, "Invitation is already published.", 409);
        case "PAYMENT_REQUIRED":
          return errorResponse(error.code, "Choose a payment option before publishing.", 402, {
            purchaseOptions: ["single_publish", "lifetime"],
          });
        case "DAILY_LIMIT_REACHED":
          return errorResponse(error.code, "Your daily lifetime publishing limit has been reached.", 429, {
            dailyLimit: LIFETIME_DAILY_PUBLISH_LIMIT,
            remainingToday: 0,
          });
      }
    }

    console.error("Failed to publish invitation", error);
    return errorResponse("PUBLISH_FAILED", "We could not publish this invitation. Please try again.", 500);
  }
}
