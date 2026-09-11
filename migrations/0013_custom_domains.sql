CREATE TABLE IF NOT EXISTS custom_domains (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  hostname TEXT NOT NULL UNIQUE,
  cloudflare_hostname_id TEXT,
  status TEXT NOT NULL,
  ssl_status TEXT,
  validation_records_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_tenant
  ON custom_domains(organization_id, project_id, deleted_at, created_at);
