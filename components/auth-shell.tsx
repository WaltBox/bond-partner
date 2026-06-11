import { BrandBg, Wordmark, StickerCard } from "@/components/brand";

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
    <BrandBg className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Wordmark size={44} />
          <div>
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
        </div>
        <StickerCard className="p-6">{children}</StickerCard>
      </div>
    </BrandBg>
  );
}
