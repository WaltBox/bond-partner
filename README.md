# Bond · Partner Portal

A partner-facing analytics dashboard for **Bond**, a rewards platform where groups of
roommates ("cribs") visit partner restaurants and get cash paid back toward their
bills. This portal is where a partner business logs in to see the value Bond drives
and what they owe.

This is a **clickable mockup** — mock/hardcoded data only. No backend, no auth, no
fetch, no env vars. You're "logged in" as the partner **Rusty Taco**.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + hand-rolled shadcn/ui primitives
- Recharts for charts
- lucide-react for icons

## The money model

Four headline numbers, kept visually distinct everywhere they appear:

| Metric           | Meaning                                                        |
| ---------------- | ------------------------------------------------------------- |
| **Sales Driven** | Total $ Bond diners spent here.                               |
| **Owed to Bond** | Payback value Bond fronted diners on this partner's promos.   |
| **True Cost**    | What it actually cost the partner to deliver those paybacks.  |
| **Kept**         | Sales Driven − Owed − True Cost.                              |

Plus an **ROI** stat: "$X in sales for every $1 of paybacks."

## Screens

- **/** — Dashboard: four metric cards, highlight banner + ROI, sales-over-time area
  chart, visits-by-day bar chart, privacy-safe diner insights.
- **/tickets** — Table of every Bond visit; click a row for a detail drawer with the
  scanned-receipt placeholder, AI-parsed itemized ledger (paid-back rows highlighted),
  and a "Dispute this ticket" flow.
- **/billing** — Read-only statement with amount owed, line items, working CSV export
  (PDF stubbed).
- **/settings** — Partner profile + editable "Cost to make" per promo (the COGS input
  that powers True Cost).

## Data layer & API integration

The app is wired to a real backend contract through [`lib/api/`](lib/api):

- [`lib/api/types.ts`](lib/api/types.ts) — the live API response shapes.
- [`lib/api/client.ts`](lib/api/client.ts) — `fetch` wrapper: `{ data }` envelope
  unwrap, `{ error }` handling, `credentials: "include"`, `/api/partner/:id/...` paths.
- [`lib/api/mock.ts`](lib/api/mock.ts) — an in-memory backend returning the **same
  shapes** as live, so the app runs with no backend. It's stateful: editing
  cost-to-make in Settings flips True Cost / Kept between known and `null`, exactly
  like the real dependency.
- [`lib/api/index.ts`](lib/api/index.ts) — routes to mock or live; screens import only
  from here.

Money is integer **cents**, formatted only in [`lib/format.ts`](lib/format.ts). A
`null` money field means "not yet known" and renders as `—`.

### Going live

Copy [`.env.local.example`](.env.local.example) to `.env.local` and set:

```bash
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://your-backend      # blank = same-origin
NEXT_PUBLIC_PARTNER_ID=<partner-uuid>
```

With no env file the app runs on the mock, so `npm run dev` works out of the box. Live
calls are admin-gated on the Supabase session cookie, so they only succeed when served
from an origin that carries it. See [`docs/backend-data-requirements.md`](docs/backend-data-requirements.md).

> Legacy mock objects from the original spec still live in [`lib/data.ts`](lib/data.ts)
> (used by the still-stubbed Billing screen).
