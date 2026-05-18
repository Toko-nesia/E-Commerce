"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, CheckCircle, AlertCircle, KeyRound, User, Phone } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { getPasswordIssues } from "@/domain/validation";
import { PasswordChecklist } from "@/app/components/auth/PasswordChecklist";

export default function AdminProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Profile fields ──────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // ── Profile save state ──────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Password fields ─────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Load current profile on mount ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setProfileLoading(false); return; }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone, avatar_url")
          .eq("id", user.id)
          .single();
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
      } catch {
        setFullName(user.full_name || "");
        setPhone(user.phone || "");
      } finally {
        setProfileLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Handle avatar file pick ─────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
  };

  // ── Save profile ────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const filePath = `${user.id}/avatar.png`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }

      const payload: { full_name: string; phone: string; avatar_url?: string } = {
        full_name: fullName.trim(),
        phone: phone.trim(),
      };
      if (avatarUrl) payload.avatar_url = avatarUrl;

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;

      setAvatarFile(null);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch {
      setProfileMsg({ type: "error", text: "Failed to save profile. Please try again." });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPasswordMsg(null);
    const issues = getPasswordIssues(newPassword, { email, name: fullName });
    if (newPassword !== confirmPassword) {
      issues.push("Password confirmation does not match.");
    }
    if (issues.length > 0) {
      setPasswordMsg({ type: "error", text: issues.join(" ") });
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const nextIssues = Array.isArray(data.issues) ? data.issues : [data.error ?? "Failed to update password."];
        setPasswordMsg({ type: "error", text: nextIssues.join(" ") });
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Password updated successfully." });
    } catch {
      setPasswordMsg({ type: "error", text: "Failed to update password. Please try again." });
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────
  const initials = fullName
    ? fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const email = user?.email || "";

  return (
    <div className="max-w-[640px]">
      <h1 className="font-bold text-[20px] text-black mb-6">Admin Profile</h1>

      {/* ── Profile Card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-[#d0d0d0] p-6 mb-5">
        <h2 className="font-bold text-[15px] text-[#511e0b] mb-5 flex items-center gap-2">
          <User size={16} />
          Account Information
        </h2>

        {profileLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-[#6b6b6b]">
            <Loader2 size={18} className="animate-spin text-[#511e0b]" />
            <span className="text-[14px]">Loading profile...</span>
          </div>
        ) : (
          <>
            {/* Avatar picker */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative shrink-0">
                <div className="w-[72px] h-[72px] rounded-full bg-[#511e0b] flex items-center justify-center overflow-hidden border-2 border-[#d0d0d0]">
                  {avatarPreview ? (
                     
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-[22px] font-bold">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#511e0b] rounded-full w-6 h-6 flex items-center justify-center cursor-pointer border-2 border-white hover:bg-[#3d1608] transition-colors"
                  aria-label="Change photo"
                >
                  <Camera size={11} className="text-white" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="font-semibold text-[15px] text-black">{fullName || "—"}</p>
                <p className="text-[13px] text-[#6b6b6b]">{email}</p>
                <p className="text-[11px] text-[#511e0b] font-medium mt-0.5 uppercase tracking-wide">Admin</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#6b6b6b] font-medium mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Admin full name"
                  className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#6b6b6b] font-medium mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  value={email}
                  disabled
                  className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none bg-gray-50 cursor-not-allowed"
                />
                <p className="text-[11px] text-[#9b9b9b] mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-[12px] text-[#6b6b6b] font-medium mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={11} />
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                />
              </div>
            </div>

            {/* Profile save status */}
            {profileMsg && (
              <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-[13px] ${
                profileMsg.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-[#df0000]"
              }`}>
                {profileMsg.type === "success"
                  ? <CheckCircle size={15} />
                  : <AlertCircle size={15} />}
                {profileMsg.text}
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="flex items-center gap-2 bg-[#511e0b] text-white rounded-lg px-5 py-2.5 text-[14px] font-bold border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {profileSaving && <Loader2 size={15} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Password Card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-[#d0d0d0] p-6">
        <h2 className="font-bold text-[15px] text-[#511e0b] mb-5 flex items-center gap-2">
          <KeyRound size={16} />
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-[#6b6b6b] font-medium mb-1.5 uppercase tracking-wider">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 12 characters"
              className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] text-[#6b6b6b] font-medium mb-1.5 uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat the new password"
              className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
            />
          </div>

          <PasswordChecklist password={newPassword} email={email} name={fullName} />
        </div>

        {/* Password save status */}
        {passwordMsg && (
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-[13px] ${
            passwordMsg.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-[#df0000]"
          }`}>
            {passwordMsg.type === "success"
              ? <CheckCircle size={15} />
              : <AlertCircle size={15} />}
            {passwordMsg.text}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving || !newPassword || !confirmPassword}
            className="flex items-center gap-2 bg-[#511e0b] text-white rounded-lg px-5 py-2.5 text-[14px] font-bold border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {passwordSaving && <Loader2 size={15} className="animate-spin" />}
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
