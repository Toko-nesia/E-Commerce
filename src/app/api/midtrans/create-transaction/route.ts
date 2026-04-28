import { NextRequest, NextResponse } from "next/server";
import MidtransClient from "midtrans-client";
import { createServiceClient } from "@/lib/supabase/service";
import { buildMidtransItemDetails, formatRp } from "@/lib/order-utils";

const snap = new MidtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,        // ZB-{timestamp} — used as midtrans_order_id
      grossAmount,
      customerDetails,
      cartItems,
      shippingCost,
      serviceFee,
      userId,
      note,
    } = body;

    if (!orderId || !grossAmount || !userId) {
      return NextResponse.json(
        { error: "orderId, grossAmount, and userId are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Generate a UUID for the DB row; orderId becomes midtrans_order_id
    const dbOrderId = crypto.randomUUID();

    // Insert order row
    const { error: orderError } = await supabase.from("orders").insert({
      id: dbOrderId,
      user_id: userId,
      status: "BARU",
      payment_status: "pending",
      midtrans_order_id: orderId,
      total_price_raw: grossAmount,
      total_price: formatRp(grossAmount),
      shipping_cost: shippingCost ?? 0,
      service_fee: serviceFee ?? 0,
      note: note ?? null,
    });

    if (orderError) {
      // Unique constraint violation on midtrans_order_id
      if (orderError.code === "23505") {
        return NextResponse.json(
          { error: "Duplicate order ID. Please try again." },
          { status: 409 }
        );
      }
      console.error("Order insert error:", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Insert order_items
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      const orderItems = cartItems.map((item: { id: string | number; qty: number; price: number }) => ({
        order_id: dbOrderId,
        product_id: item.id,
        quantity: item.qty,
        price_raw: item.price,
        price: formatRp(item.price),
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) {
        console.error("Order items insert error:", itemsError);
        // Roll back the order row
        await supabase.from("orders").delete().eq("id", dbOrderId);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    // Build Midtrans item details — IMPORT_TAX excluded
    const itemDetails = buildMidtransItemDetails(
      (cartItems ?? []).map((item: { id: string | number; price: number; qty: number; name?: string }) => ({
        id: String(item.id),
        price: item.price,
        quantity: item.qty,
        name: (item.name ?? String(item.id)).slice(0, 50),
      })),
      shippingCost ?? 0,
      serviceFee ?? 0
    );

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: customerDetails ?? {},
      item_details: itemDetails,
      credit_card: { secure: true },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: dbOrderId,
      midtransOrderId: orderId,
    });
  } catch (error: unknown) {
    console.error("Midtrans create-transaction error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
