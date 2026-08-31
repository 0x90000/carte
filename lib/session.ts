import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

export const GUEST_SESSION_COOKIE = "carte_session_id";
const GUEST_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function shouldUseSecureCookie() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "";
  return process.env.NODE_ENV === "production" && appUrl.startsWith("https://");
}

export async function getSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_SESSION_COOKIE)?.value ?? null;
}

export async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
  if (existing) {
    return existing;
  }

  const sessionId = randomUUID();
  cookieStore.set(GUEST_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax",
    maxAge: GUEST_SESSION_MAX_AGE,
    path: "/",
  });

  return sessionId;
}
