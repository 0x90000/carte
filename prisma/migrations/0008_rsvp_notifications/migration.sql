ALTER TABLE "rsvps" ADD COLUMN "notification_sent_at" TIMESTAMP(3);

CREATE INDEX "rsvps_invitation_id_notification_sent_at_idx"
ON "rsvps"("invitation_id", "notification_sent_at");

CREATE TABLE "rsvp_notifications" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "rsvp_ids" TEXT[] NOT NULL,
    "rsvp_count" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rsvp_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rsvp_notifications_status_created_at_idx"
ON "rsvp_notifications"("status", "created_at");

CREATE INDEX "rsvp_notifications_invitation_id_created_at_idx"
ON "rsvp_notifications"("invitation_id", "created_at");

ALTER TABLE "rsvp_notifications"
ADD CONSTRAINT "rsvp_notifications_invitation_id_fkey"
FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rsvp_notifications"
ADD CONSTRAINT "rsvp_notifications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_sends" ADD COLUMN "rsvp_notification_id" TEXT;

CREATE UNIQUE INDEX "email_sends_rsvp_notification_id_key"
ON "email_sends"("rsvp_notification_id");

ALTER TABLE "email_sends"
ADD CONSTRAINT "email_sends_rsvp_notification_id_fkey"
FOREIGN KEY ("rsvp_notification_id") REFERENCES "rsvp_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
