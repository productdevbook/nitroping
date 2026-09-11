import { describe, expect, it, vi } from "vitest";

vi.mock("./events", () => ({
  ProjectEventStream: class ProjectEventStream {},
}));
import {
  publicWidgetConfig,
  validateCustomFieldMetadata,
  validateWidgetTheme,
} from "./index";

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

  it("accepts white-label branding and only permits HTTPS logos", () => {
    expect(
      validateWidgetTheme({
        brandName: "Acme Support",
        logoUrl: "https://cdn.example.com/acme.png",
        showPoweredBy: false,
      }),
    ).toBeNull();
    expect(validateWidgetTheme({ logoUrl: "javascript:alert(1)" })).toContain(
      "HTTPS",
    );
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
        brandName: "Acme Support",
        logoUrl: "https://cdn.example.com/acme.png",
        showPoweredBy: false,
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
      "1x00000000000000000000AA",
    );
    expect(result.theme).toEqual({
      mode: "modal",
      buttonLabel: "Send feedback",
      brandName: "Acme Support",
      logoUrl: "https://cdn.example.com/acme.png",
      showPoweredBy: false,
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
    expect(result.turnstileSiteKey).toBe("1x00000000000000000000AA");
  });

  it("enforces configured custom field types, options, and required values", () => {
    const theme = JSON.stringify({
      customFields: [
        { id: "plan", label: "Plan", type: "select", required: true, options: ["free", "pro"] },
        { id: "beta", label: "Beta", type: "boolean" },
        { id: "seats", label: "Seats", type: "number" },
      ],
    });
    expect(validateCustomFieldMetadata(theme, { beta: true, seats: 3 })).toContain("required");
    expect(validateCustomFieldMetadata(theme, { plan: "enterprise", beta: true, seats: 3 })).toContain("invalid option");
    expect(validateCustomFieldMetadata(theme, { plan: "pro", beta: "yes", seats: 3 })).toContain("boolean");
    expect(validateCustomFieldMetadata(theme, { plan: "pro", beta: true, seats: 3 })).toBeNull();
  });
});
