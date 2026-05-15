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
import type { ShippingCommodity, ShippingDestination } from "@/domain/checkout";

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

type TokenCache = { token: string; expiresAt: number };

let trackingTokenCache: TokenCache | null = null;
let rateTokenCache: TokenCache | null = null;
let originAddressCache: {
  value: { postalCode: string; countryCode: string };
  expiresAt: number;
} | null = null;

const FEDEX_BASE_URL = () =>
  process.env.FEDEX_API_URL ?? "https://apis.fedex.com";

const FEDEX_TRACKING_BASE_URL = () =>
  process.env.FEDEX_TRACKING_API_URL ?? "https://apis-sandbox.fedex.com";

async function fetchOAuthToken(): Promise<string> {
  if (trackingTokenCache && trackingTokenCache.expiresAt > Date.now()) {
    return trackingTokenCache.token;
  }

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
  const token = data.access_token as string;
  trackingTokenCache = {
    token,
    expiresAt: Date.now() + Math.max(30, Number(data.expires_in ?? 3600) - 60) * 1000,
  };
  return token;
}

/** OAuth2 token using FEDEX_CLIENT_ID / FEDEX_CLIENT_SECRET env vars */
async function fetchRateOAuthToken(): Promise<string> {
  if (rateTokenCache && rateTokenCache.expiresAt > Date.now()) {
    return rateTokenCache.token;
  }

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
  const token = data.access_token as string;
  rateTokenCache = {
    token,
    expiresAt: Date.now() + Math.max(30, Number(data.expires_in ?? 3600) - 60) * 1000,
  };
  return token;
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
  rateType: "ACCOUNT";
  currency: "IDR";
  totalDeclaredValue: number;
  totalWeightKg: number;
  fedExRateDetail?: unknown;
}

export interface ShippingRateInput {
  destination: ShippingDestination;
  commodities: ShippingCommodity[];
}

interface OriginAddress {
  postalCode: string;
  countryCode: string;
}

function roundMoney(amount: number): number {
  return Math.round(amount);
}

