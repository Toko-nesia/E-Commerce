"use client";

import { useState } from "react";
import { Plus, AlertTriangle, X } from "lucide-react";
import { categories as initialCategories } from "@/data/categories";
import type { Category } from "@/types/database";

type ModalMode = "add" | "edit" | null;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const inputClass =
  "w-full border border-[#EBEBEB] rounded px-3 py-2 text-[14px] outline-none focus:border-[#511E0B] transition-colors placeholder:text-[#A6A6A6]";

export default function CategoriesPage() {
  const [catList, setCatList] = useState<Category[]>(initialCategories);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCount, setFormCount] = useState("");

  const openAdd = () => {
    setFormName("");
    setFormCount("");
    setEditingCat(null);
    setModalMode("add");
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormCount(String(cat.count));
    setEditingCat(cat);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingCat(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = editingCat ? editingCat.slug : slugify(formName);
    const count = parseInt(formCount) || 0;

    if (modalMode === "add") {
      setCatList((prev) => [...prev, { name: formName, slug, count }]);
    } else if (modalMode === "edit" && editingCat) {
      setCatList((prev) =>
        prev.map((c) =>
          c.slug === editingCat.slug ? { ...c, name: formName, count } : c,
        ),
      );
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteSlug) return;
    setCatList((prev) => prev.filter((c) => c.slug !== deleteSlug));
    setDeleteSlug(null);
  };

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-[20px] text-black">Kategori</h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#511E0B] text-white text-[14px] font-bold px-4 py-2 rounded hover:bg-[#3d1608] transition-colors cursor-pointer border-none"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      {/* ── White Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EBEBEB]">
              <th className="text-left text-[14px] font-normal text-black px-4 py-3">
                Nama Kategori
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3">
                Slug
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3">
                Jumlah Produk
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {catList.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-[13px] text-[#A6A6A6] py-12">
                  Belum ada kategori.
                </td>
              </tr>
            ) : (
              catList.map((category) => (
                <tr
                  key={category.slug}
                  className="border-b border-[#EBEBEB] last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-[13px] text-black font-medium">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#A6A6A6]">
                    {category.slug}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-black">
                    {category.count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="text-[13px] text-[#511E0B] font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSlug(category.slug)}
                        className="text-[13px] text-[#DF0000] font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      {modalMode !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[17px] text-black">
                {modalMode === "add" ? "Tambah Kategori" : "Edit Kategori"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#A6A6A6] hover:text-black bg-transparent border-none cursor-pointer p-0 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Nama */}
              <div>
                <label className="block font-bold text-[13px] text-black mb-1.5">
                  Nama Kategori <span className="text-[#DF0000]">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masukkan nama kategori"
                  className={inputClass}
                  required
                />
                {formName && modalMode === "add" && (
                  <p className="text-[11px] text-[#A6A6A6] mt-1">
                    Slug: <span className="font-medium text-[#511E0B]">{slugify(formName)}</span>
                  </p>
                )}
              </div>

              {/* Jumlah Produk */}
              <div>
                <label className="block font-bold text-[13px] text-black mb-1.5">
                  Jumlah Produk
                </label>
                <input
                  type="number"
                  min="0"
                  value={formCount}
                  onChange={(e) => setFormCount(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-[#EBEBEB] text-black text-[13px] font-medium rounded-lg py-2.5 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#511E0B] text-white text-[13px] font-bold rounded-lg py-2.5 hover:bg-[#3d1608] transition-colors border-none cursor-pointer"
                >
                  {modalMode === "add" ? "Tambah" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      {deleteSlug !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDeleteSlug(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-50 rounded-full p-2.5">
                <AlertTriangle size={20} className="text-[#DF0000]" />
              </div>
              <h3 className="font-bold text-[16px] text-black">Hapus Kategori?</h3>
            </div>
            <p className="text-[13px] text-[#A6A6A6] leading-relaxed">
              Apakah kamu yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteSlug(null)}
                className="flex-1 border border-[#EBEBEB] text-black text-[13px] font-medium rounded-lg py-2.5 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 bg-[#DF0000] text-white text-[13px] font-bold rounded-lg py-2.5 hover:bg-red-700 transition-colors border-none cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
