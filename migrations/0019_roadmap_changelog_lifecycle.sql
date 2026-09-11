-- Complete lifecycle metadata for roadmap and changelog records.
-- These columns are added separately so existing deployments can expand safely
-- before the API relies on active-record filtering.

ALTER TABLE roadmap_items ADD COLUMN deleted_at TEXT;
ALTER TABLE changelog_items ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_roadmap_items_tenant_lifecycle
  ON roadmap_items(organization_id, project_id, deleted_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_changelog_items_tenant_lifecycle
  ON changelog_items(organization_id, project_id, deleted_at, updated_at);
