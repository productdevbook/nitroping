-- notification indexes
CREATE INDEX IF NOT EXISTS "notification_status_scheduled_at_idx"
  ON "notification" ("status", "scheduledAt");

CREATE INDEX IF NOT EXISTS "notification_app_id_idx"
  ON "notification" ("appId");

CREATE INDEX IF NOT EXISTS "notification_created_at_idx"
  ON "notification" ("createdAt");

-- device indexes
CREATE INDEX IF NOT EXISTS "device_app_id_idx"
  ON "device" ("appId");

CREATE INDEX IF NOT EXISTS "device_app_id_status_idx"
  ON "device" ("appId", "status");

CREATE INDEX IF NOT EXISTS "device_token_idx"
  ON "device" ("token");

-- deliveryLog indexes
CREATE INDEX IF NOT EXISTS "delivery_log_notification_id_idx"
  ON "deliveryLog" ("notificationId");

CREATE INDEX IF NOT EXISTS "delivery_log_created_at_idx"
  ON "deliveryLog" ("createdAt");

CREATE INDEX IF NOT EXISTS "delivery_log_status_idx"
  ON "deliveryLog" ("status");
