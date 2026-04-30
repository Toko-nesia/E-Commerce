"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";

interface Setting {
  key: string;
  value: string;
  description: string | null;
}

const SETTING_LABELS: Record<string, string> = {
  origin_name: "Nama Pengirim / Gudang",
  origin_address: "Alamat Lengkap",
  origin_postal_code: "Kode Pos",
  origin_country_code: "Kode Negara (2 huruf)",
};

const SETTING_PLACEHOLDERS: Record<string, string> = {
  origin_name: "Tokonesia Warehouse",
  origin_address: "Jl. Raya Malang No. 1",
  origin_postal_code: "65143",
  origin_country_code: "ID",
};

const SETTING_ORDER = [
  "origin_name",
  "origin_address",
  "origin_postal_code",
  "origin_country_code",
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        setError("Gagal memuat pengaturan.");
      } else {
        const data: Setting[] = await res.json();
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const settings_payload = SETTING_ORDER.map((key) => ({
      key,
      value: (settings[key] ?? "").trim(),
    }));

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: settings_payload }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError("Gagal menyimpan: " + (data.error ?? res.statusText));
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="font-bold text-[20px] text-black mb-6">Pengaturan Toko</h1>

      <div className="bg-white rounded-xl shadow-sm border border-[#d0d0d0] p-6 max-w-[600px]">
        <h2 className="font-bold text-[16px] text-[#511e0b] mb-1">Alamat Asal Pengiriman</h2>
        <p className="text-[13px] text-[#6b6b6b] mb-6">
          Alamat ini digunakan sebagai titik asal saat menghitung ongkos kirim FedEx.
          Pastikan kode pos sesuai dengan yang terdaftar di akun FedEx.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Loader2 size={18} className="animate-spin text-[#511e0b]" />
            <span className="text-[14px] text-[#6b6b6b]">Memuat pengaturan...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {SETTING_ORDER.map((key) => (
              <div key={key}>
                <label className="block text-[13px] font-medium text-black mb-1">
                  {SETTING_LABELS[key] ?? key}
                </label>
                <input
                  value={settings[key] ?? ""}
                  onChange={(e) => {
                    const val = key === "origin_country_code"
                      ? e.target.value.toUpperCase().slice(0, 2)
                      : e.target.value;
                    setSettings((prev) => ({ ...prev, [key]: val }));
                  }}
                  placeholder={SETTING_PLACEHOLDERS[key]}
                  maxLength={key === "origin_country_code" ? 2 : undefined}
                  className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                />
              </div>
            ))}

            {error && (
              <p className="text-[13px] text-[#df0000]">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#511e0b] text-white rounded-lg px-5 py-2.5 text-[14px] font-bold border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              ) : saved ? (
                <><CheckCircle size={15} /> Tersimpan!</>
              ) : (
                <><Save size={15} /> Simpan Pengaturan</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
