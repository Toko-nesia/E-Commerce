import { describe, expect, it } from "vitest";
import { mapScanEventsToTimeline } from "@/app/components/modals/trackingUtils";
import type { FedExScanEvent } from "@/types/database";

describe("tracking timeline mapper", () => {
  it("prefers FedEx English descriptions and formats timestamps in English", () => {
    const steps = mapScanEventsToTimeline([
      {
        date: "2023-05-19T18:31:00Z",
        eventType: "AR",
        eventDescription: "Arrived at FedEx location",
        scanLocation: { city: "GREENWOOD", countryName: "United States" },
      } as FedExScanEvent,
    ]);

    expect(steps[0].label).toBe("Arrived at FedEx location");
    expect(steps[0].timestamp).toContain("May");
    expect(steps[0].location).toBe("GREENWOOD, United States");
  });
});

