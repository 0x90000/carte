import { z } from "zod";

const contactString = z.string().trim().max(320);

export const rsvpSchema = z
  .object({
    invitationSlug: z.string().trim().min(1).max(100),
    guestName: z.string().trim().min(1, "Enter your name.").max(200),
    guestEmail: contactString.email("Enter a valid email address.").or(z.literal("")).optional(),
    guestPhone: z.string().trim().max(50).optional(),
    status: z.enum(["attending", "declined", "maybe"]),
    partySize: z.coerce.number().int().min(1).max(20).default(1),
    dietaryPreferences: z.string().trim().max(1000).optional(),
    message: z.string().trim().max(500, "Messages must be 500 characters or fewer.").optional(),
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
