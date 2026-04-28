"use client";

import React, { useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import { categories } from "@/data/categories";

interface CustomSpec {
  key: string;
  value: string;
}

const inputClass =
  "w-full border border-[#d0d0d0] rounded px-3 py-2 text-[14px] outline-none focus:border-[#511E0B] transition-colors placeholder:text-[#6b6b6b]";

const labelClass = "block font-bold text-[14px] text-black mb-1.5";

const RequiredStar = () => <span className="text-[#DF0000] ml-0.5">*</span>;

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);

  // Pre-set spec fields state
  const [stock, setStock] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [unitWeight, setUnitWeight] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const addCustomSpec = () => {
    setCustomSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateCustomSpec = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setCustomSpecs((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, [field]: val } : spec)),
    );
  };

  const removeCustomSpec = (index: number) => {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Future: submit to API / Supabase
    console.log({
      name,
      category,
      price,
      description,
      stock,
      brand,
      condition,
      unitWeight,
      customSpecs,
    });
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
    {
      label: "Stok",
      placeholder: "0",
      value: stock,
      onChange: setStock,
      type: "number",
      min: "0",
      required: true,
    },
    {
      label: "Merk",
      placeholder: "Masukkan merk",
      value: brand,
      onChange: setBrand,
      required: true,
    },
    {
      label: "Condition",
      placeholder: "New / Used",
      value: condition,
      onChange: setCondition,
      required: true,
    },
    {
      label: "Unit Weight",
      placeholder: "cth: 5kg",
      value: unitWeight,
      onChange: setUnitWeight,
      required: true,
    },
  ];

  return (
    <div>
      {/* ── White Card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] p-8">
        {/* Card Header */}
        <div>
          <h1 className="font-bold text-[20px] text-black">
            Tambah Produk Baru
          </h1>
          <p className="text-[#6b6b6b] text-[13px] mt-1">
            Masukkan foto, nama, harga, stok, deskripsi produk.
          </p>
          <hr className="border-[#d0d0d0] mt-4" />
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Two-column Grid ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-12 mt-6">
            {/* ── LEFT: Basic Info ─────────────────────────────────── */}
            <div className="flex flex-col gap-5">
              {/* Foto Produk */}
              <div>
                <label className={labelClass}>
                  Foto Produk
                  <RequiredStar />
                </label>
                <label className="cursor-pointer inline-block">
                  <div className="w-[82px] h-[82px] border border-dashed border-[#d0d0d0] rounded flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Camera size={22} className="text-[#6b6b6b]" />
                        <span className="text-[11px] text-[#6b6b6b] text-center leading-tight px-1">
                          Tambahkan foto
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
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

              {/* Unified specs grid — preset rows + custom rows */}
              <div className="grid grid-cols-[120px_1fr_24px] gap-x-4 gap-y-3">
                {/* Preset spec rows */}
                {presetSpecs.map((spec) => (
                  <React.Fragment key={spec.label}>
                    {/* Col 1: Label */}
                    <div className="flex items-center">
                      <span className="text-[13px] text-gray-700 font-medium">
                        {spec.label}
                        {spec.required && <RequiredStar />}
                      </span>
                    </div>

                    {/* Col 2: Input */}
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

                    {/* Col 3: Empty placeholder */}
                    <span />
                  </React.Fragment>
                ))}

                {/* Custom spec rows */}
                {customSpecs.map((spec, idx) => (
                  <React.Fragment key={idx}>
                    {/* Col 1: Key input */}
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) =>
                        updateCustomSpec(idx, "key", e.target.value)
                      }
                      placeholder="Nama spesifikasi"
                      className={inputClass}
                    />

                    {/* Col 2: Value input */}
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) =>
                        updateCustomSpec(idx, "value", e.target.value)
                      }
                      placeholder="Nilai"
                      className={inputClass}
                    />

                    {/* Col 3: Remove button */}
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

              {/* Divider */}
              <div className="mt-4 border-t border-[#d0d0d0]" />

              {/* Add custom spec button */}
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

          {/* ── Submit Button ─────────────────────────────────────────── */}
          <button
            type="submit"
            className="mx-auto block mt-8 bg-[#511E0B] text-white rounded px-8 py-3 font-bold text-[14px] hover:bg-[#3d1608] transition-colors cursor-pointer"
          >
            Simpan Produk
          </button>
        </form>
      </div>
    </div>
  );
}
