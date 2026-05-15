import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createBuyerCancellationSchema } from "@/application/refunds/schemas";
import { createBuyerCancellationRequest } from "@/application/refunds/refund-flow";

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

    const body = createBuyerCancellationSchema.parse(await req.json());
    const refund = await createBuyerCancellationRequest({
      supabase: createServiceClient(),
      userId: user.id,
      orderId: id,
      reason: body.reason,
    });

    return NextResponse.json({ refund });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create cancellation request";
    const status = message === "Order not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

