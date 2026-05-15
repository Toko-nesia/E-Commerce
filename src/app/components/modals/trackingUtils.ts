import type { FedExScanEvent } from "@/types/database";

// ── Event type → UI label mapping ────────────────────────────
export const EVENT_TYPE_LABEL: Record<string, string> = {
  OC: "Shipment information sent",
  PU: "Picked up",
  DP: "Departed FedEx location",
  IT: "In transit",
  AR: "Arrived at FedEx location",
  DL: "Delivered",
};

export interface TimelineStep {
  label: string;
  timestamp: string;
  location: string;
  description: string;
  state: "completed" | "current" | "pending";
}

export function mapScanEventsToTimeline(
  scanEvents: FedExScanEvent[],
  latestCode?: string
): TimelineStep[] {
  // Sort chronologically (oldest first)
  const sorted = [...scanEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.map((event, index) => {
    const label = event.eventDescription || EVENT_TYPE_LABEL[event.eventType] || "Tracking update";
    const timestamp = new Date(event.date).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const city = event.scanLocation?.city ?? "";
    const country = event.scanLocation?.countryName ?? "";
    const location = [city, country].filter(Boolean).join(", ");

    // Determine visual state
    const isLast = index === sorted.length - 1;
    let state: "completed" | "current" | "pending";
    if (isLast && latestCode) {
      state = "current";
    } else if (index < sorted.length - 1) {
      state = "completed";
    } else {
      state = "current";
    }

    return {
      label,
      timestamp,
      location,
      description: event.eventDescription,
      state,
    };
  });
}
