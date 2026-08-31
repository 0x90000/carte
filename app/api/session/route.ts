import { NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";

export async function GET() {
  await getOrCreateSessionId();
  return NextResponse.json({ success: true, data: { isGuest: true } });
}
