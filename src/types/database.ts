// =============================================================================
// Database Types — mirrors future Supabase schema
// =============================================================================
// When connecting to Supabase, these types can be auto-generated with:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts
// For now, they serve as the single source of truth for data shapes.
// =============================================================================

export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  price_raw: number;
  badge: string | null;
  badge_color: string | null;
  badge_width?: string | null;
  image: string;
  img_style?: string | null;
  description?: string | null;
  specifications?: Record<string, string> | null;
  stock: number;
  weight_kg?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  name: string;
  count: number;
  slug: string;
}

export interface Brand {
  name: string;
  img: string;
  width: number;
  height: number;
  overflow?: boolean;
  style?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
}

export interface Address {
  id: string;
  user_id?: string;
  label?: string | null;
  name: string;
  phone: string;
  address: string;
  full_address?: string | null;
  details?: string | null;
  postal_code?: string | null;
  country_code?: string;
  is_default?: boolean;
}

export interface Order {
  id: string;
  user_id?: string;
  date?: string;
  status: string;
  status_color?: string | null;
  total_price?: string | null;
  total_price_raw?: number | null;
  shipping_cost?: number | null;
  service_fee?: number | null;
  note?: string | null;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
  idempotency_key?: string | null;
  cart_fingerprint?: string | null;
  address_id?: string | null;
  address_snapshot?: unknown;
  cart_snapshot?: unknown;
  pricing_snapshot?: unknown;
  shipping_snapshot?: unknown;
  snap_token?: string | null;
  snap_redirect_url?: string | null;
  snap_token_expires_at?: string | null;
  stock_decremented_at?: string | null;
  stock_reserved_at?: string | null;
  stock_released_at?: string | null;
  stock_release_reason?: string | null;
  paid_at?: string | null;
  tracking_number?: string | null;
  estimated_delivery?: string | null;
  cancel_reason?: string | null;
  // Midtrans payment fields
  payment_method?: MidtransPaymentType | string | null;
  midtrans_order_id?: string | null;
  midtrans_transaction_id?: string | null;
  payment_status?: MidtransPaymentStatus | string;
  payment_url?: string | null;
}

export interface OrderItem {
  id: string | number;
  order_id?: string;
  product_id?: number;
  quantity: number;
  price: string | null;
  price_raw?: number;
  product?: { name?: string | null; image?: string | null } | null;
}

export interface ExchangeRate {
  id: number;
  base_currency: string;
  target_currency: string;
  rate: number;
  updated_at: string;
}

