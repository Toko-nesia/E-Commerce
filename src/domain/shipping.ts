import type { ShippingCommodity, ShippingDestination } from "@/domain/checkout";

export const SHIPPING_METHODS = ["fedex", "internal_courier"] as const;

export type ShippingMethodCode = (typeof SHIPPING_METHODS)[number];

export interface ShippingMethodConfig {
  code: ShippingMethodCode;
  label: string;
  enabled: boolean;
  priceRaw: number | null;
  requiresTracking: boolean;
  settings?: Record<string, unknown> | null;
}

export interface ShippingRateOption {
  method: ShippingMethodCode;
  label: string;
  shippingCost: number;
  serviceName: string;
  estimatedDelivery: string;
  estimatedDeliveryDate?: string;
  requiresTracking: boolean;
  snapshot: Record<string, unknown>;
}

export interface ExternalShippingRateProvider {
  getShippingRate(input: {
    destination: ShippingDestination;
    commodities: ShippingCommodity[];
  }): Promise<{
    shippingCost: number;
    serviceName: string;
    estimatedDelivery: string;
    estimatedDeliveryDate?: string;
    rateType?: "ACCOUNT";
    currency?: "IDR";
    totalDeclaredValue?: number;
    totalWeightKg?: number;
  }>;
}

export function isShippingMethodCode(value: unknown): value is ShippingMethodCode {
  return typeof value === "string" && (SHIPPING_METHODS as readonly string[]).includes(value);
}

export function normalizeShippingMethodCode(value: unknown): ShippingMethodCode {
  if (!isShippingMethodCode(value)) {
    throw new Error("Invalid shipping method.");
  }
  return value;
}

export function buildInternalCourierRate(method: ShippingMethodConfig): ShippingRateOption {
  const priceRaw = Number(method.priceRaw ?? 0);
  if (!Number.isInteger(priceRaw) || priceRaw < 0) {
    throw new Error("Internal courier price is not configured correctly.");
  }

  return {
    method: "internal_courier",
    label: method.label || "Internal Courier",
    shippingCost: priceRaw,
    serviceName: method.label || "Internal Courier",
    estimatedDelivery: String(method.settings?.estimatedDelivery ?? "Handled by Tokonesia internal courier"),
    requiresTracking: false,
    snapshot: {
      method: "internal_courier",
      label: method.label || "Internal Courier",
      serviceName: method.label || "Internal Courier",
      shippingCost: priceRaw,
      requiresTracking: false,
      currency: "IDR",
    },
  };
}

export function buildFedExRateOption(
  method: ShippingMethodConfig,
  rate: Awaited<ReturnType<ExternalShippingRateProvider["getShippingRate"]>>,
): ShippingRateOption {
  return {
    method: "fedex",
    label: method.label || rate.serviceName || "FedEx",
    shippingCost: rate.shippingCost,
    serviceName: rate.serviceName,
    estimatedDelivery: rate.estimatedDelivery,
    estimatedDeliveryDate: rate.estimatedDeliveryDate,
    requiresTracking: true,
    snapshot: {
      method: "fedex",
      label: method.label || "FedEx",
      serviceName: rate.serviceName,
      shippingCost: rate.shippingCost,
      estimatedDelivery: rate.estimatedDelivery,
      estimatedDeliveryDate: rate.estimatedDeliveryDate,
      requiresTracking: true,
      rateType: rate.rateType,
      currency: rate.currency,
      totalDeclaredValue: rate.totalDeclaredValue,
      totalWeightKg: rate.totalWeightKg,
    },
  };
}

export async function buildShippingRateOptions(input: {
  methods: ShippingMethodConfig[];
  destination: ShippingDestination;
  commodities: ShippingCommodity[];
  fedex: ExternalShippingRateProvider;
}): Promise<{ rates: ShippingRateOption[]; warnings: string[] }> {
  const rates: ShippingRateOption[] = [];
  const warnings: string[] = [];
  const enabledMethods = input.methods.filter((method) => method.enabled);

  for (const method of enabledMethods) {
    if (method.code === "internal_courier") {
      rates.push(buildInternalCourierRate(method));
      continue;
    }

    try {
      const fedexRate = await input.fedex.getShippingRate({
        destination: input.destination,
        commodities: input.commodities,
      });
      rates.push(buildFedExRateOption(method, fedexRate));
    } catch (error) {
      const message = error instanceof Error ? error.message : "FedEx shipping unavailable";
      warnings.push(message);
    }
  }

  return { rates, warnings };
}

