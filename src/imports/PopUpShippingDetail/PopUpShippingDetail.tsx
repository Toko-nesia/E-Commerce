import svgPaths from "./svg-tdmv2t79t8";

function AirShips() {
  return (
    <div className="absolute contents left-[39px] top-[325px]" data-name="Air ships">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[150.5px] not-italic text-[#a6a6a6] text-[15px] text-center top-[350px] tracking-[-0.45px] whitespace-nowrap">Estimated arrival Apr 12 - June 21</p>
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[85px] not-italic text-[15px] text-black text-center top-[325px] tracking-[-0.45px] whitespace-nowrap">Air Shipping</p>
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[473.5px] not-italic text-[15px] text-black text-center top-[350px] tracking-[-0.45px] whitespace-nowrap">Rp350.000</p>
      <div className="absolute h-0 left-[39px] top-[381px] w-[475px]">
        <div className="absolute inset-[-1px_0_0_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 475 1">
            <line id="Line 5" stroke="var(--stroke-0, #A6A6A6)" x2="475" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Section() {
  return (
    <div className="absolute contents left-[39px] top-[102px]" data-name="Section 2">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[179px] not-italic text-[15px] text-black text-center top-[133px] tracking-[-0.45px] whitespace-nowrap">From Solo, Indonesia</p>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[179px] not-italic text-[15px] text-black text-center top-[174px] tracking-[-0.45px] whitespace-nowrap">Ship to Tokyo, Japan</p>
      <div className="absolute bg-[rgba(255,255,255,0)] border-[#a6a6a6] border-[0.5px] border-solid h-[123px] left-[39px] rounded-[5px] top-[102px] w-[475px]" />
      <div className="absolute left-[68px] overflow-clip size-[20px] top-[132px]" data-name="Map pin">
        <div className="absolute inset-[4.17%_12.5%]" data-name="Icon">
          <div className="absolute inset-[-5.45%_-6.67%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 20.3333">
              <g id="Icon">
                <path d={svgPaths.p6e23400} stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d={svgPaths.p10170f40} stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute left-[68px] overflow-clip size-[20px] top-[175px]" data-name="Map pin">
        <div className="absolute inset-[4.17%_12.5%]" data-name="Icon">
          <div className="absolute inset-[-5.45%_-6.67%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 20.3333">
              <g id="Icon">
                <path d={svgPaths.p6e23400} stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d={svgPaths.p10170f40} stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[9px] items-center justify-center left-[78px] top-[159px] w-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "22" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[9px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 1">
                <line id="Line 4" stroke="var(--stroke-0, #7F7F7F)" x2="9" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-[257px] overflow-clip size-[16px] top-[175px]" data-name="Chevron down">
        <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Icon">
          <div className="absolute inset-[-20%_-10%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.6 5.6">
              <path d="M0.8 0.8L4.8 4.8L8.8 0.8" id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PopUpShippingDetail() {
  return (
    <div className="bg-white overflow-clip relative rounded-[5px] size-full" data-name="Pop up shipping detail">
      <AirShips />
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[259.5px] not-italic text-[15px] text-black text-center top-[241px] tracking-[-0.45px] whitespace-nowrap">
        <span className="leading-[1.2]">{`Weight per item: 500g `}</span>
        <span className="font-['Inter:Bold',sans-serif] font-bold leading-[1.2]">{`• `}</span>
        <span className="leading-[1.2]">{`Total shipping cost calculated at checkout `}</span>
      </p>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[198px] not-italic text-[15px] text-black text-center top-[267px] tracking-[-0.45px] whitespace-nowrap">
        <span className="leading-[1.2]">{`Shipping is available for orders of `}</span>
        <span className="leading-[1.2] text-[#511e0b]">at least 21 kg</span>
        <span className="leading-[1.2]">.</span>
      </p>
      <Section />
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[159.5px] not-italic text-[32px] text-black text-center top-[38px] tracking-[-0.96px] whitespace-nowrap">Shipping Details</p>
      <div className="absolute left-[494px] overflow-clip size-[20px] top-[38px]" data-name="X">
        <div className="absolute inset-1/4" data-name="Icon">
          <div className="absolute inset-[-10%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
              <path d="M11 1L1 11M1 1L11 11" id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}