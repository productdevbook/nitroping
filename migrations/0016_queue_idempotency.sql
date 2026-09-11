-- Record the source queue event on moderation work so a retry cannot create
-- a second pending moderation item after a crash between the side effect and
-- processed_events acknowledgement.
ALTER TABLE moderation_events ADD COLUMN event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_events_event
  ON moderation_events(event_id)
  WHERE event_id IS NOT NULL;
