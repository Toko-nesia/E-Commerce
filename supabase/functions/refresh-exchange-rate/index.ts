// Supabase Edge Function: refresh-exchange-rate
// Fetches the live IDR→JPY exchange rate from open.er-api.com (free, no API key)
// and upserts it into the exchange_rates table.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let rate: number;
  let rateUpdatedAt: string;

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/IDR");

    if (!response.ok) {
      throw new Error(`Exchange API responded with status ${response.status}`);
    }

    const json = await response.json();

    if (json.result !== "success") {
      throw new Error(`Exchange API error: ${json["error-type"] ?? "unknown"}`);
    }

    rate = json.rates?.JPY;
    rateUpdatedAt = new Date(json.time_last_update_unix * 1000).toISOString();

    if (typeof rate !== "number" || isNaN(rate)) {
      throw new Error("JPY rate missing or invalid in API response");
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error: upsertError } = await supabase
    .from("exchange_rates")
    .upsert(
      {
        base_currency: "IDR",
        target_currency: "JPY",
        rate,
        updated_at: rateUpdatedAt,
      },
      { onConflict: "base_currency,target_currency" }
    );

  if (upsertError) {
    return new Response(
      JSON.stringify({ success: false, error: upsertError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, rate, updated_at: rateUpdatedAt }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
