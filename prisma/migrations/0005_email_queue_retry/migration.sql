ALTER TABLE "email_sends" ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "email_sends" ADD COLUMN "last_attempt_at" TIMESTAMP(3);

CREATE INDEX "email_sends_last_attempt_at_idx" ON "email_sends"("last_attempt_at");
