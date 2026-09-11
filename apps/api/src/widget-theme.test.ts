import { describe, expect, it, vi } from "vitest";

vi.mock("./events", () => ({
  ProjectEventStream: class ProjectEventStream {},
}));
import { publicWidgetConfig, validateWidgetTheme } from "./index";

describe("widget theme contract", () => {
  it("accepts bounded custom field definitions", () => {
    expect(
      validateWidgetTheme({
        mode: "modal",
        fields: ["type", "title", "description"],
        customFields: [
          {
            id: "account.plan",
            label: "Plan",
            type: "select",
            required: true,
            options: ["free", "pro"],
          },
          { id: "repro.steps", label: "Reproduction steps", type: "textarea" },
        ],
      }),
    ).toBeNull();
  });

  it("rejects duplicate IDs and invalid select options", () => {
    expect(
      validateWidgetTheme({
        customFields: [
          { id: "plan", label: "Plan", type: "text" },
          { id: "plan", label: "Again", type: "text" },
        ],
      }),
    ).toContain("unique");
    expect(
      validateWidgetTheme({
        customFields: [
          { id: "plan", label: "Plan", type: "select", options: [] },
        ],
      }),
    ).toContain("options");
  });

  it("sanitizes public config and excludes private settings", () => {
    const result = publicWidgetConfig(
      JSON.stringify({
        mode: "modal",
        buttonLabel: "Send feedback",
        customFields: [
          {
            id: "plan",
            label: "Plan",
            type: "select",
            required: true,
            options: ["free", "pro"],
            secret: "remove",
          },
        ],
        colors: { primary: "#7C3AED", invalid: "javascript:alert(1)" },
        allowedMetadata: ["internal.secret"],
      }),
      [],
    );
    expect(result.theme).toEqual({
      mode: "modal",
      buttonLabel: "Send feedback",
      customFields: [
        {
          id: "plan",
          label: "Plan",
          type: "select",
          required: true,
          options: ["free", "pro"],
        },
      ],
      colors: { primary: "#7C3AED" },
    });
    expect(JSON.stringify(result)).not.toContain("internal.secret");
  });
});