export interface RefundRequest {
  id: string;
  order_id: string;
  user_id: string;
  refund_method: string;
  account_number: string;
  reason: string;
  status: 'awaiting_seller_review' | 'rejected' | 'cancelled_by_buyer' | 'awaiting_buyer_payout' | 'awaiting_manual_transfer' | 'refunded';
  admin_note?: string;
  initiated_by?: "buyer" | "seller";
  initiated_by_user_id?: string;
  previous_order_status?: string;
  refund_amount?: number;
  account_name?: string;
  payout_provider?: string;
  seller_reason?: string;
  buyer_reason?: string;
  review_note?: string;
  rejection_reason?: string;
  transfer_note?: string;
  reviewed_at?: string;
  payout_submitted_at?: string;
  refunded_at?: string;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// Midtrans Payment Types
// =============================================================================

export type MidtransPaymentType =
  | "bank_transfer"
  | "qris"
  | "credit_card"
  | "gopay"
  | "shopeepay"
  | "cstore"
  | "echannel";

export type MidtransPaymentStatus =
  | "pending"
  | "settlement"
  | "capture"
  | "deny"
  | "cancel"
  | "expire"
  | "failure"
  | "refund";

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransCustomerDetails {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransSnapRequest {
  transaction_details: MidtransTransactionDetails;
  customer_details?: MidtransCustomerDetails;
  item_details?: MidtransItemDetail[];
  credit_card?: { secure: boolean };
  enabled_payments?: MidtransPaymentType[];
  expiry?: {
    start_time?: string;
    unit: "day" | "days" | "hour" | "hours" | "minute" | "minutes";
    duration: number;
  };
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency: string;
}

export interface PaymentMethod {
  id: MidtransPaymentType;
  name: string;
  type: MidtransPaymentType;
  description?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: string;
  estimated_delivery: string;
}

// =============================================================================
// FedEx API Interfaces
// =============================================================================

// ── FedEx Track API — Scan Event ─────────────────────────────
export interface FedExScanLocation {
  city?: string;
  stateOrProvinceCode?: string;
  countryCode?: string;
  countryName?: string;
  residential?: boolean;
}

export interface FedExScanEvent {
  date: string;
  eventType: string;
  eventDescription: string;
  derivedStatus: string;
  derivedStatusCode: string;
  scanLocation?: FedExScanLocation;
  exceptionCode?: string;
  exceptionDescription?: string;
  delayDetail?: {
    type: "WEATHER" | "OPERATIONAL" | "LOCAL" | "GENERAL" | "CLEARANCE";
    subType?: string;
    status: "DELAYED" | "ON_TIME" | "EARLY";
  };
}

// ── FedEx Track API — Date & Time ────────────────────────────
export interface FedExDateAndTime {
  type:
    | "ACTUAL_DELIVERY"
    | "ACTUAL_PICKUP"
    | "ACTUAL_TENDER"
    | "ESTIMATED_DELIVERY"
    | "SHIP"
    | "SHIPMENT_DATA_RECEIVED"
    | string;
  dateTime: string;
}

// ── FedEx Track API — Latest Status ──────────────────────────
export interface FedExLatestStatus {
  code: string;
  derivedCode: string;
  statusByLocale: string;
  description: string;
  scanLocation?: FedExScanLocation;
  delayDetail?: {
    type: string;
    subType?: string;
    status: "DELAYED" | "ON_TIME" | "EARLY";
  };
}

// ── FedEx Track API — Delivery Details ───────────────────────
export interface FedExDeliveryDetails {
  receivedByName?: string;
  actualDeliveryAddress?: FedExScanLocation;
  deliveryToday?: boolean;
  locationType?: string;
  signedByName?: string;
  deliveryAttempts?: string;
}

// ── FedEx Track API — Package Details ────────────────────────
export interface FedExPackageDetails {
  physicalPackagingType?: string;
  sequenceNumber?: string;
  count?: string;
  weightAndDimensions?: {
    weight?: Array<{ unit: "KG" | "LB"; value: string }>;
    dimensions?: Array<{ length: number; width: number; height: number; units: "CM" | "IN" }>;
  };
}

// ── FedEx Track API — Track Result ───────────────────────────
export interface FedExTrackResult {
  trackingNumberInfo: {
    trackingNumber: string;
    carrierCode?: string;
    trackingNumberUniqueId?: string;
  };
  latestStatusDetail?: FedExLatestStatus;
  dateAndTimes?: FedExDateAndTime[];
  scanEvents?: FedExScanEvent[];
  deliveryDetails?: FedExDeliveryDetails;
  packageDetails?: FedExPackageDetails;
  serviceDetail?: {
    description?: string;
    shortDescription?: string;
    type?: string;
  };
  originLocation?: { locationId?: string; locationContactAndAddress?: { address?: FedExScanLocation } };
  destinationLocation?: { locationId?: string; locationContactAndAddress?: { address?: FedExScanLocation } };
  error?: { code: string; message: string };
}

// ── FedEx Track API — Top-level Response ─────────────────────
export interface FedExTrackingResponse {
  transactionId?: string;
  customerTransactionId?: string;
  output?: {
    completeTrackResults?: Array<{
      trackingNumber: string;
      trackResults: FedExTrackResult[];
    }>;
    alerts?: Array<{ code: string; alertType: "NOTE" | "WARNING"; message: string }>;
  };
}

// ── FedEx Postal Code Validation API ─────────────────────────
export interface FedExPostalValidationRequest {
  carrierCode: "FDXE" | "FDXG" | "FXSP";
  countryCode: string;
  stateOrProvinceCode?: string;
  postalCode: string;
  shipDate?: string;
}

export interface FedExPostalValidationResponse {
  transactionId?: string;
  output?: {
    resolvedAddresses?: Array<{
      streetLinesToken?: string[];
      city?: string;
      stateOrProvinceCode?: string;
      postalCode?: string;
      countryCode?: string;
      countryName?: string;
      classification?: "BUSINESS" | "RESIDENTIAL" | "MIXED" | "UNKNOWN";
      residential?: boolean;
    }>;
    alerts?: Array<{ code: string; alertType: "NOTE" | "WARNING"; message: string }>;
  };
}

// ── FedEx Rates and Transit Times API ────────────────────────
export interface FedExCustomsCommodityRequest {
  weight: { units: "KG" | "LB"; value: number };
  numberOfPieces?: number;
  description: string;
  countryOfManufacture: string;
  quantity: number;
  quantityUnits: "PCS" | string;
  unitPrice: { amount: number; currency: string };
  customsValue: { amount: number; currency: string };
}

export interface FedExRateRequest {
  accountNumber: { value: string };
  requestedShipment: {
    shipper: { address: { postalCode: string; countryCode: string } };
    recipient: { address: { postalCode: string; countryCode: string } };
    shipDatestamp?: string;
    pickupType: "DROPOFF_AT_FEDEX_LOCATION" | "USE_SCHEDULED_PICKUP";
    serviceType?: string;
    packagingType?: string;
    rateRequestType?: Array<"LIST" | "ACCOUNT" | "PREFERRED">;
    returnTransitTimes?: boolean;
    customsClearanceDetail?: {
      dutiesPayment: { paymentType: "SENDER" | "RECIPIENT" | "THIRD_PARTY" };
      commodities: FedExCustomsCommodityRequest[];
    };
    requestedPackageLineItems: Array<{
      weight: { units: "KG" | "LB"; value: number };
      dimensions?: { length: number; width: number; height: number; units: "CM" | "IN" };
    }>;
  };
  rateRequestType?: Array<"LIST" | "ACCOUNT" | "PREFERRED">;
  returnTransitTimes?: boolean;
}

export interface FedExRateReplyDetail {
  serviceType: string;
  serviceName?: string;
  packagingType?: string;
  ratedShipmentDetails?: Array<{
    rateType: "LIST" | "ACCOUNT" | "PREFERRED" | "INCENTIVE" | "PREFERRED_INCENTIVE" | "PREFERRED_CURRENCY";
    /** Plain number — NOT an object. e.g. 445.54 */
    totalNetCharge?: number;
    /** Plain number — NOT an object. e.g. 403.2 */
    totalBaseCharge?: number;
    totalVatCharge?: number;
    totalNetFedExCharge?: number;
    totalNetChargeWithDutiesAndTaxes?: number;
    currency?: string;
    surCharges?: Array<{ type: string; description: string; amount: number }>;
  }>;
  operationalDetail?: {
    /** String enum e.g. "THREE_DAYS", "FOUR_DAYS" — NOT a number */
    transitTime?: string;
    deliveryDay?: string;
    /** ISO date-time string or empty string */
    deliveryDate?: string;
    commitDate?: string;
  };
  commit?: {
    label?: string;
    commitTimestamp?: string;
    deliveryMessages?: string[];
    dateDetail?: {
      dayOfWeek?: string;
      dayCxsFormat?: string;
    };
  };
}

export interface FedExRatesResponse {
  transactionId?: string;
  output?: {
    rateReplyDetails?: FedExRateReplyDetail[];
    alerts?: Array<{ code: string; alertType: "NOTE" | "WARNING"; message: string }>;
  };
}

// ── FedEx Service Availability API ───────────────────────────
export interface FedExServiceAvailabilityResponse {
  transactionId?: string;
  output?: {
    serviceOptions?: Array<{
      serviceType: string;
      serviceName?: string;
      packagingTypes?: Array<{ packagingType: string; packagingDescription?: string }>;
      transitTime?: string;
      deliveryDate?: string;
      deliveryDay?: string;
    }>;
    alerts?: Array<{ code: string; alertType: "NOTE" | "WARNING"; message: string }>;
  };
}

// ── FedEx Location Search API ─────────────────────────────────
export interface FedExLocationAddress {
  streetLines?: string[];
  city?: string;
  stateOrProvinceCode?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  residential?: boolean;
}

export interface FedExLocationResult {
  locationId?: string;
  locationType?: string;
  locationContactAndAddress?: {
    address?: FedExLocationAddress;
    contact?: { companyName?: string; phoneNumber?: string };
  };
  distance?: { value: number; units: "KM" | "MI" };
  businessHours?: Array<{
    dayOfWeek: string;
    timeRange?: Array<{ begins: string; ends: string }>;
    closed?: boolean;
  }>;
  supportedServices?: string[];
  dropoffServices?: string[];
}

export interface FedExLocationResponse {
  transactionId?: string;
  output?: {
    matchedAddresses?: FedExLocationAddress[];
    matchedLocations?: FedExLocationResult[];
    alerts?: Array<{ code: string; alertType: "NOTE" | "WARNING"; message: string }>;
  };
}
