"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import { resolveImagePath } from "@/lib/image-paths";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => (searchParams.get("email") ?? "").trim().toLowerCase(), [searchParams]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasEmail = /^\S+@\S+\.\S+$/.test(email);
  const canSubmit = hasEmail && /^\d{6}$/.test(token);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!canSubmit) {
      setError("Enter your email and the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Verification failed.");

      router.push(data.redirectTo || "/complete-data");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    if (!hasEmail) {
      setError("Enter a valid email address before resending the code.");
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to resend code.");
      setMessage("A new verification code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-[#FDF9F5] min-h-screen flex items-center justify-center p-4">
      <div className="flex max-w-[906px] w-full shadow-lg">
        <div className="hidden md:block w-[448px] h-[675px] relative overflow-hidden">
          <img alt="" className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]" src={resolveImagePath("/images/Register/fbb1676fb1e714ce082c8512433c9a5517bce894.png")} />
        </div>
        <div className="bg-white flex-1 p-8 sm:p-16 flex flex-col justify-center min-h-[675px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[26px] text-black">VERIFY YOUR EMAIL</h1>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#605850] mt-1">
            {hasEmail ? "Enter the code we sent to this email." : "No verification email is selected."}
          </p>

          <form onSubmit={handleVerify} className="mt-8 space-y-5">
            <div className="bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3">
              <p className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase mb-1">Email Address</p>
              <p className="font-['Manrope',sans-serif] text-[14px] text-[#2f251d] break-all">
                {hasEmail ? email : "Return to registration to choose an email."}
              </p>
            </div>

            <div>
              <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">Verification Code</label>
              <InputOTP value={token} onChange={setToken} maxLength={6} disabled={!hasEmail} containerClassName="mt-3 justify-center sm:justify-start">
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} className="h-12 w-12 border border-[#d8d0c8] bg-[#FDF9F5] text-[18px] font-semibold" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {message && <p className="text-[#0f7a43] font-['Manrope',sans-serif] text-[13px] text-center">{message}</p>}
            {error && <p className="text-[#a24141] font-['Manrope',sans-serif] text-[13px] text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-[#511e0b] text-white rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer border-none hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Account"}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5 font-['Manrope',sans-serif] text-[13px]">
            <button type="button" onClick={handleResend} disabled={resending || !hasEmail} className="bg-transparent border-none text-[#a24141] cursor-pointer disabled:opacity-60">
              {resending ? "Sending..." : "Resend code"}
            </button>
            <span className="hidden sm:inline text-[#d8d0c8]">|</span>
            <Link href={hasEmail ? `/register?email=${encodeURIComponent(email)}` : "/register"} className="text-[#a24141] no-underline">Change email</Link>
            <span className="hidden sm:inline text-[#d8d0c8]">|</span>
            <Link href="/login" className="text-[#605850] no-underline">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
