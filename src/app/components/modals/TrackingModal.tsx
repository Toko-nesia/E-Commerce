"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import type { Order, FedExDateAndTime, FedExLatestStatus } from "@/types/database";
import { mapScanEventsToTimeline } from "./trackingUtils";

type TrackingState = "loading" | "found" | "not_found";

type TimelineStep = ReturnType<typeof mapScanEventsToTimeline>[number];

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

function getEstimatedDelivery(dateAndTimes?: FedExDateAndTime[]): string | null {
  if (!dateAndTimes) return null;
  const entry = dateAndTimes.find((d) => d.type === "ESTIMATED_DELIVERY");
  if (!entry) return null;
  return new Date(entry.dateTime).toLocaleString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function TrackingModal({ isOpen, onClose, order }: TrackingModalProps) {
  const [trackingState, setTrackingState] = useState<TrackingState>("loading");
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !order.tracking_number) return;

    setTrackingState("loading");
    setSteps([]);
    setEstimatedDelivery(null);
    setCurrentStatus(null);

    fetch(`/api/shipping/track?tracking_number=${order.tracking_number}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Tracking fetch failed");
        return res.json();
      })
      .then((response) => {
        const trackResult =
          response.output?.completeTrackResults?.[0]?.trackResults?.[0];

        if (!trackResult) {
          setTrackingState("not_found");
          return;
        }

        const { scanEvents, latestStatusDetail, dateAndTimes } = trackResult;
        const latestStatus: FedExLatestStatus | undefined = latestStatusDetail;

        const timeline = mapScanEventsToTimeline(
          scanEvents ?? [],
          latestStatus?.code
        );

        setSteps(timeline);
        setEstimatedDelivery(getEstimatedDelivery(dateAndTimes));
        setCurrentStatus(latestStatus?.statusByLocale ?? null);
        setTrackingState("found");
      })
      .catch(() => {
        setTrackingState("not_found");
      });
  }, [isOpen, order.tracking_number]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-[600px]">
      <div className="p-6 pt-10 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <h2 className="text-lg font-semibold text-[#511e0b] mb-1">
          Track Package
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Tracking number:{" "}
          <span className="font-medium text-gray-700">
            {order.tracking_number}
          </span>
        </p>

        {/* Current status & estimated delivery */}
        {trackingState === "found" && (
          <div className="bg-[#fdf6f2] rounded-lg p-3 mb-5 flex flex-col gap-1">
            {currentStatus && (
              <p className="text-sm">
                <span className="text-gray-500">Current status: </span>
                <span className="font-semibold text-[#511e0b]">
                  {currentStatus}
                </span>
              </p>
            )}
            {estimatedDelivery && (
              <p className="text-sm">
                <span className="text-gray-500">Estimated delivery: </span>
                <span className="font-semibold text-gray-700">
                  {estimatedDelivery}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Loading state */}
        {trackingState === "loading" && (
          <div className="flex flex-col gap-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-4 h-4 rounded-full bg-gray-200 mt-1 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Not found state */}
        {trackingState === "not_found" && (
          <div className="py-6 text-center text-sm text-gray-500">
            Tracking data is not available yet. Please check again later.
          </div>
        )}

        {/* Timeline */}
        {trackingState === "found" && steps.length > 0 && (
          <ol className="relative">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <li key={index} className="flex gap-3 relative">
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[7px] top-4 w-[2px] h-full ${
                        step.state === "completed"
                          ? "bg-[#511e0b]"
                          : "border-l-2 border-dashed border-[#d0d0d0] bg-transparent"
                      }`}
                    />
                  )}

                  {/* Circle indicator */}
                  <div className="shrink-0 mt-1 z-10">
                    {step.state === "completed" && (
                      <div className="w-4 h-4 rounded-full bg-[#511e0b]" />
                    )}
                    {step.state === "current" && (
                      <div className="w-4 h-4 rounded-full bg-[#511e0b] animate-pulse" />
                    )}
                    {step.state === "pending" && (
                      <div className="w-4 h-4 rounded-full border-2 border-[#d0d0d0] bg-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-5 flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {step.description}
                    </p>
                    {step.location && (
                      <p className="text-xs text-gray-400">{step.location}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {step.timestamp}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* Footer - tracking number + CS info */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
          <p>
            FedEx tracking number:{" "}
            <span className="font-medium text-gray-600">
              {order.tracking_number}
            </span>
          </p>
          <p>
            Need help? Contact Tokonesia support:{" "}
            <a
              href="mailto:cs@tokonesia.com"
              className="text-[#511e0b] underline"
            >
              cs@tokonesia.com
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
}
