CREATE INDEX IF NOT EXISTS idx_webhooks_project_active ON webhooks(project_id, active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status, next_attempt_at);
