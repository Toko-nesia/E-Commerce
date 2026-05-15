import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { payoutSchema } from "@/application/refunds/schemas";
import { submitRefundPayout } from "@/application/refunds/refund-flow";
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

    const body = payoutSchema.parse(await req.json());
    const result = await submitRefundPayout({
      supabase: createServiceClient(),
      userId: user.id,
      refundId: id,
      refundMethod: body.refundMethod,
      payoutProvider: body.payoutProvider,
      accountName: body.accountName,
      accountNumber: body.accountNumber,
      notify: notifyOrderEvent,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit refund payout";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
