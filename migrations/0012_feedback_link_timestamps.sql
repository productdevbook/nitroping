ALTER TABLE roadmap_feedback_links ADD COLUMN created_at TEXT;
ALTER TABLE changelog_feedback_links ADD COLUMN created_at TEXT;

UPDATE roadmap_feedback_links
SET created_at = COALESCE(created_at, (SELECT created_at FROM roadmap_items WHERE roadmap_items.id = roadmap_feedback_links.roadmap_id));

UPDATE changelog_feedback_links
SET created_at = COALESCE(created_at, (SELECT created_at FROM changelog_items WHERE changelog_items.id = changelog_feedback_links.changelog_id));

CREATE INDEX IF NOT EXISTS idx_roadmap_feedback_links_created ON roadmap_feedback_links(project_id, roadmap_id, created_at);
CREATE INDEX IF NOT EXISTS idx_changelog_feedback_links_created ON changelog_feedback_links(project_id, changelog_id, created_at);
