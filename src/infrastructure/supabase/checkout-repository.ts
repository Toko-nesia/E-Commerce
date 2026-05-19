import { createServiceClient } from "@/lib/supabase/service";
import { formatRp, type CheckoutProduct } from "@/domain/checkout";
import { DuplicateCheckoutRequestError } from "@/application/checkout/create-checkout-intent";
import { isShippingMethodCode, type ShippingMethodConfig } from "@/domain/shipping";
import type {
  CheckoutAddress,
  CheckoutRepository,
  CreateCheckoutOrderInput,
  CreatedCheckoutOrder,
  ExistingCheckoutOrder,
} from "@/application/checkout/create-checkout-intent";
import type { Json } from "@/types/supabase";

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
    description: row.description ?? null,
    pricingType: row.pricing_type ?? "fixed",
    minPriceRaw: row.min_price_raw == null ? null : Number(row.min_price_raw),
    maxPriceRaw: row.max_price_raw == null ? null : Number(row.max_price_raw),
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
      .select("id, name, category, price, price_raw, weight_kg, stock, description, pricing_type, min_price_raw, max_price_raw")
      .in("id", productIds);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toProduct);
  }

  async getShippingMethods(): Promise<ShippingMethodConfig[]> {
    const { data, error } = await (this.supabase as any)
      .from("shipping_methods")
      .select("code, label, enabled, price_raw, requires_tracking, settings")
      .in("code", ["fedex", "internal_courier"])
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? [])
      .filter((row: Record<string, any>) => isShippingMethodCode(row.code))
      .map((row: Record<string, any>) => ({
        code: row.code,
        label: row.label,
        enabled: Boolean(row.enabled),
        priceRaw: row.price_raw == null ? null : Number(row.price_raw),
        requiresTracking: Boolean(row.requires_tracking),
        settings: row.settings ?? {},
      }));
  }

  async createPendingOrder(input: CreateCheckoutOrderInput): Promise<CreatedCheckoutOrder> {
    const midtransOrderId = `ZB-${input.id.replace(/-/g, "").slice(0, 24).toUpperCase()}`;

    const items = input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      price_raw: item.priceRaw,
      price: item.price,
      custom_amount_raw: item.customAmountRaw ?? null,
      buyer_note: item.buyerNote ?? null,
    }));

    const { data, error } = await (this.supabase as any).rpc("create_checkout_order_with_stock_reservation", {
      p_order_id: input.id,
      p_user_id: input.userId,
      p_midtrans_order_id: midtransOrderId,
      p_idempotency_key: input.idempotencyKey,
      p_cart_fingerprint: input.cartFingerprint,
      p_address_id: input.address.id,
      p_address_snapshot: toJson({
        name: input.address.name,
        phone: input.address.phone,
        address: input.address.address,
        full_address: input.address.fullAddress,
        details: input.address.details,
        postal_code: input.address.postalCode,
        country_code: input.address.countryCode,
      }),
      p_pricing_snapshot: toJson({
        subtotal: input.pricing.subtotal,
        shipping_cost: input.pricing.shippingCost,
        service_fee: input.pricing.serviceFee,
        grand_total: input.pricing.grandTotal,
        total_weight_kg: input.pricing.totalWeightKg,
      }),
      p_shipping_snapshot: toJson(input.shippingSnapshot),
      p_cart_snapshot: toJson(input.cartSnapshot),
      p_items: toJson(items),
      p_total_price_raw: input.pricing.grandTotal,
      p_total_price: formatRp(input.pricing.grandTotal),
      p_shipping_cost: input.pricing.shippingCost,
      p_service_fee: input.pricing.serviceFee,
      p_note: input.note || "",
      p_payment_method: input.paymentMethod,
      p_shipping_method: input.shippingMethod,
    });

    if (error) {
      if (error.code === "23505") {
        throw new DuplicateCheckoutRequestError();
      }
      throw new Error(error.message);
    }

    const created = (data ?? {}) as { id?: string; midtrans_order_id?: string };
    return {
      id: created.id ?? input.id,
      midtransOrderId: created.midtrans_order_id ?? midtransOrderId,
    };
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
