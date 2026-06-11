import Link from "next/link";
import { cn } from "@/lib/utils";

const INK = "#1a1a1a";

export const sticker = "border-[2.5px] border-[#1a1a1a] shadow-[4px_4px_0_0_#1a1a1a]";
export const stickerSm = "border-[2.5px] border-[#1a1a1a] shadow-[3px_3px_0_0_#1a1a1a]";
export const stickerInput =
  "w-full rounded-xl border-[2.5px] border-[#1a1a1a] bg-white px-3.5 py-2.5 text-[15px] text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 transition-shadow focus:outline-none focus:shadow-[3px_3px_0_0_#1a1a1a]";

/** Full-screen blue-tint brand background (Satoshi/Inter body, ink text). */
export function BrandBg({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("min-h-screen bg-[#D4DEFF] text-[#1a1a1a]", className)}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {children}
    </div>
  );
}

/** lowercase "bond" wordmark with the rightward ink block extrusion. */
export function Wordmark({ size = 32 }: { size?: number }) {
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

/** Baloo headline. Wrap one word in <Caveat> for the signature highlight. */
export function Heading({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h1
      className={className}
      style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, ...style }}
    >
      {children}
    </h1>
  );
}

export function Caveat({ children, color = "#6B80E6" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontFamily: "var(--font-caveat)", fontWeight: 700, color }}>{children}</span>
  );
}

export function StickerCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-2xl bg-white", sticker, className)}>{children}</div>;
}

export function BrandField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-[#1a1a1a]" style={{ fontWeight: 900 }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={stickerInput}
        style={{ fontWeight: 500 }}
      />
    </div>
  );
}

type BtnProps = {
  children: React.ReactNode;
  variant?: "primary" | "white";
  className?: string;
  full?: boolean;
} & (
  | { href: string; external?: boolean; onClick?: never; type?: never; disabled?: never }
  | { href?: never; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }
);

export function StickerButton(props: BtnProps) {
  const { children, variant = "primary", className, full } = props;
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm transition-transform",
    "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    sticker,
    variant === "primary" ? "bg-gradient-to-b from-[#FFE066] to-[#FFC93C]" : "bg-white",
    "text-[#1a1a1a]",
    full && "w-full",
    "disabled:opacity-60 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0_0_#1a1a1a]",
    className
  );
  const style = { fontWeight: 900 as const };
  if ("href" in props && props.href) {
    return props.external ? (
      <a href={props.href} className={cls} style={style}>
        {children}
      </a>
    ) : (
      <Link href={props.href} className={cls} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cls}
      style={style}
    >
      {children}
    </button>
  );
}