function normalizeFedExDescription(commodity: ShippingCommodity): string {
  return `${commodity.name} - ${commodity.category}`
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export function summarizeShippingCommodities(commodities: ShippingCommodity[]) {
  const totalWeightKg = commodities.reduce((sum, item) => sum + item.lineWeightKg, 0);
  const totalDeclaredValue = commodities.reduce((sum, item) => sum + item.lineValueIdr, 0);

  if (!commodities.length) {
    throw new Error("Shipping commodities are required.");
  }
  if (!Number.isFinite(totalWeightKg) || totalWeightKg <= 0) {
    throw new Error("Shipping weight is invalid.");
  }
  if (!Number.isFinite(totalDeclaredValue) || totalDeclaredValue <= 0) {
    throw new Error("Shipping declared value is invalid.");
  }

  return {
    totalWeightKg,
    totalDeclaredValue,
  };
}

export function buildFedExCommodities(commodities: ShippingCommodity[]) {
  return commodities.map((commodity) => ({
    weight: { units: "KG", value: commodity.lineWeightKg },
    numberOfPieces: 1,
    description: normalizeFedExDescription(commodity),
    countryOfManufacture: commodity.countryOfManufacture,
    quantity: commodity.quantity,
    quantityUnits: "PCS",
    unitPrice: { amount: roundMoney(commodity.unitPriceIdr), currency: "IDR" },
    customsValue: { amount: roundMoney(commodity.lineValueIdr), currency: "IDR" },
  }));
}

function buildCustomsClearanceDetail(commodities: ShippingCommodity[]) {
  return {
    dutiesPayment: { paymentType: "SENDER" },
    commodities: buildFedExCommodities(commodities),
  };
}

export function buildFedExRateRequest(input: {
  accountNumber: string;
  origin: OriginAddress;
  destination: ShippingDestination;
  shipDate: string;
  commodities: ShippingCommodity[];
}) {
  const { totalWeightKg } = summarizeShippingCommodities(input.commodities);

  return {
    accountNumber: { value: input.accountNumber },
    requestedShipment: {
      shipper: { address: { postalCode: input.origin.postalCode, countryCode: input.origin.countryCode } },
      recipient: {
        address: {
          postalCode: input.destination.postalCode,
          countryCode: input.destination.countryCode,
        },
      },
      shipDatestamp: input.shipDate,
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      serviceType: "INTERNATIONAL_ECONOMY",
      packagingType: "YOUR_PACKAGING",
      rateRequestType: ["ACCOUNT"],
      returnTransitTimes: true,
      customsClearanceDetail: buildCustomsClearanceDetail(input.commodities),
      requestedPackageLineItems: [
        { weight: { units: "KG", value: totalWeightKg } },
      ],
    },
  };
}

export function buildFedExTransitTimesRequest(input: {
  origin: OriginAddress;
  destination: ShippingDestination;
  shipDate: string;
  commodities: ShippingCommodity[];
}) {
  const { totalWeightKg } = summarizeShippingCommodities(input.commodities);

  return {
    requestedShipment: {
      shipper: { address: { postalCode: input.origin.postalCode, countryCode: input.origin.countryCode } },
      recipients: [{ address: { postalCode: input.destination.postalCode, countryCode: input.destination.countryCode } }],
      packagingType: "YOUR_PACKAGING",
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      shipDatestamp: input.shipDate,
      serviceType: "INTERNATIONAL_ECONOMY",
      requestedPackageLineItems: [{ weight: { units: "KG", value: totalWeightKg } }],
      customsClearanceDetail: buildCustomsClearanceDetail(input.commodities),
    },
    carrierCodes: ["FDXE"],
  };
}

function formatFedExDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

type RateReplyDetail = NonNullable<NonNullable<FedExRatesResponse["output"]>["rateReplyDetails"]>[number];

function readEstimatedDelivery(detail: RateReplyDetail | undefined): string {
  const raw =
    detail?.operationalDetail?.deliveryDate ||
    detail?.operationalDetail?.commitDate ||
    detail?.commit?.commitTimestamp ||
    (detail?.commit?.dateDetail as { day?: string } | undefined)?.day ||
    "";

  return raw ? formatFedExDate(raw) : "";
}

function assertOriginAddressConfigured(input: { postalCode?: string; countryCode?: string }) {
  if (!input.postalCode || !input.countryCode) {
    throw new Error("Shipping origin is not configured. Set origin_postal_code and origin_country_code in admin store settings.");
  }

  return {
    postalCode: input.postalCode,
    countryCode: input.countryCode,
  };
}

/**
 * Fetch origin address settings from store_settings table.
 */
async function getOriginAddress(): Promise<{ postalCode: string; countryCode: string }> {
  if (originAddressCache && originAddressCache.expiresAt > Date.now()) {
    return originAddressCache.value;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", ["origin_postal_code", "origin_country_code"]);

  if (error) {
    throw new Error(`Failed to fetch shipping origin settings: ${error.message}`);
  }

  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  const value = assertOriginAddressConfigured({
    postalCode: map["origin_postal_code"]?.trim(),
    countryCode: map["origin_country_code"]?.trim().toUpperCase(),
  });
  originAddressCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
  return value;
}

/**
 * Get shipping rate from admin-configured origin address to the given recipient.
 * Returns cost in IDR (FedEx production API returns IDR directly for Indonesian accounts).
 */
export async function getShippingRate(
  input: ShippingRateInput
): Promise<ShippingRateResult> {
  if (!hasRateCredentials()) {
    throw new Error("FedEx Rate API credentials not configured. Set FEDEX_CLIENT_ID, FEDEX_CLIENT_SECRET, and FEDEX_ACCOUNT_NUMBER.");
  }

  const baseUrl = FEDEX_BASE_URL();
  const token = await fetchRateOAuthToken();

  const today = new Date().toISOString().split("T")[0];
  const origin = await getOriginAddress();
  const totals = summarizeShippingCommodities(input.commodities);

  const rateRequest = buildFedExRateRequest({
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER!,
    origin,
    destination: input.destination,
    shipDate: today,
    commodities: input.commodities,
  });

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
    (r) => r.rateType === "ACCOUNT"
  );

  if (!ratedDetail) {
    throw new Error("FedEx ACCOUNT rate unavailable.");
  }

  // FedEx production returns rates in IDR directly — no USD conversion needed
  // totalNetCharge is a plain number (e.g. 445.54), NOT { amount, currency }
  const shippingCost = Math.round(ratedDetail?.totalNetCharge ?? 0);
  if (!Number.isFinite(shippingCost) || shippingCost <= 0) {
    throw new Error("FedEx ACCOUNT rate amount unavailable.");
  }

  // ── Step 2: Fetch real estimated delivery from /availability/v1/transittimes ──
  let estimatedDelivery = readEstimatedDelivery(preferred);
  try {
    if (!estimatedDelivery) {
      const transitBody = buildFedExTransitTimesRequest({
        origin,
        destination: input.destination,
        shipDate: today,
        commodities: input.commodities,
      });

      const transitRes = await fetch(`${baseUrl}/availability/v1/transittimes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-locale": "en_US" },
        body: JSON.stringify(transitBody),
      });

      if (transitRes.ok) {
        const transitData = await transitRes.json();
        const details: Array<{
          serviceType?: string;
          commit?: { dateDetail?: { dayOfWeek?: string; day?: string } };
        }> = transitData?.output?.transitTimes?.[0]?.transitTimeDetails ?? [];

        const ieDetail = details.find((d) => d.serviceType === "INTERNATIONAL_ECONOMY") ?? details[0];
        const rawDay = ieDetail?.commit?.dateDetail?.day ?? "";
        estimatedDelivery = rawDay ? formatFedExDate(rawDay) : "";
      }
    }
  } catch {
    // Transit API failed — estimatedDelivery stays empty
  }

  return {
    shippingCost,
    serviceName: preferred.serviceName ?? preferred.serviceType,
    estimatedDelivery,
    rateType: "ACCOUNT",
    currency: "IDR",
    totalDeclaredValue: totals.totalDeclaredValue,
    totalWeightKg: totals.totalWeightKg,
    fedExRateDetail: {
      serviceType: preferred.serviceType,
      serviceName: preferred.serviceName,
      ratedShipmentDetail: ratedDetail,
    },
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-locale": "en_US" },
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
