"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { getPasswordIssues } from "@/domain/validation";

interface PasswordChecklistProps {
  password: string;
  email?: string | null;
  name?: string | null;
  className?: string;
}

export function PasswordChecklist({
  password,
  email,
  name,
  className = "",
}: PasswordChecklistProps) {
  const issues = getPasswordIssues(password, {
    email: email ?? undefined,
    name: name ?? undefined,
  });
  const hasIdentityContext = Boolean(email || name);
  const identityOk = !issues.some((issue) => issue.includes("email") || issue.includes("name"));
  const checks = [
    { label: "At least 12 characters", ok: password.length >= 12 },
    { label: "Uppercase and lowercase letters", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "Number and symbol", ok: /\d/.test(password) && /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(password) },
    { label: hasIdentityContext ? "Does not include name/email" : "Does not include personal info", ok: password.length > 0 && identityOk },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1 text-[12px] font-['Manrope',sans-serif] ${className}`}>
      {checks.map((check) => {
        const Icon = check.ok ? CheckCircle2 : Circle;
        return (
          <span key={check.label} className={`inline-flex items-center gap-1 ${check.ok ? "text-[#0f7a43]" : "text-[#8a6b5a]"}`}>
            <Icon size={12} aria-hidden="true" />
            {check.label}
          </span>
        );
      })}
    </div>
  );
}
