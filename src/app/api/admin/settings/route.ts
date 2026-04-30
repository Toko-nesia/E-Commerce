import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// GET — fetch all store settings
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value, description")
      .order("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST — upsert store settings (admin only)
export async function POST(req: NextRequest) {
  try {
    // Verify caller is admin via server session
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body as { settings: Array<{ key: string; value: string }> };

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    const upserts = settings.map((s) => ({
      key: s.key,
      value: s.value,
      updated_at: new Date().toISOString(),
    }));

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("store_settings")
      .upsert(upserts, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
