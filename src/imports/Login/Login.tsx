import svgPaths from "./svg-pw2zbjbmrr";
import imgElmn31 from "./fbb1676fb1e714ce082c8512433c9a5517bce894.png";

function Group5() {
  return (
    <div className="absolute contents left-[62px] top-[105px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[62px] not-italic text-[#605850] text-[14px] top-[113.5px] whitespace-nowrap">
        <p className="leading-[1.2]">Login</p>
      </div>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents left-[62px] top-[70px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] left-[62px] not-italic text-[24px] text-black top-[84.5px] whitespace-nowrap">
        <p className="leading-[1.2]">WELCOME!</p>
      </div>
      <Group5 />
    </div>
  );
}

function Label() {
  return (
    <div className="absolute h-[17px] left-0 right-0 top-0" data-name="Label">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-px not-italic right-[7px] text-[#605850] text-[11px] top-[8.5px] tracking-[1.1px] uppercase">
        <p className="leading-[16.5px]">EMAIL OR ADDRESS</p>
      </div>
    </div>
  );
}

function Label1() {
  return (
    <div className="absolute font-['Inter:Regular',sans-serif] font-normal h-[17px] leading-[0] left-0 not-italic right-0 text-[11px] top-[97.25px] tracking-[1.1px]" data-name="Label">
      <div className="-translate-y-1/2 absolute flex flex-col justify-center left-px right-[254px] text-[#605850] top-[8.5px] uppercase">
        <p className="leading-[16.5px]">PASSWORD</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col justify-center left-px right-[254px] text-[#605850] top-[8.5px] uppercase">
        <p className="leading-[16.5px]">PASSWORD</p>
      </div>
      <div className="-translate-y-1/2 absolute capitalize flex flex-col justify-center left-[218px] right-0 text-[#a24141] top-[8.5px]">
        <p className="leading-[16.5px]">Forgot Password?</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(154,144,136,0.5)] w-full">
          <p className="leading-[normal]">Febri@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#faf5ee] h-[46px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start justify-center pb-[14px] pt-[13px] px-[17px] relative size-full">
          <Container />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d8d0c8] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[-10px] p-[10px] top-[15px] w-[350px]">
      <Input />
    </div>
  );
}

function Input1() {
  return (
    <div className="absolute bg-[#faf5ee] h-[46px] left-0 right-0 rounded-[8px] top-[114.25px]" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#d8d0c8] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[-10px] top-0">
      <Label />
      <Label1 />
      <Frame1 />
      <Input1 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[12px] overflow-clip top-[127.25px] w-[151px]" data-name="Container">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(154,144,136,0.5)] w-full">
        <p className="leading-[normal]">••••••••</p>
      </div>
    </div>
  );
}

function NameField() {
  return (
    <div className="absolute h-[125px] left-0 right-0 top-0" data-name="Name Field">
      <Group2 />
      <Container1 />
    </div>
  );
}

function Terms() {
  return <div className="absolute h-[17px] left-0 right-0 top-[282.5px]" data-name="Terms" />;
}

function Group3() {
  return (
    <div className="absolute contents left-[87.22px] top-[17px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-[calc(50%-5.63px)] text-[14px] text-center text-white top-[calc(50%+0.5px)] tracking-[1.4px] uppercase w-[144.31px]">
        <p className="leading-[20px]">{`login `}</p>
      </div>
      <div className="absolute left-[212px] size-[11.25px] top-[21px]" data-name="Icon">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.2499 11.2499">
          <path d={svgPaths.p3ffb2280} fill="var(--fill-0, white)" id="Icon" />
        </svg>
      </div>
    </div>
  );
}

function CtaButton() {
  return (
    <div className="absolute bg-[#511e0b] h-[53px] left-[-2px] right-[2px] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[200px]" data-name="CTA Button">
      <Group3 />
    </div>
  );
}

function Form() {
  return (
    <div className="absolute h-[451.5px] left-0 right-0 top-[-1px]" data-name="Form">
      <NameField />
      <Terms />
      <CtaButton />
    </div>
  );
}

function FormMargin() {
  return (
    <div className="absolute h-[391.5px] left-[64px] right-[64px] top-[161px]" data-name="Form:margin">
      <Form />
    </div>
  );
}

function RightSideRegistrationForm() {
  return (
    <div className="absolute h-[675px] left-0 right-0 top-0" data-name="Right Side: Registration Form">
      <Group6 />
      <FormMargin />
    </div>
  );
}

function CtaButton1() {
  return (
    <div className="absolute bg-[#faf5ee] content-stretch flex h-[53px] items-center justify-center left-[62px] pb-[16px] pt-[17px] right-[66px] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[486.25px]" data-name="CTA Button">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] relative shrink-0 text-[#798698] text-[14px] text-center tracking-[1.4px] uppercase w-[144.31px]">
        <p className="leading-[20px]">GooGLE</p>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[112px] top-[561px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-[221.5px] text-[#605850] text-[14px] text-center top-[571px] w-[219px]">
        <p>
          <span className="leading-[20px]">{`New ? `}</span>
          <span className="font-['Manrope:Regular',sans-serif] font-normal leading-[20px] text-[#a24141]">Create Account</span>
        </p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[16px]" data-name="Container">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[15px] justify-center leading-[0] relative shrink-0 text-[#deadad] text-[10px] tracking-[2px] uppercase w-[100.2px]">
        <p className="leading-[15px]">or</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-center left-[62px] pt-[8px] right-[78px] top-[439px]" data-name="Container">
      <div className="bg-[#deadad] flex-[1_0_0] h-px min-h-px min-w-px" data-name="Horizontal Divider" />
      <Container3 />
      <div className="bg-[#deadad] flex-[1_0_0] h-px min-h-px min-w-px" data-name="Horizontal Divider" />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[62px] top-[439px]">
      <CtaButton1 />
      <Group />
      <Container2 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bg-white h-[675px] left-1/2 overflow-clip top-[116px] w-[458px]">
      <RightSideRegistrationForm />
      <Group4 />
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

export default function Login() {
  return (
    <div className="bg-[#faf5ee] relative size-full" data-name="Login">
      <Group1 />
      <div className="absolute h-[675px] left-[calc(12.5%+2px)] top-[116px] w-[448px]" data-name="elmn3 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[148.01%] left-[-111.31%] max-w-none top-[-23.71%] w-[396.5%]" src={imgElmn31} />
        </div>
      </div>
    </div>
  );
}