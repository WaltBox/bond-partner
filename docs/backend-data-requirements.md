# Bond Partner Portal — Backend Data Requirements

**Status:** Draft for backend review
**Owner:** Frontend (partner portal)
**Purpose:** Define every piece of data the partner portal displays so the backend can design the API. Grounded in the current UI build — what's **live** vs. **coming soon** is marked throughout.

---

## 0. TL;DR for the backend team

The portal shows a restaurant partner (e.g. "Rusty Taco") the value Bond drives them and what they owe. Four ideas drive everything:

| Term | Meaning | Formula |
|---|---|---|
| **Sales Driven** | Total $ Bond diners spent at this partner | sum of Bond-attributed visit totals |
| **Owed to Bond** | The partner's current **monthly bill** for paybacks | sum of payback values, **current billing month only** |
| **True / Real Cost** | What it actually cost the partner to deliver paybacks | sum of (partner's cost-to-make × paid-back qty) |
| **Kept / "Made from Bond"** | What the partner keeps | `Sales Driven − Owed − True Cost` |

Identity we rely on everywhere: **`Sales Driven = Kept + Owed (paid back) + True Cost`**.

The single most important backend dependency: **True Cost depends on a partner-entered "cost to make" per promo** (set in Settings). Without that input, True Cost can't be computed.

---

## 1. Conventions (apply to all endpoints)

- **Money:** integer **cents** everywhere (e.g. `1245000` = $12,450.00). No floats.
- **Timestamps:** ISO 8601 UTC; the UI formats to the partner's local tz.
- **Scoping:** every response is scoped to the authenticated **partner**. A partner has **multiple locations** — support an optional `locationId` filter and per-location breakdowns even though the top-level location switcher is hidden in the current UI (it will come back).
- **Privacy (hard requirement):** diner-level data is **aggregate counts only**. The partner must **never** receive diner names, emails, phone numbers, or any PII. Repeat/return detection happens server-side; only counts cross the wire.
- **Periods:** the dashboard filters **per metric**, not globally. Each filterable metric needs two windows: **`this_month`** and **`all_time`**. Either return both, or accept a `period` query param per metric request.

---

## 2. Dashboard — Headline metrics (LIVE)

The top of the dashboard shows three cards. Two are **time-filterable** (per-card Monthly / All-time toggle); one is **fixed** (always the current monthly bill).

### 2.1 Sales Driven — *filterable*
```
salesDrivenCents: int        // for the requested period (this_month | all_time)
deltaVsPrevMonth: float       // e.g. 0.12 = +12%; only meaningful for this_month
```

### 2.2 Owed to Bond — *fixed (current billing month only)*
This is a **bill**, not a running total. It does **not** scale to all-time. It also carries the cost breakdown:
```
owedToBondCents: int          // current billing month's payback total = the bill due
trueCostCents:   int          // partner's real cost to deliver those paybacks (COGS)
passThroughCents: int         // derived = owedToBondCents - trueCostCents
deltaVsPrevMonth: float        // change in the bill vs last month
```
> UI shows: **Owed $2,310 (Due this month)**, with **Real cost to you $480** and **Passes back to diners $1,830** beneath it.

### 2.3 Made from Bond (Kept) — *filterable*
```
keptCents: int                // = salesDriven - owed - trueCost, for the period
deltaVsPrevMonth: float
```

### 2.4 ROI (shown in the AI note)
```
roi: float                    // salesDrivenCents / owedToBondCents, e.g. 5.39
```

### 2.5 AI note (LIVE — currently templated on the client)
The "AI note" is plain-language copy derived from the numbers above (real cost vs. pass-through). **Decision needed:** generate this copy server-side, or keep templating it on the client from the metric fields? Frontend default = template on client unless backend wants to own the wording.

**What's mocked today that the backend must replace:**
- All-time figures are a frontend multiplier (`× 8.4`) — backend must return **real** all-time aggregates.
- `deltaVsPrevMonth` values are hardcoded — backend computes them.

---

## 3. Dashboard — "How a payback flows" (LIVE, static)

Educational dialog. **No backend data** — illustrative $15 → $5 → $10 example. Ignore.

---

## 4. Dashboard — Coming soon (PHASE 2, not blocking)

Placeholders today; will need data later:

### 4.1 Cost vs. Earnings — daily time series
```
series: [{ date: "2026-06-01", keptCents, paidBackCents, costCents }]
```
Each day must satisfy `kept + paidBack + cost = salesDriven` for that day.

### 4.2 Diner Insights — privacy-safe counts only
```
totalDiners: int
repeatRate: float            // 0..1
avgPartySize: float
avgTicketCents: int
newVsReturning: { new: int, returning: int }
```
> Counts only. No names, ever.

---

## 5. Tickets (LIVE)

A table of every Bond visit + a detail drawer.

### 5.1 List row
```
id: string                   // "tkt_1042"
timestamp: ISO8601           // UI shows "Jun 12, 2026 · 7:24 PM"
locationName: string
partySize: int               // displayed as "3 diners" — COUNT ONLY, no identities
promoName: string
status: "redeemed" | "pending_review" | "disputed" | "expired"
salesCents: int
owedCents: int
trueCostCents: int
keptCents: int
```

### 5.2 Detail drawer (per ticket)
```
...all list fields, plus:
party: { total: int, repeat: int, new: int }   // counts only
receiptImageUrl: string                          // scanned receipt
receiptTotalCents: int                           // printed pre-discount total
lineItems: [{
  qty: int,
  name: string,
  unitCents: int,
  totalCents: int,
  paidBack: boolean,        // did this line qualify for a payback?
  paidBackQty?: int         // how many units were paid back
}]
```
> Line items are **AI-parsed from the receipt** — backend owns the OCR/parse and the `paidBack` flagging.

### 5.3 Dispute action
`POST /tickets/{id}/dispute` — partner flags a ticket. Needs: accept submission, set status → `disputed`, (optionally) pause the owed amount, return confirmation. Body could carry an optional reason later; UI is confirm-only today.

---

## 6. Billing (LIVE)

Read-only statement. **No payment collection in this portal.**
```
period: string               // "June 2026"
totalOwedCents: int          // = Owed to Bond for that month
lines: [{ id, timestamp, promoName, owedCents }]
```
- Needs a **list of selectable periods** (months).
- **Export:** CSV + PDF buttons. Decide: client-generated (CSV is trivial client-side) vs. a backend `GET /billing/{period}/export?format=csv|pdf`. PDF probably wants backend.

---

## 7. Settings (LIVE)

### 7.1 Partner profile (read-only in UI)
```
name, primaryLocation, logoUrl, locations: string[]
```

### 7.2 Promotions — the COGS input that powers True Cost
```
promos: [{
  id, name,
  paybackCents: int,        // payback value Bond delivers
  costToMakeCents: int      // PARTNER-EDITABLE — their cost to make the comped item
}]
```
- `costToMakeCents` is **edited by the partner** → `PUT /promos/{id}` (or PATCH).
- This value is the input to **True Cost** across the dashboard, tickets, and billing. Changing it should recompute True Cost going forward.

---

## 8. Suggested endpoints (straw man)

| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard/metrics?period=this_month\|all_time` | §2 headline metrics |
| GET | `/dashboard/cost-vs-earnings?from&to` | §4.1 (Phase 2) |
| GET | `/dashboard/diner-insights?period` | §4.2 (Phase 2) |
| GET | `/tickets?period&location&status&cursor` | §5.1 paginated list |
| GET | `/tickets/{id}` | §5.2 detail |
| POST | `/tickets/{id}/dispute` | confirmation |
| GET | `/billing/periods` | selectable months |
| GET | `/billing/{period}` | §6 statement |
| GET | `/billing/{period}/export?format=csv\|pdf` | file |
| GET | `/settings/profile` | §7.1 |
| GET | `/settings/promos` | §7.2 |
| PUT | `/promos/{id}` | update `costToMakeCents` |

---

## 9. Cross-cutting dependencies

1. **Cost-to-make → True Cost.** Settings input feeds Dashboard + Tickets + Billing True Cost. Single source of truth needed.
2. **Attribution.** Backend must define what makes a visit "Bond-driven" (this drives Sales Driven, diner counts, everything). Frontend just renders the result.
3. **Billing cycle.** "Owed to Bond" = current billing month. Confirm the cycle boundary (calendar month? rolling?) and when it resets.
4. **Repeat detection.** Needed for `party.repeat/new` and insights `repeatRate` — done server-side, exposed as counts only.
5. **Multi-location.** Data should be queryable per location even though the switcher is currently hidden.

---

## 10. Open questions for backend

- [ ] Real all-time aggregates per metric (replacing the FE `×8.4` mock)?
- [ ] Who owns the AI-note copy — backend-generated or FE-templated from fields?
- [ ] Receipt OCR / line-item parsing + `paidBack` flagging — confirmed backend-owned?
- [ ] Dispute flow: what state transitions and SLAs? Does owed pause on dispute?
- [ ] PDF/CSV export — backend endpoint or client-side?
- [ ] Billing cycle definition + period list source.
- [ ] Pagination strategy for `/tickets` (cursor vs. page).
- [ ] Exact "Bond-driven visit" attribution rule.

---

*All field names are illustrative; match the FE mock shapes in `lib/data.ts` where useful. Money is always integer cents.*
