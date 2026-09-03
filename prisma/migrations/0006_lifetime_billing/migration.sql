ALTER TABLE "users" ADD COLUMN "lifetime_access_at" TIMESTAMP(3);

ALTER TABLE "payments" ADD COLUMN "purchase_type" TEXT NOT NULL DEFAULT 'single_publish';
ALTER TABLE "payments" ALTER COLUMN "purchase_type" DROP DEFAULT;

CREATE TABLE "daily_publish_usages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "usage_date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_publish_usages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_publish_usages_user_id_usage_date_key"
ON "daily_publish_usages"("user_id", "usage_date");

ALTER TABLE "daily_publish_usages"
ADD CONSTRAINT "daily_publish_usages_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
