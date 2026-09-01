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

// Accept the field names used by the first Week 8 review while keeping the
// documented slug-based request as the canonical shape for new clients.
export const rsvpRequestSchema = z
  .object({
    invitationSlug: invitationIdentifier.optional(),
    invitationId: invitationIdentifier.optional(),
    guestName: guestName.optional(),
    name: guestName.optional(),
    guestEmail,
    email: guestEmail,
    guestPhone,
    status: attendanceStatus,
    partySize: partySizeValue.optional(),
    guestCount: z.coerce.number().int().min(1).max(20).optional(),
    dietaryPreferences,
    dietary: dietaryPreferences,
    message,
  })
  .superRefine((value, context) => {
    if (!value.invitationSlug && !value.invitationId) {
      context.addIssue({ code: "custom", path: ["invitationSlug"], message: "Invitation identifier is required." });
    }
    if (value.invitationSlug && value.invitationId) {
      context.addIssue({ code: "custom", path: ["invitationSlug"], message: "Provide either invitationSlug or invitationId." });
    }
    if (!value.guestName && !value.name) {
      context.addIssue({ code: "custom", path: ["guestName"], message: "Enter your name." });
    }
    if (!value.guestEmail && !value.email && !value.guestPhone) {
      context.addIssue({ code: "custom", path: ["guestEmail"], message: "Enter an email address or phone number." });
    }
  })
  .transform((value) => ({
    invitationSlug: value.invitationSlug,
    invitationId: value.invitationId,
    guestName: value.guestName ?? value.name ?? "",
    guestEmail: value.guestEmail || value.email,
    guestPhone: value.guestPhone,
    status: value.status,
    partySize: value.partySize ?? value.guestCount ?? 1,
    dietaryPreferences: value.dietaryPreferences ?? value.dietary,
    message: value.message,
  }));
