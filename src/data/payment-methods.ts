import type { PaymentMethod } from "@/types/database";

export const paymentMethods: PaymentMethod[] = [
  { id: "paypal", name: "PayPal", img: "/images/PaymentOption/a002559c80637287a6897bcbb94172adeaf103d3.png", img_style: "h-[19px] w-[69px]", overflow: true, overflow_style: "h-[183.93%] left-[-0.12%] top-[-41.96%] w-[100.24%]" },
  { id: "smiles", name: "Smiles", img: "/images/PaymentOption/855f857e528c851d118dc36a29eb329315b97d1f.png", img_style: "h-[20px] w-[74px]" },
  { id: "wise", name: "Wise", img: "/images/PaymentOption/ddb3a231b270e22da82487c5dc6ef2c14bdcd399.png", img_style: "h-[16px] w-[63px]", overflow: true, overflow_style: "h-[384.62%] left-0 top-[-144.23%] w-full" },
  { id: "dcom", name: "DCOM Money", img: "/images/PaymentOption/24f038a7942b396f3202d9ed0e43a8d2b600e5c8.png", img_style: "h-[17px] w-[73px]", overflow: true, overflow_style: "h-[162.59%] left-[-5.47%] top-[-28.57%] w-[109.71%]" },
];
