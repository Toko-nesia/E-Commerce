"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/database";

interface CustomSpec {
  key: string;
  value: string;
}

const inputClass =
  "w-full border border-[#d0d0d0] rounded px-3 py-2 text-[14px] outline-none focus:border-[#511E0B] transition-colors placeholder:text-[#6b6b6b]";

const labelClass = "block font-bold text-[14px] text-black mb-1.5";

const RequiredStar = () => <span className="text-[#DF0000] ml-0.5">*</span>;

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-set spec fields state
  const [stock, setStock] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [unitWeight, setUnitWeight] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("categories").select("*").then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  };

  const addCustomSpec = () => {
    setCustomSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateCustomSpec = (index: number, field: "key" | "value", val: string) => {
    setCustomSpecs((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, [field]: val } : spec)),
    );
  };

  const removeCustomSpec = (index: number) => {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate weight_kg > 0
    const weightKg = parseFloat(unitWeight);
    if (!unitWeight || isNaN(weightKg) || weightKg <= 0) {
      setError("Unit weight must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // Upload image if selected
      let imageUrl = "";
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const filePath = `products/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, photoFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      // Parse price: strip "Rp" and dots, convert to integer
      const priceRaw = parseInt(price.replace(/[Rp.\s]/g, "").replace(/,/g, ""), 10) || 0;
      const priceFormatted = price.startsWith("Rp") ? price : `Rp ${price}`;

      // Build specifications from custom specs
      const specifications: Record<string, string> = {};
      if (brand) specifications["Brand"] = brand;
      if (condition) specifications["Condition"] = condition;
      for (const spec of customSpecs) {
        if (spec.key.trim()) specifications[spec.key.trim()] = spec.value.trim();
      }

      const { error: insertError } = await supabase.from("products").insert({
        name: name.trim(),
        category,
        price: priceFormatted,
        price_raw: priceRaw,
        description: description.trim(),
        stock: parseInt(stock) || 0,
        weight_kg: weightKg,
        image: imageUrl,
        specifications: Object.keys(specifications).length > 0 ? specifications : null,
        badge: "",
        badge_color: "",
      });

      if (insertError) throw insertError;

      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const presetSpecs: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    min?: string;
    step?: string;
    required?: boolean;
  }[] = [
    {
      label: "Stock",
      placeholder: "0",
      value: stock,
      onChange: setStock,
      type: "number",
      min: "0",
      required: true,
    },
    {
      label: "Brand",
      placeholder: "Enter brand",
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
      label: "Unit Weight (kg)",
      placeholder: "e.g. 5",
      value: unitWeight,
      onChange: setUnitWeight,
      type: "number",
      min: "0.001",
      step: "0.001",
      required: true,
    },
  ];

  return (
    <div>
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] p-8">
        <div>
          <h1 className="font-bold text-[20px] text-black">Add Product</h1>
          <p className="text-[#6b6b6b] text-[13px] mt-1">
            Add the product photo, name, price, stock, and description.
          </p>
          <hr className="border-[#d0d0d0] mt-4" />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-[13px] text-[#DF0000]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-12 mt-6">
            {/* LEFT: Basic Info */}
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>
                  Product Photo
                  <RequiredStar />
                </label>
                <label className="cursor-pointer inline-block">
                  <div className="w-[82px] h-[82px] border border-dashed border-[#d0d0d0] rounded flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                    {photoPreview ? (
                       
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={22} className="text-[#6b6b6b]" />
                        <span className="text-[11px] text-[#6b6b6b] text-center leading-tight px-1">
                          Add photo
                        </span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                </label>
              </div>

              <div>
                <label className={labelClass}>
                  Product Name
                  <RequiredStar />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Category
                  <RequiredStar />
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`${inputClass} bg-white cursor-pointer`}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Price
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

              <div>
                <label className={labelClass}>
                  Product Description
                  <RequiredStar />
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                  rows={5}
                  className={`${inputClass} h-[120px] resize-none`}
                  required
                />
              </div>
            </div>

            {/* RIGHT: Specifications */}
            <div>
              <label className="block font-bold text-[14px] text-black mb-3">
                Product Specifications
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
                        step={spec.step}
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
                      placeholder="Specification name"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => updateCustomSpec(idx, "value", e.target.value)}
                      placeholder="Value"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomSpec(idx)}
                      className="flex items-center justify-center text-[#DF0000] hover:text-red-700 bg-transparent border-none cursor-pointer p-0"
                      aria-label="Remove specification"
                    >
                      <X size={14} />
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-4 border-t border-[#d0d0d0]" />

              <button
                type="button"
                onClick={addCustomSpec}
                className="bg-[#511E0B] text-white rounded px-4 py-2 text-[14px] font-bold flex items-center gap-2 mt-3 hover:bg-[#3d1608] transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Add specification
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mx-auto block mt-8 bg-[#511E0B] text-white rounded px-8 py-3 font-bold text-[14px] hover:bg-[#3d1608] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
