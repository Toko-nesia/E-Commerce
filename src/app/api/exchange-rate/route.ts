import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
