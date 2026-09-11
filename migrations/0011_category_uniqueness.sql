-- Keep category slugs stable within a project so public clients can safely
-- cache and submit category IDs without ambiguous configuration.
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_project_slug
  ON categories(organization_id, project_id, slug);
