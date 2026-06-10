import { cn } from "@/lib/utils";

/** Renders the partner's logo image, falling back to initials when there's no
 *  logoUrl. */
export function PartnerAvatar({
  name,
  logoUrl,
  className,
}: {
  name?: string | null;
  logoUrl?: string | null;
  className?: string;
}) {
  const initials =
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name ?? "Partner logo"}
        className={cn("shrink-0 border border-border/60 object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-foreground font-semibold text-background",
        className
      )}
    >
      {initials}
    </div>
  );
}
