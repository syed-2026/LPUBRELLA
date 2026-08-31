# LPU Umbrella — Staff & Admin Web Portal

A React + TypeScript + Vite web portal for **LPU Umbrella** staff and administrators.
Built against the actual backend implementation (Node.js/Express/Prisma/PostgreSQL) —
every endpoint used here is a real, inspected route from that backend, not an invented
or mocked contract. This portal does not include any student-facing screens; the
Android app remains the student experience.

---

## ⚠️ About the PRD

`LPU-Umbrella-Web-PRD.md` was referenced in the build instructions but was **not
included** in the actual upload — only the backend project zip came through. This
frontend was built directly from the detailed requirements in the build instructions
themselves (which specify the design system, feature list, roles, and the return
workflow in full) combined with a full inspection of the real backend. If you have the
actual PRD, compare it against this README's "What was implemented" section below and
flag any discrepancies — they were not intentional deviations, just an artifact of the
PRD not being available.

---

## Tech stack

React 18 · TypeScript (strict) · Vite · React Router 6 · TanStack Query 5 ·
Tailwind CSS · Axios · Recharts · Lucide React · `qrcode` (for rendering Return QR codes)

No other libraries were added.

---

## Project structure

```
src/
  api/            Centralized API client + one module per backend resource
  components/
    ui/           Button, Input/Select, Card, Modal, ConfirmDialog, Toast, states, etc.
    layout/       Sidebar, Header, MobileNav, PageHeader, nav item definitions
  hooks/          useAuth, useToast, useDebounce, useCountdown, TanStack Query hooks
  layouts/        AppLayout (sidebar + header + content shell)
  pages/
    auth/         LoginPage
    staff/        Dashboard, Inventory, Active Rentals, Return Umbrella, Damage, History
    admin/        Dashboard, Stations, Umbrellas, Rentals, Students, Staff, Payments,
                   Issues, Rebalancing, Pricing, Audit Logs
  routes/         ProtectedRoute, RoleRoute, RoleHomeRedirect
  types/          Domain types mirroring the backend's Prisma schema exactly
  utils/          money (paise formatting), date, status label/color mapping
  lib/            cn() classname helper
```

62 source files. No file contains the whole application — each page/concern is its own
module.

---

## Setup

### 1. Backend first

This portal is useless without a running backend. **Apply the small backend patch
described below** (or copy the patched files) before starting the backend — the Return
Umbrella workflow and Active Rentals search depend on it.

```bash
# in the backend project
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, etc.
npx prisma migrate dev
npx prisma generate
npm run seed            # optional: loads sample stations/staff/umbrellas
npm run dev              # runs on http://localhost:4000 by default
```

Make sure the backend's `CORS_ORIGIN` matches wherever this frontend runs
(defaults to `http://localhost:3000` on both sides — see `vite.config.ts`).

### 2. Frontend

```bash
npm install
cp .env.example .env
# edit .env if your backend isn't at http://localhost:4000/api/v1
npm run dev
```

Open `http://localhost:3000`.

### Build for production

```bash
npm run build     # runs `tsc -b && vite build`, outputs to dist/
npm run preview   # serve the production build locally
```

The build has been verified to complete with **zero TypeScript errors and zero
ESLint errors** (two harmless "fast refresh" warnings remain on `useAuth.tsx` and
`useToast.tsx`, which is expected and correct for files that export both a
Provider component and a hook from the same module).

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, including `/api/v1` | `http://localhost:4000/api/v1` |

No secrets are ever stored in frontend code or committed `.env` files.

---

## Backend changes that were required

Per the instruction to identify (and, if very small, make) backend changes required for
correct frontend integration, I made **two small, additive, backward-compatible**
changes to the backend. Nothing existing was rewritten, redesigned, or removed.

### 1. `GET /api/v1/staff/rentals/lookup?umbrellaCode=UMB-0001` (new)

**Why:** The PRD's Return workflow requires staff to search by **Umbrella ID** and have
the frontend resolve the corresponding active rental — never typing/searching the
internal rental UUID. But the existing backend had no endpoint that does this. Worse,
the existing `GET /staff/rentals` and `GET /staff/inventory` endpoints are scoped to
`originStationId` (the station a rental started from). Per the backend's own business
rules, a student can return an umbrella "at any participating station" — so a rental
that started at Station A and is being returned at Station B would be **invisible** to
Station B's staff under the old endpoints, making a same-station-only lookup unusable
for the documented workflow.

