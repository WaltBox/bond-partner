/**
 * Export helpers for diner moments — so partners can repost the content to their
 * own social. Two outputs:
 *   - downloadMomentPhoto: the raw high-res photo.
 *   - downloadShareCard: a 1080×1350 (IG-portrait) branded graphic with the
 *     restaurant name, caption, and likes baked in — ready to post.
 */

import { imageThumb } from "./image";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Supabase serves ACAO:* so the canvas stays untainted
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > r) {
    sh = img.height;
    sw = sh * r;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / r;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) {
        line = "";
        break;
      }
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  // ellipsize the final line if we ran out of room
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth) {
      while (last.length && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download the raw high-res photo (good for reposting at full quality). */
export async function downloadMomentPhoto(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  triggerDownload(await res.blob(), filename);
}

const SANS = `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

/** Build + download a 1080×1350 branded share card for a moment. */
export async function downloadShareCard(opts: {
  imageUrl: string;
  caption: string | null;
  likeCount: number;
  partnerName: string | null;
  filename: string;
}) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const img = await loadImage(imageThumb(opts.imageUrl, { width: 1080, height: 1350, quality: 90 }));
  drawCover(ctx, img, 0, 0, W, H);

  // Bottom scrim for legibility
  const g = ctx.createLinearGradient(0, H * 0.42, 0, H);
  g.addColorStop(0, "rgba(12,12,18,0)");
  g.addColorStop(1, "rgba(12,12,18,0.9)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const pad = 72;

  // Restaurant pill (top-left) — the partner's brand on their content
  if (opts.partnerName) {
    ctx.font = `700 38px ${SANS}`;
    const tw = ctx.measureText(opts.partnerName).width;
    const pillW = tw + 64;
    const pillH = 72;
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    roundRect(ctx, pad, pad, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.partnerName, pad + 32, pad + pillH / 2 + 2);
  }

  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 12;

  // Bottom credit row: "♥ N" left, "made on Bond" right
  const baseY = H - pad;
  ctx.font = `700 40px ${SANS}`;
  ctx.fillStyle = "#FF6B95";
  ctx.fillText("♥", pad, baseY);
  const heartW = ctx.measureText("♥ ").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(opts.likeCount), pad + heartW, baseY);

  ctx.font = `700 34px ${SANS}`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const credit = "made on Bond";
  ctx.fillText(credit, W - pad - ctx.measureText(credit).width, baseY);

  // Caption above the credit row
  if (opts.caption?.trim()) {
    ctx.font = `600 56px ${SANS}`;
    ctx.fillStyle = "#ffffff";
    const lines = wrapLines(ctx, opts.caption.trim(), W - pad * 2, 3);
    const lineH = 70;
    let cy = baseY - 78 - (lines.length - 1) * lineH;
    for (const line of lines) {
      ctx.fillText(line, pad, cy);
      cy += lineH;
    }
  }

  ctx.shadowBlur = 0;

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
  if (!blob) throw new Error("Could not generate card");
  triggerDownload(blob, opts.filename);
}
