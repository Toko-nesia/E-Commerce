import { createServiceClient } from "@/lib/supabase/service";
import { formatRp, type CheckoutProduct } from "@/domain/checkout";
import { DuplicateCheckoutRequestError } from "@/application/checkout/create-checkout-intent";
import type {
  CheckoutAddress,
  CheckoutRepository,
  CreateCheckoutOrderInput,
  CreatedCheckoutOrder,
  ExistingCheckoutOrder,
} from "@/application/checkout/create-checkout-intent";
import type { Json, TablesInsert } from "@/types/supabase";

type SupabaseClient = ReturnType<typeof createServiceClient>;

function toAddress(row: Record<string, any>): CheckoutAddress {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    fullAddress: row.full_address ?? row.address,
    details: row.details ?? "",
    postalCode: row.postal_code || "100-0001",
    countryCode: row.country_code || "JP",
  };
}

function toProduct(row: Record<string, any>): CheckoutProduct {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    priceRaw: Number(row.price_raw),
    price: row.price,
    weightKg: Number(row.weight_kg ?? 0),
    stock: Number(row.stock ?? 0),
  };
}

function toExistingOrder(row: Record<string, any>): ExistingCheckoutOrder {
  return {
    id: row.id,
    midtransOrderId: row.midtrans_order_id,
    idempotencyKey: row.idempotency_key,
    cartFingerprint: row.cart_fingerprint,
    snapToken: row.snap_token,
    snapRedirectUrl: row.snap_redirect_url,
    snapTokenExpiresAt: row.snap_token_expires_at,
  };
}

function toJson(value: unknown): Json {
  return value as Json;
}

export class SupabaseCheckoutRepository implements CheckoutRepository {
  constructor(private readonly supabase: SupabaseClient = createServiceClient()) {}

  async findOrderByIdempotency(
    userId: string,
    idempotencyKey: string,
  ): Promise<ExistingCheckoutOrder | null> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("id, midtrans_order_id, idempotency_key, cart_fingerprint, snap_token, snap_redirect_url, snap_token_expires_at")
      .eq("user_id", userId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toExistingOrder(data) : null;
  }

  async getAddressForUser(userId: string, addressId: string): Promise<CheckoutAddress | null> {
    const { data, error } = await this.supabase
      .from("addresses")
      .select("id, user_id, name, phone, address, full_address, details, postal_code, country_code")
      .eq("id", addressId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toAddress(data) : null;
  }

  async getProductsByIds(productIds: number[]): Promise<CheckoutProduct[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("id, name, category, price, price_raw, weight_kg, stock")
      .in("id", productIds);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toProduct);
  }

  async createPendingOrder(input: CreateCheckoutOrderInput): Promise<CreatedCheckoutOrder> {
    const midtransOrderId = `ZB-${input.id.replace(/-/g, "").slice(0, 24).toUpperCase()}`;

    const orderPayload: TablesInsert<"orders"> = {
      id: input.id,
      user_id: input.userId,
      status: "BARU",
      payment_status: "pending",
      midtrans_order_id: midtransOrderId,
      idempotency_key: input.idempotencyKey,
      cart_fingerprint: input.cartFingerprint,
      address_id: input.address.id,
      address_snapshot: toJson({
        name: input.address.name,
        phone: input.address.phone,
        address: input.address.address,
        full_address: input.address.fullAddress,
        details: input.address.details,
        postal_code: input.address.postalCode,
        country_code: input.address.countryCode,
      }),
      pricing_snapshot: toJson({
        subtotal: input.pricing.subtotal,
        shipping_cost: input.pricing.shippingCost,
        service_fee: input.pricing.serviceFee,
        grand_total: input.pricing.grandTotal,
        total_weight_kg: input.pricing.totalWeightKg,
      }),
      shipping_snapshot: toJson(input.shippingSnapshot),
      cart_snapshot: toJson(input.cartSnapshot),
      total_price_raw: input.pricing.grandTotal,
      total_price: formatRp(input.pricing.grandTotal),
      shipping_cost: input.pricing.shippingCost,
      service_fee: input.pricing.serviceFee,
      note: input.note || null,
    };

    const { error: orderError } = await this.supabase.from("orders").insert(orderPayload);
    if (orderError) {
      if (orderError.code === "23505") {
        throw new DuplicateCheckoutRequestError();
      }
      throw new Error(orderError.message);
    }

    const orderItems: TablesInsert<"order_items">[] = input.items.map((item) => ({
      order_id: input.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_raw: item.priceRaw,
      price: item.price,
    }));

    const { error: itemsError } = await this.supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      await this.supabase.from("orders").delete().eq("id", input.id);
      throw new Error(itemsError.message);
    }

    return { id: input.id, midtransOrderId };
  }

  async attachSnapToken(input: {
    orderId: string;
    token: string;
    redirectUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("orders")
      .update({
        snap_token: input.token,
        snap_redirect_url: input.redirectUrl,
        snap_token_expires_at: input.expiresAt.toISOString(),
        payment_url: input.redirectUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.orderId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
