"use client";

import * as React from "react";
import { Download, Loader2, AlertCircle, X, ImagePlus, Sparkles, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePartner } from "@/components/partner-context";
import { bondFetch, partnerPath, getAccessToken } from "@/lib/api/client";

// ─── Templates ────────────────────────────────────────────────────────────────
// Copy lives in the template .html files (single source of truth). The frontend
// only supplies partner_name, photo_url (photo templates), and colors.

interface Template { id: string; name: string }

const TEMPLATES: Template[] = [
  { id: "01-tacos-wifi",             name: "Editorial type" },
  { id: "02-brunch-internet",        name: "Receipt" },
  { id: "03-dinner-bertas-internet", name: "Dark + partner highlighted" },
  { id: "04-math",                   name: "The math" },
  { id: "05-photo-caption",          name: "Photo + caption bar" },
  { id: "06-split",                  name: "Split photo / text" },
  { id: "07-fullbleed-scrim",        name: "Full-bleed scrim" },
  { id: "08-squad-meme",             name: "Squad meme" },
  { id: "09-rent-is-tacos",          name: "Cream type" },
  { id: "10-group-chat",             name: "Group chat" },
  { id: "11-refund-and-fries",       name: "Yellow statement" },
  { id: "12-now-on-bond",            name: "Brand flex" },
  { id: "13-now-on-bond-cobrand",    name: "Co-branded" },
  { id: "14-sticker-badge",          name: "Sticker badge" },
  { id: "15-equal-lockup",           name: "Equal lockup" },
  { id: "16-now-available-band",     name: "Now available band" },
];

// Per-template image inputs. Each entry's `key` is the exact request field the
// backend expects; `hint` explains the fallback. Templates not listed take no
// image input (name/colors only).
interface ImageInput { key: string; label: string; hint: string }

const IMAGE_INPUTS: Record<string, ImageInput[]> = {
  "05-photo-caption":       [{ key: "photo_url", label: "Photo", hint: "Defaults to your logo until you upload your own." }],
  "06-split":               [{ key: "photo_url", label: "Photo", hint: "Defaults to your logo until you upload your own." }],
  "07-fullbleed-scrim":     [{ key: "photo_url", label: "Photo", hint: "Defaults to your logo until you upload your own." }],
  "08-squad-meme":          [{ key: "photo_url", label: "Photo", hint: "Defaults to the squad meme until you upload your own." }],
  "13-now-on-bond-cobrand": [{ key: "partner_logo_url", label: "Your logo", hint: "Defaults to your saved logo." }],
  "16-now-available-band":  [
    { key: "photo_url_top",    label: "Top dish photo",    hint: "Falls back to your logo — upload a real dish photo." },
    { key: "photo_url_bottom", label: "Bottom dish photo", hint: "Falls back to your logo — upload a real dish photo." },
  ],
};

const imageInputsFor = (id: string) => IMAGE_INPUTS[id] ?? [];
const IMAGE_KEYS = ["photo_url", "partner_logo_url", "photo_url_top", "photo_url_bottom"];

// Templates with a partner-set food word baked into the design.
const FOOD_TYPE_TEMPLATES = new Set(["01-tacos-wifi", "05-photo-caption", "09-rent-is-tacos"]);
const hasFoodType = (id: string) => FOOD_TYPE_TEMPLATES.has(id);

// ─── Colors — per-template pickers mapped to palette keys ──────────────────────
// Bond palette: cream #EEE9DC · yellow #FFD84D · ink #1a1a1a · accent #7B8FE8 · offwhite #FFF9F0

interface ColorPicker { label: string; key: string; default: string }

