import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, loadEnv, requireEnv } from "./shared-env.mjs";

loadEnv();

const supabase = createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

async function main() {
  console.log("Invoking refresh-exchange-rate Edge Function...");

  try {
    const { data, error } = await supabase.functions.invoke("refresh-exchange-rate");
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (data && data.success) {
      console.log(`Successfully refreshed exchange rate via Edge Function. Rate: ${data.rate}, Updated At: ${data.updated_at}`);
      return;
    } else {
      throw new Error(data?.error || "Unknown edge function error");
    }
  } catch (edgeError) {
    console.warn(`Edge Function invocation failed: ${edgeError.message}`);
    console.log("Falling back to local API fetching and direct DB upsert...");
    
    const response = await fetch("https://open.er-api.com/v6/latest/IDR");
    if (!response.ok) {
      throw new Error(`Exchange API responded with status ${response.status}`);
    }
    const json = await response.json();
    if (json.result !== "success") {
      throw new Error(`Exchange API error: ${json["error-type"] ?? "unknown"}`);
    }
    const rate = json.rates?.JPY;
    const rateUpdatedAt = new Date(json.time_last_update_unix * 1000).toISOString();
    
    if (typeof rate !== "number" || isNaN(rate)) {
      throw new Error("JPY rate missing or invalid in API response");
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
      throw new Error(upsertError.message);
    }

    console.log(`Successfully upserted exchange rate directly. Rate: ${rate}, Updated At: ${rateUpdatedAt}`);
  }
}

main().catch((err) => {
  console.error(`Failed to bootstrap exchange rate: ${err.message}`);
  process.exitCode = 1;
});
