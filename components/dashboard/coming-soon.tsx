import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Placeholder for a section that isn't built yet — keeps the layout intact
 *  and signals what's coming without faking data. */
export function ComingSoon({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-muted-foreground">{title}</CardTitle>
        <Badge variant="muted" className="font-normal">
          Coming soon
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-secondary/25 px-6 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground/70">
            <Icon className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
