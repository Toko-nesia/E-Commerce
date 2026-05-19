import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const shippingMethodSchema = z.object({
  code: z.enum(["fedex", "internal_courier"]),
  label: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
  priceRaw: z.coerce.number().int().min(0).nullable().optional(),
});

const settingsPayloadSchema = z.object({
  settings: z.array(z.object({
    key: z.string().trim().min(1).max(80),
    value: z.string().trim().max(2000),
  })).optional().default([]),
  shippingMethods: z.array(shippingMethodSchema).optional().default([]),
}).strict();

async function assertAdminRequest() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }
  if (user.app_metadata?.role !== "admin") {
    throw new Error("Forbidden");
  }
}

export async function GET() {
  try {
    await assertAdminRequest();
    const supabase = createServiceClient();
    const { data: settings, error } = await supabase
      .from("store_settings")
      .select("key, value, description")
      .order("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: shippingMethods, error: shippingError } = await (supabase as any)
      .from("shipping_methods")
      .select("code, label, enabled, price_raw, requires_tracking, settings, sort_order")
      .order("sort_order", { ascending: true });

    if (shippingError) {
      return NextResponse.json({ error: shippingError.message }, { status: 500 });
    }

    return NextResponse.json({
      settings: settings ?? [],
      shippingMethods: (shippingMethods ?? []).map((method: Record<string, unknown>) => ({
        code: method.code,
        label: method.label,
        enabled: method.enabled,
        priceRaw: method.price_raw,
        requiresTracking: method.requires_tracking,
        settings: method.settings,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await assertAdminRequest();
    const body = settingsPayloadSchema.parse(await req.json());
    const { settings, shippingMethods } = body;

    if (settings.length === 0 && shippingMethods.length === 0) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    if (shippingMethods.length > 0 && !shippingMethods.some((method) => method.enabled)) {
      return NextResponse.json({ error: "At least one shipping method must be enabled." }, { status: 400 });
    }

    const fedex = shippingMethods.find((method) => method.code === "fedex");
    if (fedex?.enabled) {
      const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));
      for (const key of ["origin_name", "origin_address", "origin_postal_code", "origin_country_code"]) {
        if (!settingMap.get(key)?.trim()) {
          return NextResponse.json({ error: "FedEx origin settings are required while FedEx is enabled." }, { status: 400 });
        }
      }
      if (settingMap.get("origin_country_code")?.length !== 2) {
        return NextResponse.json({ error: "Origin country code must be 2 letters." }, { status: 400 });
      }
    }

    const supabase = createServiceClient();
    if (settings.length > 0) {
      const upserts = settings.map((setting) => ({
        key: setting.key,
        value: setting.value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("store_settings")
        .upsert(upserts, { onConflict: "key" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (shippingMethods.length > 0) {
      const methodRows = shippingMethods.map((method) => ({
        code: method.code,
        label: method.label,
        enabled: method.enabled,
        price_raw: method.code === "internal_courier" ? Number(method.priceRaw ?? 0) : null,
        requires_tracking: method.code === "fedex",
        sort_order: method.code === "fedex" ? 10 : 20,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await (supabase as any)
        .from("shipping_methods")
        .upsert(methodRows, { onConflict: "code" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
