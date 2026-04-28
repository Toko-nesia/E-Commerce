"use client";

import { PageWrapper } from "../components/layout/PageWrapper";
import { aboutBrands, whyChooseUs } from "@/data/brands";

export default function AboutPage() {
  return (
    <PageWrapper>
      {/* Hero */}
      <section className="relative h-[480px] md:h-[560px] w-full overflow-hidden flex items-center justify-center">
        <img
          alt=""
          className="absolute h-[110.43%] left-0 max-w-none top-[-8.79%] w-full object-cover"
          src="/images/AboutTermsConditions/5e342d0667a9577578f0e6b7fd827dad0dec2006.png"
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
            src="/images/AboutTermsConditions/f4843ce4c490da459963aa8592808b498345d492.png"
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
      <section className="py-12 md:py-16 px-6 md:px-16 bg-[#faf5ee]">
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
