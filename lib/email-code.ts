import { randomInt } from "node:crypto";
import nodemailer from "nodemailer";
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

function buildEmailCodeHtml(code: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f3ef;color:#252321;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your secure Carte sign-in code is ready.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f3ef;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 8px 18px;color:#252321;font-size:13px;letter-spacing:3px;font-weight:700;">CARTE</td>
            </tr>
            <tr>
              <td style="background:#252321;padding:28px 32px;border-radius:18px 18px 0 0;">
                <div style="color:#f4c9a7;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Secure access</div>
                <h1 style="margin:10px 0 0;color:#ffffff;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-.4px;">Your sign-in code</h1>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:34px 32px 30px;border:1px solid #e8e3dc;border-top:0;border-radius:0 0 18px 18px;">
                <p style="margin:0 0 22px;color:#625d57;font-size:16px;line-height:1.6;">Use the code below to continue to your Carte account.</p>
                <div style="background:#faf8f5;border:1px solid #eadfd5;border-radius:14px;padding:22px 16px;text-align:center;">
                  <div style="color:#8a8178;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Verification code</div>
                  <div style="margin-top:10px;color:#252321;font-family:Arial,Helvetica,sans-serif;font-size:38px;line-height:1;letter-spacing:9px;font-weight:700;">${code}</div>
                </div>
                <p style="margin:22px 0 0;color:#625d57;font-size:14px;line-height:1.6;">This code expires in <strong style="color:#252321;">10 minutes</strong> and can only be used once.</p>
                <div style="height:1px;background:#eee9e3;margin:26px 0 22px;"></div>
                <p style="margin:0;color:#8a8178;font-size:13px;line-height:1.6;">If you did not request this code, you can safely ignore this email. No changes will be made to your account.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;color:#9b948c;font-size:12px;line-height:1.5;">Carte &middot; Thoughtful invitations for meaningful moments</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPassword = process.env.SMTP_PASSWORD?.trim();
  if (smtpHost && smtpUser && smtpPassword) {
    const smtpPort = Number(process.env.SMTP_PORT ?? "465");
    const secure = process.env.SMTP_SECURE !== "false";
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number.isFinite(smtpPort) ? smtpPort : 465,
      secure,
      auth: { user: smtpUser, pass: smtpPassword },
    });
    const from = process.env.EMAIL_FROM?.trim() || smtpUser;
    await transporter.sendMail({
      from,
      to: email,
      subject: "Your Carte sign-in code",
      text: `Your Carte sign-in code is ${code}. It expires in 10 minutes.`,
      html: buildEmailCodeHtml(code),
    });
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
    text: `Your Carte sign-in code is ${code}. It expires in 10 minutes.`,
    html: buildEmailCodeHtml(code),
  });

  if (result.error) {
    throw new Error("EMAIL_SEND_FAILED");
  }
}
