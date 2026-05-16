"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { resolveImagePath } from "@/lib/image-paths";
import { getPasswordIssues } from "@/domain/validation";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => (searchParams.get("email") ?? "").trim().toLowerCase());
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGoogleRegister = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error || "Google sign-in failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordIssues = getPasswordIssues(password, { email, name });
    if (passwordIssues.length > 0) {
      setError(passwordIssues[0]);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const result = await register(name, email, password);
    if (result.success) {
      router.push(`/verify-email?email=${encodeURIComponent(result.email || email)}`);
    } else {
      setError(result.error || "Registration failed");
    }
  };

  const passwordIssues = getPasswordIssues(password, { email, name });
  const passwordChecks = [
    { label: "At least 12 characters", ok: password.length >= 12 },
    { label: "Uppercase and lowercase letters", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "Number and symbol", ok: /\d/.test(password) && /[!@#$%^&*()_+\-=[\]{};'\\:\"|<>?,./`~]/.test(password) },
    { label: "Does not include name/email", ok: password.length > 0 && !passwordIssues.some((issue) => issue.includes("name") || issue.includes("email")) },
  ];

  return (
    <div className="bg-[#FDF9F5] min-h-screen flex items-center justify-center p-4">
      <div className="flex max-w-[906px] w-full shadow-lg">
        <div className="hidden md:block w-[448px] h-[675px] relative overflow-hidden">
          <img alt="" className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]" src={resolveImagePath("/images/Register/fbb1676fb1e714ce082c8512433c9a5517bce894.png")} />
        </div>
        <div className="bg-white flex-1 p-16 flex flex-col justify-center min-h-[675px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[26px] text-black">CREATE YOUR ACCOUNT</h1>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#605850] mt-1">Register</p>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <div>
              <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Febri" className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none" />
            </div>
            <div>
              <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Febri@gmail.com" className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none" />
              </div>
              <div className="flex-1">
                <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">Confirm</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(47,37,29,0.5)] outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[12px] font-['Manrope',sans-serif]">
              {passwordChecks.map((check) => (
                <span key={check.label} className={check.ok ? "text-[#0f7a43]" : "text-[#8a6b5a]"}>
                  {check.ok ? "✓" : "•"} {check.label}
                </span>
              ))}
            </div>
            {error && (
              <p className="text-[#a24141] font-['Manrope',sans-serif] text-[13px] text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#511e0b] text-white rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer border-none hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "CONTINUE REGISTER"}
            </button>
          </form>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 h-px bg-[#deadad]" />
            <span className="font-['Manrope',sans-serif] text-[10px] text-[#deadad] tracking-[2px] uppercase">or</span>
            <div className="flex-1 h-px bg-[#deadad]" />
          </div>

          <button
            onClick={handleGoogleRegister}
            disabled={isLoading}
            className="w-full mt-4 bg-[#FDF9F5] rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] text-[#798698] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer border-none hover:bg-[#f0e8dc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            GOOGLE
          </button>

          <p className="text-center mt-4 font-['Manrope',sans-serif] text-[14px] text-[#605850]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#a24141] no-underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
