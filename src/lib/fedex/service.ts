import type {
  Order,
  FedExTrackingResponse,
  FedExPostalValidationResponse,
  FedExRateRequest,
  FedExRatesResponse,
  FedExServiceAvailabilityResponse,
  FedExLocationResponse,
} from "@/types/database";

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
// Mock data
// =============================================================================

const MOCK_TRACK_RESPONSE: FedExTrackingResponse = {
  transactionId: "mock-transaction-001",
  output: {
    completeTrackResults: [
      {
        trackingNumber: "7489234651200",
        trackResults: [
          {
            trackingNumberInfo: {
              trackingNumber: "7489234651200",
              carrierCode: "FDXE",
            },
            latestStatusDetail: {
              code: "IT",
              derivedCode: "IT",
              statusByLocale: "In Transit",
              description: "In Transit",
              scanLocation: { city: "Tokyo", countryCode: "JP", countryName: "Japan" },
            },
            dateAndTimes: [
              { type: "SHIP", dateTime: "2026-10-13T09:00:00+07:00" },
              { type: "ESTIMATED_DELIVERY", dateTime: "2026-10-20T18:00:00+09:00" },
            ],
            scanEvents: [
              {
                date: "2026-10-12T10:00:00+07:00",
                eventType: "OC",
                eventDescription: "Shipment information sent to FedEx",
                derivedStatus: "Label Created",
                derivedStatusCode: "OC",
                scanLocation: { city: "Solo", countryCode: "ID", countryName: "Indonesia" },
              },
              {
                date: "2026-10-12T14:30:00+07:00",
                eventType: "PU",
                eventDescription: "Picked up",
                derivedStatus: "Picked Up",
                derivedStatusCode: "PU",
                scanLocation: { city: "Solo", countryCode: "ID", countryName: "Indonesia" },
              },
              {
                date: "2026-10-13T09:00:00+07:00",
                eventType: "DP",
                eventDescription: "Departed FedEx hub",
                derivedStatus: "In Transit",
                derivedStatusCode: "IT",
                scanLocation: { city: "Jakarta", countryCode: "ID", countryName: "Indonesia" },
              },
              {
                date: "2026-10-14T22:00:00+09:00",
                eventType: "IT",
                eventDescription: "In transit",
                derivedStatus: "In Transit",
                derivedStatusCode: "IT",
                scanLocation: { city: "Narita", countryCode: "JP", countryName: "Japan" },
              },
            ],
            serviceDetail: {
              description: "FedEx International Priority",
              type: "INTERNATIONAL_PRIORITY",
            },
          },
        ],
      },
    ],
  },
};

const MOCK_POSTAL_RESPONSE: FedExPostalValidationResponse = {
  transactionId: "mock-postal-001",
  output: {
    resolvedAddresses: [
      {
        city: "Tokyo",
        stateOrProvinceCode: "13",
        postalCode: "100-0001",
        countryCode: "JP",
        countryName: "Japan",
        classification: "MIXED",
        residential: false,
      },
    ],
  },
};

const MOCK_RATES_RESPONSE: FedExRatesResponse = {
  transactionId: "mock-rates-001",
  output: {
    rateReplyDetails: [
      {
        serviceType: "INTERNATIONAL_PRIORITY",
        serviceName: "FedEx International Priority",
        ratedShipmentDetails: [
          {
            rateType: "LIST",
            totalNetCharge: { amount: 85.5, currency: "USD" },
            totalBaseCharge: { amount: 75.0, currency: "USD" },
          },
        ],
        operationalDetail: {
          transitDays: "3",
          deliveryDay: "THURSDAY",
          deliveryDate: "2026-10-16T18:00:00",
        },
      },
    ],
  },
};

const MOCK_AVAILABILITY_RESPONSE: FedExServiceAvailabilityResponse = {
  transactionId: "mock-availability-001",
  output: {
    serviceOptions: [
      {
        serviceType: "INTERNATIONAL_PRIORITY",
        serviceName: "FedEx International Priority",
        transitTime: "3",
        deliveryDate: "2026-10-16",
        deliveryDay: "THURSDAY",
      },
    ],
  },
};

