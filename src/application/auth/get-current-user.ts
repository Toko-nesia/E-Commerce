import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/database";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email || user.email || "",
    full_name: profile?.full_name || user.user_metadata?.full_name || "",
    phone: profile?.phone || undefined,
    avatar_url: profile?.avatar_url || undefined,
    role: profile?.role || (user.app_metadata?.role as string | undefined) || "user",
  };
}
