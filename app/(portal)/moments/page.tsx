"use client";

import * as React from "react";
import { Images, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MomentCard } from "@/components/moments/moment-card";
import { MomentLightbox } from "@/components/moments/moment-lightbox";
import { usePartner } from "@/components/partner-context";
import { getMoments, type Moment } from "@/lib/api";

const PAGE_SIZE = 24;

export default function MomentsPage() {
  const [moments, setMoments] = React.useState<Moment[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true); // initial load
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Moment | null>(null);
  const { partner } = usePartner();
  const sentinel = React.useRef<HTMLDivElement | null>(null);
  const busy = React.useRef(false);

  const load = React.useCallback(async (c: string | null) => {
    if (busy.current) return;
    busy.current = true;
    if (c) setLoadingMore(true);
    try {
      const res = await getMoments({ cursor: c, limit: PAGE_SIZE });
      setMoments((prev) => (c ? [...prev, ...res.moments] : res.moments));
      setCursor(res.next_cursor);
      if (!res.next_cursor) setDone(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load moments");
    } finally {
      busy.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  React.useEffect(() => {
    load(null);
  }, [load]);

  // Infinite scroll: fetch the next page when the sentinel nears the viewport.
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || done || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load(cursor);
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, done, loading, load]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Moments"
        description="Photos your diners posted at your spot — tap any to download or grab a ready-to-post share card."
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : error && moments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-7 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => load(null)}>
            Try again
          </Button>
        </div>
      ) : moments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Images className="size-6" />
          </span>
          <p className="text-sm font-medium text-foreground">No moments yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            When diners post photos from your restaurant, they&apos;ll show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {moments.map((m) => (
              <MomentCard key={m.id} moment={m} onOpen={() => setSelected(m)} />
            ))}
          </div>

          <div ref={sentinel} className="h-px" />

          {loadingMore ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : done ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : null}
        </>
      )}

      <MomentLightbox
        moment={selected}
        partnerName={partner?.name ?? null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
