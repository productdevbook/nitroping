-- Complete lifecycle metadata for tenant-owned feedback relations.

ALTER TABLE roadmap_feedback_links ADD COLUMN updated_at TEXT;
ALTER TABLE roadmap_feedback_links ADD COLUMN deleted_at TEXT;
ALTER TABLE changelog_feedback_links ADD COLUMN updated_at TEXT;
ALTER TABLE changelog_feedback_links ADD COLUMN deleted_at TEXT;

UPDATE roadmap_feedback_links
SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

UPDATE changelog_feedback_links
SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_roadmap_feedback_links_lifecycle
  ON roadmap_feedback_links(organization_id, project_id, roadmap_id, deleted_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_changelog_feedback_links_lifecycle
  ON changelog_feedback_links(organization_id, project_id, changelog_id, deleted_at, updated_at);
