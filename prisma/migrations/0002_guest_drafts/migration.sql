-- CreateTable
CREATE TABLE "guest_drafts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "template_id" TEXT,
    "event_date" TIMESTAMP(3),
    "event_location" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guest_drafts_session_id_idx" ON "guest_drafts"("session_id");

-- CreateIndex
CREATE INDEX "guest_drafts_expires_at_idx" ON "guest_drafts"("expires_at");

-- AddForeignKey
ALTER TABLE "guest_drafts" ADD CONSTRAINT "guest_drafts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
