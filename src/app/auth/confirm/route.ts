import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeRelativeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function isSupportedEmailOtpType(value: string | null): value is EmailOtpType {
  return value === "email" || value === "recovery" || value === "invite" || value === "email_change";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = safeRelativeRedirect(requestUrl.searchParams.get("next"));

  if (!tokenHash || !isSupportedEmailOtpType(type)) {
    return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
