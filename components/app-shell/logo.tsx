import { cn } from "@/lib/utils";

/** Bond mark + wordmark. */
export function BondLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BondMark className="size-8" />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">Partner Portal</span>
    </div>
  );
}

export function BondMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Bond" className={cn("object-contain", className)} />
  );
}
