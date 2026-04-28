"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Plus, X, ArrowLeft, Check } from "lucide-react";
import { getProductById } from "@/data/products";
import { categories } from "@/data/categories";

interface CustomSpec {
  key: string;
  value: string;
}

const inputClass =
  "w-full border border-[#EBEBEB] rounded px-3 py-2 text-[14px] outline-none focus:border-[#511E0B] transition-colors placeholder:text-[#A6A6A6]";

const labelClass = "block font-bold text-[14px] text-black mb-1.5";

const RequiredStar = () => <span className="text-[#DF0000] ml-0.5">*</span>;

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const product = getProductById(parseInt(id));

  // If product not found
  if (!product) {
    return (
      <div className="text-center py-24">
        <p className="text-[16px] text-[#A6A6A6] mb-4">Produk tidak ditemukan.</p>
        <Link href="/admin/products" className="text-[#511E0B] underline text-[14px]">
          ← Kembali ke Produk
        </Link>
      </div>
    );
  }

  return <EditForm product={product} onSaved={() => router.push("/admin/products")} />;
}

function EditForm({
  product,
  onSaved,
}: {
  product: NonNullable<ReturnType<typeof getProductById>>;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price);
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(
    typeof product.description === "object" && product.description
      ? product.description.text
      : "Produk berkualitas dari Indonesia.",
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(product.image);
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);
  const [saved, setSaved] = useState(false);

  // Preset specs
  const [stock, setStock] = useState(String(product.stock ?? ""));
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("New");
  const [unitWeight, setUnitWeight] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const addCustomSpec = () => setCustomSpecs((prev) => [...prev, { key: "", value: "" }]);

  const updateCustomSpec = (index: number, field: "key" | "value", val: string) =>
    setCustomSpecs((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, [field]: val } : spec)),
    );

  const removeCustomSpec = (index: number) =>
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Future: update product via API / Supabase
    setSaved(true);
    setTimeout(() => onSaved(), 1000);
  };

  const presetSpecs: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    min?: string;
    required?: boolean;
  }[] = [
    { label: "Stok", placeholder: "0", value: stock, onChange: setStock, type: "number", min: "0", required: true },
    { label: "Merk", placeholder: "Masukkan merk", value: brand, onChange: setBrand, required: true },
    { label: "Condition", placeholder: "New / Used", value: condition, onChange: setCondition, required: true },
    { label: "Unit Weight", placeholder: "cth: 5kg", value: unitWeight, onChange: setUnitWeight, required: true },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#A6A6A6] hover:text-[#511E0B] transition-colors mb-5 no-underline"
      >
        <ArrowLeft size={14} />
        Kembali ke Produk
      </Link>

      {/* ── White Card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] p-8">
        {/* Card Header */}
        <div>
          <h1 className="font-bold text-[20px] text-black">Edit Produk</h1>
          <p className="text-[#A6A6A6] text-[13px] mt-1">
            ID Produk: <span className="font-medium text-black">{3172860 + product.id}</span>
          </p>
          <hr className="border-[#EBEBEB] mt-4" />
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Two-column Grid ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-12 mt-6">
            {/* ── LEFT ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-5">
              {/* Foto Produk */}
              <div>
                <label className={labelClass}>
                  Foto Produk
                  <RequiredStar />
                </label>
                <label className="cursor-pointer inline-block">
                  <div className="w-[82px] h-[82px] border border-dashed border-[#EBEBEB] rounded flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden relative">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={22} className="text-[#A6A6A6]" />
                        <span className="text-[11px] text-[#A6A6A6] text-center leading-tight px-1">
                          Tambahkan foto
                        </span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                </label>
              </div>

              {/* Nama Produk */}
              <div>
                <label className={labelClass}>
                  Nama Produk
                  <RequiredStar />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama produk"
                  className={inputClass}
                  required
                />
              </div>

              {/* Kategori */}
              <div>
                <label className={labelClass}>
                  Kategori
                  <RequiredStar />
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`${inputClass} bg-white cursor-pointer`}
                  required
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga */}
              <div>
                <label className={labelClass}>
                  Harga
                  <RequiredStar />
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Rp 0"
                  className={inputClass}
                  required
                />
              </div>

              {/* Deskripsi Produk */}
              <div>
                <label className={labelClass}>
                  Deskripsi Produk
                  <RequiredStar />
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masukkan deskripsi produk"
                  rows={5}
                  className={`${inputClass} h-[120px] resize-none`}
                  required
                />
              </div>
            </div>

            {/* ── RIGHT: Specifications ─────────────────────────────── */}
            <div>
              <label className="block font-bold text-[14px] text-black mb-3">
                Spesifikasi Produk
              </label>

              <div className="grid grid-cols-[120px_1fr_24px] gap-x-4 gap-y-3">
                {presetSpecs.map((spec) => (
                  <React.Fragment key={spec.label}>
                    <div className="flex items-center">
                      <span className="text-[13px] text-gray-700 font-medium">
                        {spec.label}
                        {spec.required && <RequiredStar />}
                      </span>
                    </div>
                    <div>
                      <input
                        type={spec.type ?? "text"}
                        min={spec.min}
                        value={spec.value}
                        onChange={(e) => spec.onChange(e.target.value)}
                        placeholder={spec.placeholder}
                        required={spec.required}
                        className={inputClass}
                      />
                    </div>
                    <span />
                  </React.Fragment>
                ))}

                {customSpecs.map((spec, idx) => (
                  <React.Fragment key={idx}>
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => updateCustomSpec(idx, "key", e.target.value)}
                      placeholder="Nama spesifikasi"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => updateCustomSpec(idx, "value", e.target.value)}
                      placeholder="Nilai"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomSpec(idx)}
                      className="flex items-center justify-center text-[#DF0000] hover:text-red-700 bg-transparent border-none cursor-pointer p-0"
                      aria-label="Hapus spesifikasi"
                    >
                      <X size={14} />
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-4 border-t border-[#EBEBEB]" />
              <button
                type="button"
                onClick={addCustomSpec}
                className="bg-[#511E0B] text-white rounded px-4 py-2 text-[14px] font-bold flex items-center gap-2 mt-3 hover:bg-[#3d1608] transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Spesifikasi lainnya
              </button>
            </div>
          </div>

          {/* ── Action Buttons ────────────────────────────────────────── */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="border border-[#EBEBEB] text-black rounded px-6 py-3 font-medium text-[14px] hover:bg-gray-50 transition-colors cursor-pointer bg-white"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={saved}
              className="bg-[#511E0B] text-white rounded px-8 py-3 font-bold text-[14px] hover:bg-[#3d1608] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-70"
            >
              {saved ? (
                <>
                  <Check size={16} />
                  Tersimpan!
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
