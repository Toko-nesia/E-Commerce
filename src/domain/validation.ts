import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const passwordSymbols = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export function getPasswordIssues(password: string, context: { email?: string; name?: string } = {}): string[] {
  const issues: string[] = [];
  const lowerPassword = password.toLowerCase();
  const emailLocal = context.email?.split("@")[0]?.toLowerCase().trim();
  const nameParts = context.name?.toLowerCase().split(/\s+/).filter((part) => part.length >= 3) ?? [];

  if (password.length < 12) issues.push("Use at least 12 characters.");
  if (!/[a-z]/.test(password)) issues.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(password)) issues.push("Add an uppercase letter.");
  if (!/\d/.test(password)) issues.push("Add a number.");
  if (!/[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(password)) issues.push("Add a symbol.");
  if (emailLocal && emailLocal.length >= 3 && lowerPassword.includes(emailLocal)) {
    issues.push("Do not include your email.");
  }
  if (nameParts.some((part) => lowerPassword.includes(part))) {
    issues.push("Do not include your name.");
  }

  return issues;
}

export function normalizePhoneNumber(input: string, defaultCountry: "ID" | "JP" = "ID"): string {
  const phone = parsePhoneNumberFromString(input.trim(), defaultCountry);
  if (!phone?.isValid()) {
    throw new Error("Enter a valid phone number.");
  }
  return phone.number;
}

export const strongPasswordSchema = z.string().superRefine((password, ctx) => {
  for (const issue of getPasswordIssues(password)) {
    ctx.addIssue({ code: "custom", message: issue });
  }
});

export const phoneNumberSchema = z.string().trim().min(1).transform((value, ctx) => {
  try {
    return normalizePhoneNumber(value);
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Enter a valid phone number.",
    });
    return z.NEVER;
  }
});

export const optionalPhoneNumberSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return "";
    try {
      return normalizePhoneNumber(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Enter a valid phone number.",
      });
      return z.NEVER;
    }
  });

export const postalCodeSchema = z.string().trim().min(2).max(20);
export const positiveQuantitySchema = z.coerce.number().int().positive().max(999);
export const trackingNumberSchema = z.string().trim().regex(/^[a-zA-Z0-9]{12,}$/, "Invalid tracking number.");

export const addressInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: phoneNumberSchema,
  address: z.string().trim().min(5).max(1000),
  details: z.string().trim().max(500).optional().default(""),
  postalCode: postalCodeSchema,
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).default("JP"),
});

