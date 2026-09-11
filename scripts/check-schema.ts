type SchemaRow = { tableName: string; columnName: string };

const required: Record<string, string[]> = {
  organizations: ["id", "created_at", "updated_at", "deleted_at"],
  projects: ["id", "organization_id", "created_at", "updated_at", "deleted_at"],
  feedback_items: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  feedback_comments: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  feedback_votes: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  feedback_watchers: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  feedback_status_history: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  feedback_tags: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  feedback_tag_links: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  roadmap_items: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  roadmap_feedback_links: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  changelog_items: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  changelog_feedback_links: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  attachments: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  webhooks: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  webhook_deliveries: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  notification_preferences: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  email_deliveries: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  magic_link_tokens: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  moderation_events: ["organization_id", "project_id", "created_at", "updated_at", "deleted_at"],
  audit_logs: ["organization_id", "created_at", "updated_at", "deleted_at"],
};

const rows: SchemaRow[] = [];
for (const [tableName, columns] of Object.entries(required)) {
  const sql = `SELECT '${tableName}' AS tableName, name AS columnName FROM pragma_table_info('${tableName}') WHERE name IN (${columns.map((column) => `'${column}'`).join(",")})`;
  const result = Bun.spawnSync(
    [
      "bunx",
      "wrangler",
      "d1",
      "execute",
      "nitroping",
      "--local",
      "--config",
      "apps/api/wrangler.jsonc",
      "--command",
      sql,
      "--json",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (result.exitCode !== 0) {
    console.error(new TextDecoder().decode(result.stderr) || new TextDecoder().decode(result.stdout));
    process.exit(result.exitCode || 1);
  }
  const payload = JSON.parse(new TextDecoder().decode(result.stdout)) as Array<{
    results?: SchemaRow[];
  }>;
  rows.push(...(payload[0]?.results ?? []));
}
const present = new Set(rows.map((row) => `${row.tableName}.${row.columnName}`));
const missing = Object.entries(required).flatMap(([tableName, columns]) =>
  columns
    .filter((columnName) => !present.has(`${tableName}.${columnName}`))
    .map((columnName) => `${tableName}.${columnName}`),
);

if (missing.length > 0) {
  console.error(`Schema contract failed; missing columns: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Schema contract passed for ${Object.keys(required).length} tenant tables.`);