**What it does:** Given a human-friendly umbrella code, finds that umbrella's current
`ACTIVE`/`OVERDUE` rental — intentionally **not** scoped to the requesting staff
member's own station, so cross-station returns work. Returns `404
UMBRELLA_NOT_FOUND` or `404 NO_ACTIVE_RENTAL_FOR_UMBRELLA` when there's nothing to
return.

**Files touched:** `src/repositories/rentalRepository.js` (new query method),
`src/services/staffService.js` (new `lookupRentalByUmbrellaCode`), `src/controllers/
staffController.js` (new `lookupRentalByUmbrella`), `src/validators/
staffValidators.js` (new `umbrellaLookupQuerySchema`), `src/routes/staffRoutes.js`
(new route).

### 2. `GET /staff/rentals` extended with optional `status` and `search` params

**Why:** The PRD requires an "Active Rentals" view (ACTIVE/OVERDUE only) with search
prioritizing Umbrella ID, plus a separate "Rental History" view with filtering. The
existing endpoint returned *all* statuses with no filtering, which would have required
either fetching every page client-side (violating "avoid loading thousands of
records") or building a second near-duplicate endpoint.

**What it does:** Both new params are optional and additive — any existing caller that
omits them gets the exact same behavior as before. `status` accepts a comma-separated
list (e.g. `ACTIVE,OVERDUE`); `search` matches umbrella code, student name/LPU ID, or
exact rental ID.

**Files touched:** `src/services/staffService.js` (`recentRentals` signature
extended), `src/validators/staffValidators.js` (new `staffRentalsQuerySchema`),
`src/routes/staffRoutes.js` (validator swapped in).

All patched backend files were syntax-checked (`node --check`) and pass. These changes
are not included in this frontend zip's contents (the backend is a separate project) —
apply them to your backend copy using the diffs above, or ask me to hand you the full
patched files again.

---

## What was implemented

**Auth:** Login against the real `POST /auth/login`, token persistence, silent
refresh-on-401 via `POST /auth/refresh` (with request queuing so concurrent 401s only
trigger one refresh), logout via `POST /auth/logout`, session bootstrap via `GET
/auth/me`. Non-staff/admin accounts (e.g. a STUDENT logging in here by mistake) are
explicitly rejected client-side.

**Route protection:** `ProtectedRoute` gates all authenticated routes; `RoleRoute` gates
STAFF-only vs ADMIN-only route trees and redirects a logged-in user of the wrong role to
their own home. **This is a UX layer only** — every single request still goes through
the backend's own `authenticate`/`requireRole` middleware, which remains the actual
security boundary, exactly as instructed.

**Staff:**
- Dashboard — station info/status, live inventory counts, today's rentals/returns,
  overdue alerts, recent activity feed. Handles the "no station assigned" case as a
  distinct empty state, not a generic error.
- Inventory — station inventory, search by umbrella ID, status filter, detail view
  showing the current rental (via the new lookup endpoint) when an umbrella is rented.
- Active Rentals — search prioritizing Umbrella ID (also matches student name/LPU ID
  and exact rental ID), backed by the patched `status`/`search` query params.
- **Return Umbrella** — the full documented workflow: search by Umbrella ID → resolve
  rental via the new lookup endpoint → confirm details → generate Return QR via the
  real `POST /returns/token` → large QR + live expiry countdown → polls `GET
  /rentals/:id` every 2.5s for completion → success/expired/error states → cancel at
  any stage. The internal rental UUID is never shown or typed by staff.
- Damage Reporting — report damage (with severity) or mark missing, via the real
  `POST /staff/damage` and `POST /staff/missing`.
- Rental History — station-relevant history with status filter and search.

**Admin:**
- Dashboard — system-wide stats and two charts (rentals by status, umbrella fleet by
  status) via `GET /admin/analytics`.
- Stations — list, create, detail view (edit, live inventory breakdown, assigned staff,
  recent station activity).
- Umbrellas — global list, status filter, per-page search, create, status/condition
  editing (backend enforces valid state transitions; invalid ones surface as a clear
  error rather than crashing).
- Rentals — system-wide list with status filter and a detail modal.
- Students — directory with per-page search, detail page showing combined rental +
  payment history (payment status pulled from each rental's nested `payment` object,
  since the payments endpoint itself has no student filter — see limitations below).
- Staff — list, create account, edit (station assignment, activate/suspend/deactivate).
  Passwords are never displayed or returned by the backend, and this UI never asks for
  or shows one after creation.
- Payments — list with status filter, provider/amount/dates.
- Damage & Issues — list with status filter.
- Rebalancing — create and list rebalancing tasks (from/to station, count, optional
  staff assignment).
- Pricing — view all plans, create new plans, edit price/active flag.
- Audit Logs — list with action filter.

**Cross-cutting UX:** every API-driven page has loading, empty, and error states;
mutations show inline validation errors and disable submit buttons while pending;
successful actions show a toast; destructive-ish actions (status/state changes) surface
backend rejections (e.g. invalid state transitions) as readable messages, never raw
stack traces. Search inputs are debounced. Lists are paginated wherever the backend
paginates. The layout is responsive down to mobile (collapsible drawer nav) with laptop/
desktop as the primary target.

---

## What could not be implemented / known limitations

These are backend read-model gaps that don't block the core workflows but limit a few
secondary features. None required a backend change to *work around* — they're
documented here rather than patched, to keep the backend diff minimal as instructed.

- **No `GET /admin/users/:id`.** The backend only exposes a filtered *list* of users, no
  single-user-by-id read. The Student Detail and Staff Edit pages work around this by
  fetching a generously-paged list (`limit: 500` for students) and filtering
  client-side. This is fine for a single-campus deployment but wouldn't scale to a very
  large student body — a dedicated `GET /admin/users/:id` endpoint would be a
  worthwhile future backend addition.
- **`GET /admin/payments` has no `studentId` filter.** A dedicated "payment history for
  this student" list isn't directly fetchable. Worked around by showing each rental's
  nested `payment` object on the Student Detail page instead (rentals *do* support a
  `studentId` filter), which covers the same information without an extra endpoint.
- **`GET /admin/payments` doesn't include rental/student data.** The payments list
  therefore shows provider/amount/status/dates only — no student or umbrella column, as
  that data isn't in the API response and fetching it per-row would mean one API call
  per table row, which the instructions explicitly say to avoid.
- **`GET /admin/umbrellas` has no free-text search param** (only `status`/`stationId`
  filters). The Umbrellas page filters by umbrella code within the currently loaded
  page only; searching across the entire fleet would require either a backend search
  param or fetching the whole fleet client-side, which was avoided per the
  "don't load thousands of records" instruction.
- **Station detail's "assigned staff" and "station activity"** are derived by filtering
  the general staff list / general rentals list client-side (there's no
  `GET /stations/:id/staff` or `/stations/:id/activity` endpoint) — fine for the
  moderate list sizes involved, flagged here for transparency.

Nothing in the application uses mock, fake, or placeholder data. Every screen either
shows real data from the backend or an explicit empty/error state.

---

## Assumptions made

1. **"Umbrella ID"** in the PRD/instructions refers to the umbrella's `publicCode`
   (e.g. `UMB-0001`), matching the backend's own terminology and the format printed on
   the physical QR sticker.
2. Return QR **cancel** is a client-side-only action — there's no backend "invalidate
   token" endpoint, and none is needed: an abandoned token simply expires on its own
   short TTL (30s by default, per the backend's `RETURN_TOKEN_TTL_SECONDS`).
3. The Return QR countdown and success detection rely on **polling**
   (`GET /rentals/:id` every 2.5s) since the backend has no websocket/push channel.
   This is a deliberate, bounded amount of polling (only while the QR modal-equivalent
   is open) rather than continuous background polling.
4. Vite's dev server defaults to port `3000` specifically to match the backend's
   default `CORS_ORIGIN`. If you run the frontend on a different port, update the
   backend's `.env` to match.

---

## Known issues

- None currently blocking. `npm run build`, `npm run dev`, and `npx eslint .` all pass
  cleanly as of this writing.
- The chunk containing Recharts (~400KB / ~108KB gzipped) is the largest bundle piece;
  it's already split into its own chunk via `manualChunks` in `vite.config.ts` so it
  doesn't bloat the main bundle, and only loads on pages that actually render charts (a
  further improvement would be lazy-loading the Admin Dashboard route itself, which
  wasn't done here to keep routing simple, but is a reasonable follow-up).
