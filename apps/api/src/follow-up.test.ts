import { describe, expect, it, vi } from "vitest";

vi.mock("./events", () => ({
  ProjectEventStream: class ProjectEventStream {},
}));

import { issueFollowUpLink } from "./index";

describe("issueFollowUpLink", () => {
  it("rotates the active token, records consent, and queues the email", async () => {
    const sql: string[] = [];
    const sent: Array<Record<string, unknown>> = [];
    const db = {
      prepare(statement: string) {
        sql.push(statement);
        return {
          bind: (..._values: unknown[]) => ({ statement }),
        };
      },
      batch: async (_statements: unknown[]) => undefined,
    };
    const env = {
      DB: db,
      EVENTS: { send: async (event: Record<string, unknown>) => void sent.push(event) },
    } as never;

    await issueFollowUpLink(
      env,
      { organizationId: "org_1", projectId: "project_1" },
      "feedback_1",
      " User@Example.com ",
    );

    expect(sql).toHaveLength(4);
    expect(sql[0]).toContain("UPDATE magic_link_tokens");
    expect(sql[1]).toContain("INSERT INTO magic_link_tokens");
    expect(sql[2]).toContain("feedback_watchers");
    expect(sql[3]).toContain("consent_records");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "follow-up.requested",
      email: "user@example.com",
      feedbackId: "feedback_1",
      organizationId: "org_1",
      projectId: "project_1",
    });
    expect(String(sent[0]?.token)).toMatch(/^follow_/);
  });
});
