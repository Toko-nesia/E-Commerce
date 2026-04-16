import { Link } from "react-router";
import { PageWrapper } from "../layout/PageWrapper";
import imgNewHeroo1 from "../../../imports/HomeBeforeLogin/ddf830bb09d6517538362b5457cbc8292017ec7e.png";
import imgTolakAngin1 from "../../../imports/HomeBeforeLogin/0ebb731ac0cc6130f95d969c3462755df0f575c4.png";
import imgLogoAero1 from "../../../imports/HomeBeforeLogin/20e3dc0c2ba546b3900c0769482bcf364276dde1.png";
import imgIndofoodLogo011 from "../../../imports/HomeBeforeLogin/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png";
import imgLogo1 from "../../../imports/HomeBeforeLogin/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png";
import imgIndomie1 from "../../../imports/HomeBeforeLogin/5771203864e095cbe2563743bf886fd6c03ee3a8.png";
import imgBatik1 from "../../../imports/HomeBeforeLogin/f72f513939c94efe91d378657305af192ebecd74.png";
import imgTolakAngin2 from "../../../imports/HomeBeforeLogin/bfdc8bafe96751bd661dd529a936b4f52f114530.png";
import imgRempah from "../../../imports/HomeBeforeLogin/345cde66ad556f77fc4a2de614911a54ac7e8282.png";
import imgImage16 from "../../../imports/HomeBeforeLogin/5bc42449b61397e41571ffa7cc94f48332069351.png";
import imgIcon3 from "../../../imports/HomeBeforeLogin/61ed9253763e955d2f0a7c5290f2a40996acd534.png";

const trendingProducts = [
  { name: "Indomie Goreng", image: imgIndomie1, imgStyle: "h-[231px] w-[321px] -left-[90px] -top-[7px]" },
  { name: "Batik Wanita", image: imgBatik1, imgStyle: "h-[227px] w-[237px] -left-[16px] top-0" },
  { name: "Tolak Angin Sidomuncul", image: imgTolakAngin2, imgStyle: "w-[227px] h-[227px] -left-[11px] -top-[3px]" },
  { name: "Rempah-rempah Nusantara", image: imgRempah, imgStyle: "h-[224px] w-[336px] -left-[60px] top-0" },
];

const whyChooseUs = [
  { title: "Door-to-Door Delivery", desc: "Delivered straight to your doorstep. Your order will be carefully delivered from Indonesia to your address.", iconStyle: "h-[229.79%] left-[-14.26%] top-[-103.19%] w-[282.35%]" },
  { title: "SECURE PAYMENT", desc: "Safe and secure transactions. Shop with confidence using trusted and protected payment methods.", iconStyle: "h-[243.79%] left-[-380.27%] top-[-22.8%] w-[512%]" },
  { title: "ORDER TRACKING", desc: "Track your order anytime. Stay updated with real-time tracking from checkout to delivery.", iconStyle: "h-[222.22%] left-[-205.65%] top-[-101.65%] w-[417.39%]" },
];

export default function HomePage() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative h-[558px] w-full overflow-hidden">
        <img alt="" className="absolute h-[120.94%] left-0 max-w-none top-[-19.71%] w-full object-cover" src={imgNewHeroo1} />
        <div className="relative z-10 px-16 pt-32">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-white tracking-[-0.9px]">TITLE</h1>
          <p className="font-['Inter',sans-serif] text-[25px] text-white tracking-[-0.75px] max-w-[601px] mt-2">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      </section>

      {/* Brand Logos */}
      <section className="flex items-center justify-center gap-12 py-8 px-16 bg-[#f8f8f8]">
        <div className="h-[81px] w-[136px] relative overflow-hidden">
          <img alt="Tolak Angin" className="absolute h-[166.67%] left-0 max-w-none top-[-34.07%] w-full" src={imgTolakAngin1} />
        </div>
        <div className="h-[51px] w-[177px]">
          <img alt="Aerostreet" className="w-full h-full object-cover" src={imgLogoAero1} />
        </div>
        <div className="w-[92px] h-[92px]">
          <img alt="Indofood" className="w-full h-full object-cover" src={imgIndofoodLogo011} />
        </div>
        <div className="h-[87px] w-[161px] relative overflow-hidden">
          <img alt="Brand" className="absolute h-[219.07%] left-[-9.97%] max-w-none top-[-96.75%] w-[210.3%]" src={imgLogo1} />
        </div>
        <div className="h-[113px] w-[124px] relative overflow-hidden">
          <img alt="Brand" className="absolute h-[183.99%] left-[-170.5%] max-w-none top-[-14.14%] w-[298.14%]" src={imgLogo1} />
        </div>
      </section>

      {/* Trending Now */}
      <section className="bg-[#faf5ee] py-12 px-16">
        <p className="text-center font-['Inter',sans-serif] text-[16px] text-[#511e0b] tracking-[-0.48px]">POPULAR PRODUCT</p>
        <h2 className="text-center font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px] mt-1">Trending Now</h2>
        <div className="flex justify-center gap-8 mt-10">
          {trendingProducts.map((p) => (
            <Link to="/shop" key={p.name} className="flex flex-col items-center no-underline group">
              <div className="relative w-[205px] h-[224px] overflow-hidden shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform">
                <img alt={p.name} className={`absolute max-w-none object-cover pointer-events-none ${p.imgStyle}`} src={p.image} />
                <div className="absolute top-[10px] left-[14px] bg-white rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-3 py-0.5">
                  <span className="font-['Roboto:Medium',sans-serif] font-medium text-[14px] text-black tracking-[0.1px]">TOP</span>
                </div>
              </div>
              <p className="font-['Inter',sans-serif] text-[16px] text-[#511e0b] tracking-[-0.48px] text-center mt-3">{p.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* New Product */}
      <section className="relative bg-[rgba(255,246,242,0.6)] mx-6 overflow-hidden">
        <div className="h-[530px] w-full relative overflow-hidden">
          <img alt="" className="absolute h-[118.87%] left-0 max-w-none top-[-8.49%] w-full" src={imgImage16} />
        </div>
        <div className="absolute top-12 left-16 z-10">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px]">NEW PRODUCT</h2>
          <p className="font-['Inter',sans-serif] text-[16px] text-[#511e0b] tracking-[-0.48px] max-w-[335px] mt-2">
            Step into comfort with Aerostreet<br />
            High-quality local sneakers from Indonesia designed for everyday wear.
          </p>
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
                <img alt="" className={`absolute max-w-none ${item.iconStyle}`} src={imgIcon3} />
              </div>
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#090909] tracking-[-0.45px] text-center mt-4">{item.title}</h3>
              <p className="font-['Inter',sans-serif] text-[11px] text-[#090909] tracking-[-0.33px] text-center mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
}
