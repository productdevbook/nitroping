ALTER TABLE "notification"
  ADD COLUMN IF NOT EXISTS "channelType" "channelType",
  ADD COLUMN IF NOT EXISTS "channelId" uuid,
  ADD COLUMN IF NOT EXISTS "contactIds" jsonb;
