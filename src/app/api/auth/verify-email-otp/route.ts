import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const verifyEmailOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export async function POST(req: Request) {
  const parsed = verifyEmailOtpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Verification failed" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url, role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role || (data.user.app_metadata?.role as string | undefined) || "user";
  const redirectTo = role === "admin"
    ? "/admin"
    : profile?.phone
      ? "/"
      : "/complete-data";

  return NextResponse.json({
    success: true,
    redirectTo,
    role,
    user: {
      id: data.user.id,
      email: profile?.email || data.user.email || parsed.data.email,
      full_name: profile?.full_name || data.user.user_metadata?.full_name || "",
      phone: profile?.phone || undefined,
      avatar_url: profile?.avatar_url || undefined,
      role,
    },
  });
}
