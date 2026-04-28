"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  order_count: number;
  total_spend: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("full_name");

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        return;
      }

      // Fetch order aggregates per user
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("user_id, total_price_raw");

      if (ordersError) throw ordersError;

      // Aggregate order count and total spend per user
      const aggregates: Record<string, { count: number; total: number }> = {};
      for (const order of orders ?? []) {
        if (!aggregates[order.user_id]) {
          aggregates[order.user_id] = { count: 0, total: 0 };
        }
        aggregates[order.user_id].count += 1;
        aggregates[order.user_id].total += order.total_price_raw ?? 0;
      }

      const rows: UserRow[] = profiles.map((p) => ({
        id: p.id,
        full_name: p.full_name || "(no name)",
        email: p.email || "",
        role: p.role || "user",
        order_count: aggregates[p.id]?.count ?? 0,
        total_spend: aggregates[p.id]?.total ?? 0,
      }));

      setUsers(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setUpdatingRole(userId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setUpdatingRole(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-[20px] text-black">Users</h1>
      </div>

      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-[#d0d0d0]">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full border border-[#d0d0d0] rounded pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[#511E0B] transition-colors placeholder:text-[#6b6b6b]"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 text-[13px] text-[#DF0000] bg-red-50 border-b border-red-200">
            {error}
            <button onClick={fetchUsers} className="ml-2 underline font-medium bg-transparent border-none cursor-pointer text-[#DF0000]">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#511e0b]" />
            <span className="ml-2 text-[14px] text-[#6b6b6b]">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#d0d0d0]">
                  {["Name", "Email", "Role", "Orders", "Total Spend", "Action"].map((h) => (
                    <th key={h} className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-[13px] text-[#6b6b6b] py-12">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="border-b border-[#d0d0d0] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[13px] font-medium text-black">{user.full_name}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6b6b6b]">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-bold ${
                          user.role === "admin"
                            ? "bg-[#FDF9F5] text-[#511e0b]"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-black">{user.order_count}</td>
                      <td className="px-4 py-3 text-[13px] text-black whitespace-nowrap">
                        {formatCurrency(user.total_spend)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(user.id, user.role)}
                          disabled={updatingRole === user.id}
                          className="text-[13px] text-[#511E0B] font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {updatingRole === user.id && <Loader2 size={12} className="animate-spin" />}
                          {user.role === "admin" ? "Demote to User" : "Promote to Admin"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
