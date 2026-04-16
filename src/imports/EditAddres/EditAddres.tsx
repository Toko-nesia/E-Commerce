function Group() {
  return (
    <div className="absolute contents left-[41px] top-[636px]">
      <div className="absolute bg-[#511e0b] h-[58px] left-[41px] rounded-[8px] top-[636px] w-[451px]" />
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[266px] not-italic text-[20px] text-center text-white top-[653px] tracking-[-0.6px] whitespace-nowrap">Save Address</p>
    </div>
  );
}

function Group2() {
  return (
    <button className="absolute contents cursor-pointer left-[41px] top-[636px]">
      <Group />
    </button>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[41px] top-[110px]">
      <div className="absolute border border-black border-solid h-[86px] left-[41px] rounded-[8px] top-[110px] w-[451px]" />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[41px] top-[220px]">
      <div className="absolute border border-black border-solid h-[64px] left-[41px] rounded-[8px] top-[220px] w-[451px]" />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-[41px] top-[403px]">
      <div className="absolute border border-black border-solid h-[64px] left-[41px] rounded-[8px] top-[403px] w-[451px]" />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents left-[41px] top-[515px]">
      <div className="absolute border border-black border-solid h-[64px] left-[41px] rounded-[8px] top-[515px] w-[451px]" />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[41px] top-[308px]">
      <div className="absolute border border-black border-solid h-[64px] left-[41px] rounded-[8px] top-[308px] w-[451px]" />
    </div>
  );
}

export default function EditAddres() {
  return (
    <div className="bg-white overflow-clip relative rounded-[8px] size-full" data-name="Edit Addres">
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[266px] not-italic text-[32px] text-black text-center top-[29px] tracking-[-0.96px] whitespace-nowrap">Edit Address</p>
      <button className="absolute block cursor-pointer left-[460px] overflow-clip size-[20px] top-[38px]" data-name="X">
        <div className="absolute inset-1/4" data-name="Icon">
          <div className="absolute inset-[-10%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
              <path d="M11 1L1 11M1 1L11 11" id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </button>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[133.5px] not-italic text-[#a6a6a6] text-[20px] text-center top-[127px] tracking-[-0.6px] whitespace-nowrap">Recipient Name</p>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[95.5px] not-italic text-[20px] text-black text-center top-[155px] tracking-[-0.6px] whitespace-nowrap">Haruka</p>
      <Group2 />
      <Group1 />
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[130.5px] not-italic text-[#a6a6a6] text-[20px] text-center top-[240px] tracking-[-0.6px] whitespace-nowrap">Phone Number</p>
      <Group3 />
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[118px] not-italic text-[#a6a6a6] text-[20px] text-center top-[423px] tracking-[-0.6px] whitespace-nowrap">Full Address</p>
      <Group5 />
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[187px] not-italic text-[#a6a6a6] text-[20px] text-center top-[535px] tracking-[-0.6px] whitespace-nowrap">Additional Details (Optional)</p>
      <Group6 />
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[193px] not-italic text-[#a6a6a6] text-[20px] text-center top-[328px] tracking-[-0.6px] whitespace-nowrap">Search your address</p>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[169.5px] not-italic text-[#a6a6a6] text-[14px] text-center top-[379px] tracking-[-0.42px] whitespace-nowrap">Example: street name / building / housing</p>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[169px] not-italic text-[#a6a6a6] text-[14px] text-center top-[586px] tracking-[-0.42px] whitespace-nowrap">Example: block, unit number, or landmark</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[41px] not-italic text-[#a6a6a6] text-[14px] top-[474px] tracking-[-0.42px] w-[451px]">Make sure your address is correct, e.g. include housing name, apartment, or building</p>
      <Group4 />
    </div>
  );
}