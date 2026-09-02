import { randomInt } from "node:crypto";
import { Resend } from "resend";
import { getRedis } from "@/lib/redis";

const CODE_TTL_SECONDS = 10 * 60;
const COOLDOWN_SECONDS = 60;
const codeKey = (email: string) => `auth:email-code:${email}`;
const cooldownKey = (email: string) => `auth:email-code-cooldown:${email}`;

type MemoryCode = { code: string; expiresAt: number; cooldownUntil: number };
const memoryStore = new Map<string, MemoryCode>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getConfiguredTestCode() {
  const configuredCode = process.env.E2E_TEST_EMAIL_CODE?.trim();
  return process.env.E2E_TEST_MODE === "1" && configuredCode && /^\d{6}$/.test(configuredCode)
    ? configuredCode
    : null;
}

function createEmailCode() {
  return getConfiguredTestCode() ?? randomInt(100000, 1000000).toString();
}

export async function issueEmailCode(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const code = createEmailCode();
  const redis = await getRedis();

  if (redis) {
    const allowed = await redis.set(cooldownKey(email), "1", {
      NX: true,
      EX: COOLDOWN_SECONDS,
    });
    if (!allowed) {
      throw new Error("RATE_LIMIT");
    }
    await redis.set(codeKey(email), code, { EX: CODE_TTL_SECONDS });
  } else {
    const now = Date.now();
    const current = memoryStore.get(email);
    if (current && current.cooldownUntil > now) {
      throw new Error("RATE_LIMIT");
    }
    memoryStore.set(email, {
      code,
      expiresAt: now + CODE_TTL_SECONDS * 1000,
      cooldownUntil: now + COOLDOWN_SECONDS * 1000,
    });
  }

  await sendEmailCode(email, code);
}

export async function verifyEmailCode(rawEmail: string, code: string) {
  const email = normalizeEmail(rawEmail);
  const redis = await getRedis();
  let expectedCode: string | null = null;

  if (redis) {
    expectedCode = await redis.get(codeKey(email));
    if (expectedCode) {
      await redis.del(codeKey(email));
    }
  } else {
    const stored = memoryStore.get(email);
    if (stored && stored.expiresAt > Date.now()) {
      expectedCode = stored.code;
    }
    memoryStore.delete(email);
  }

  return Boolean(expectedCode && expectedCode === code.trim());
}

async function sendEmailCode(email: string, code: string) {
  if (getConfiguredTestCode()) {
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Carte] Development email code for ${email}: ${code}`);
    }
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "Carte <noreply@carte.app>";
  const result = await resend.emails.send({
    from,
    to: email,
    subject: "Your Carte sign-in code",
    html: `<p>Your Carte verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });

  if (result.error) {
    throw new Error("EMAIL_SEND_FAILED");
  }
}
