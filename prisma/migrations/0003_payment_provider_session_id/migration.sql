ALTER TABLE "payments" ADD COLUMN "provider_session_id" TEXT;

CREATE UNIQUE INDEX "payments_provider_session_id_key" ON "payments"("provider_session_id");
