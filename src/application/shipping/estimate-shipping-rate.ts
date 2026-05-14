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

  return deps.shipping.getShippingRate({
    destination: {
      postalCode: address.postalCode,
      countryCode: address.countryCode,
    },
    commodities: buildShippingCommodities(pricedItems),
  });
}
