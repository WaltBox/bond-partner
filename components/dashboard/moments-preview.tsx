"use client";

import Link from "next/link";
import { Images, Heart, ArrowRight, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMoments } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { imageThumb } from "@/lib/image";

/** Dashboard peek at what diners are posting. Uniform square tiles that link
 *  into /moments. Hidden entirely when there's nothing to show. */
export function MomentsPreview() {
  const { data, loading, error } = useAsync(() => getMoments({ limit: 12 }), []);

  if (error) return null; // don't clutter the dashboard if it fails to load

  const moments = data?.moments ?? [];
  if (!loading && moments.length === 0) return null;

  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#FF85B8]/15 text-[#FF4D6D]">
            <Camera className="size-[18px]" />
          </span>
          <div>
            <CardTitle className="text-base">Moments</CardTitle>
            <p className="text-sm text-muted-foreground">Fresh from your diners</p>
          </div>
        </div>
        <Link
          href="/moments"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1.5">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="size-[120px] shrink-0 rounded-xl" />
              ))
            : moments.map((m) => {
                const photo = [...m.photos].sort((a, b) => a.order - b.order)[0];
                if (!photo) return null;
                return (
                  <Link
                    key={m.id}
                    href="/moments"
                    title={m.caption ?? undefined}
                    className="group relative size-[120px] shrink-0 overflow-hidden rounded-xl ring-1 ring-border/70 transition-shadow hover:ring-2 hover:ring-[#FF85B8]/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageThumb(photo.url, { width: 320, height: 320 })}
                      alt={m.caption ?? "Diner moment"}
                      width={120}
                      height={120}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.07]"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/60 via-black/15 to-transparent px-2 pb-1.5 pt-4 text-xs font-semibold text-white">
                      <Heart className="size-3.5 fill-white text-white" />
                      <span className="tabular">{m.likeCount}</span>
                      {m.photos.length > 1 ? (
                        <span className="ml-auto flex items-center gap-0.5 rounded bg-white/25 px-1 py-px text-[10px] leading-none backdrop-blur-sm">
                          <Images className="size-2.5" />
                          {m.photos.length}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
        </div>
      </CardContent>
    </Card>
  );
}
