"use client";

import * as React from "react";
import { Heart, ChevronLeft, ChevronRight, Download, ImageDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { imageThumb } from "@/lib/image";
import { downloadMomentPhoto, downloadShareCard } from "@/lib/share-card";
import type { Moment } from "@/lib/api";

/** Full view of a moment with carousel + export actions. Partners open this to
 *  grab the photo or a ready-to-post branded share card for their socials. */
export function MomentLightbox({
  moment,
  partnerName,
  onClose,
}: {
  moment: Moment | null;
  partnerName: string | null;
  onClose: () => void;
}) {
  const [i, setI] = React.useState(0);
  const [busy, setBusy] = React.useState<null | "photo" | "card">(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setI(0);
    setErr(null);
  }, [moment?.id]);

  if (!moment) return null;

  const photos = [...moment.photos].sort((a, b) => a.order - b.order);
  const n = photos.length;
  const idx = Math.min(i, Math.max(0, n - 1));
  const cur = photos[idx];
  const go = (delta: number) => setI((p) => (((p + delta) % n) + n) % n);

  async function run(kind: "photo" | "card") {
    if (busy) return;
    setBusy(kind);
    setErr(null);
    try {
      if (kind === "photo") {
        await downloadMomentPhoto(cur.url, `bond-moment-${moment!.id}-${idx + 1}.jpg`);
      } else {
        await downloadShareCard({
          imageUrl: cur.url,
          caption: moment!.caption,
          likeCount: moment!.likeCount,
          partnerName,
          filename: `bond-moment-${moment!.id}-card.jpg`,
        });
      }
    } catch {
      setErr("Export failed — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={!!moment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Diner moment</DialogTitle>

        <div className="relative aspect-[4/5] bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageThumb(cur.url, { width: 900, height: 1125 })}
            alt={moment.caption ?? "Diner moment"}
            className="size-full object-contain"
          />
          {n > 1 ? (
            <>
              <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                {idx + 1}/{n}
              </span>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Heart className="size-4 fill-[#FF4D6D] text-[#FF4D6D]" />
            <span className="tabular">{moment.likeCount}</span>
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {formatDate(moment.createdAt)}
            </span>
          </div>
          {moment.caption ? (
            <p className="text-sm leading-relaxed text-foreground">{moment.caption}</p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => run("photo")}
              disabled={busy !== null}
            >
              {busy === "photo" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Photo
            </Button>
            <Button className="flex-1" onClick={() => run("card")} disabled={busy !== null}>
              {busy === "card" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageDown className="size-4" />
              )}
              Share card
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            {err ?? "Repost it to your socials — your diners made it for you."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
