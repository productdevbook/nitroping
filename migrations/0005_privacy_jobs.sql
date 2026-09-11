CREATE TABLE IF NOT EXISTS privacy_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT,
  kind TEXT NOT NULL CHECK(kind IN ('export','anonymize','delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
  requested_by TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_tenant ON privacy_requests(organization_id, project_id, status, created_at);
