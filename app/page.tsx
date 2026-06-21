import Link from "next/link";
import { CalendarClock, ArrowRight } from "lucide-react";

const DEMO_URL = "mailto:partnerships@usebond.com?subject=Bond%20Partner%20Demo";

const INK = "#1a1a1a";

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-[#D4DEFF] text-[#1a1a1a]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-[#D4DEFF]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Wordmark size={30} />
          <div className="flex items-center gap-2.5">
            <NavButton href="/login">Log in</NavButton>
            <NavButton href={DEMO_URL} external primary>
              Schedule a demo
            </NavButton>
          </div>
        </div>
      </header>

      {/* Hero (blue tint) */}
      <section className="relative bg-[#D4DEFF]">
        <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-12 text-center sm:px-8 sm:pt-20">
          <span
            className="text-2xl text-[#6B80E6] sm:text-3xl"
            style={{ fontFamily: "var(--font-caveat)", fontWeight: 700 }}
          >
            bond for partners
          </span>
          <h1
            className="mx-auto mt-3 max-w-3xl text-5xl sm:text-7xl"
            style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95 }}
          >
            turn slow shifts into{" "}
            <span style={{ fontFamily: "var(--font-caveat)", fontWeight: 700, color: "#6B80E6" }}>
              full tables
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#1a1a1a]/80" style={{ fontWeight: 500 }}>
            Most marketing is a tax. Bond is a trade — groups spend above a threshold, their own extra spend funds their cashback, and you keep the table that would have sat empty. Your real cost is just the food you comped.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton href={DEMO_URL} external>
              <CalendarClock className="size-[18px]" />
              Schedule a demo
            </CtaButton>
            <WhiteButton href="/login">
              Log in
              <ArrowRight className="size-[18px]" />
            </WhiteButton>
          </div>

          {/* Sticker stat peek */}
          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
            <StatSticker tone="#7B8FE8" emoji="📈" label="sales driven" value="$12,450" />
            <StatSticker tone="#FF85B8" emoji="🧾" label="real cost" value="$480" />
            <StatSticker tone="#5DD96E" emoji="💸" label="you made" value="$9,660" />
          </div>
        </div>

        {/* seam → white */}
        <Wave fill="#FFFFFF" />
      </section>

      {/* Why partners (white) */}
      <section className="-mt-px bg-white">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <h2
            className="text-center text-4xl sm:text-5xl"
            style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            why partners{" "}
            <span style={{ fontFamily: "var(--font-caveat)", fontWeight: 700, color: "#FFC93C" }}>love</span> bond
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            <ValueCard tone="#D4DEFF" emoji="🌙" title="incremental tables, not discounted ones">
              Bond groups plan ahead and commit to a spend floor before they walk in. You're not discounting regulars — you're filling seats that would have been empty.
            </ValueCard>
            <ValueCard tone="#FFF5E8" emoji="✅" title="their spend funds their reward">
              The cashback your diners receive comes from their own incremental spend cycling back through Bond — not straight out of your margins. It's a pass-through, not a subsidy.
            </ValueCard>
            <ValueCard tone="#E8FBEA" emoji="🔍" title="your real cost is just the food">
              What you actually owe is the cost-to-make of what you comped — your True Cost. Set it in your portal and see exactly what each ticket costs you vs. what it drove.
            </ValueCard>
          </div>
        </div>

        {/* seam → yellow */}
        <Wave fill="#FFC93C" />
      </section>

      {/* CTA band (yellow) */}
      <section className="-mt-px bg-[#FFC93C]">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2
            className="text-4xl sm:text-6xl"
            style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95 }}
          >
            a full table{" "}
            <span style={{ fontFamily: "var(--font-caveat)", fontWeight: 700, color: "#6B80E6" }}>at a known cost.</span>
          </h2>
          <p className="max-w-md text-lg text-[#1a1a1a]/80" style={{ fontWeight: 500 }}>
            No flat fees, no guesswork. You know the cost before they walk in — and you keep everything above it.
          </p>
          <WhiteButton href={DEMO_URL} external large>
            <CalendarClock className="size-5" />
            Schedule a demo
          </WhiteButton>
        </div>
      </section>

      {/* Footer (ink) */}
      <footer className="bg-[#1a1a1a] text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, letterSpacing: "-0.04em", fontSize: 22 }}>
            bond
          </span>
          <div className="flex items-center gap-6 text-sm text-white/70" style={{ fontWeight: 500 }}>
            <a href={DEMO_URL} className="hover:text-white">
              Schedule a demo
            </a>
            <Link href="/login" className="hover:text-white">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Brand bits ─────────────────────────────────────────────────────────── */

