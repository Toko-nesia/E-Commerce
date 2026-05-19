import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assertAdmin } from "@/application/refunds/refund-flow";
import { completeOverdueShippedOrders } from "@/application/orders/complete-order";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";

export async function POST() {
  try {
    const authClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();
    await assertAdmin(service, user.id);
    const result = await completeOverdueShippedOrders({ supabase: service });
    await Promise.all(result.completed.map((orderId) => notifyOrderEvent({ eventType: "order_completed", orderId })));

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete overdue orders.";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
