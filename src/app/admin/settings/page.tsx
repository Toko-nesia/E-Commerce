"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";

interface Setting {
  key: string;
  value: string;
  description: string | null;
}

interface ShippingMethodSetting {
  code: "fedex" | "internal_courier";
  label: string;
  enabled: boolean;
  priceRaw: number | null;
  requiresTracking: boolean;
}

const SETTING_LABELS: Record<string, string> = {
  origin_name: "Sender / Warehouse Name",
  origin_address: "Full Address",
  origin_postal_code: "Postal Code",
  origin_country_code: "Country Code (2 letters)",
};

const SETTING_PLACEHOLDERS: Record<string, string> = {
  origin_name: "Enter sender or warehouse name",
  origin_address: "Enter full origin address",
  origin_postal_code: "Enter origin postal code",
  origin_country_code: "Enter country code",
};

const SETTING_ORDER = [
  "origin_name",
  "origin_address",
  "origin_postal_code",
  "origin_country_code",
];

const DEFAULT_SHIPPING_METHODS: ShippingMethodSetting[] = [
  {
    code: "fedex",
    label: "FedEx",
    enabled: true,
    priceRaw: null,
    requiresTracking: true,
  },
  {
    code: "internal_courier",
    label: "Internal Courier",
    enabled: false,
    priceRaw: 0,
    requiresTracking: false,
  },
];

function formatRp(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodSetting[]>(DEFAULT_SHIPPING_METHODS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to load settings.");
      } else {
        const data: { settings: Setting[]; shippingMethods: ShippingMethodSetting[] } = await res.json();
        const map: Record<string, string> = {};
        data.settings.forEach((setting) => { map[setting.key] = setting.value; });
        setSettings(map);
        const byCode = new Map((data.shippingMethods ?? []).map((method) => [method.code, method]));
        setShippingMethods(DEFAULT_SHIPPING_METHODS.map((method) => ({
          ...method,
          ...byCode.get(method.code),
        })));
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const updateShippingMethod = (
    code: ShippingMethodSetting["code"],
    patch: Partial<ShippingMethodSetting>,
  ) => {
    setShippingMethods((current) => current.map((method) =>
      method.code === code ? { ...method, ...patch } : method
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const settingsPayload = SETTING_ORDER.map((key) => ({
      key,
      value: (settings[key] ?? "").trim(),
    }));

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: settingsPayload,
        shippingMethods,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError("Failed to save: " + (data.error ?? res.statusText));
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="font-bold text-[20px] text-black mb-6">Store Settings</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,600px)_minmax(0,520px)] gap-6 items-start">
        <div className="bg-white rounded-xl shadow-sm border border-[#d0d0d0] p-6">
          <h2 className="font-bold text-[16px] text-[#511e0b] mb-1">Shipping Origin Address</h2>
          <p className="text-[13px] text-[#6b6b6b] mb-6">
            This address is used as the origin when calculating FedEx shipping rates.
            It is required while FedEx is enabled.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 size={18} className="animate-spin text-[#511e0b]" />
              <span className="text-[14px] text-[#6b6b6b]">Loading settings...</span>
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
                    onChange={(event) => {
                      const value = key === "origin_country_code"
                        ? event.target.value.toUpperCase().slice(0, 2)
                        : event.target.value;
                      setSettings((prev) => ({ ...prev, [key]: value }));
                    }}
                    placeholder={SETTING_PLACEHOLDERS[key]}
                    maxLength={key === "origin_country_code" ? 2 : undefined}
                    className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#d0d0d0] p-6">
          <h2 className="font-bold text-[16px] text-[#511e0b] mb-1">Shipping Methods</h2>
          <p className="text-[13px] text-[#6b6b6b] mb-6">
            Customers can choose only the methods enabled here. At least one method must stay enabled.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 size={18} className="animate-spin text-[#511e0b]" />
              <span className="text-[14px] text-[#6b6b6b]">Loading shipping methods...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {shippingMethods.map((method) => (
                <div key={method.code} className="rounded-xl border border-[#e0d5cc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[15px] text-black">{method.label}</p>
                      <p className="text-[12px] text-[#6b6b6b] mt-1">
                        {method.requiresTracking
                          ? "Requires tracking number when the order is shipped."
                          : "No tracking number or tracking API is required."}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#511e0b] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(event) => updateShippingMethod(method.code, { enabled: event.target.checked })}
                        className="accent-[#511e0b]"
                      />
                      Enabled
                    </label>
                  </div>

                  {method.code === "internal_courier" && (
                    <div className="mt-4">
                      <label className="block text-[13px] font-medium text-black mb-1">
                        Shipping Price
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={method.priceRaw ?? 0}
                        onChange={(event) => updateShippingMethod(method.code, {
                          priceRaw: Math.max(0, Number(event.target.value || 0)),
                        })}
                        className="w-full border border-[#d0d0d0] rounded-lg px-4 py-2.5 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                      />
                      <p className="text-[12px] text-[#6b6b6b] mt-1">
                        Current display: {formatRp(Number(method.priceRaw ?? 0))}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[13px] text-[#df0000] mt-4">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="flex items-center gap-2 bg-[#511e0b] text-white rounded-lg px-5 py-2.5 text-[14px] font-bold border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-6"
      >
        {saving ? (
          <><Loader2 size={15} className="animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle size={15} /> Saved</>
        ) : (
          <><Save size={15} /> Save Settings</>
        )}
      </button>
    </div>
  );
}
