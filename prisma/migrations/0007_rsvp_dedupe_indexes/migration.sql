-- Enforce the product dedupe rule at the database boundary as well as in the API.
CREATE UNIQUE INDEX "rsvps_invitation_email_dedupe_key"
ON "rsvps" ("invitation_id", lower(btrim("guest_email")))
WHERE "guest_email" IS NOT NULL AND btrim("guest_email") <> '';

CREATE UNIQUE INDEX "rsvps_invitation_phone_dedupe_key"
ON "rsvps" ("invitation_id", regexp_replace("guest_phone", '[^0-9]', '', 'g'))
WHERE ("guest_email" IS NULL OR btrim("guest_email") = '')
  AND "guest_phone" IS NOT NULL
  AND regexp_replace("guest_phone", '[^0-9]', '', 'g') <> '';
