"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { resolveImagePath } from "@/lib/image-paths";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSent(false);
    try {
      const result = await resetPassword(normalizedEmail);
      if (!result.success) {
        const message = (result.error ?? "").toLowerCase();
        if (message.includes("rate") || message.includes("frequency")) {
          setError("Please wait before requesting another reset email.");
          return;
        }
        setError("We could not send the reset email. Please try again.");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FDF9F5] min-h-screen flex items-center justify-center p-4">
      <div className="flex max-w-[906px] w-full shadow-lg">
        <div className="hidden md:block w-[448px] h-[560px] relative overflow-hidden">
          <img
            alt=""
            className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]"
            src={resolveImagePath("/images/Login/fbb1676fb1e714ce082c8512433c9a5517bce894.png")}
          />
        </div>
        <div className="bg-white flex-1 p-8 sm:p-12 md:p-16 flex flex-col justify-center min-h-[560px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[26px] text-black">Reset Your Password</h1>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#605850] mt-2">
            Enter your account email and we will send you a secure reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] text-black placeholder-[rgba(154,144,136,0.6)] outline-none focus:border-[#511e0b]"
              />
            </div>

            {sent && (
              <p className="text-[#0f7a43] font-['Manrope',sans-serif] text-[13px] leading-relaxed">
                If an account exists for that email, a password reset link has been sent.
              </p>
            )}

            {error && (
              <p className="text-[#a24141] font-['Manrope',sans-serif] text-[13px] leading-relaxed">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#511e0b] text-white rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <LoadingSpinner label="Sending link..." /> : "SEND RESET LINK"}
            </button>
          </form>

          <Link href="/login" className="mt-6 text-center text-[#a24141] font-['Manrope',sans-serif] text-[14px] no-underline hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
