import svgPaths from "./svg-lcamwji33u";

function BerhasilTambahCart() {
  return (
    <div className="absolute contents left-0 top-0" data-name="Berhasil tambah cart">
      <div className="absolute bg-[#ececec] h-[269px] left-0 rounded-[4px] top-0 w-[552px]" />
      <div className="absolute left-[252px] overflow-clip rounded-[4px] size-[48px] top-[76px]" data-name="Check circle">
        <div className="absolute inset-[8.31%_8.33%_8.36%_8.33%]" data-name="Icon">
          <div className="absolute inset-[-5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
              <path d={svgPaths.p2ae95200} id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
            </svg>
          </div>
        </div>
      </div>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.2] left-[276.5px] not-italic text-[36px] text-black text-center top-[150px] tracking-[-1.08px] whitespace-nowrap">Added to your cart!</p>
    </div>
  );
}

export default function PopUpAddCart() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative size-full" data-name="Pop up add cart">
      <BerhasilTambahCart />
    </div>
  );
}