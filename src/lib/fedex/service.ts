import type {
  Order,
  FedExTrackingResponse,
  FedExPostalValidationResponse,
  FedExRateRequest,
  FedExRatesResponse,
  FedExServiceAvailabilityResponse,
  FedExLocationResponse,
} from "@/types/database";
import { createServiceClient } from "@/lib/supabase/service";

// =============================================================================
// Validation helpers
// =============================================================================

export function validateTrackingNumber(input: string): boolean {
  return /^[a-zA-Z0-9]{12,}$/.test(input);
}

export function saveTrackingNumber(order: Order, resi: string): Order {
  if (resi === "") {
    return order;
  }
  return { ...order, tracking_number: resi };
}

// =============================================================================
// OAuth2 token helper
// =============================================================================

const FEDEX_BASE_URL = () =>
  process.env.FEDEX_API_URL ?? "https://apis.fedex.com";

const FEDEX_TRACKING_BASE_URL = () =>
  process.env.FEDEX_TRACKING_API_URL ?? "https://apis-sandbox.fedex.com";

async function fetchOAuthToken(): Promise<string> {
  const apiKey = process.env.FEDEX_API_KEY!;
  const secretKey = process.env.FEDEX_SECRET_KEY!;
  const baseUrl = FEDEX_TRACKING_BASE_URL();
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: secretKey,
    }),
  });
  if (!res.ok) throw new Error(`FedEx OAuth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

/** OAuth2 token using FEDEX_CLIENT_ID / FEDEX_CLIENT_SECRET env vars */
async function fetchRateOAuthToken(): Promise<string> {
  const baseUrl = FEDEX_BASE_URL();
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FEDEX_CLIENT_ID!,
      client_secret: process.env.FEDEX_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`FedEx OAuth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

function hasCredentials(): boolean {
  return !!(process.env.FEDEX_API_KEY && process.env.FEDEX_SECRET_KEY);
}

function hasRateCredentials(): boolean {
  return !!(
    process.env.FEDEX_CLIENT_ID &&
    process.env.FEDEX_CLIENT_SECRET &&
    process.env.FEDEX_ACCOUNT_NUMBER
  );
}

export interface ShippingRateResult {
  shippingCost: number;
  serviceName: string;
  estimatedDelivery: string;
}

/**
 * Fetch origin address settings from store_settings table.
 * Falls back to hardcoded defaults if DB is unavailable.
 */
async function getOriginAddress(): Promise<{ postalCode: string; countryCode: string }> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("store_settings")
      .select("key, value")
      .in("key", ["origin_postal_code", "origin_country_code"]);

    if (data && data.length > 0) {
      const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));
      return {
        postalCode: map["origin_postal_code"] ?? "65143",
        countryCode: map["origin_country_code"] ?? "ID",
      };
    }
  } catch (err) {
    console.warn("Failed to fetch origin address from DB, using default:", err);
  }
  return { postalCode: "65143", countryCode: "ID" };
}

/**
 * Get shipping rate from admin-configured origin address to the given recipient.
 * Returns cost in IDR (FedEx production API returns IDR directly for Indonesian accounts).
 */
export async function getShippingRate(
  recipientPostalCode: string,
  recipientCountryCode: string,
  totalWeightKg: number
): Promise<ShippingRateResult> {
  if (!hasRateCredentials()) {
    throw new Error("FedEx Rate API credentials not configured. Set FEDEX_CLIENT_ID, FEDEX_CLIENT_SECRET, and FEDEX_ACCOUNT_NUMBER.");
  }

  const baseUrl = FEDEX_BASE_URL();
  const token = await fetchRateOAuthToken();

  const today = new Date().toISOString().split("T")[0];
  const origin = await getOriginAddress();

  const rateRequest = {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER! },
    requestedShipment: {
      shipper: { address: { postalCode: origin.postalCode, countryCode: origin.countryCode } },
      recipient: {
        address: {
          postalCode: recipientPostalCode,
          countryCode: recipientCountryCode,
        },
      },
      shipDatestamp: today,
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      serviceType: "INTERNATIONAL_ECONOMY",
      packagingType: "YOUR_PACKAGING",
      rateRequestType: ["LIST"],
      requestedPackageLineItems: [
        { weight: { units: "KG", value: totalWeightKg } },
      ],
    },
  };

  const res = await fetch(`${baseUrl}/rate/v1/rates/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-locale": "en_US",
    },
    body: JSON.stringify(rateRequest),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[FedEx Rate API] ${res.status}:`, errBody);
    throw new Error(`FedEx Rate API failed: ${res.status} — ${errBody}`);
  }

  const data: FedExRatesResponse = await res.json();
  const details = data.output?.rateReplyDetails;

  if (!details || details.length === 0) {
    throw new Error("No rate details returned from FedEx");
  }

  // Prefer INTERNATIONAL_ECONOMY, fall back to first available
  const preferred =
    details.find((d) => d.serviceType === "INTERNATIONAL_ECONOMY") ??
    details[0];

  const ratedDetail = preferred.ratedShipmentDetails?.find(
    (r) => r.rateType === "LIST"
  ) ?? preferred.ratedShipmentDetails?.[0];

  // FedEx production returns rates in IDR directly — no USD conversion needed
  const shippingCost = Math.round(ratedDetail?.totalNetCharge?.amount ?? 0);

  const deliveryDate =
    preferred.operationalDetail?.deliveryDate ??
    preferred.commit?.commitTimestamp ??
    "";
  const transitDays = preferred.operationalDetail?.transitDays;
  const estimatedDelivery = deliveryDate
    ? deliveryDate.split("T")[0]
    : transitDays
    ? `${transitDays} business days`
    : "Contact FedEx for details";

  return {
    shippingCost,
    serviceName: preferred.serviceName ?? preferred.serviceType,
    estimatedDelivery,
  };
}

