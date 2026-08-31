import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyEmailCode } from "@/lib/email-code";

const emailSchema = z.string().trim().toLowerCase().email();

const credentialsProvider = Credentials({
  name: "Email code",
  credentials: {
    email: { label: "Email", type: "email" },
    code: { label: "Verification code", type: "text" },
  },
  async authorize(credentials) {
    const parsed = emailSchema.safeParse(credentials?.email);
    const code = typeof credentials?.code === "string" ? credentials.code : "";

    if (!parsed.success || !/^\d{6}$/.test(code) || !(await verifyEmailCode(parsed.data, code))) {
      return null;
    }

    return prisma.user.upsert({
      where: { email: parsed.data },
      update: { emailVerified: new Date() },
      create: { email: parsed.data, emailVerified: new Date() },
    });
  },
});

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "carte-local-development-secret-change-me",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    credentialsProvider,
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
