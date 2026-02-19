-- AlterTable
ALTER TABLE "Setting" ADD COLUMN "userId" TEXT;
ALTER TABLE "Setting" ADD COLUMN "resendApiKey" TEXT;
ALTER TABLE "Setting" ADD COLUMN "stripePublishableKey" TEXT;
ALTER TABLE "Setting" ADD COLUMN "stripeSecretKey" TEXT;

-- Create unique index on userId
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_userId_key" ON "Setting"("userId");
