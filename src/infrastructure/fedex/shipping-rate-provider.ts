import { getShippingRate } from "@/lib/fedex/service";
import type { ShippingRateProvider } from "@/application/checkout/create-checkout-intent";
import type { ShippingCommodity, ShippingDestination } from "@/domain/checkout";

export class FedExShippingRateProvider implements ShippingRateProvider {
  async getShippingRate(input: {
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
  }> {
    return getShippingRate(input);
  }
}
