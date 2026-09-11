CREATE TABLE IF NOT EXISTS organization_invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','member','moderator','viewer','billing_admin')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (organization_id, email)
);
CREATE INDEX IF NOT EXISTS idx_organization_invites_lookup ON organization_invites(organization_id, email, accepted_at, expires_at);
