ALTER TABLE feedback_items ADD COLUMN assigned_user_id TEXT;
ALTER TABLE feedback_items ADD COLUMN merged_into_id TEXT;
CREATE INDEX IF NOT EXISTS idx_feedback_assignee ON feedback_items(organization_id, project_id, assigned_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_merged_into ON feedback_items(organization_id, project_id, merged_into_id);
