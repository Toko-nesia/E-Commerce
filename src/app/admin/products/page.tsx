"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { products as initialProducts } from "@/data/products";
import { categories } from "@/data/categories";

export default function ProductsPage() {
  const [productList, setProductList] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return productList.filter((p) => {
      const matchName = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "" || p.category === selectedCategory;
      return matchName && matchCategory;
    });
  }, [productList, search, selectedCategory]);

  const confirmDelete = () => {
    if (confirmDeleteId === null) return;
    setProductList((prev) => prev.filter((p) => p.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-[20px] text-black">Produk Saya</h1>
        <Link
          href="/admin/products/add"
          className="flex items-center gap-2 bg-[#511E0B] text-white text-[14px] font-bold px-4 py-2 rounded hover:bg-[#3d1608] transition-colors"
        >
          <Plus size={16} />
          Tambah Produk
        </Link>
      </div>

      {/* ── White Card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Filter Row */}
        <div className="flex items-center gap-3 p-4 border-b border-[#d0d0d0]">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk, ID Produk"
              className="w-full border border-[#d0d0d0] rounded pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[#511E0B] transition-colors placeholder:text-[#6b6b6b]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-[#d0d0d0] rounded px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-[#511E0B] transition-colors bg-white cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#d0d0d0]">
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3">
                Produk
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3">
                Harga
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3">
                Stok
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-[13px] text-[#6b6b6b] py-12"
                >
                  Tidak ada produk yang ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#d0d0d0] last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {/* Produk */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-[82px] h-[82px] flex-shrink-0 rounded overflow-hidden border border-[#d0d0d0] bg-gray-50">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-contain"
                          sizes="82px"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[13px] text-black leading-snug line-clamp-2 max-w-[260px]">
                          {p.name}
                        </span>
                        <span className="text-[13px] text-[#6b6b6b]">
                          ID Produk: {3172860 + p.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Harga */}
                  <td className="px-4 py-4 text-[13px] text-black whitespace-nowrap">
                    {p.price}
                  </td>

                  {/* Stok */}
                  <td className="px-4 py-4 text-[13px]">
                    {p.stock === undefined ? (
                      <span className="text-[#6b6b6b]">-</span>
                    ) : p.stock === 0 ? (
                      <span className="text-[#DF0000] font-semibold">Habis</span>
                    ) : (
                      <span className="text-black">{p.stock}</span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-[13px] text-[#511E0B] font-semibold hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="text-[13px] text-[#DF0000] font-semibold hover:underline bg-transparent border-none cursor-pointer"
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

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-50 rounded-full p-2.5">
                <AlertTriangle size={20} className="text-[#DF0000]" />
              </div>
              <h3 className="font-bold text-[16px] text-black">Hapus Produk?</h3>
            </div>
            <p className="text-[13px] text-[#6b6b6b] leading-relaxed">
              Apakah kamu yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-[#d0d0d0] text-black text-[13px] font-medium rounded-lg py-2.5 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
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
