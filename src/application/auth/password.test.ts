import { describe, expect, it } from "vitest";
import { validatePasswordUpdate } from "@/application/auth/password";

describe("validatePasswordUpdate", () => {
  it("returns detailed issues for weak passwords", () => {
    expect(validatePasswordUpdate({ password: "weak", confirmPassword: "weak" })).toEqual([
      "Use at least 12 characters.",
      "Add an uppercase letter.",
      "Add a number.",
      "Add a symbol.",
    ]);
  });

  it("rejects passwords that include identity context", () => {
    const issues = validatePasswordUpdate({
      password: "Tokonesia2026!",
      confirmPassword: "Tokonesia2026!",
      email: "tokonesia@example.com",
      name: "Tokonesia Admin",
    });

    expect(issues).toContain("Do not include your email.");
    expect(issues).toContain("Do not include your name.");
  });

  it("rejects mismatched password confirmation", () => {
    expect(
      validatePasswordUpdate({
        password: "StrongPassword2026!",
        confirmPassword: "DifferentPassword2026!",
      }),
    ).toEqual(["Password confirmation does not match."]);
  });

  it("accepts a strong password", () => {
    expect(
      validatePasswordUpdate({
        password: "FreshVault2026!",
        confirmPassword: "FreshVault2026!",
        email: "customer@example.com",
        name: "Customer Name",
      }),
    ).toEqual([]);
  });
});
