CREATE TABLE IF NOT EXISTS idempotency_keys (
  organization_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  key TEXT NOT NULL,
  response_json TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (project_id, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_created ON idempotency_keys(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_feedback ON feedback_comments(project_id, feedback_id, created_at);
CREATE INDEX IF NOT EXISTS idx_status_history_feedback ON feedback_status_history(project_id, feedback_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attachments_feedback ON attachments(project_id, feedback_id, created_at);
