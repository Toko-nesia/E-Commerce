import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutIntentSchema } from "@/application/checkout/schemas";
import {
  CheckoutIntentConflictError,
  CheckoutIntentInProgressError,
  createCheckoutIntent,
} from "@/application/checkout/create-checkout-intent";
import { SupabaseCheckoutRepository } from "@/infrastructure/supabase/checkout-repository";
import { FedExShippingRateProvider } from "@/infrastructure/fedex/shipping-rate-provider";
import { MidtransSnapPaymentGateway } from "@/infrastructure/midtrans/snap-payment-gateway";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createCheckoutIntentSchema.parse(await req.json());
    const result = await createCheckoutIntent(
      {
        userId: user.id,
        idempotencyKey: body.idempotencyKey,
        addressId: body.addressId,
        note: body.note,
        items: body.items,
      },
      {
        repository: new SupabaseCheckoutRepository(),
        shipping: new FedExShippingRateProvider(),
        paymentGateway: new MidtransSnapPaymentGateway(),
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid checkout payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof CheckoutIntentInProgressError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CheckoutIntentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Failed to create checkout intent";
    console.error("[checkout/intents] create failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
