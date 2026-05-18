"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveImagePath } from "@/lib/image-paths";
import { getPasswordIssues } from "@/domain/validation";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { PasswordChecklist } from "@/app/components/auth/PasswordChecklist";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash") ?? "";
  const tokenType = searchParams.get("type") ?? "";
  const email = useMemo(() => {
    const value = searchParams.get("email");
    return value ? value.replace(/\s/g, "+").trim().toLowerCase() : "";
  }, [searchParams]);
  const hasAnyRecoveryParams = Boolean(tokenHash || tokenType || email);
  const hasValidLink = Boolean(tokenHash) && tokenType === "recovery" && /^\S+@\S+\.\S+$/.test(email);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAnyRecoveryParams) {
      router.replace("/login");
    }
  }, [hasAnyRecoveryParams, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !hasValidLink) return;

    const clientIssues = getPasswordIssues(newPassword, { email });
    if (newPassword !== confirmPassword) {
      clientIssues.push("Password confirmation does not match.");
    }
    if (clientIssues.length > 0) {
      setIssues(clientIssues);
      setError(clientIssues[0]);
      return;
    }

    setSubmitting(true);
    setIssues([]);
    setError(null);
    const response = await fetch("/api/auth/recover-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenHash,
        type: "recovery",
        email,
        password: newPassword,
        confirmPassword,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const nextIssues = Array.isArray(data.issues) ? data.issues : [data.error ?? "Failed to reset password."];
      setIssues(nextIssues);
      setError(nextIssues[0] ?? "Failed to reset password.");
      setSubmitting(false);
      return;
    }

    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login?reset=success");
    router.refresh();
  };

  return (
    <div className="bg-[#FDF9F5] min-h-screen flex items-center justify-center p-4">
      <div className="flex max-w-[906px] w-full shadow-lg">
        <div className="hidden md:block w-[448px] h-[620px] relative overflow-hidden">
          <img
            alt=""
            className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]"
            src={resolveImagePath("/images/Login/fbb1676fb1e714ce082c8512433c9a5517bce894.png")}
          />
        </div>
        <div className="bg-white flex-1 p-8 sm:p-12 md:p-16 flex flex-col justify-center min-h-[620px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[26px] text-black">Create a New Password</h1>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#605850] mt-2">
            Use a strong password that you have not used on Tokonesia before.
          </p>

          {!hasAnyRecoveryParams ? (
            <div className="mt-10 flex justify-center text-[#605850]">
              <LoadingSpinner label="Redirecting..." />
            </div>
          ) : !hasValidLink ? (
            <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-4 text-[14px] text-[#a24141] font-['Manrope',sans-serif]">
              This reset link is invalid or expired. Please return to login and request a new password reset email.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div>
                <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimum 12 characters"
                  className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] text-black placeholder-[rgba(154,144,136,0.6)] outline-none focus:border-[#511e0b]"
                />
              </div>
              <div>
                <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] text-black placeholder-[rgba(154,144,136,0.6)] outline-none focus:border-[#511e0b]"
                />
              </div>

              <PasswordChecklist password={newPassword} email={email} />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-[#a24141] font-['Manrope',sans-serif]">
                  <p className="font-bold">{error}</p>
                  {issues.length > 1 && (
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !newPassword || !confirmPassword}
                className="w-full bg-[#511e0b] text-white rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <LoadingSpinner label="Updating password..." /> : "UPDATE PASSWORD"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
