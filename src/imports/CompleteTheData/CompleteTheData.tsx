import imgElmn32 from "./fbb1676fb1e714ce082c8512433c9a5517bce894.png";

function Group2() {
  return (
    <div className="absolute contents left-0 top-[51.25px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-0 not-italic text-[#605850] text-[14px] top-[59.75px] whitespace-nowrap">
        <p className="leading-[1.2]">Complete the data to complete the registration</p>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-0 top-[16.25px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] left-0 not-italic text-[24px] text-black top-[30.75px] whitespace-nowrap">
        <p className="leading-[1.2]">COMPLETE THE DATA</p>
      </div>
      <Group2 />
    </div>
  );
}

function Margin() {
  return (
    <div className="absolute h-[108px] left-[64px] right-[64px] top-[41.75px]" data-name="Margin">
      <Group3 />
    </div>
  );
}

function Label() {
  return (
    <div className="h-[17px] relative shrink-0 w-full" data-name="Label">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] left-[4px] right-[4px] text-[#605850] text-[11px] top-[8.5px] tracking-[1.1px] uppercase">
        <p className="leading-[16.5px]">PHONE NUMBER</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(154,144,136,0.5)] w-full">
          <p className="leading-[normal]">08117750</p>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#faf5ee] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start justify-center pb-[14px] pt-[13px] px-[17px] relative size-full">
          <Container />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d8d0c8] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function NameField() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] items-start left-0 right-0 top-0" data-name="Name Field">
      <Label />
      <Input />
    </div>
  );
}

function Label1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Label">
      <div className="content-stretch flex flex-col items-start px-[4px] relative size-full">
        <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#605850] text-[11px] tracking-[1.1px] uppercase w-full">
          <p className="leading-[16.5px]">ADDRESS</p>
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(154,144,136,0.5)] w-full">
          <p className="leading-[normal]">JL. Tata Surya</p>
        </div>
      </div>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#faf5ee] h-[180px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start justify-center pb-[14px] pt-[13px] px-[17px] relative size-full">
          <Container1 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d8d0c8] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function EmailField() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] items-start left-0 right-0 top-[94px]" data-name="Email Field">
      <Label1 />
      <Input1 />
    </div>
  );
}

function LabelMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[12px] relative shrink-0" data-name="Label:margin">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] relative shrink-0 text-[#605850] text-[12px] w-[268.63px]">
        <p>
          <span className="leading-[16px]">{`I agree to the `}</span>
          <span className="font-['Manrope:Regular',sans-serif] font-normal leading-[16px] text-[#a24141]">Terms of Service</span>
          <span className="leading-[16px]">{` and `}</span>
          <span className="font-['Manrope:Regular',sans-serif] font-normal leading-[16px] text-[#a24141]">Privacy Policy</span>
          <span className="leading-[16px]">.</span>
        </p>
      </div>
    </div>
  );
}

function Terms() {
  return (
    <div className="absolute content-stretch flex h-[17px] items-center left-0 pt-px px-[4px] right-0 top-[341.25px]" data-name="Terms">
      <div className="bg-white relative rounded-[4px] shrink-0 size-[16px]" data-name="Input">
        <div aria-hidden="true" className="absolute border border-[#d8d0c8] border-solid inset-0 pointer-events-none rounded-[4px]" />
      </div>
      <LabelMargin />
    </div>
  );
}

function CtaButton() {
  return (
    <div className="absolute bg-[#511e0b] content-stretch flex h-[53px] items-center justify-center left-[82px] pb-[16px] pt-[17px] right-0 rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[382.25px]" data-name="CTA Button">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white tracking-[1.4px] uppercase w-[144.31px]">
        <p className="leading-[20px]">Create Account</p>
      </div>
    </div>
  );
}

function CtaButton1() {
  return (
    <button className="absolute bg-[#faf5ee] content-stretch cursor-pointer flex h-[53px] items-center justify-center left-0 pb-[16px] pt-[17px] right-[254px] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[382.25px]" data-name="CTA Button">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[#511e0b] text-[14px] text-center tracking-[1.4px] uppercase w-[144.31px]">
        <p className="leading-[20px]">RETURN</p>
      </div>
    </button>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-0 right-0 top-[382.25px]">
      <CtaButton />
      <CtaButton1 />
    </div>
  );
}

function Form() {
  return (
    <div className="absolute h-[451.5px] left-0 right-0 top-[-1px]" data-name="Form">
      <NameField />
      <EmailField />
      <Terms />
      <Group4 />
    </div>
  );
}

function FormMargin() {
  return (
    <div className="absolute h-[391.5px] left-[64px] right-[64px] top-[149.75px]" data-name="Form:margin">
      <Form />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents font-['Manrope:Regular',sans-serif] font-normal leading-[0] left-[119px] text-[14px] text-center top-[637px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col h-[20px] justify-center left-[202.69px] text-[#605850] top-[647px] w-[167.38px]">
        <p className="leading-[20px]">{`Already have an account? `}</p>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col h-[20px] justify-center left-[319.11px] text-[#a24141] top-[647px] w-[40.23px]">
        <p className="leading-[20px]">Log in</p>
      </div>
    </div>
  );
}

function RightSideRegistrationForm() {
  return (
    <div className="absolute h-[675px] left-0 right-0 top-0" data-name="Right Side: Registration Form">
      <Margin />
      <FormMargin />
      <Group />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bg-white h-[675px] left-1/2 overflow-clip top-[116px] w-[458px]">
      <RightSideRegistrationForm />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-1/2 top-[116px]">
      <Frame />
    </div>
  );
}

export default function CompleteTheData() {
  return (
    <div className="bg-[#faf5ee] relative size-full" data-name="Complete The Data">
      <Group1 />
      <div className="absolute h-[675px] left-[calc(12.5%+2px)] top-[116px] w-[448px]" data-name="elmn3 2">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]" src={imgElmn32} />
        </div>
      </div>
    </div>
  );
}