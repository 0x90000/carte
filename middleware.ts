import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "@/i18n/routing";

const SESSION_COOKIE = "carte_session_id";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const intlMiddleware = createMiddleware({ locales, defaultLocale, localePrefix: "always" });

export function middleware(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith("/api/");
  const response = isApiRequest ? NextResponse.next() : intlMiddleware(request);
  if (request.cookies.has(SESSION_COOKIE)) return response;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "";
  response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && appUrl.startsWith("https://"),
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
