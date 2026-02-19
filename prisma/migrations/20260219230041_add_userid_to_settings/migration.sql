-- Add userId column to Settings table
ALTER TABLE "Setting" ADD COLUMN "userId" TEXT;

-- Create unique index on userId
CREATE UNIQUE INDEX "Setting_userId_key" ON "Setting"("userId");