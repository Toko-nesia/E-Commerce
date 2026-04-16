import type { Address } from "@/types/database";

export const addresses: Address[] = [
  {
    id: "1",
    name: "Haruka",
    phone: "+81 476 22-2311",
    address: "1-10-5 Akasaka, Minato-ku, Tokyo 107-8420",
  },
];

export const savedAddresses: (Address & { label: string })[] = [
  { id: "1", label: "HOME", name: "Febri", phone: "081140", address: "Jl. Tata Surya" },
  { id: "2", label: "OFFICE", name: "Febrian", phone: "081140", address: "Jl. Tata dunia" },
];
