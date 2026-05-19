import {
  buildShippingCommodities,
  calculateCheckoutPricing,
  normalizeCheckoutItems,
  priceCheckoutItems,
  type CheckoutItemInput,
} from "@/domain/checkout";
import type {
  CheckoutRepository,
  ShippingRateProvider,
} from "@/application/checkout/create-checkout-intent";
import { buildShippingRateOptions } from "@/domain/shipping";

export interface EstimateShippingRateInput {
  userId: string;
  addressId: string;
  items: CheckoutItemInput[];
}

export async function estimateShippingRate(
  input: EstimateShippingRateInput,
  deps: {
    repository: CheckoutRepository;
    shipping: ShippingRateProvider;
  },
) {
  const normalizedItems = normalizeCheckoutItems(input.items);
  const address = await deps.repository.getAddressForUser(input.userId, input.addressId);
  if (!address) {
    throw new Error("Address not found.");
  }

  const products = await deps.repository.getProductsByIds(normalizedItems.map((item) => item.productId));
  const pricedItems = priceCheckoutItems(normalizedItems, products);
  calculateCheckoutPricing(pricedItems, 0);
  const methods = await deps.repository.getShippingMethods();

  const { rates, warnings } = await buildShippingRateOptions({
    methods,
    destination: {
      postalCode: address.postalCode,
      countryCode: address.countryCode,
    },
    commodities: buildShippingCommodities(pricedItems),
    fedex: deps.shipping,
  });

  if (rates.length === 0) {
    throw new Error(warnings[0] ?? "No shipping method is available.");
  }

  return { rates, warnings };
}
