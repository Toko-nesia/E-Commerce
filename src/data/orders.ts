import type { Order } from "@/types/database";

export const orderHistory: Order[] = [
  {
    id: "#XX-0001",
    date: "12 Okt 2026",
    status: "DIKIRIM",
    status_color: "text-blue-500",
    total_price: "¥ 000,000",
    tracking_number: "7489234651200",
    payment_method: "bank_transfer",
    estimated_delivery: "20 Okt 2026",
  },
  {
    id: "#XX-0002",
    date: "28 Sep 2026",
    status: "SELESAI",
    status_color: "text-[#15a15b]",
    total_price: "¥ 00,000",
    tracking_number: "7489234651100",
    payment_method: "qris",
    estimated_delivery: "10 Okt 2026",
  },
  {
    id: "#XX-0003",
    date: "15 Sep 2026",
    status: "SELESAI",
    status_color: "text-[#15a15b]",
    total_price: "¥ 000,000",
    tracking_number: "7489234650900",
    payment_method: "bank_transfer",
    estimated_delivery: "28 Sep 2026",
  },
];
