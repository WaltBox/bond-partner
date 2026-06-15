"use client";

import { Heart, Images, Download } from "lucide-react";
import { formatDate } from "@/lib/format";
import { imageThumb } from "@/lib/image";
import type { Moment } from "@/lib/api";

/** A diner moment as a fixed-aspect photo tile (every card is the SAME size).
 *  Click to open the lightbox and export. Anonymized — no poster identity. */
export function MomentCard({ moment, onOpen }: { moment: Moment; onOpen: () => void }) {
  const photos = [...moment.photos].sort((a, b) => a.order - b.order);
  const cover = photos[0];

  return (
    <button
      type="button"
      onClick={onOpen}
      title={moment.caption ?? "View moment"}
      className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary text-left ring-1 ring-border/70 transition-shadow hover:ring-2 hover:ring-[#FF85B8]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageThumb(cover.url, { width: 640, height: 800 })}
          alt={moment.caption ?? "Diner moment"}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
        />
      ) : null}

      {/* multi-photo indicator */}
      {photos.length > 1 ? (
        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Images className="size-3" />
          {photos.length}
        </span>
      ) : null}

      {/* export affordance on hover */}
      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        <Download className="size-3" />
        Export
      </span>

      {/* caption + meta overlay — fixed to the bottom, so card height never changes */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 pt-10 text-white">
        {moment.caption ? (
          <p className="line-clamp-2 text-sm font-medium leading-snug drop-shadow">{moment.caption}</p>
        ) : null}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
          <Heart className="size-3.5 fill-[#FF6B95] text-[#FF6B95]" />
          <span className="tabular">{moment.likeCount}</span>
          <span className="ml-auto font-normal text-white/80">{formatDate(moment.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}
