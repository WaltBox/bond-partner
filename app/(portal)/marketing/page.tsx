"use client";

import * as React from "react";
import { Download, Loader2, AlertCircle, X, ImagePlus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { usePartner } from "@/components/partner-context";
import { bondFetch, partnerPath, getAccessToken } from "@/lib/api/client";

// ─── Templates + per-template field schema ────────────────────────────────────

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
];

type FieldType = "text" | "html" | "photo";
interface FieldDef { key: string; label: string; type: FieldType }

const HEADLINE: FieldDef = { key: "headline_html", label: "Headline (HTML — use <br/> and <span> for color)", type: "html" };
const BODY:     FieldDef = { key: "body", label: "Body", type: "text" };
const FOOTER:   FieldDef = { key: "footer_tagline", label: "Footer tagline", type: "text" };

const STATEMENT_FIELDS = [HEADLINE, BODY, FOOTER];
const PHOTO_FIELDS = [HEADLINE, BODY, { key: "photo_url", label: "Photo", type: "photo" as const }];

const TEMPLATE_FIELDS: Record<string, FieldDef[]> = {
  "01-tacos-wifi":             STATEMENT_FIELDS,
  "03-dinner-bertas-internet": STATEMENT_FIELDS,
  "09-rent-is-tacos":          STATEMENT_FIELDS,
  "11-refund-and-fries":       STATEMENT_FIELDS,
  "02-brunch-internet": [
    HEADLINE,
    { key: "cashback_amount", label: "Cashback amount", type: "text" },
    { key: "receipt_label_1", label: "Receipt line 1",  type: "text" },
    { key: "receipt_label_2", label: "Receipt line 2",  type: "text" },
    { key: "receipt_status",  label: "Receipt status",  type: "text" },
  ],
  "04-math": [
    { key: "math_line_1",     label: "Math line 1", type: "text" },
    { key: "math_line_2",     label: "Math line 2", type: "text" },
    { key: "math_result_html", label: "Result (HTML)", type: "html" },
  ],
  "05-photo-caption": PHOTO_FIELDS,
  "06-split":         PHOTO_FIELDS,
  "07-fullbleed-scrim": PHOTO_FIELDS,
  "08-squad-meme":    PHOTO_FIELDS,
  "10-group-chat": [
    HEADLINE,
    { key: "chat_line_1", label: "Chat message 1", type: "text" },
    { key: "chat_line_2", label: "Chat message 2", type: "text" },
    { key: "chat_line_3", label: "Chat message 3", type: "text" },
  ],
};

const PERIWINKLE = "#7B8FE8";
const span = (s: string) => `<span style="color:${PERIWINKLE};">${s}</span>`;


// ─── Types ──────────────────────────────────────────────────────────────────

type Tokens = Record<string, string>;

interface Asset {
  template_id:   string;
  tokens:        Tokens;
  photo_url:     string | null;
  generated_url: string | null;
}

interface PromotionListing {
  id: string; name: string; description: string;
  active: boolean; review_status: "pending_review" | "approved" | "rejected" | null;
  planned_budget_cents: number;
  reward?: { kind: string; percent?: number | null; fixed_off_cents?: number | null } | null;
  reward_item_name?: string | null;
}

interface PromoContext { partnerName: string; promoTitle: string; budgetFmt: string; cashbackLabel: string; roiX: number | null }

