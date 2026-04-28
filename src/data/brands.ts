import type { Brand } from "@/types/database";

// Home page brands (logo bar)
export const homeLogos = [
  { name: "Tolak Angin", img: "/images/HomeBeforeLogin/0ebb731ac0cc6130f95d969c3462755df0f575c4.png", containerClass: "h-[81px] w-[136px] relative overflow-hidden", imgClass: "absolute h-[166.67%] left-0 max-w-none top-[-34.07%] w-full" },
  { name: "Aerostreet", img: "/images/HomeBeforeLogin/20e3dc0c2ba546b3900c0769482bcf364276dde1.png", containerClass: "h-[51px] w-[177px]", imgClass: "w-full h-full object-cover" },
  { name: "Indofood", img: "/images/HomeBeforeLogin/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png", containerClass: "w-[92px] h-[92px]", imgClass: "w-full h-full object-cover" },
  { name: "Brand", img: "/images/HomeBeforeLogin/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png", containerClass: "h-[87px] w-[161px] relative overflow-hidden", imgClass: "absolute h-[219.07%] left-[-9.97%] max-w-none top-[-96.75%] w-[210.3%]" },
  { name: "Brand", img: "/images/HomeBeforeLogin/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png", containerClass: "h-[113px] w-[124px] relative overflow-hidden", imgClass: "absolute h-[183.99%] left-[-170.5%] max-w-none top-[-14.14%] w-[298.14%]" },
];

// Home page trending products
export const trendingProducts = [
  { name: "Indomie Goreng", image: "/images/HomeBeforeLogin/5771203864e095cbe2563743bf886fd6c03ee3a8.png", imgStyle: "h-[231px] w-[321px] -left-[90px] -top-[7px]" },
  { name: "Batik Wanita", image: "/images/HomeBeforeLogin/f72f513939c94efe91d378657305af192ebecd74.png", imgStyle: "h-[227px] w-[237px] -left-[16px] top-0" },
  { name: "Tolak Angin Sidomuncul", image: "/images/HomeBeforeLogin/bfdc8bafe96751bd661dd529a936b4f52f114530.png", imgStyle: "w-[227px] h-[227px] -left-[11px] -top-[3px]" },
  { name: "Rempah-rempah Nusantara", image: "/images/HomeBeforeLogin/345cde66ad556f77fc4a2de614911a54ac7e8282.png", imgStyle: "h-[224px] w-[336px] -left-[60px] top-0" },
];

// Home page "Why Choose Us" items
export const whyChooseUs = [
  {
    title: "Door-to-Door Delivery",
    desc: "Delivered straight to your doorstep. Your order will be carefully delivered from Indonesia to your address.",
    icon: "/images/HomeBeforeLogin/hands.png",
  },
  {
    title: "Secure Payment",
    desc: "Safe and secure transactions. Shop with confidence using trusted and protected payment methods.",
    icon: "/images/HomeBeforeLogin/payment.png",
  },
  {
    title: "Order Tracking",
    desc: "Track your order anytime. Stay updated with real-time tracking from checkout to delivery.",
    icon: "/images/HomeBeforeLogin/carts.png",
  },
];

// About page brands grid
export const aboutBrands: Brand[] = [
  { img: "/images/AboutTermsConditions/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png", width: 150, height: 150, name: "Indofood" },
  { img: "/images/AboutTermsConditions/96b1b0bf8f394affd2422778a1b39a7160fd8e20.png", width: 236, height: 49, name: "Polytron" },
  { img: "/images/AboutTermsConditions/0ebb731ac0cc6130f95d969c3462755df0f575c4.png", width: 168, height: 101, name: "Tolak Angin", overflow: true, style: "h-[166.67%] left-0 top-[-34.07%] w-full" },
  { img: "/images/AboutTermsConditions/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png", width: 225, height: 117, name: "Brand", overflow: true, style: "h-[230.28%] left-[-11.07%] top-[-103.84%] w-[212.62%]" },
  { img: "/images/AboutTermsConditions/20e3dc0c2ba546b3900c0769482bcf364276dde1.png", width: 192, height: 56, name: "Aerostreet" },
  { img: "/images/AboutTermsConditions/96809bd8d5a7fa1f5a01c4a20039fe9445e37373.png", width: 235, height: 67, name: "Brand", overflow: true, style: "h-[646.71%] left-[-45.69%] top-[-361.08%] w-[324.87%]" },
  { img: "/images/AboutTermsConditions/01a99087ec101d10593a676d342682bba131c6ee.png", width: 176, height: 94, name: "Mie Sedaap" },
  { img: "/images/AboutTermsConditions/c0fd69c570c85dce51ea76e90ea7746f9ef12432.png", width: 186, height: 104, name: "Kopiko" },
  { img: "/images/AboutTermsConditions/a825c5a8cda7c3112115b33b7b4f84b9ec65f494.png", width: 169, height: 92, name: "Sari Roti", overflow: true, style: "h-[235.29%] left-[-14.1%] top-[-67.06%] w-[128.21%]" },
];
