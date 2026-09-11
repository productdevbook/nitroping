import { describe, expect, it } from "vitest";
import { attachmentSignatureMatches } from "./attachments";

describe("attachmentSignatureMatches", () => {
  it("accepts supported file signatures", () => {
    expect(attachmentSignatureMatches("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(
      attachmentSignatureMatches(
        "image/png",
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe(true);
    expect(attachmentSignatureMatches("application/pdf", new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(attachmentSignatureMatches("text/plain", new TextEncoder().encode("hello\nworld"))).toBe(true);
  });

  it("rejects mismatched and binary content", () => {
    expect(attachmentSignatureMatches("image/png", new TextEncoder().encode("MZ executable"))).toBe(false);
    expect(attachmentSignatureMatches("text/plain", new Uint8Array([0x41, 0x00, 0x42]))).toBe(false);
    expect(attachmentSignatureMatches("image/webp", new TextEncoder().encode("RIFF1234WEBP"))).toBe(true);
  });
});