const COLOR_PICKERS: Record<string, ColorPicker[]> = {
  "01-tacos-wifi": [
    { label: "Background", key: "cream",  default: "#EEE9DC" },
    { label: "Text",       key: "ink",    default: "#1a1a1a" },
    { label: "Accent",     key: "accent", default: "#7B8FE8" },
  ],
  "02-brunch-internet": [
    { label: "Background", key: "accent",   default: "#7B8FE8" }, // periwinkle bg → accent
    { label: "Text",       key: "offwhite", default: "#FFF9F0" },
  ],
  "03-dinner-bertas-internet": [
    { label: "Background", key: "ink",      default: "#1a1a1a" },
    { label: "Text",       key: "offwhite", default: "#FFF9F0" },
    { label: "Accent",     key: "accent",   default: "#7B8FE8" },
    { label: "Footer pop", key: "yellow",   default: "#FFD84D" },
  ],
  "05-photo-caption": [
    { label: "Text",        key: "ink",      default: "#1a1a1a" },
    { label: "Accent",      key: "accent",   default: "#7B8FE8" },
    { label: "Caption bar", key: "offwhite", default: "#FFF9F0" },
  ],
  "06-split": [
    { label: "Background", key: "cream",  default: "#EEE9DC" },
    { label: "Text",       key: "ink",    default: "#1a1a1a" },
    { label: "Accent",     key: "accent", default: "#7B8FE8" },
  ],
  "07-fullbleed-scrim": [
    { label: "Text",   key: "offwhite", default: "#FFF9F0" },
    { label: "Accent", key: "accent",   default: "#7B8FE8" },
  ],
  "08-squad-meme": [
    { label: "Accent", key: "accent", default: "#7B8FE8" },
  ],
  "09-rent-is-tacos": [
    { label: "Background", key: "cream",  default: "#EEE9DC" },
    { label: "Text",       key: "ink",    default: "#1a1a1a" },
    { label: "Accent",     key: "accent", default: "#7B8FE8" },
  ],
  "10-group-chat": [
    { label: "Background",    key: "ink",      default: "#1a1a1a" },
    { label: "Text",          key: "offwhite", default: "#FFF9F0" },
    { label: "Accent",        key: "accent",   default: "#7B8FE8" }, // highlighted bubble
    { label: "Yellow bubble", key: "yellow",   default: "#FFD84D" },
  ],
  "11-refund-and-fries": [
    { label: "Background", key: "yellow", default: "#FFD84D" },
    { label: "Text",       key: "ink",    default: "#1a1a1a" },
    { label: "Accent",     key: "accent", default: "#7B8FE8" },
  ],
};

const DEFAULT_PICKERS: ColorPicker[] = [{ label: "Accent", key: "accent", default: "#7B8FE8" }];
const pickersFor = (id: string) => COLOR_PICKERS[id] ?? DEFAULT_PICKERS;
const defaultColors = (id: string): Record<string, string> =>
  Object.fromEntries(pickersFor(id).map(p => [p.key, p.default]));

// ─── Types ──────────────────────────────────────────────────────────────────

interface Asset {
  template_id:   string;
  images:        Record<string, string>; // image-input key → url (photo_url, partner_logo_url, …)
  food_type:     string;                 // partner-set food word (templates 01/05/09)
  generated_url: string | null;
  colors?:       Record<string, string> | null;
}

// Normalize a raw GET asset (image urls may arrive as flat keys; food_type lives
// inside tokens) into our shape.
function normalizeAsset(raw: Record<string, unknown>): Asset {
  const images: Record<string, string> = {};
  for (const k of IMAGE_KEYS) if (typeof raw[k] === "string") images[k] = raw[k] as string;
  if (raw.images && typeof raw.images === "object") Object.assign(images, raw.images);
  const tokens = (raw.tokens as Record<string, unknown> | undefined) ?? {};
  return {
    template_id:   String(raw.template_id),
    images,
    food_type:     typeof tokens.food_type === "string" ? tokens.food_type : (typeof raw.food_type === "string" ? raw.food_type : ""),
    generated_url: (raw.generated_url as string | null) ?? null,
    colors:        (raw.colors as Record<string, string> | null) ?? null,
  };
}

// ─── Photo upload + download helpers ───────────────────────────────────────────

