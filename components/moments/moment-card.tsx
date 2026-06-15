"use client";

import * as React from "react";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { Moment } from "@/lib/api";

/** A single diner moment: 1–3 photos (carousel), caption, likes, date.
 *  Anonymized — no poster identity is shown. */
export function MomentCard({ moment }: { moment: Moment }) {
  const photos = [...moment.photos].sort((a, b) => a.order - b.order);
  const [i, setI] = React.useState(0);
  const n = photos.length;
  const idx = Math.min(i, Math.max(0, n - 1));
  const go = (delta: number) => setI((p) => (((p + delta) % n) + n) % n);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/5] bg-secondary">
        {n > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[idx].url}
            alt={moment.caption ?? "Diner moment"}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : null}

        {n > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-foreground/45 text-background backdrop-blur-sm transition-colors hover:bg-foreground/65"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-foreground/45 text-background backdrop-blur-sm transition-colors hover:bg-foreground/65"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {photos.map((p, k) => (
                <span
                  key={p.id}
                  className={`size-1.5 rounded-full transition-colors ${
                    k === idx ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-2 p-3.5">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Heart className="size-4 fill-[#FF4D6D] text-[#FF4D6D]" />
          <span className="tabular">{moment.likeCount}</span>
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {formatDate(moment.createdAt)}
          </span>
        </div>
        {moment.caption ? (
          <p className="text-sm leading-relaxed text-foreground">{moment.caption}</p>
        ) : null}
      </div>
    </Card>
  );
}
