import { z } from "zod";

const contactString = z.string().trim().max(320);

const invitationIdentifier = z.string().trim().min(1).max(100);
const guestName = z.string().trim().min(1, "Enter your name.").max(200);
const guestEmail = contactString.email("Enter a valid email address.").or(z.literal("")).optional();
const guestPhone = z.string().trim().max(50).optional();
const attendanceStatus = z.enum(["attending", "declined", "maybe"]);
const partySizeValue = z.coerce.number().int().min(1).max(20);
const partySize = partySizeValue.default(1);
const dietaryPreferences = z.string().trim().max(1000).optional();
const message = z.string().trim().max(500, "Messages must be 500 characters or fewer.").optional();

export function normalizeRsvpEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

export function normalizeRsvpPhone(value: string | null | undefined) {
  const normalized = value?.replace(/\D/g, "") ?? "";
  return normalized || null;
}

export const rsvpSchema = z
  .object({
    invitationSlug: invitationIdentifier,
    guestName,
    guestEmail,
    guestPhone,
    status: attendanceStatus,
    partySize,
    dietaryPreferences,
    message,
  })
  .superRefine((value, context) => {
    if (!value.guestEmail && !value.guestPhone) {
      context.addIssue({
        code: "custom",
        path: ["guestEmail"],
        message: "Enter an email address or phone number.",
      });
    }
  });

export type RSVPFormData = z.infer<typeof rsvpSchema>;
export type RSVPFormInput = z.input<typeof rsvpSchema>;