async function uploadPhoto(file: File, templateId: string): Promise<string> {
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("photo", file);
  fd.append("template_id", templateId);
  const res = await fetch(`${BASE}/api${partnerPath("/promo-images/photo")}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { url: string }; url?: string; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? `Upload failed (${res.status})`);
  const url = json.data?.url ?? json.url;
  if (!url) throw new Error("Upload succeeded but no URL returned.");
  return url;
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(obj);
  } catch {
    window.open(url, "_blank");
  }
}

// ─── Image upload row ──────────────────────────────────────────────────────────

function ImageUploadRow({ input, url, uploading, onPick }: { input: ImageInput; url: string | null; uploading: boolean; onPick: (f: File) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{input.label} <span className="font-normal text-muted-foreground/70">(optional)</span></Label>
      <div className="flex items-center gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/50"><ImagePlus className="size-5" /></div>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={uploading} onClick={() => ref.current?.click()}>
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
          {url ? "Replace" : "Upload"}
        </Button>
        <input
          ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => { const file = e.target.files?.[0]; if (file) onPick(file); e.target.value = ""; }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">{input.hint}</p>
    </div>
  );
}

// ─── Edit modal — photo + colors only ──────────────────────────────────────────

function EditModal({
  template, partnerName, asset, onClose, onGenerated,
}: {
  template: Template;
  partnerName: string;
  asset: Asset | undefined;
  onClose: () => void;
  onGenerated: (a: Asset) => void;
}) {
  const imageInputs = imageInputsFor(template.id);
  const foodTemplate = hasFoodType(template.id);
  const [colors, setColors] = React.useState<Record<string, string>>({ ...defaultColors(template.id), ...(asset?.colors ?? {}) });
  const [images, setImages] = React.useState<Record<string, string>>(asset?.images ?? {});
  const [foodType, setFoodType] = React.useState<string>(asset?.food_type ?? "");
  const foodMissing = foodTemplate && !foodType.trim();
  const [preview, setPreview] = React.useState<string | null>(asset?.generated_url ?? null);
  const [busy, setBusy] = React.useState(false);
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handlePhoto(key: string, file: File) {
    setError(null);
    setUploadingKey(key);
    try {
      const url = await uploadPhoto(file, template.id);
      setImages(im => ({ ...im, [key]: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadingKey(null);
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await bondFetch<{ url: string; cached?: boolean }>(
        partnerPath("/promo-images"),
        {
          method: "POST",
          body: JSON.stringify({
            template_id: template.id,
            partner_name: partnerName,
            colors,
            ...images, // photo_url / partner_logo_url / photo_url_top / photo_url_bottom
            ...(foodTemplate ? { food_type: foodType.trim() } : {}),
          }),
        }
      );
      setPreview(res.url);
      setStatusMsg(res.cached ? "No changes — showing the saved version." : "Updated.");
      onGenerated({ template_id: template.id, images, food_type: foodType.trim(), generated_url: res.url, colors });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // Auto-apply color / food-type changes (debounced) so edits update + save the
  // preview without a separate step.
  const generateRef = React.useRef(generate);
  generateRef.current = generate;
  const firstAutoRun = React.useRef(true);
  React.useEffect(() => {
    if (firstAutoRun.current) { firstAutoRun.current = false; return; }
    const t = setTimeout(() => { if (!busy) generateRef.current(); }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, foodType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* Preview */}
        <div className="flex shrink-0 items-center justify-center bg-secondary/40 p-5 md:w-1/2">
          <div className="aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card">
            {busy ? (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" /><p className="text-xs">Generating…</p>
              </div>
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={template.name} className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground/50">
                <Sparkles className="size-7" /><p className="text-xs">Generate to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <p className="font-display text-base font-bold text-foreground">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {imageInputs.length ? "Swap the photo and colors, then generate." : "Adjust the colors, then generate."}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary">
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {/* Image inputs (1+ depending on template) */}
            {imageInputs.map(inp => (
              <ImageUploadRow
                key={inp.key}
                input={inp}
                url={images[inp.key] ?? null}
                uploading={uploadingKey === inp.key}
                onPick={file => handlePhoto(inp.key, file)}
              />
            ))}

            {/* Food type (templates 01 / 05 / 09) */}
            {foodTemplate && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Food type</Label>
                <Input
                  value={foodType}
                  onChange={e => setFoodType(e.target.value)}
                  placeholder="e.g. wings, tacos, pizza"
                />
                <p className={`text-[11px] ${foodMissing ? "text-amber-600" : "text-muted-foreground"}`}>
                  {foodMissing
                    ? "Add a food word — it appears in the headline. Required before you can download."
                    : "One short word or phrase. Casing is handled for you."}
                </p>
              </div>
            )}

            {/* Colors */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Colors</Label>
                <button
                  onClick={() => setColors(defaultColors(template.id))}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Reset to Bond defaults
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {pickersFor(template.id).map(p => {
                  const val = colors[p.key] ?? p.default;
                  return (
                    <div key={p.key} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val}
                        onChange={e => setColors(c => ({ ...c, [p.key]: e.target.value }))}
                        aria-label={p.label}
                        className="size-9 shrink-0 cursor-pointer rounded-lg border border-border bg-card p-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-foreground">{p.label}</p>
                        <Input
                          value={val}
                          onChange={e => setColors(c => ({ ...c, [p.key]: e.target.value }))}
                          className="h-7 w-full font-mono text-[11px] uppercase"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="secondary" size="sm" className="w-full gap-1.5" onClick={generate} disabled={busy}>
                {busy ? <><Loader2 className="size-3.5 animate-spin" /> Applying…</> : "Apply colors"}
              </Button>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-2 border-t border-border/60 px-5 py-4">
            {statusMsg && <p className="text-[11px] text-muted-foreground">{statusMsg}</p>}
            <div className="flex items-center gap-2">
              <Button className="flex-1 gap-1.5" onClick={generate} disabled={busy}>
                {busy ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><Sparkles className="size-4" /> Generate</>}
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={!preview || foodMissing}
                title={foodMissing ? "Add a food type first" : undefined}
                onClick={() => preview && downloadImage(preview, `bond-${template.id}.png`)}
              >
                <Download className="size-4" /> Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery card ─────────────────────────────────────────────────────────────

function TemplateCard({ template, asset, generating, onOpen }: { template: Template; asset: Asset | undefined; generating: boolean; onOpen: () => void }) {
  const url = asset?.generated_url ?? null;
  return (
    <Card className="overflow-hidden">
      <button onClick={onOpen} className="group block w-full text-left" aria-label={`Edit ${template.name}`}>
        <div className="relative aspect-square bg-secondary/40">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={template.name} className="size-full object-cover transition-transform group-hover:scale-[1.02]" />
          ) : generating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <p className="text-xs">Generating…</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/60">
              <Sparkles className="size-7" />
              <p className="text-xs font-medium">Tap to create</p>
            </div>
          )}
        </div>
        <CardContent className="flex items-center justify-between gap-2 p-4">
          <p className="text-sm font-semibold text-foreground">{template.name}</p>
          <span className="text-xs font-medium text-primary">{url ? "Edit" : "Create"} →</span>
        </CardContent>
      </button>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const { partner } = usePartner();
  const [assets, setAssets] = React.useState<Record<string, Asset>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState<Record<string, boolean>>({});
  const autoStarted = React.useRef(false);

  const partnerName = partner?.name ?? "";
  const anyGenerating = Object.values(generating).some(Boolean);

  const runGenerate = React.useCallback(async (id: string, name: string, images: Record<string, string>, colors?: Record<string, string> | null, foodType?: string) => {
    setGenerating(g => ({ ...g, [id]: true }));
    const post = () => bondFetch<{ url: string }>(partnerPath("/promo-images"), {
      method: "POST",
      body: JSON.stringify({
        template_id: id,
        partner_name: name,
        ...(colors ? { colors } : {}),
        ...(hasFoodType(id) && foodType ? { food_type: foodType } : {}),
        ...images,
      }),
    });
    try {
      let res;
      try {
        res = await post();
      } catch {
        await new Promise(r => setTimeout(r, 900)); // one retry — renders can be flaky under load
        res = await post();
      }
      setAssets(prev => ({ ...prev, [id]: { template_id: id, images, food_type: foodType ?? prev[id]?.food_type ?? "", generated_url: res.url, colors: colors ?? prev[id]?.colors ?? null } }));
    } catch {
      /* leave the card un-generated; partner can retry from the modal */
    } finally {
      setGenerating(g => ({ ...g, [id]: false }));
    }
  }, []);

  // Regenerate every template with its saved images + colors + food type (defaults otherwise).
  const regenAll = React.useCallback(() => {
    const todo = [...TEMPLATES];
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const t = todo[i++];
        const a = assets[t.id];
        await runGenerate(t.id, partnerName, a?.images ?? {}, a?.colors ?? undefined, a?.food_type || undefined);
      }
    };
    Promise.all(Array.from({ length: 4 }, () => worker()));
  }, [assets, partnerName, runGenerate]);

  // Seed instantly from the local cache so previews show without waiting on GET.
  React.useEffect(() => {
    if (!partner?.id) return;
    try {
      const raw = localStorage.getItem(`bond_promo_assets_${partner.id}`);
      if (raw) {
        const cached = JSON.parse(raw) as Record<string, Asset>;
        setAssets(prev => ({ ...cached, ...prev }));
      }
    } catch { /* ignore bad cache */ }
  }, [partner?.id]);

  // Persist the cache whenever assets change.
  React.useEffect(() => {
    if (!partner?.id || Object.keys(assets).length === 0) return;
    try {
      localStorage.setItem(`bond_promo_assets_${partner.id}`, JSON.stringify(assets));
    } catch { /* quota / private mode — fine */ }
  }, [assets, partner?.id]);

  // Restore saved assets from the server (source of truth, merged over cache).
  React.useEffect(() => {
    bondFetch<{ assets: Record<string, unknown>[] }>(partnerPath("/promo-images"))
      .then(r => {
        const map: Record<string, Asset> = {};
        for (const raw of r.assets ?? []) {
          const a = normalizeAsset(raw);
          map[a.template_id] = a;
        }
        setAssets(prev => ({ ...prev, ...map }));
      })
      .catch(() => setError("Couldn't load your saved materials."))
      .finally(() => setLoading(false));
  }, []);

  // Auto-generate any template that has no saved preview yet, once the partner
  // is loaded. Photo/colors fall back to the template defaults server-side.
  React.useEffect(() => {
    if (loading || !partner || autoStarted.current) return;
    autoStarted.current = true;

    const todo = TEMPLATES.filter(t => !assets[t.id]?.generated_url);
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const t = todo[i++];
        const a = assets[t.id];
        await runGenerate(t.id, partnerName, a?.images ?? {}, a?.colors ?? undefined, a?.food_type || undefined);
      }
    };
    Promise.all(Array.from({ length: 4 }, () => worker())); // capped concurrency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, partner]);

  const openTemplate = TEMPLATES.find(t => t.id === openId) ?? null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Marketing materials"
        description="Branded social posts for your venue. Tap a template to swap the photo or colors, generate, and download."
      >
        <Button variant="outline" size="sm" className="gap-1.5" onClick={regenAll} disabled={loading || anyGenerating}>
          <RefreshCw className={`size-4 ${anyGenerating ? "animate-spin" : ""}`} /> Regenerate all
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map(t => (
            <Card key={t.id} className="overflow-hidden">
              <div className="aspect-square animate-pulse bg-secondary/50" />
              <CardContent className="p-4"><div className="h-4 w-32 animate-pulse rounded bg-secondary" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2.5 text-sm text-muted-foreground">
              <AlertCircle className="size-4" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map(t => (
              <TemplateCard key={t.id} template={t} asset={assets[t.id]} generating={!!generating[t.id]} onOpen={() => setOpenId(t.id)} />
            ))}
          </div>
        </>
      )}

      {openTemplate && (
        <EditModal
          template={openTemplate}
          partnerName={partnerName}
          asset={assets[openTemplate.id]}
          onClose={() => setOpenId(null)}
          onGenerated={a => setAssets(prev => ({ ...prev, [a.template_id]: a }))}
        />
      )}
    </div>
  );
}
