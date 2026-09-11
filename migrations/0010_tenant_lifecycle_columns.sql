-- Expand tenant context onto support tables before tightening repository cleanup.
-- Existing rows are backfilled from their authoritative tenant-owned parent.
ALTER TABLE project_settings ADD COLUMN organization_id TEXT;
ALTER TABLE project_settings ADD COLUMN created_at TEXT;
ALTER TABLE project_settings ADD COLUMN updated_at TEXT;
ALTER TABLE project_settings ADD COLUMN deleted_at TEXT;
UPDATE project_settings
SET organization_id = (SELECT organization_id FROM projects WHERE projects.id = project_settings.project_id),
    created_at = COALESCE(created_at, (SELECT created_at FROM projects WHERE projects.id = project_settings.project_id)),
    updated_at = COALESCE(updated_at, (SELECT updated_at FROM projects WHERE projects.id = project_settings.project_id));

ALTER TABLE feedback_votes ADD COLUMN organization_id TEXT;
ALTER TABLE feedback_votes ADD COLUMN project_id TEXT;
UPDATE feedback_votes
SET organization_id = (SELECT organization_id FROM feedback_items WHERE feedback_items.id = feedback_votes.feedback_id),
    project_id = (SELECT project_id FROM feedback_items WHERE feedback_items.id = feedback_votes.feedback_id);

ALTER TABLE feedback_watchers ADD COLUMN organization_id TEXT;
ALTER TABLE feedback_watchers ADD COLUMN project_id TEXT;
UPDATE feedback_watchers
SET organization_id = (SELECT organization_id FROM feedback_items WHERE feedback_items.id = feedback_watchers.feedback_id),
    project_id = (SELECT project_id FROM feedback_items WHERE feedback_items.id = feedback_watchers.feedback_id);

ALTER TABLE feedback_tag_links ADD COLUMN organization_id TEXT;
ALTER TABLE feedback_tag_links ADD COLUMN project_id TEXT;
UPDATE feedback_tag_links
SET organization_id = (SELECT organization_id FROM feedback_tags WHERE feedback_tags.id = feedback_tag_links.tag_id),
    project_id = (SELECT project_id FROM feedback_tags WHERE feedback_tags.id = feedback_tag_links.tag_id);

ALTER TABLE roadmap_feedback_links ADD COLUMN organization_id TEXT;
ALTER TABLE roadmap_feedback_links ADD COLUMN project_id TEXT;
UPDATE roadmap_feedback_links
SET organization_id = (SELECT organization_id FROM roadmap_items WHERE roadmap_items.id = roadmap_feedback_links.roadmap_id),
    project_id = (SELECT project_id FROM roadmap_items WHERE roadmap_items.id = roadmap_feedback_links.roadmap_id);

ALTER TABLE changelog_feedback_links ADD COLUMN organization_id TEXT;
ALTER TABLE changelog_feedback_links ADD COLUMN project_id TEXT;
UPDATE changelog_feedback_links
SET organization_id = (SELECT organization_id FROM changelog_items WHERE changelog_items.id = changelog_feedback_links.changelog_id),
    project_id = (SELECT project_id FROM changelog_items WHERE changelog_items.id = changelog_feedback_links.changelog_id);

ALTER TABLE webhook_deliveries ADD COLUMN organization_id TEXT;
ALTER TABLE webhook_deliveries ADD COLUMN project_id TEXT;
UPDATE webhook_deliveries
SET organization_id = (SELECT organization_id FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id),
    project_id = (SELECT project_id FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id);

ALTER TABLE magic_link_tokens ADD COLUMN organization_id TEXT;
ALTER TABLE magic_link_tokens ADD COLUMN project_id TEXT;
UPDATE magic_link_tokens
SET organization_id = (SELECT organization_id FROM feedback_items WHERE feedback_items.id = magic_link_tokens.feedback_id),
    project_id = (SELECT project_id FROM feedback_items WHERE feedback_items.id = magic_link_tokens.feedback_id);

CREATE INDEX IF NOT EXISTS idx_project_settings_tenant ON project_settings(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_tenant ON feedback_votes(organization_id, project_id, feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_watchers_tenant ON feedback_watchers(organization_id, project_id, feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tag_links_tenant ON feedback_tag_links(organization_id, project_id, feedback_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_feedback_links_tenant ON roadmap_feedback_links(organization_id, project_id, roadmap_id);
CREATE INDEX IF NOT EXISTS idx_changelog_feedback_links_tenant ON changelog_feedback_links(organization_id, project_id, changelog_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant ON webhook_deliveries(organization_id, project_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_tenant ON magic_link_tokens(organization_id, project_id, expires_at);
