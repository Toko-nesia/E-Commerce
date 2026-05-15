import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { markRefundedSchema } from "@/application/refunds/schemas";
import { markRefunded } from "@/application/refunds/refund-flow";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = markRefundedSchema.parse(await req.json());
    const result = await markRefunded({
      supabase: createServiceClient(),
      adminUserId: user.id,
      refundId: id,
      transferNote: body.transferNote,
      notify: notifyOrderEvent,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark refund as done";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
