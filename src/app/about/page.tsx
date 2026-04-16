"use client";

import { PageWrapper } from "../components/layout/PageWrapper";
import { aboutBrands, whyChooseUs } from "@/data/brands";

export default function AboutPage() {
  return (
    <PageWrapper>
      {/* Hero */}
      <section className="relative h-[611px] w-full overflow-hidden flex items-center justify-center">
        <img alt="" className="absolute h-[110.43%] left-0 max-w-none top-[-8.79%] w-full" src="/images/AboutTermsConditions/5e342d0667a9577578f0e6b7fd827dad0dec2006.png" />
        <div className="relative z-10 text-center">
          <p className="font-['Inter',sans-serif] text-[20px] text-white tracking-[-0.6px]">A FEW WORDS</p>
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] text-white tracking-[-1.44px]">ABOUT US</h1>
        </div>
      </section>

      {/* Made in Indonesia */}
      <section className="py-16 px-16 flex gap-16 items-start max-w-[1200px] mx-auto">
        <div className="w-[404px] h-[324px] relative overflow-hidden shrink-0">
          <img alt="" className="absolute h-[131.23%] left-[-2.58%] max-w-none top-[-13.06%] w-[105.21%]" src="/images/AboutTermsConditions/f4843ce4c490da459963aa8592808b498345d492.png" />
        </div>
        <div>
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#090909] tracking-[-0.9px]">Made in Indonesia, for You</h2>
          <div className="font-['Inter',sans-serif] text-[25px] text-[#090909] tracking-[-0.75px] mt-4 space-y-4">
            <p>This platform originates from Indonesia and is designed to support the global expansion of local products. As a cross-border e-commerce platform, we connect Indonesian brands with customers in Japan, making it easier to discover and purchase authentic goods.</p>
            <p>Our mission is to make Indonesian products more accessible globally through a simple, transparent, and reliable shopping experience.</p>
          </div>
        </div>
      </section>

      {/* Our Brand */}
      <section className="py-16 px-16">
        <h2 className="text-center font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#090909] tracking-[-0.9px]">OUR BRAND</h2>
        <div className="flex flex-wrap justify-center items-center gap-8 mt-8 max-w-[1000px] mx-auto">
          {aboutBrands.map((b, i) => (
            <div key={i} className="relative overflow-hidden" style={{ width: b.width * 0.7, height: b.height * 0.7 }}>
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
      <section className="py-16 px-16">
        <h2 className="text-center font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#090909] tracking-[-0.9px]">WHY CHOOSE US</h2>
        <p className="text-center font-['Inter',sans-serif] text-[25px] text-[#090909] tracking-[-0.75px] max-w-[601px] mx-auto mt-4">
          We make it easy, safe, and reliable to shop your favorite Indonesian products delivered right to your door.
        </p>
        <div className="w-[333px] h-px bg-[#FBBE48] mx-auto mt-8" />
        <div className="flex justify-center gap-16 mt-12">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="flex flex-col items-center max-w-[212px]">
              <div className="relative w-[75px] h-[52px] overflow-hidden">
                <img alt="" className={`absolute max-w-none ${item.iconStyle}`} src="/images/HomeBeforeLogin/61ed9253763e955d2f0a7c5290f2a40996acd534.png" />
              </div>
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#090909] tracking-[-0.45px] text-center mt-4">{item.title}</h3>
              <p className="font-['Inter',sans-serif] text-[11px] text-[#090909] tracking-[-0.33px] text-center mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="py-16 px-16 max-w-[1100px] mx-auto">
        <div className="w-[129px] h-px bg-[#FBBE48] mx-auto" />
        <h2 className="text-center font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#090909] tracking-[-0.9px] mt-4">Terms &amp; Conditions</h2>
        <div className="font-['Inter',sans-serif] text-[16px] text-[#090909] tracking-[-0.48px] text-justify mt-8 space-y-4 leading-[1.5]">
          <p>Welcome to our platform. These Terms & Conditions govern your use of our cross-border e-commerce service, which connects Indonesian products with customers in Japan. By accessing and using this platform, you agree to comply with the terms outlined below.</p>
          <p>Our platform allows users to browse and purchase products sourced from Indonesia. While we strive to present product information, images, and pricing as accurately as possible, there may be slight variations due to differences in display, packaging, or production. Product availability may also change without prior notice.</p>
          <p>All prices are initially listed in Indonesian Rupiah (IDR) and may be displayed in Japanese Yen (JPY) based on current exchange rates. Due to currency fluctuations, the final price may vary slightly at checkout. However, the exact total amount will always be clearly shown before you complete your payment to ensure transparency.</p>
          <p>Payments must be completed using the available methods provided on the platform. All transactions are processed securely, and orders will only be confirmed once payment has been successfully received.</p>
          <p>We provide international shipping from Indonesia to Japan. Shipping costs are calculated based on factors such as product weight, selected shipping method, and destination. Delivery times may vary depending on the chosen method, with faster options available via air shipping and more economical options via sea shipping.</p>
          <p>We reserve the right to update these Terms & Conditions at any time. Continued use of the platform indicates your acceptance of any changes made. If you have any questions or concerns, please contact our support team for further assistance.</p>
        </div>
      </section>
    </PageWrapper>
  );
}
