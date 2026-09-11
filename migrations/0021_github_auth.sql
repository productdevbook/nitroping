ALTER TABLE users ADD COLUMN github_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id
  ON users(github_id)
  WHERE github_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token
  ON auth_sessions(token_hash, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
  ON auth_sessions(user_id, revoked_at, expires_at);
