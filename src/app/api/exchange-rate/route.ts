import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shouldRefreshRate } from '@/lib/exchange-rate-utils';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate, updated_at, base_currency, target_currency')
      .eq('base_currency', 'IDR')
      .eq('target_currency', 'JPY')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Exchange rate unavailable' },
        { status: 503 }
      );
    }

    // Optionally trigger a refresh if the cached rate is stale (> 24 hours)
    if (shouldRefreshRate(new Date(data.updated_at), new Date())) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey) {
        // Fire-and-forget: don't await so we still return the cached rate quickly
        fetch(`${supabaseUrl}/functions/v1/refresh-exchange-rate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Edge Function may not be deployed yet — ignore errors
        });
      }
    }

    return NextResponse.json({
      rate: data.rate,
      updated_at: data.updated_at,
      base_currency: data.base_currency,
      target_currency: data.target_currency,
    });
  } catch {
    return NextResponse.json(
      { error: 'Exchange rate unavailable' },
      { status: 503 }
    );
  }
}
