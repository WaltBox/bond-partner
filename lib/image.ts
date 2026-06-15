/**
 * Serve a resized/compressed version of a Supabase Storage public image instead
 * of the multi-MB original — the moment photos are ~3 MB each, which is why the
 * raw URLs take ages to paint. Supabase's image-transform endpoint returns a
 * cover-cropped, quality-compressed thumbnail (e.g. ~40 KB at 400px wide).
 *
 * Falls back to the original URL for anything that isn't a Supabase public
 * object (so it's a no-op for already-small or non-Supabase images).
 */
export function imageThumb(
  url: string | null | undefined,
  opts: { width: number; height?: number; quality?: number; resize?: "cover" | "contain" | "fill" }
): string {
  if (!url) return "";
  const marker = "/storage/v1/object/public/";
  if (!url.includes(marker)) return url;
  const transformed = url.replace(marker, "/storage/v1/render/image/public/");
  const p = new URLSearchParams({
    width: String(opts.width),
    quality: String(opts.quality ?? 72),
    resize: opts.resize ?? "cover",
  });
  if (opts.height) p.set("height", String(opts.height));
  return `${transformed}?${p.toString()}`;
}
