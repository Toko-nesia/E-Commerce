import { PageWrapper } from "../layout/PageWrapper";
import imgElmn42 from "../../../imports/AboutTermsConditions/5e342d0667a9577578f0e6b7fd827dad0dec2006.png";
import imgIndonesia1 from "../../../imports/AboutTermsConditions/f4843ce4c490da459963aa8592808b498345d492.png";
import imgIcon3 from "../../../imports/HomeBeforeLogin/61ed9253763e955d2f0a7c5290f2a40996acd534.png";
import imgIndofoodLogo012 from "../../../imports/AboutTermsConditions/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png";
import imgPolytron1 from "../../../imports/AboutTermsConditions/96b1b0bf8f394affd2422778a1b39a7160fd8e20.png";
import imgTolakAngin2 from "../../../imports/AboutTermsConditions/0ebb731ac0cc6130f95d969c3462755df0f575c4.png";
import imgLogo3 from "../../../imports/AboutTermsConditions/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png";
import imgLogoAero2 from "../../../imports/AboutTermsConditions/20e3dc0c2ba546b3900c0769482bcf364276dde1.png";
import imgLogo31 from "../../../imports/AboutTermsConditions/96809bd8d5a7fa1f5a01c4a20039fe9445e37373.png";
import imgLogoMieSedaap1 from "../../../imports/AboutTermsConditions/01a99087ec101d10593a676d342682bba131c6ee.png";
import imgKopiko1 from "../../../imports/AboutTermsConditions/c0fd69c570c85dce51ea76e90ea7746f9ef12432.png";
import imgLogoSariRoti1 from "../../../imports/AboutTermsConditions/a825c5a8cda7c3112115b33b7b4f84b9ec65f494.png";

const brands = [
  { img: imgIndofoodLogo012, w: 150, h: 150, name: "Indofood" },
  { img: imgPolytron1, w: 236, h: 49, name: "Polytron" },
  { img: imgTolakAngin2, w: 168, h: 101, name: "Tolak Angin", overflow: true, style: "h-[166.67%] left-0 top-[-34.07%] w-full" },
  { img: imgLogo3, w: 225, h: 117, name: "Brand", overflow: true, style: "h-[230.28%] left-[-11.07%] top-[-103.84%] w-[212.62%]" },
  { img: imgLogoAero2, w: 192, h: 56, name: "Aerostreet" },
  { img: imgLogo31, w: 235, h: 67, name: "Brand", overflow: true, style: "h-[646.71%] left-[-45.69%] top-[-361.08%] w-[324.87%]" },
  { img: imgLogoMieSedaap1, w: 176, h: 94, name: "Mie Sedaap" },
  { img: imgKopiko1, w: 186, h: 104, name: "Kopiko" },
  { img: imgLogoSariRoti1, w: 169, h: 92, name: "Sari Roti", overflow: true, style: "h-[235.29%] left-[-14.1%] top-[-67.06%] w-[128.21%]" },
];

export default function AboutPage() {
  return (
    <PageWrapper>
      {/* Hero */}
      <section className="relative h-[611px] w-full overflow-hidden flex items-center justify-center">
        <img alt="" className="absolute h-[110.43%] left-0 max-w-none top-[-8.79%] w-full" src={imgElmn42} />
        <div className="relative z-10 text-center">
          <p className="font-['Inter',sans-serif] text-[20px] text-white tracking-[-0.6px]">A FEW WORDS</p>
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] text-white tracking-[-1.44px]">ABOUT US</h1>
        </div>
      </section>

      {/* Made in Indonesia */}
      <section className="py-16 px-16 flex gap-16 items-start max-w-[1200px] mx-auto">
        <div className="w-[404px] h-[324px] relative overflow-hidden shrink-0">
          <img alt="" className="absolute h-[131.23%] left-[-2.58%] max-w-none top-[-13.06%] w-[105.21%]" src={imgIndonesia1} />
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
          {brands.map((b, i) => (
            <div key={i} className="relative overflow-hidden" style={{ width: b.w * 0.7, height: b.h * 0.7 }}>
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
          {[
            { title: "Door-to-Door Delivery", desc: "Delivered straight to your doorstep. Your order will be carefully delivered from Indonesia to your address.", iconStyle: "h-[229.79%] left-[-14.26%] top-[-103.19%] w-[282.35%]" },
            { title: "SECURE PAYMENT", desc: "Safe and secure transactions. Shop with confidence using trusted and protected payment methods.", iconStyle: "h-[243.79%] left-[-380.27%] top-[-22.8%] w-[512%]" },
            { title: "ORDER TRACKING", desc: "Track your order anytime. Stay updated with real-time tracking from checkout to delivery.", iconStyle: "h-[222.22%] left-[-205.65%] top-[-101.65%] w-[417.39%]" },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center max-w-[212px]">
              <div className="relative w-[75px] h-[52px] overflow-hidden">
                <img alt="" className={`absolute max-w-none ${item.iconStyle}`} src={imgIcon3} />
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
