"use client";

import { PageWrapper } from "../components/layout/PageWrapper";
import { resolveImagePath } from "@/lib/image-paths";
import type { Brand } from "@/types/database";

// Static UI config — About page brands grid
const aboutBrands: Brand[] = [
  { img: resolveImagePath("/images/AboutTermsConditions/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png"), width: 150, height: 150, name: "Indofood" },
  { img: resolveImagePath("/images/AboutTermsConditions/96b1b0bf8f394affd2422778a1b39a7160fd8e20.png"), width: 236, height: 49, name: "Polytron" },
  { img: resolveImagePath("/images/AboutTermsConditions/0ebb731ac0cc6130f95d969c3462755df0f575c4.png"), width: 168, height: 101, name: "Tolak Angin", overflow: true, style: "h-[166.67%] left-0 top-[-34.07%] w-full" },
  { img: resolveImagePath("/images/AboutTermsConditions/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png"), width: 225, height: 117, name: "Brand", overflow: true, style: "h-[230.28%] left-[-11.07%] top-[-103.84%] w-[212.62%]" },
  { img: resolveImagePath("/images/AboutTermsConditions/20e3dc0c2ba546b3900c0769482bcf364276dde1.png"), width: 192, height: 56, name: "Aerostreet" },
  { img: resolveImagePath("/images/AboutTermsConditions/96809bd8d5a7fa1f5a01c4a20039fe9445e37373.png"), width: 235, height: 67, name: "Brand", overflow: true, style: "h-[646.71%] left-[-45.69%] top-[-361.08%] w-[324.87%]" },
  { img: resolveImagePath("/images/AboutTermsConditions/01a99087ec101d10593a676d342682bba131c6ee.png"), width: 176, height: 94, name: "Mie Sedaap" },
  { img: resolveImagePath("/images/AboutTermsConditions/c0fd69c570c85dce51ea76e90ea7746f9ef12432.png"), width: 186, height: 104, name: "Kopiko" },
  { img: resolveImagePath("/images/AboutTermsConditions/a825c5a8cda7c3112115b33b7b4f84b9ec65f494.png"), width: 169, height: 92, name: "Sari Roti", overflow: true, style: "h-[235.29%] left-[-14.1%] top-[-67.06%] w-[128.21%]" },
];

// Static UI config — Why Choose Us section
const whyChooseUs = [
  {
    title: "Door-to-Door Delivery",
    desc: "Delivered straight to your doorstep. Your order will be carefully delivered from Indonesia to your address.",
    icon: resolveImagePath("/images/HomeBeforeLogin/hands.png"),
  },
  {
    title: "Secure Payment",
    desc: "Safe and secure transactions. Shop with confidence using trusted and protected payment methods.",
    icon: resolveImagePath("/images/HomeBeforeLogin/payment.png"),
  },
  {
    title: "Order Tracking",
    desc: "Track your order anytime. Stay updated with real-time tracking from checkout to delivery.",
    icon: resolveImagePath("/images/HomeBeforeLogin/carts.png"),
  },
];

