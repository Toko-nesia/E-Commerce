import { describe, expect, it } from "vitest";
import { getPasswordIssues, normalizePhoneNumber } from "@/domain/validation";

describe("validation helpers", () => {
  it("rejects weak passwords and passwords containing identity context", () => {
    expect(getPasswordIssues("password", { email: "febri@example.com", name: "Febri User" })).toContain("Use at least 12 characters.");
    expect(getPasswordIssues("FebriPassword1!", { email: "febri@example.com", name: "Febri User" })).toContain("Do not include your email.");
  });

  it("accepts strong passwords", () => {
    expect(getPasswordIssues("R0bust!Passphrase2026", { email: "user@example.com", name: "Example User" })).toEqual([]);
  });

  it("normalizes phone numbers to E.164", () => {
    expect(normalizePhoneNumber("0812 3456 7890")).toBe("+6281234567890");
    expect(normalizePhoneNumber("+81 90-1234-5678", "JP")).toBe("+819012345678");
  });
});

