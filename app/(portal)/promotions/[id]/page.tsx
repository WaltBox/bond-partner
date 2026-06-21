"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Upload, X, CheckCircle2, Clock, XCircle, CircleDot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { bondFetch, partnerPath, getAccessToken } from "@/lib/api/client";
import { usePartner } from "@/components/partner-context";
import { PromoPhonePreview } from "@/components/promo-phone-preview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Promotion {
  id:                   string;
  name:                 string;
  description:          string | null;
  terms:                string | null;
  discount_description: string | null;
  comp_description:     string | null;
  image_url:            string | null;
  tags:                 string[];
  review_status:        "pending_review" | "approved" | "rejected" | null;
  rejection_reason:     string | null;
  active:               boolean;
  requirements:         unknown[];
  reward_kind:          string;
  builder_snapshot:     {
    form: { confirmation_message?: string; title_suggestion?: string; description_suggestion?: string };
    pricing: Record<string, unknown>;
    budget_cents: number;
  } | null;
}

interface PatchBody {
  name?:                 string;
  description?:          string;
  terms?:                string;
  discount_description?: string;
  comp_description?:     string;
  tags?:                 string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function bondUpload<T>(path: string, formData: FormData): Promise<T> {
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const token = getAccessToken();
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  const body = json as { data?: T; error?: string };
  if (!res.ok || body.error) throw new Error(body.error ?? `Upload failed (${res.status})`);
  return (body.data !== undefined ? body.data : body) as T;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ p }: { p: Promotion }) {
  if (p.review_status === "pending_review")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"><Clock className="size-3" />In review</span>;
  if (p.review_status === "rejected")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"><XCircle className="size-3" />Needs changes</span>;
  if (p.review_status === "approved" && !p.active)
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"><CircleDot className="size-3" />Approved</span>;
  if (p.active)
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"><CheckCircle2 className="size-3" />Live</span>;
  return null;
}

// ─── Image upload zone ────────────────────────────────────────────────────────

