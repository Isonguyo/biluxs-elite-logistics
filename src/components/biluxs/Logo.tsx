import logo from "@/assets/biluxs-logo.png";

export function Logo({ size = 44, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <img
        src={logo}
        alt="BiLUXS — Brightflow Logistics Luxury Services"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size, filter: "invert(1)" }}
      />
      {withText && (
        <span className="leading-none hidden sm:flex flex-col gap-1">
          {/* <span className="text-[8px] tracking-[0.25em] text-white/70 uppercase">Brightflow Logistics Luxury Services</span> */}
          <span className="font-display text-xl tracking-[0.25em] text-white">BiLUXS</span>
          {/* <span className="text-[9px] tracking-[0.2em] text-gold italic">…Bringing the World to US</span> */}
        </span>
      )}
    </span>
  );
}
