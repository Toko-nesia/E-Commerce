import { useState } from "react";
import { Link, useNavigate } from "react-router";
import imgElmn32 from "../../../imports/Register/fbb1676fb1e714ce082c8512433c9a5517bce894.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/complete-data");
  };

  return (
    <div className="bg-[#faf5ee] min-h-screen flex items-center justify-center p-4">
      <div className="flex max-w-[906px] w-full shadow-lg">
        <div className="hidden md:block w-[448px] h-[675px] relative overflow-hidden">
          <img alt="" className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]" src={imgElmn32} />
        </div>
        <div className="bg-white flex-1 p-16 flex flex-col justify-center min-h-[675px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-black">CREATE YOUR ACCOUNT</h1>
          <p className="font-['Inter',sans-serif] text-[14px] text-[#605850] mt-1">Register</p>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <div>
              <label className="font-['Manrope',sans-serif] text-[11px] text-[#605850] tracking-[1.1px] uppercase">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Febri" className="w-full mt-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none" />
            </div>
            <div>
              <label className="font-['Manrope',sans-serif] text-[11px] text-[#605850] tracking-[1.1px] uppercase">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Febri@gmail.com" className="w-full mt-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="font-['Manrope',sans-serif] text-[11px] text-[#605850] tracking-[1.1px] uppercase">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(154,144,136,0.5)] outline-none" />
              </div>
              <div className="flex-1">
                <label className="font-['Manrope',sans-serif] text-[11px] text-[#605850] tracking-[1.1px] uppercase">Confirm</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="w-full mt-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-[8px] px-4 py-3 font-['Manrope',sans-serif] text-[14px] placeholder-[rgba(47,37,29,0.5)] outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#511e0b] text-white rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer border-none hover:bg-[#3d1608] transition-colors">
              CONTINUE REGISTER
            </button>
          </form>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 h-px bg-[#deadad]" />
            <span className="font-['Manrope',sans-serif] text-[10px] text-[#deadad] tracking-[2px] uppercase">or</span>
            <div className="flex-1 h-px bg-[#deadad]" />
          </div>

          <button className="w-full mt-4 bg-[#faf5ee] rounded-[8px] h-[53px] font-['Manrope',sans-serif] text-[14px] text-[#798698] tracking-[1.4px] uppercase shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer border-none hover:bg-[#f0e8dc] transition-colors">
            GOOGLE
          </button>

          <p className="text-center mt-4 font-['Manrope',sans-serif] text-[14px] text-[#605850]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#a24141] no-underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