export default function AboutPage() {
  return (
    <PageWrapper>
      {/* Hero */}
      <section className="relative h-[480px] md:h-[560px] w-full overflow-hidden flex items-center justify-center">
        <img
          alt=""
          className="absolute h-[110.43%] left-0 max-w-none top-[-8.79%] w-full object-cover"
          src={resolveImagePath("/images/AboutTermsConditions/5e342d0667a9577578f0e6b7fd827dad0dec2006.png")}
        />
        <div className="relative z-10 text-center px-6">
          <p className="text-[14px] text-white tracking-[0.1em] uppercase">A FEW WORDS</p>
          <h1 className="font-bold text-[32px] md:text-[40px] text-white tracking-tight mt-2">ABOUT US</h1>
        </div>
      </section>

      {/* Made in Indonesia */}
      <section className="py-12 md:py-16 px-6 md:px-16 flex flex-col md:flex-row gap-8 md:gap-16 items-start max-w-[1200px] mx-auto">
        <div className="w-full md:w-[360px] h-[260px] md:h-[300px] relative overflow-hidden shrink-0 rounded-xl">
          <img
            alt=""
            className="absolute h-[131.23%] left-[-2.58%] max-w-none top-[-13.06%] w-[105.21%]"
            src={resolveImagePath("/images/AboutTermsConditions/f4843ce4c490da459963aa8592808b498345d492.png")}
          />
        </div>
        <div>
          <h2 className="font-bold text-[24px] md:text-[28px] text-[#090909] tracking-tight">
            Made in Indonesia, for You
          </h2>
        <div className="text-[15px] text-[#555] mt-4 space-y-4 leading-relaxed">
            <p>
              This platform originates from Indonesia and is designed to support the global expansion
              of local products. As a cross-border e-commerce platform, we connect Indonesian brands
              with customers in Japan, making it easier to discover and purchase authentic goods.
            </p>
            <p>
              Our mission is to make Indonesian products more accessible globally through a simple,
              transparent, and reliable shopping experience.
            </p>
          </div>
        </div>
      </section>

      {/* Our Brand */}
      <section className="py-12 md:py-16 px-6 md:px-16">
        <h2 className="text-center font-bold text-[24px] md:text-[28px] text-[#090909] tracking-tight">
          OUR BRAND
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 mt-8 max-w-[960px] mx-auto">
          {aboutBrands.map((b, i) => (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{ width: b.width * 0.65, height: b.height * 0.65 }}
            >
              {b.overflow ? (
                <img alt={b.name} className={`absolute max-w-none ${b.style}`} src={b.img} />
              ) : (
                <img alt={b.name} className="w-full h-full object-cover" src={b.img} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16 px-6 md:px-16 bg-[#FDF9F5]">
        <h2 className="text-center font-bold text-[24px] md:text-[28px] text-[#090909] tracking-tight">
          WHY CHOOSE US
        </h2>
        <p className="text-center text-[15px] text-[#555] max-w-[560px] mx-auto mt-3 leading-relaxed">
          We make it easy, safe, and reliable to shop your favorite Indonesian products delivered
          right to your door.
        </p>
        <div className="w-[240px] h-px bg-[#FBBE48] mx-auto mt-6" />
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-10">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="flex flex-col items-center max-w-[200px]">
              <div className="w-[64px] h-[64px] flex items-center justify-center">
                { }
                <img
                  alt={item.title}
                  className="w-full h-full object-contain"
                  src={item.icon}
                />
              </div>
              <h3 className="font-bold text-[15px] text-[#090909] text-center mt-3">{item.title}</h3>
              <p className="text-[13px] text-[#555] text-center mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="py-12 md:py-16 px-6 md:px-16 max-w-[1000px] mx-auto">
        <div className="w-[100px] h-px bg-[#FBBE48] mx-auto" />
        <h2 className="text-center font-bold text-[24px] md:text-[28px] text-[#090909] tracking-tight mt-4">
          Terms &amp; Conditions
        </h2>
        <div className="text-[14px] md:text-[15px] text-[#444] text-justify mt-8 space-y-4 leading-[1.8]">
          <p>
            Welcome to our platform. These Terms &amp; Conditions govern your use of our cross-border
            e-commerce service, which connects Indonesian products with customers in Japan. By
            accessing and using this platform, you agree to comply with the terms outlined below.
          </p>
          <p>
            Our platform allows users to browse and purchase products sourced from Indonesia. While
            we strive to present product information, images, and pricing as accurately as possible,
            there may be slight variations due to differences in display, packaging, or production.
            Product availability may also change without prior notice.
          </p>
          <p>
            All prices are initially listed in Indonesian Rupiah (IDR) and may be displayed in
            Japanese Yen (JPY) based on current exchange rates. Due to currency fluctuations, the
            final price may vary slightly at checkout. However, the exact total amount will always
            be clearly shown before you complete your payment to ensure transparency.
          </p>
          <p>
            Payments must be completed using the available methods provided on the platform. All
            transactions are processed securely, and orders will only be confirmed once payment has
            been successfully received.
          </p>
          <p>
            We provide international shipping from Indonesia to Japan. Shipping costs are calculated
            based on factors such as product weight, selected shipping method, and destination.
            Delivery times may vary depending on the chosen method, with faster options available
            via air shipping and more economical options via sea shipping.
          </p>
          <p>
            We reserve the right to update these Terms &amp; Conditions at any time. Continued use
            of the platform indicates your acceptance of any changes made. If you have any questions
            or concerns, please contact our support team for further assistance.
          </p>
        </div>
      </section>
    </PageWrapper>
  );
}