function Wordmark({ size }: { size: number }) {
  const n = Math.max(1, Math.round(size / 40));
  const shadow = Array.from({ length: n }, (_, i) => `${i + 1}px 0 0 ${INK}`).join(", ");
  return (
    <span
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 900,
        color: "#7B8FE8",
        letterSpacing: "-0.04em",
        fontSize: size,
        lineHeight: 1,
        textShadow: shadow,
      }}
    >
      bond
    </span>
  );
}

function NavButton({
  href,
  children,
  primary,
  external,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  const cls = [
    "inline-flex items-center rounded-full border-[2.5px] border-[#1a1a1a] px-4 py-1.5 text-sm",
    "shadow-[0_4px_0_0_#1a1a1a] transition-transform active:translate-y-[4px] active:shadow-none",
    primary ? "bg-gradient-to-b from-[#FFE066] to-[#FFC93C]" : "bg-white",
  ].join(" ");
  const style = { fontWeight: 900 as const };
  return external ? (
    <a href={href} className={cls} style={style}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} style={style}>
      {children}
    </Link>
  );
}

function CtaButton({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const cls =
    "inline-flex items-center gap-2 rounded-full border-[2.5px] border-[#1a1a1a] bg-gradient-to-b from-[#FFE066] to-[#FFC93C] px-6 py-3 text-sm uppercase tracking-wide text-[#1a1a1a] shadow-[4px_4px_0_0_#1a1a1a] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none";
  return external ? (
    <a href={href} className={cls} style={{ fontWeight: 900 }}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} style={{ fontWeight: 900 }}>
      {children}
    </Link>
  );
}

function WhiteButton({
  href,
  children,
  external,
  large,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  large?: boolean;
}) {
  const cls = [
    "inline-flex items-center gap-2 rounded-full border-[2.5px] border-[#1a1a1a] bg-white text-[#1a1a1a]",
    "shadow-[4px_4px_0_0_#1a1a1a] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    large ? "px-7 py-3.5 text-base uppercase tracking-wide" : "px-6 py-3 text-sm",
  ].join(" ");
  return external ? (
    <a href={href} className={cls} style={{ fontWeight: 900 }}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} style={{ fontWeight: 900 }}>
      {children}
    </Link>
  );
}

function StatSticker({
  tone,
  emoji,
  label,
  value,
}: {
  tone: string;
  emoji: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-3 text-left shadow-[4px_4px_0_0_#1a1a1a] sm:p-4"
    >
      <div
        className="mb-2 flex size-9 items-center justify-center rounded-full border-[2.5px] border-[#1a1a1a] text-base shadow-[2.5px_2.5px_0_0_#1a1a1a]"
        style={{ backgroundColor: tone }}
      >
        {emoji}
      </div>
      <p className="text-[11px] text-[#1a1a1a]/60" style={{ fontWeight: 500 }}>
        {label}
      </p>
      <p className="text-lg sm:text-xl" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}>
        {value}
      </p>
    </div>
  );
}

function ValueCard({
  tone,
  emoji,
  title,
  children,
}: {
  tone: string;
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border-[2.5px] border-[#1a1a1a] p-5 shadow-[4px_4px_0_0_#1a1a1a]"
      style={{ backgroundColor: tone }}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-full border-[2.5px] border-[#1a1a1a] bg-white text-xl shadow-[2.5px_2.5px_0_0_#1a1a1a]">
        {emoji}
      </div>
      <h3 className="text-xl" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, lineHeight: 1.05 }}>
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#1a1a1a]/75" style={{ fontWeight: 500 }}>
        {children}
      </p>
    </div>
  );
}

function Wave({ fill }: { fill: string }) {
  return (
    <div style={{ lineHeight: 0 }}>
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none" className="block h-[40px] w-full sm:h-[60px]">
        <path
          d="M0,34 C240,72 480,6 720,32 C960,58 1200,8 1440,32 L1440,70 L0,70 Z"
          fill={fill}
        />
        <path
          d="M0,34 C240,72 480,6 720,32 C960,58 1200,8 1440,32"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
