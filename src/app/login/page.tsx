"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { resolveImagePath } from "@/lib/image-paths";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { GoogleIcon } from "@/app/components/ui/GoogleIcon";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  const handleGoogleLogin = async () => {
    if (googleSubmitting) return;
    setGoogleSubmitting(true);
    setError(null);
    const result = await signInWithGoogle(searchParams.get("redirect"));
    if (!result.success) {
      setError(result.error || "Google sign-in failed");
      setGoogleSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginSubmitting) return;
    setLoginSubmitting(true);
    setError(null);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.role === 'admin') {
          router.push('/admin');
        } else {
          const redirectTo = searchParams.get("redirect");
          router.push(redirectTo || "/");
        }
      } else if (result.requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(result.email || email)}`);
      } else {
        setError(result.error || "Login failed");
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FDF9F5] min-h-screen flex items-center justify-center p-4">
      <div className="flex max-w-[906px] w-full shadow-lg">
        {/* Left: Decorative Pattern */}
        <div className="hidden md:block w-[448px] h-[675px] relative overflow-hidden">
          <img alt="" className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]" src={resolveImagePath("/images/Login/fbb1676fb1e714ce082c8512433c9a5517bce894.png")} />
        </div>
        {/* Right: Form */}
        <div className="bg-white flex-1 p-16 flex flex-col justify-center min-h-[675px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[26px] text-black">WELCOME!</h1>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#605850] mt-1">Login</p>

          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div>
              <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">EMAIL OR ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Febri@gmail.com"
                className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] text-[#9a9088] placeholder-[rgba(154,144,136,0.5)] outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">PASSWORD</label>
                <Link href="/forgot-password" className="font-['Manrope',sans-serif] text-[12px] text-[#a24141] capitalize no-underline hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] text-[#9a9088] placeholder-[rgba(154,144,136,0.5)] outline-none"
              />
            </div>

            {resetSuccess && (
              <p className="text-[#0f7a43] font-['Manrope',sans-serif] text-[13px] text-center">
                Your password has been reset. Please log in with your new password.
              </p>
            )}

            {error && (
              <p className="text-[#a24141] font-['Manrope',sans-serif] text-[13px] text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full bg-[#511e0b] text-white rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginSubmitting ? <LoadingSpinner label="Logging in..." /> : "LOGIN ->"}
            </button>
          </form>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-px bg-[#deadad]" />
            <span className="font-['Manrope',sans-serif] text-[10px] text-[#deadad] tracking-[2px] uppercase">or</span>
            <div className="flex-1 h-px bg-[#deadad]" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleSubmitting}
            className="w-full mt-4 bg-white border border-[#d8d0c8] rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] text-[#2f251d] tracking-[0.8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-[#FDF9F5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {googleSubmitting ? <LoadingSpinner label="Opening Google..." /> : <><GoogleIcon /> Continue with Google</>}
          </button>

          <p className="text-center mt-6 font-['Manrope',sans-serif] text-[14px] text-[#605850]">
            New ?{" "}
            <Link href="/register" className="text-[#a24141] no-underline">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
