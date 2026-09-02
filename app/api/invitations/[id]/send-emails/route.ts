import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { buildInvitationEmail } from "@/lib/invitation-email";
import { enqueueInvitationEmails } from "@/lib/invitation-email-queue";
import { prisma } from "@/lib/prisma";

const recipientSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid recipient email address."),
  name: z.string().trim().max(100, "Recipient name is too long.").optional(),
}).strict();

const sendEmailsSchema = z.object({
  recipients: z.array(recipientSchema).min(1, "Add at least one recipient.").max(100, "You can send to at most 100 recipients at a time."),
  subject: z.string().trim().min(1).max(200).optional(),
  message: z.string().max(2000).optional(),
  sendImmediately: z.boolean().default(false),
}).strict();

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Please sign in first.", 401);
  }

  const { id } = await context.params;
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!invitation) {
    return errorResponse("INVITATION_NOT_FOUND", "Invitation not found.", 404);
  }

  const sends = await prisma.emailSend.findMany({
    where: { invitationId: invitation.id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ success: true, data: sends });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Please sign in first.", 401);
  }

  try {
    const payload = sendEmailsSchema.parse(await request.json());
    const { id } = await context.params;
    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: session.user.id, status: "published" },
      select: { id: true, title: true, slug: true, eventDate: true, eventLocation: true },
    });
    if (!invitation) {
      return errorResponse("INVITATION_NOT_FOUND", "Only your published invitations can be emailed.", 404);
    }

    const recipients = Array.from(new Map(payload.recipients.map((recipient) => [recipient.email, recipient])).values());
    const email = buildInvitationEmail(invitation, payload.message);
    const subject = payload.subject?.trim() || email.subject;
    const sends = await Promise.all(recipients.map((recipient) => prisma.emailSend.create({
      data: {
        invitationId: invitation.id,
        userId: session.user.id,
        recipientEmail: recipient.email,
        recipientName: recipient.name || null,
        subject,
        message: email.html,
        status: "pending",
      },
    })));

    if (payload.sendImmediately) {
      try {
        await enqueueInvitationEmails(sends.map((send) => send.id));
      } catch (error) {
        await prisma.emailSend.updateMany({
          where: { id: { in: sends.map((send) => send.id) } },
          data: { status: "failed", errorMessage: "Email queue is unavailable." },
        });
        if (error instanceof Error && error.message === "EMAIL_QUEUE_UNAVAILABLE") {
          return errorResponse("EMAIL_QUEUE_UNAVAILABLE", "Email delivery queue is not available.", 503);
        }
        throw error;
      }
    }

    const latest = await prisma.emailSend.findMany({ where: { id: { in: sends.map((send) => send.id) } }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({
      success: true,
      data: {
        invitationId: invitation.id,
        totalRecipients: latest.length,
        preview: !payload.sendImmediately,
        sends: latest,
      },
    }, { status: payload.sendImmediately ? 202 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_EMAIL_REQUEST", error.issues[0]?.message ?? "Email request is invalid.", 400);
    }
    if (error instanceof Error && error.message === "APP_URL_NOT_CONFIGURED") {
      return errorResponse("APP_URL_NOT_CONFIGURED", "Public app URL is not configured.", 503);
    }
    console.error("Failed to create invitation email sends", error);
    return errorResponse("EMAIL_SENDS_FAILED", "We could not prepare invitation emails.", 500);
  }
}
