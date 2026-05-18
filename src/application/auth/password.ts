import { z } from "zod";
import { getPasswordIssues } from "@/domain/validation";

export const passwordUpdateSchema = z.object({
  password: z.string(),
  confirmPassword: z.string().optional(),
});

export function validatePasswordUpdate(input: {
  password: string;
  confirmPassword?: string;
  email?: string | null;
  name?: string | null;
}): string[] {
  const issues = getPasswordIssues(input.password, {
    email: input.email ?? undefined,
    name: input.name ?? undefined,
  });

  if (input.confirmPassword !== undefined && input.password !== input.confirmPassword) {
    issues.push("Password confirmation does not match.");
  }

  return issues;
}
