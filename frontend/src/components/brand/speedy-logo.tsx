import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type SpeedyLogoProps = {
  className?: string;
  /** Image sizing */
  variant?: "full" | "mark";
  /** Presentation shell */
  frame?: "none" | "card" | "soft";
  priority?: boolean;
  showSlogan?: boolean;
};

/**
 * Official SpeedyPrint brand logo — framed presentation for premium UI.
 */
export function SpeedyLogo({
  className,
  variant = "full",
  frame = "none",
  priority = false,
  showSlogan = false,
}: SpeedyLogoProps) {
  const image = (
    <Image
      src={BRAND.logoSrc}
      alt={`${BRAND.name} — ${BRAND.slogan}`}
      width={variant === "full" ? 320 : 180}
      height={variant === "full" ? 140 : 80}
      priority={priority}
      className={cn(
        "mx-auto h-auto w-auto object-contain object-center",
        variant === "full" ? "max-h-[4.5rem] sm:max-h-[5.25rem]" : "max-h-11",
        className
      )}
    />
  );

  if (frame === "none") {
    return image;
  }

  if (frame === "soft") {
    return (
      <div className="inline-flex flex-col items-center">
        <div className="rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 px-5 py-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80">
          {image}
        </div>
        {showSlogan && (
          <p className="mt-2 max-w-[220px] text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
            {BRAND.slogan}
          </p>
        )}
      </div>
    );
  }

  // frame === "card"
  return (
    <div className="w-full">
      <div
        className="relative rounded-[22px] p-[1px]"
        style={{
          background:
            "linear-gradient(135deg, #2563EB 0%, #EC4899 35%, #F59E0B 65%, #06B6D4 100%)",
          boxShadow:
            "0 0 18px rgba(37,99,235,0.55), 0 0 36px rgba(236,72,153,0.35), 0 0 52px rgba(245,158,11,0.25), 0 14px 40px rgba(15,23,42,0.2)",
        }}
      >
        <div
          className="pointer-events-none absolute -inset-1 rounded-[24px] opacity-70 blur-md"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.55), rgba(236,72,153,0.45), rgba(245,158,11,0.4), rgba(6,182,212,0.45))",
          }}
          aria-hidden
        />
        <div className="relative overflow-hidden rounded-[21px] bg-white px-4 py-3.5 sm:px-5 sm:py-4">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-amber-50/60"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-1.5">
            {image}
            {showSlogan && (
              <p className="max-w-[240px] text-center text-[10px] font-semibold leading-snug tracking-wide text-slate-500">
                {BRAND.slogan}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