const MOCK_LOCATION_RESPONSE: FedExLocationResponse = {
  transactionId: "mock-location-001",
  output: {
    matchedLocations: [
      {
        locationId: "ID-SOLO-001",
        locationType: "FEDEX_OFFICE",
        locationContactAndAddress: {
          address: {
            streetLines: ["Jl. Slamet Riyadi No. 1"],
            city: "Solo",
            postalCode: "57100",
            countryCode: "ID",
            countryName: "Indonesia",
          },
          contact: { companyName: "FedEx Office Solo", phoneNumber: "+62-271-000000" },
        },
        distance: { value: 2.5, units: "KM" },
      },
    ],
  },
};

// =============================================================================
// OAuth2 token helper
// =============================================================================

const FEDEX_BASE_URL = () =>
  process.env.FEDEX_API_URL ?? "https://apis-sandbox.fedex.com";

async function fetchOAuthToken(): Promise<string> {
  const apiKey = process.env.FEDEX_API_KEY!;
  const secretKey = process.env.FEDEX_SECRET_KEY!;
  const res = await fetch("https://apis.fedex.com/oauth/token", {
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

// Fixed USD → IDR conversion rate
const USD_TO_IDR = 16000;

export interface ShippingRateResult {
  shippingCost: number;
  serviceName: string;
  estimatedDelivery: string;
}

/**
 * Get shipping rate from Solo, Indonesia (57100, ID) to the given recipient.
 * Returns cost in IDR.
 */
export async function getShippingRate(
  recipientPostalCode: string,
  recipientCountryCode: string,
  totalWeightKg: number
): Promise<ShippingRateResult> {
  if (!hasRateCredentials()) {
    // Return mock data when credentials are not configured
    return {
      shippingCost: MOCK_RATES_RESPONSE.output!.rateReplyDetails![0]
        .ratedShipmentDetails![0].totalNetCharge!.amount * USD_TO_IDR,
      serviceName: "FedEx International Economy",
      estimatedDelivery: "5-7 business days",
    };
  }

  const baseUrl = FEDEX_BASE_URL();
  const token = await fetchRateOAuthToken();

  const rateRequest: FedExRateRequest = {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER! },
    requestedShipment: {
      shipper: { address: { postalCode: "57100", countryCode: "ID" } },
      recipient: {
        address: {
          postalCode: recipientPostalCode,
          countryCode: recipientCountryCode,
        },
      },
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      serviceType: "INTERNATIONAL_ECONOMY",
      packagingType: "YOUR_PACKAGING",
      requestedPackageLineItems: [
        { weight: { units: "KG", value: totalWeightKg } },
      ],
    },
    rateRequestType: ["LIST"],
    returnTransitTimes: true,
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
    throw new Error(`FedEx Rate API failed: ${res.status}`);
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

  const amountUsd = ratedDetail?.totalNetCharge?.amount ?? 0;
  const shippingCost = Math.round(amountUsd * USD_TO_IDR);

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
    if (!hasCredentials()) return Promise.resolve(MOCK_TRACK_RESPONSE);
    const token = await fetchOAuthToken();
    const res = await fetch("https://apis.fedex.com/track/v1/trackingnumbers", {
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
    if (!hasCredentials()) return Promise.resolve(MOCK_POSTAL_RESPONSE);
    const token = await fetchOAuthToken();
    const res = await fetch("https://apis.fedex.com/postalcode/v1/validatepostalcode", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ carrierCode: carrierCode ?? "FDXE", countryCode, postalCode }),
    });
    if (!res.ok) throw new Error(`FedEx validatePostalCode failed: ${res.status}`);
    return res.json() as Promise<FedExPostalValidationResponse>;
  },

  async getRatesAndTransitTimes(request: FedExRateRequest): Promise<FedExRatesResponse> {
    if (!hasCredentials()) return Promise.resolve(MOCK_RATES_RESPONSE);
    const token = await fetchOAuthToken();
    const res = await fetch("https://apis.fedex.com/rate/v1/rates/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`FedEx getRatesAndTransitTimes failed: ${res.status}`);
    return res.json() as Promise<FedExRatesResponse>;
  },

  async checkServiceAvailability(originPostal: string, destPostal: string, originCountry: string, destCountry: string): Promise<FedExServiceAvailabilityResponse> {
    if (!hasCredentials()) return Promise.resolve(MOCK_AVAILABILITY_RESPONSE);
    const token = await fetchOAuthToken();
    const res = await fetch("https://apis.fedex.com/availability/v1/packageandserviceoptions", {
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
    if (!hasCredentials()) return Promise.resolve(MOCK_LOCATION_RESPONSE);
    const token = await fetchOAuthToken();
    const res = await fetch("https://apis.fedex.com/location/v1/locations", {
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
