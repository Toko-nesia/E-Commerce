import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPasswordIssues } from "@/domain/validation";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string(),
}).superRefine((value, ctx) => {
  const issues = getPasswordIssues(value.password, {
    email: value.email,
    name: value.name,
  });
  for (const issue of issues) {
    ctx.addIssue({ code: "custom", path: ["password"], message: issue });
  }
});

export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid registration payload",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.name } },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email || parsed.data.email,
          full_name: parsed.data.name,
          role: "user",
        }
      : null,
  });
}
