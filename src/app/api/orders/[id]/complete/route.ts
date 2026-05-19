import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { completeOrderByBuyer } from "@/application/orders/complete-order";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await completeOrderByBuyer({
      supabase: createServiceClient(),
      orderId: id,
      userId: user.id,
    });

    if (result.status === "completed") {
      await notifyOrderEvent({ eventType: "order_completed", orderId: id });
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