// =============================================================================
// FedEx Service
// =============================================================================

export const FedExService = {
  async trackShipment(trackingNumber: string): Promise<FedExTrackingResponse> {
    if (!hasCredentials()) throw new Error("FedEx Tracking API credentials not configured. Set FEDEX_API_KEY and FEDEX_SECRET_KEY.");
    const token = await fetchOAuthToken();
    const baseUrl = FEDEX_TRACKING_BASE_URL();
    const res = await fetch(`${baseUrl}/track/v1/trackingnumbers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        includeDetailedScans: true,
        trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      }),
    });
    if (!res.ok) throw new Error(`FedEx trackShipment failed: ${res.status}`);
    return res.json() as Promise<FedExTrackingResponse>;
  },

  async validatePostalCode(postalCode: string, countryCode: string, carrierCode?: string): Promise<FedExPostalValidationResponse> {
    if (!hasCredentials()) throw new Error("FedEx API credentials not configured. Set FEDEX_API_KEY and FEDEX_SECRET_KEY.");
    const token = await fetchOAuthToken();
    const baseUrl = FEDEX_BASE_URL();
    const res = await fetch(`${baseUrl}/postalcode/v1/validatepostalcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ carrierCode: carrierCode ?? "FDXE", countryCode, postalCode }),
    });
    if (!res.ok) throw new Error(`FedEx validatePostalCode failed: ${res.status}`);
    return res.json() as Promise<FedExPostalValidationResponse>;
  },

  async getRatesAndTransitTimes(request: FedExRateRequest): Promise<FedExRatesResponse> {
    if (!hasCredentials()) throw new Error("FedEx API credentials not configured. Set FEDEX_API_KEY and FEDEX_SECRET_KEY.");
    const token = await fetchOAuthToken();
    const baseUrl = FEDEX_BASE_URL();
    const res = await fetch(`${baseUrl}/rate/v1/rates/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`FedEx getRatesAndTransitTimes failed: ${res.status}`);
    return res.json() as Promise<FedExRatesResponse>;
  },

  async checkServiceAvailability(originPostal: string, destPostal: string, originCountry: string, destCountry: string): Promise<FedExServiceAvailabilityResponse> {
    if (!hasCredentials()) throw new Error("FedEx API credentials not configured. Set FEDEX_API_KEY and FEDEX_SECRET_KEY.");
    const token = await fetchOAuthToken();
    const baseUrl = FEDEX_BASE_URL();
    const res = await fetch(`${baseUrl}/availability/v1/packageandserviceoptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        requestedShipment: {
          shipper: { address: { postalCode: originPostal, countryCode: originCountry } },
          recipient: { address: { postalCode: destPostal, countryCode: destCountry } },
        },
      }),
    });
    if (!res.ok) throw new Error(`FedEx checkServiceAvailability failed: ${res.status}`);
    return res.json() as Promise<FedExServiceAvailabilityResponse>;
  },

  async searchLocations(postalCode: string, countryCode: string, radiusKm?: number): Promise<FedExLocationResponse> {
    if (!hasCredentials()) throw new Error("FedEx API credentials not configured. Set FEDEX_API_KEY and FEDEX_SECRET_KEY.");
    const token = await fetchOAuthToken();
    const baseUrl = FEDEX_BASE_URL();
    const res = await fetch(`${baseUrl}/location/v1/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        locationsSummaryRequestControlParameters: {
          maxResults: 10,
          ...(radiusKm !== undefined && { searchRadius: { value: radiusKm, unit: "KM" } }),
        },
        locationsSearchCriterion: "ADDRESS",
        address: { postalCode, countryCode },
      }),
    });
    if (!res.ok) throw new Error(`FedEx searchLocations failed: ${res.status}`);
    return res.json() as Promise<FedExLocationResponse>;
  },
};
