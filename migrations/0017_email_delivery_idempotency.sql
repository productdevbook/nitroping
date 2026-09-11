CREATE TABLE IF NOT EXISTS email_deliveries (
  event_id TEXT PRIMARY KEY,
  organization_id TEXT,
  project_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'delivered')),
  created_at TEXT NOT NULL,
  delivered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_status
  ON email_deliveries(status, created_at);
