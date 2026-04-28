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
  badge: string;
  badge_color: string;
  badge_width?: string;
  image: string;
  img_style?: string;
  description?: string;
  specifications?: Record<string, string>;
  stock: number;
  weight_kg?: number;
  created_at?: string;
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
  created_at?: string;
}

export interface Address {
  id: string;
  user_id?: string;
  label?: string;
  name: string;
  phone: string;
  address: string;
  full_address?: string;
  details?: string;
  is_default?: boolean;
}

export interface Order {
  id: string;
  user_id?: string;
  date: string;
  status: "BARU" | "DIPROSES" | "DIKIRIM" | "SELESAI" | "DIBATALKAN";
  status_color: string;
  total_price: string;
  items?: OrderItem[];
  created_at?: string;
  tracking_number?: string;
  payment_method?: "bank_transfer" | "qris";
  estimated_delivery?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: number;
  quantity: number;
  price: string;
}

export interface PaymentMethod {
  id: "bank_transfer" | "qris";
  name: string;
  type: "bank_transfer" | "qris";
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
export interface FedExRateRequest {
  accountNumber: { value: string };
  requestedShipment: {
    shipper: { address: { postalCode: string; countryCode: string } };
    recipient: { address: { postalCode: string; countryCode: string } };
    pickupType: "DROPOFF_AT_FEDEX_LOCATION" | "USE_SCHEDULED_PICKUP";
    serviceType?: string;
    packagingType?: string;
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
    rateType: "LIST" | "ACCOUNT" | "PREFERRED" | "INCENTIVE";
    totalNetCharge?: { amount: number; currency: string };
    totalBaseCharge?: { amount: number; currency: string };
    surCharges?: Array<{ type: string; description: string; amount: { amount: number; currency: string } }>;
  }>;
  operationalDetail?: {
    transitDays?: string;
    deliveryDay?: string;
    deliveryDate?: string;
  };
  commit?: {
    label?: string;
    commitTimestamp?: string;
    deliveryMessages?: string[];
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
