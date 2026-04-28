"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveImagePath } from "@/lib/image-paths";

export default function CompleteDataPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/");
  };

  return (
    <div className="bg-[#FDF9F5] min-h-screen flex items-center justify-center p-4">
      <div className="flex max-w-[906px] w-full shadow-lg">
        <div className="hidden md:block w-[448px] h-[675px] relative overflow-hidden">
          <img alt="" className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]" src={resolveImagePath("/images/CompleteTheData/fbb1676fb1e714ce082c8512433c9a5517bce894.png")} />
        </div>
        <div className="bg-white flex-1 p-16 flex flex-col justify-center min-h-[675px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[26px] text-black">COMPLETE THE DATA</h1>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#605850] mt-1">Complete the data to complete the registration</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">PHONE NUMBER</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08117750" className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none" />
            </div>
            <div>
              <label className="font-['Manrope',sans-serif] text-[12px] text-[#605850] tracking-[1.1px] uppercase">ADDRESS</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="JL. Tata Surya" className="w-full mt-2 bg-[#FDF9F5] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none h-[180px] resize-none" />
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 rounded border-[#d8d0c8]" />
              <span className="font-['Manrope',sans-serif] text-[13px] text-[#605850]">
                I agree to the <span className="text-[#a24141]">Terms of Service</span> and <span className="text-[#a24141]">Privacy Policy</span>.
              </span>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => router.back()} className="flex-1 bg-[#FDF9F5] text-[#511e0b] rounded-[8px] h-[53px] font-['Manrope:Bold',sans-serif] font-bold text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer border-none hover:bg-[#f0e8dc] transition-colors">
                RETURN
              </button>
              <button type="submit" className="flex-[2] bg-[#511e0b] text-white rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer border-none hover:bg-[#3d1608] transition-colors">
                Create Account
              </button>
            </div>
          </form>

          <p className="text-center mt-6 font-['Manrope',sans-serif] text-[14px] text-[#605850]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#a24141] no-underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