function fmtWhole(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function formatCashback(p: PromotionListing): string {
  const r = p.reward;
  if (!r) return "Cash back";
  if (r.kind === "free_item")        return `Free ${p.reward_item_name ?? "item"}`;
  if (r.kind === "percent_off_item") return r.percent != null ? `${r.percent}% back` : "Cash back";
  if (r.kind === "fixed_off_item")   return r.fixed_off_cents != null ? `$${(r.fixed_off_cents / 100).toFixed(0)} back` : "Cash back";
  return "Cash back";
}

// Smart defaults so templates never render raw {{TOKEN}}.
function defaultsFor(id: string, ctx: PromoContext): Tokens {
  const { partnerName, promoTitle, budgetFmt } = ctx;
  const base: Tokens = { partner_name: partnerName, eyebrow: "Now on Bond" };
  switch (id) {
    case "01-tacos-wifi":
      return { ...base, headline_html: `Your food paid<br/>the ${span("Wi-Fi.")}`, body: "Order together, get cash back. Every time.", footer_tagline: "You can't bond alone." };
    case "03-dinner-bertas-internet":
      return { ...base, headline_html: `Dinner at ${partnerName}<br/>paid the ${span("internet.")}`, body: "Bring the group. Bond covers the cashback.", footer_tagline: "You can't bond alone." };
    case "09-rent-is-tacos":
      return { ...base, headline_html: `Rent is just<br/>a lot of ${span("good food.")}`, body: "Order together, get cash back. Every time.", footer_tagline: "You can't bond alone." };
    case "11-refund-and-fries":
      return { ...base, headline_html: `Your group order<br/>just paid you ${span("back.")}`, body: "That's how Bond works.", footer_tagline: "You can't bond alone." };
    case "02-brunch-internet":
      return { ...base, headline_html: partnerName, cashback_amount: ctx.cashbackLabel, receipt_label_1: promoTitle, receipt_label_2: "Bond cashback", receipt_status: "covered" };
    case "04-math":
      return { ...base, headline_html: `The math<br/>${span("checks out.")}`, math_line_1: `You put in ${budgetFmt}`, math_line_2: "Groups spend more, you keep the difference", math_result_html: `That's ${span(`${ctx.roiX ?? "real"}${ctx.roiX != null ? "X" : ""}`)} back` };
    case "05-photo-caption":
    case "06-split":
    case "07-fullbleed-scrim":
      return { ...base, headline_html: `Good food.<br/>Better ${span("together.")}`, body: "Order together, get cash back. Every time." };
    case "08-squad-meme":
      return { ...base, headline_html: `Good food.<br/>Better ${span("together.")}`, body: "Your squad rolling in to get hella cashback." };
    case "10-group-chat":
      return { ...base, headline_html: partnerName, chat_line_1: `anyone down for ${partnerName || "dinner"}?`, chat_line_2: "YES if we use Bond 👀", chat_line_3: "already activated the perk lol" };
    default:
      return base;
  }
}

// ─── Photo upload (multipart) ──────────────────────────────────────────────────

// Uploads a photo for a single marketing material WITHOUT touching the partner's
// logo. Hits the dedicated promo-image photo endpoint.
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

// ─── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({
  template, ctx, asset, onClose, onGenerated,
}: {
  template: Template;
  ctx: PromoContext;
  asset: Asset | undefined;
  onClose: () => void;
  onGenerated: (a: Asset) => void;
}) {
  const fields = TEMPLATE_FIELDS[template.id] ?? STATEMENT_FIELDS;
  const initial = React.useMemo(
    () => ({ ...defaultsFor(template.id, ctx), ...(asset?.tokens ?? {}) }),
    [template.id, ctx, asset]
  );
  const [tokens, setTokens] = React.useState<Tokens>(initial);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(asset?.photo_url ?? null);
  const [preview, setPreview] = React.useState<string | null>(asset?.generated_url ?? null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isPhotoTemplate = fields.some(f => f.type === "photo");

  function set(key: string, value: string) {
    setTokens(t => ({ ...t, [key]: value }));
  }

  async function handlePhoto(file: File) {
    setError(null);
    setUploading(true);
    try {
      setPhotoUrl(await uploadPhoto(file, template.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await bondFetch<{ url: string; template_id: string }>(
        partnerPath("/promo-images"),
        {
          method: "POST",
          body: JSON.stringify({
            template_id: template.id,
            ...tokens,
            ...(isPhotoTemplate && photoUrl ? { photo_url: photoUrl } : {}),
          }),
        }
      );
      setPreview(res.url);
      onGenerated({ template_id: template.id, tokens, photo_url: photoUrl, generated_url: res.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate. Try again.");
    } finally {
      setBusy(false);
    }
  }

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
              <p className="text-xs text-muted-foreground">Edit the copy, then generate.</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary">
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {fields.map(f =>
              f.type === "photo" ? (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{f.label} <span className="font-normal text-muted-foreground/70">(optional)</span></Label>
                  <div className="flex items-center gap-3">
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground/50"><ImagePlus className="size-5" /></div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                      {photoUrl ? "Replace photo" : "Upload photo"}
                    </Button>
                    <input
                      ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => { const file = e.target.files?.[0]; if (file) handlePhoto(file); e.target.value = ""; }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {template.id === "08-squad-meme" ? "Defaults to the squad meme until you upload your own." : "Defaults to your logo until you upload your own."}
                  </p>
                </div>
              ) : (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  {f.type === "html" ? (
                    <Textarea rows={2} value={tokens[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} className="font-mono text-xs" />
                  ) : (
                    <Input value={tokens[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} />
                  )}
                </div>
              )
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex items-center gap-2 border-t border-border/60 px-5 py-4">
            <Button className="flex-1 gap-1.5" onClick={generate} disabled={busy}>
              {busy ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><Sparkles className="size-4" /> Generate</>}
            </Button>
            <Button variant="outline" className="gap-1.5" disabled={!preview} onClick={() => preview && downloadImage(preview, `bond-${template.id}.png`)}>
              <Download className="size-4" /> Download
            </Button>
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
  const [ctx, setCtx] = React.useState<PromoContext>({ partnerName: "", promoTitle: "your promo", budgetFmt: "$500", cashbackLabel: "Cash back", roiX: null });
  const [ctxReady, setCtxReady] = React.useState(false);
  const [generating, setGenerating] = React.useState<Record<string, boolean>>({});
  const autoStarted = React.useRef(false);

  const isPhotoTemplate = (id: string) => (TEMPLATE_FIELDS[id] ?? []).some(f => f.type === "photo");

  const runGenerate = React.useCallback(async (id: string, tokens: Tokens, photoUrl: string | null, isPhoto: boolean) => {
    setGenerating(g => ({ ...g, [id]: true }));
    const post = () => bondFetch<{ url: string }>(partnerPath("/promo-images"), {
      method: "POST",
      body: JSON.stringify({ template_id: id, ...tokens, ...(isPhoto && photoUrl ? { photo_url: photoUrl } : {}) }),
    });
    try {
      let res;
      try {
        res = await post();
      } catch {
        await new Promise(r => setTimeout(r, 900)); // one retry — image renders can be flaky under load
        res = await post();
      }
      setAssets(prev => ({ ...prev, [id]: { template_id: id, tokens, photo_url: photoUrl, generated_url: res.url } }));
    } catch {
      /* leave the card un-generated; partner can retry from the modal */
    } finally {
      setGenerating(g => ({ ...g, [id]: false }));
    }
  }, []);

  // Seed instantly from the local cache so previews show without waiting on GET.
  React.useEffect(() => {
    if (!partner?.id) return;
    try {
      const raw = localStorage.getItem(`bond_promo_assets_${partner.id}`);
      if (raw) {
        const cached = JSON.parse(raw) as Record<string, Asset>;
        setAssets(prev => ({ ...cached, ...prev })); // server/live state wins over cache
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
    bondFetch<{ assets: Asset[] }>(partnerPath("/promo-images"))
      .then(r => {
        const map: Record<string, Asset> = {};
        for (const a of r.assets ?? []) map[a.template_id] = a;
        setAssets(prev => ({ ...prev, ...map }));
      })
      .catch(() => setError("Couldn't load your saved materials."))
      .finally(() => setLoading(false));
  }, []);

  // Build copy context from partner + active promo.
  React.useEffect(() => {
    if (!partner) return;
    setCtx(c => ({ ...c, partnerName: partner.name ?? c.partnerName }));
    bondFetch<{ promotions: PromotionListing[] }>(partnerPath("/promotions"))
      .then(r => {
        const promo = r.promotions.find(p => p.active) ?? r.promotions.find(p => p.review_status === "approved") ?? r.promotions[0];
        if (!promo) { setCtxReady(true); return; }

        setCtx(c => ({
          ...c,
          promoTitle: promo.name || c.promoTitle,
          budgetFmt: promo.planned_budget_cents ? fmtWhole(promo.planned_budget_cents) : c.budgetFmt,
          cashbackLabel: formatCashback(promo),
        }));

        // Pull real ROI for the math template from the funding projection.
        if (promo.planned_budget_cents) {
          bondFetch<{ projection: { profit_cents: number; investment_cents: number } | null }>(
            partnerPath("/billing/funding-projection"),
            { method: "POST", body: JSON.stringify({ amount_cents: promo.planned_budget_cents }) }
          )
            .then(p => {
              const proj = p.projection;
              if (proj && proj.investment_cents > 0) {
                setCtx(c => ({ ...c, roiX: Math.round(proj.profit_cents / proj.investment_cents) }));
              }
            })
            .catch(() => {})
            .finally(() => setCtxReady(true));
        } else {
          setCtxReady(true);
        }
      })
      .catch(() => setCtxReady(true));
  }, [partner]);

  // Auto-generate any template that has no saved preview yet (once content is ready).
  React.useEffect(() => {
    if (loading || !ctxReady || autoStarted.current) return;
    autoStarted.current = true;

    // Auto-generate everything. Photo templates send no photo_url unless the
    // partner saved one — the backend falls back to the logo (05/06/07) or the
    // meme (08) automatically. Limit concurrency so the renderer isn't
    // overwhelmed (firing all 11 at once makes some fail).
    const todo = TEMPLATES.filter(t => !assets[t.id]?.generated_url);
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const t = todo[i++];
        const photo = assets[t.id]?.photo_url ?? null;
        const tokens = { ...defaultsFor(t.id, ctx), ...(assets[t.id]?.tokens ?? {}) };
        await runGenerate(t.id, tokens, photo, isPhotoTemplate(t.id));
      }
    };
    Promise.all(Array.from({ length: 4 }, () => worker()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ctxReady]);

  const openTemplate = TEMPLATES.find(t => t.id === openId) ?? null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Marketing materials"
        description="Branded social posts for your venue. Tap a template to edit the copy, generate, and download."
      />

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
          ctx={ctx}
          asset={assets[openTemplate.id]}
          onClose={() => setOpenId(null)}
          onGenerated={a => setAssets(prev => ({ ...prev, [a.template_id]: a }))}
        />
      )}
    </div>
  );
}
