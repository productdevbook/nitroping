-- Drop the unique constraint that was preventing BullMQ from logging retry attempts.
-- Multiple delivery attempts for the same notification+device pair are valid and
-- must all be recorded. Replace with a plain index for query performance.
ALTER TABLE "deliveryLog"
  DROP CONSTRAINT IF EXISTS "delivery_log_notification_device_unique";

CREATE INDEX IF NOT EXISTS "delivery_log_notification_device_idx"
  ON "deliveryLog" ("notificationId", "deviceId");
