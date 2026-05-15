import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createSellerCancellationSchema } from "@/application/refunds/schemas";
import { createSellerCancellation } from "@/application/refunds/refund-flow";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = createSellerCancellationSchema.parse(await req.json());
    const refund = await createSellerCancellation({
      supabase: createServiceClient(),
      adminUserId: user.id,
      orderId: id,
      reason: body.reason,
      notify: notifyOrderEvent,
    });

    return NextResponse.json({ refund });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create seller cancellation";
    const status = message === "Forbidden" ? 403 : message === "Order not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