function ImageUpload({
  imageUrl,
  onUploaded,
  promotionPath,
}: {
  imageUrl:      string | null;
  onUploaded:    (url: string) => void;
  promotionPath: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError]         = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError("JPEG, PNG or WebP only."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max 5 MB."); return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await bondUpload<{ image_url: string }>(`${promotionPath}/image`, fd);
      onUploaded(res.image_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        className="relative cursor-pointer overflow-hidden rounded-xl border-[2px] border-dashed border-border transition-colors hover:border-[#1a1a1a]/40"
        style={{ minHeight: 160 }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Promotion" className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading
              ? <Loader2 className="size-6 animate-spin" />
              : <><Upload className="size-6" /><p className="text-xs font-medium">Click or drag to upload</p><p className="text-[11px]">JPEG · PNG · WebP · max 5 MB</p></>
            }
          </div>
        )}
        {imageUrl && uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
        )}
      </div>
      {imageUrl && (
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Replace photo
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ─── Tags input ───────────────────────────────────────────────────────────────

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = React.useState("");

  function add() {
    const t = draft.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium">
          {t}
          <button onClick={() => onChange(tags.filter(x => x !== t))} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder="Add tag…"
        className="h-7 min-w-[80px] rounded-full border border-dashed border-border bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-[#1a1a1a]/40"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromotionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { partner } = usePartner();

  const [promo, setPromo]     = React.useState<Promotion | null>(null);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [saving, setSaving]   = React.useState(false);
  const [saved, setSaved]     = React.useState(false);

  // Editable fields
  const [name, setName]                         = React.useState("");
  const [description, setDescription]           = React.useState("");
  const [terms, setTerms]                       = React.useState("");
  const [discountDescription, setDiscountDesc]  = React.useState("");
  const [tags, setTags]                         = React.useState<string[]>([]);
  const [imageUrl, setImageUrl]                 = React.useState<string | null>(null);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const promoPath    = partnerPath(`/promotions/${id}`);

  // Load
  React.useEffect(() => {
    bondFetch<{ promotion: Promotion }>(promoPath)
      .then(r => {
        const p = r.promotion;
        setPromo(p);
        setName(p.name ?? "");
        setDescription(p.description ?? "");
        setTerms(p.terms ?? "");
        setDiscountDesc(p.discount_description ?? "");
        setTags(p.tags ?? []);
        setImageUrl(p.image_url);
      })
      .catch(e => setPageError(e instanceof Error ? e.message : "Failed to load promotion."));
  }, [id]);

  // Auto-save
  function scheduleSave(patch: PatchBody) {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await bondFetch(promoPath, { method: "PATCH", body: JSON.stringify(patch) });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch { /* silent */ }
      finally { setSaving(false); }
    }, 800);
  }

  function updateName(v: string)   { setName(v);        scheduleSave({ name: v }); }
  function updateDesc(v: string)   { setDescription(v); scheduleSave({ description: v }); }
  function updateTerms(v: string)  { setTerms(v);       scheduleSave({ terms: v }); }
  function updateDiscount(v: string) { setDiscountDesc(v); scheduleSave({ discount_description: v }); }
  function updateTags(t: string[]) { setTags(t);        scheduleSave({ tags: t }); }

  if (pageError) return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-medium text-foreground">Couldn't load this promotion</p>
      <p className="text-sm text-muted-foreground">{pageError}</p>
      <Link href="/promotions" className="text-sm font-semibold underline underline-offset-2">Back to promotions</Link>
    </div>
  );

  if (!promo) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );

  const snapshot = promo.builder_snapshot?.form;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link href="/promotions" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" /> Back to promotions
        </Link>
        <div className="flex items-start justify-between gap-3">
          <PageHeader title={promo.name} description="Add your photos and details while we review." />
          <div className="pt-1 shrink-0"><StatusBadge p={promo} /></div>
        </div>
      </div>

      {/* Rejection notice */}
      {promo.review_status === "rejected" && promo.rejection_reason && (
        <div className="rounded-xl border border-red-200/60 bg-red-50 px-4 py-3 space-y-1.5">
          <p className="text-sm font-semibold text-red-700">Changes needed</p>
          <p className="text-sm text-red-700 leading-snug">{promo.rejection_reason}</p>
          <Link href="/promotions" className="text-xs font-semibold text-red-700 underline underline-offset-2">Go back to the builder to fix the economics →</Link>
        </div>
      )}

      {/* Approved-but-unfunded nudge */}
      {promo.review_status === "approved" && !promo.active && (
        <div className="rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C] px-4 py-3 shadow-[3px_3px_0_0_#1a1a1a]">
          <p className="text-sm font-black text-[#1a1a1a]">Approved — add funds to go live</p>
          <p className="text-xs text-[#1a1a1a]/70 mt-0.5">Your promotion is ready. Load your prepaid balance and it goes live immediately.</p>
          <Link href="/billing" className="mt-2 inline-block text-xs font-bold text-[#1a1a1a] underline underline-offset-2">Add funds in Billing →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left — editable fields */}
        <div className="space-y-6">

          {/* Economics summary (read-only) */}
          {snapshot && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">The promo you built</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {snapshot.confirmation_message ?? snapshot.description_suggestion ?? "Promotion details locked in from the builder."}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground/50">To change the economics, submit a new promotion from the builder.</p>
              </CardContent>
            </Card>
          )}

          {/* Merchandising fields */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your details</CardTitle>
                <span className={`text-[11px] font-medium transition-opacity ${saving || saved ? "opacity-100" : "opacity-0"}`}>
                  {saving ? <span className="text-muted-foreground">Saving…</span> : <span className="text-green-600">Saved</span>}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Headline</Label>
                <Input
                  value={name}
                  onChange={e => updateName(e.target.value)}
                  placeholder="Free Fries Fridays"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={e => updateDesc(e.target.value)}
                  placeholder="Order any burger and a drink — your table unlocks free shareable fries."
                  className="resize-none"
                />
                <p className="text-[11px] text-muted-foreground">Shown to users in the Bond app.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Short reward label</Label>
                <Input
                  value={discountDescription}
                  onChange={e => updateDiscount(e.target.value)}
                  placeholder="Free shareable fries"
                />
                <p className="text-[11px] text-muted-foreground">One line — what they actually get.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Terms & restrictions</Label>
                <Textarea
                  rows={2}
                  value={terms}
                  onChange={e => updateTerms(e.target.value)}
                  placeholder="Dine-in only. Valid Fri–Sun. One redemption per visit."
                  className="resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <TagsInput tags={tags} onChange={updateTags} />
                <p className="text-[11px] text-muted-foreground">Press Enter or comma to add.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — photo + live preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                imageUrl={imageUrl}
                onUploaded={url => setImageUrl(url)}
                promotionPath={promoPath}
              />
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Live preview</p>
            <p className="text-xs text-muted-foreground">This is what users see in the Bond app.</p>
            <div className="overflow-x-auto">
              <PromoPhonePreview
                headline={name}
                description={description}
                rewardLabel={discountDescription}
                terms={terms}
                photoUrl={imageUrl}
                partnerName={partner?.name ?? ""}
                category={partner?.category ?? undefined}
                logoUrl={partner?.logoUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
