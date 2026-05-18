import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assertAdmin } from "@/application/refunds/refund-flow";

export async function GET() {
  try {
    const authClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    await assertAdmin(serviceClient, user.id);

    const { data, error } = await serviceClient
      .from("refund_requests")
      .select(`
        id, order_id, user_id, refund_method, account_number, account_name, payout_provider,
        reason, status, admin_note, refund_amount, initiated_by, rejection_reason, transfer_note, created_at,
        orders ( id, total_price ),
        profiles:profiles!refund_requests_user_id_fkey ( full_name, email )
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ refunds: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load refund requests.";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
