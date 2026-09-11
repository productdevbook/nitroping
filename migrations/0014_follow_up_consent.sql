ALTER TABLE magic_link_tokens ADD COLUMN email TEXT;

CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  feedback_id TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('feedback_follow_up')),
  legal_basis TEXT NOT NULL DEFAULT 'consent',
  granted_at TEXT NOT NULL,
  withdrawn_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_consent_records_feedback
  ON consent_records(organization_id, project_id, feedback_id, email);
