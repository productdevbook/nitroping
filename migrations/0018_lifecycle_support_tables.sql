ALTER TABLE notification_preferences ADD COLUMN updated_at TEXT;
ALTER TABLE notification_preferences ADD COLUMN deleted_at TEXT;
ALTER TABLE email_deliveries ADD COLUMN updated_at TEXT;
ALTER TABLE email_deliveries ADD COLUMN deleted_at TEXT;

UPDATE notification_preferences
SET updated_at = created_at
WHERE updated_at IS NULL;

UPDATE email_deliveries
SET updated_at = COALESCE(delivered_at, created_at)
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_lifecycle
  ON notification_preferences(organization_id, project_id, deleted_at, updated_at);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_tenant_lifecycle
  ON email_deliveries(organization_id, project_id, deleted_at, updated_at);
