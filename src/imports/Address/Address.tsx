import svgPaths from "./svg-u5wptq0ygi";

function Group1() {
  return (
    <div className="absolute contents left-[51px] top-[127px]">
      <div className="absolute h-0 left-[51px] top-[265px] w-[431px]">
        <div className="absolute inset-[-0.5px_0_0_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 431 0.5">
            <line id="Line 8" stroke="var(--stroke-0, #511E0B)" strokeWidth="0.5" x2="431" y1="0.25" y2="0.25" />
          </svg>
        </div>
      </div>
      <div className="absolute left-[445px] overflow-clip size-[30px] top-[146px]" data-name="Circle">
        <div className="absolute inset-[8.33%]" data-name="Icon">
          <div className="absolute inset-[-7%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.5 28.5">
              <path d={svgPaths.p34921800} id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
            </svg>
          </div>
        </div>
      </div>
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[92px] not-italic text-[20px] text-black text-center top-[127px] tracking-[-0.6px] whitespace-nowrap">Haruka</p>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[133.5px] not-italic text-[#a6a6a6] text-[20px] text-center top-[164px] tracking-[-0.6px] whitespace-nowrap">+81 476 22-2311</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[58px] not-italic text-[#a6a6a6] text-[20px] top-[188px] tracking-[-0.6px] w-[361px]">1-10-5 Akasaka, Minato-ku, Tokyo 107-8420</p>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[41px] top-[326px]">
      <div className="absolute bg-[#511e0b] h-[58px] left-[41px] rounded-[8px] top-[326px] w-[451px]" />
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[287.5px] not-italic text-[20px] text-center text-white top-[343px] tracking-[-0.6px] whitespace-nowrap">Add Address</p>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[41px] top-[326px]">
      <Group />
      <div className="absolute left-[185px] overflow-clip size-[32px] top-[339px]" data-name="Plus">
        <div className="absolute inset-[20.83%]" data-name="Icon">
          <div className="absolute inset-[-8.04%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6667 21.6667">
              <path d={svgPaths.p10edcba0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Address() {
  return (
    <div className="bg-white overflow-clip relative rounded-[8px] size-full" data-name="Address">
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[266px] not-italic text-[32px] text-black text-center top-[29px] tracking-[-0.96px] whitespace-nowrap">Address</p>
      <button className="absolute block cursor-pointer left-[460px] overflow-clip size-[20px] top-[38px]" data-name="X">
        <div className="absolute inset-1/4" data-name="Icon">
          <div className="absolute inset-[-10%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
              <path d="M11 1L1 11M1 1L11 11" id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </button>
      <Group1 />
      <Group2 />
    </div>
  );
}