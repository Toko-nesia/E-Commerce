import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    const message = error?.message ?? "Login failed";
    if (message.toLowerCase().includes("email not confirmed")) {
      return NextResponse.json({
        error: "Please verify your email before logging in.",
        requiresVerification: true,
        email: parsed.data.email,
      }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url, role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role || (data.user.app_metadata?.role as string | undefined) || "user";

  return NextResponse.json({
    success: true,
    role,
    user: {
      id: data.user.id,
      email: profile?.email || data.user.email || "",
      full_name: profile?.full_name || data.user.user_metadata?.full_name || "",
      phone: profile?.phone || undefined,
      avatar_url: profile?.avatar_url || undefined,
      role,
    },
  });
}
