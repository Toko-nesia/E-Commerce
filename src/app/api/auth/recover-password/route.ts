import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { recoverPasswordSchema, validatePasswordUpdate } from "@/application/auth/password";
import { createServiceClient } from "@/lib/supabase/service";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";

export async function POST(req: Request) {
  const parsed = recoverPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid password recovery payload.",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const issues = validatePasswordUpdate({
    password: parsed.data.password,
    confirmPassword: parsed.data.confirmPassword,
    email: parsed.data.email,
  });

  if (issues.length > 0) {
    return NextResponse.json({ error: issues[0], issues }, { status: 400 });
  }

  const recoveryClient = createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  const { data, error: verifyError } = await recoveryClient.auth.verifyOtp({
    token_hash: parsed.data.tokenHash,
    type: "recovery",
  });

  if (verifyError || !data.user) {
    return NextResponse.json(
      { error: "This reset link is invalid or expired.", issues: ["This reset link is invalid or expired."] },
      { status: 400 },
    );
  }

  if ((data.user.email ?? "").toLowerCase() !== parsed.data.email) {
    return NextResponse.json(
      { error: "This reset link does not match the submitted email.", issues: ["This reset link does not match the submitted email."] },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const { error: updateError } = await service.auth.admin.updateUserById(data.user.id, {
    password: parsed.data.password,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message, issues: [updateError.message] }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
