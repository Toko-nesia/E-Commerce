import { getShippingRate } from "@/lib/fedex/service";
import type { ShippingRateProvider } from "@/application/checkout/create-checkout-intent";

export class FedExShippingRateProvider implements ShippingRateProvider {
  async getShippingRate(input: {
    postalCode: string;
    countryCode: string;
    totalWeightKg: number;
  }): Promise<{
    shippingCost: number;
    serviceName: string;
    estimatedDelivery: string;
  }> {
    return getShippingRate(input.postalCode, input.countryCode, input.totalWeightKg);
  }
}
