import { NextResponse } from "next/server";
import { z } from "zod";
import { issueEmailCode } from "@/lib/email-code";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: Request) {
  try {
    const payload = bodySchema.parse(await request.json());
    await issueEmailCode(payload.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "RATE_LIMIT") {
      return NextResponse.json(
        { error: "Please wait a minute before requesting another code." },
        { status: 429 },
      );
    }
    console.error("Failed to issue sign-in code", error);
    return NextResponse.json(
      { error: "We could not send your code. Please try again." },
      { status: 503 },
    );
  }
}
