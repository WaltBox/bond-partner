import Link from "next/link";
import { BrandBg, StickerCard } from "@/components/brand";

const BLOCK_SHADOW = Array.from({ length: 2 }, (_, i) => `${i + 1}px 0 0 #1a1a1a`).join(", ");

function NavWordmark() {
  return (
    <Link href="/" className="flex items-center group">
      <span
        className="group-hover:opacity-70 transition-opacity"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 900,
          color: "#7B8FE8",
          textShadow: BLOCK_SHADOW,
          letterSpacing: "-0.04em",
          lineHeight: 0.7,
          fontSize: 32,
        }}
      >
        bond
      </span>
    </Link>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <BrandBg className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-[#D4DEFF]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-5 sm:px-8">
          <NavWordmark />
        </div>
      </header>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1
              className="text-2xl text-[#1a1a1a]"
              style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-[#1a1a1a]/70" style={{ fontWeight: 500 }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <StickerCard className="p-6">{children}</StickerCard>
        </div>
      </div>
    </BrandBg>
  );
}
