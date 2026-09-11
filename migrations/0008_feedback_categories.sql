ALTER TABLE feedback_items ADD COLUMN category_id TEXT;
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback_items(organization_id, project_id, category_id, created_at DESC);
