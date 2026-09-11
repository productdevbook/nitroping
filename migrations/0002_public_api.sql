CREATE TABLE IF NOT EXISTS project_api_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('public', 'server')),
  label TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_project_keys_lookup ON project_api_keys(project_id, kind, revoked_at);

CREATE TABLE IF NOT EXISTS feedback_watchers (
  feedback_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (feedback_id, email)
);

CREATE TABLE IF NOT EXISTS feedback_tags (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, slug)
);

CREATE TABLE IF NOT EXISTS feedback_tag_links (
  feedback_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (feedback_id, tag_id)
);

CREATE TABLE IF NOT EXISTS roadmap_feedback_links (
  roadmap_id TEXT NOT NULL,
  feedback_id TEXT NOT NULL,
  PRIMARY KEY (roadmap_id, feedback_id)
);

CREATE TABLE IF NOT EXISTS changelog_feedback_links (
  changelog_id TEXT NOT NULL,
  feedback_id TEXT NOT NULL,
  PRIMARY KEY (changelog_id, feedback_id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, email, event_type)
);
