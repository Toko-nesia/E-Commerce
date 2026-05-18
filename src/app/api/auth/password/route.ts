import { NextResponse } from "next/server";
import { passwordUpdateSchema, validatePasswordUpdate } from "@/application/auth/password";
import { createClient } from "@/lib/supabase/server";

function firstString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function PATCH(req: Request) {
  const parsed = passwordUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid password payload.",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    return NextResponse.json({ error: "You must be signed in to change your password." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const email = firstString(profile?.email) ?? firstString(user.email);
  const name =
    firstString(profile?.full_name) ??
    firstString(user.user_metadata?.full_name) ??
    firstString(user.user_metadata?.name);

  const issues = validatePasswordUpdate({
    password: parsed.data.password,
    confirmPassword: parsed.data.confirmPassword,
    email,
    name,
  });

  if (issues.length > 0) {
    return NextResponse.json({ error: issues[0], issues }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: error.message, issues: [error.message] }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
