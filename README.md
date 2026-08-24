# LPU Umbrella — Backend (MVP)

Staff-assisted campus umbrella rental backend for Lovely Professional University.

Students rent umbrellas from staffed campus stations by scanning a permanent
umbrella QR code to rent, and staff generate a short-lived, single-use
**Return QR** for the student to scan when physically returning the umbrella.
There are no reservations, subscriptions, social features, RFID/IoT, or
autonomous lockers in this MVP — the architecture is simply structured so
those can be added later without a rewrite.

---

## 1. Tech stack

| Concern            | Choice                     |
|---------------------|----------------------------|
| Language / runtime  | Node.js (>=18) / JavaScript |
| Framework           | Express.js                 |
| Database            | PostgreSQL                 |
| ORM                 | Prisma                     |
| Auth                | JWT (access + refresh)     |
| Password hashing    | bcryptjs                   |
| Validation          | Zod                        |
| Security headers    | Helmet                     |
| CORS                | cors                       |
| Rate limiting       | express-rate-limit         |
| Dev reload          | Nodemon                    |
| Tests               | Jest + Supertest           |

---

## 2. Project structure

```
src/
  config/         env loader, Prisma client singleton
  controllers/    thin HTTP handlers
  routes/         versioned Express routers (/api/v1/...)
  middleware/     authenticate, authorize, validate, error handler, rate limiters
  services/       business logic (rental/umbrella state machines, payments, returns...)
  repositories/   Prisma data-access functions
  validators/     Zod schemas
  utils/          AppError, asyncHandler, jwt, secureToken, money, logger
  jobs/           overdue-rentals cron sweep
  app.js          Express app wiring
  server.js       process entrypoint, graceful shutdown
prisma/
  schema.prisma   full data model
  seed.js         realistic fake LPU seed data
tests/            Jest + Supertest integration tests
```

Controllers are intentionally thin; all business rules live in `services/`.
The two most safety-critical modules are:

- `src/services/rentalStateMachine.js` and `src/services/umbrellaStateMachine.js`
  — the **single source of truth** for every valid status transition. No
  controller or service is allowed to write a status directly; it must go
  through `assertTransition()`.
- `src/services/returnService.js` — implements the exact 14-step atomic
  return transaction from the spec inside one `prisma.$transaction`.

---

## 3. Setup instructions

### 3.1 Prerequisites
- Node.js 18+
- A running PostgreSQL instance (local, Docker, or hosted)

### 3.2 Install
```bash
npm install
```

### 3.3 Configure environment
```bash
cp .env.example .env
# then edit .env: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, etc.
```

Generate strong secrets, e.g.:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3.4 Database setup
```bash
npx prisma migrate dev --name init   # creates schema + migration history
npx prisma generate                   # generates the Prisma client
npm run seed                          # loads realistic fake LPU test data
```

> **Sandbox note:** this project was authored in a network-restricted
> sandbox that could not reach `binaries.prisma.sh` to download the Prisma
> query engine, so `prisma generate` / `migrate` could not be executed
> here. The schema has been carefully hand-reviewed for correctness, but
> run `npx prisma migrate dev` yourself on first setup to create the
> actual database schema and verify it end-to-end.

### 3.5 Run locally
```bash
npm run dev      # nodemon, auto-reload
# or
npm start        # plain node
```
Server boots on `http://localhost:4000` (or your configured `PORT`).
Health check: `GET /health`.

### 3.6 Run tests
Tests are **integration tests** against a real PostgreSQL test database
(several rules — e.g. "one active rental per umbrella", the atomic return
transaction — are meaningfully verified only against a real DB transaction,
not a mock). Point `DATABASE_URL` at a disposable test database before
running:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lpu_umbrella_test" npm test
```

`tests/setup.js` truncates all tables before every test, so tests are
independent and repeatable. Make sure this points at a **test** database,
never production.

---

## 4. Authentication

- `POST /api/v1/auth/register` — public, STUDENT accounts only.
- `POST /api/v1/auth/login` — returns `{ accessToken, refreshToken, user }`.
- `POST /api/v1/auth/refresh` — rotates refresh tokens (old one is revoked).
- `POST /api/v1/auth/logout` — revokes the given refresh token.
- `GET /api/v1/auth/me` — requires `Authorization: Bearer <accessToken>`.

Staff and Admin accounts are **not** self-registrable — they are
provisioned by an existing Admin via `POST /api/v1/admin/users`. This
keeps privileged-role creation auditable and admin-controlled.

Refresh tokens are stored server-side only as a SHA-256 hash (never the raw
value), so a database read alone can't be used to mint sessions, and logout
actually revokes access. The `authenticate` middleware re-loads the user
from the database — not just the JWT payload — on every request, so a
suspended account is rejected immediately rather than only at token expiry.

Authentication is deliberately kept behind a single `authService` module;
swapping in LPU SSO later means replacing the internals of `login`/`register`
without touching controllers, routes, or the JWT issuance/verification code.

---

## 5. Core flows

### 5.1 Rental (umbrella QR)
1. `POST /api/v1/umbrellas/validate { qrIdentifier }` — checks the umbrella
   exists, is `AVAILABLE`, and its station is `ACTIVE`. The client's belief
   about availability is never trusted.
2. `POST /api/v1/rentals { umbrellaId, pricingPlanId }` — creates a rental in
   `CREATED` status inside one transaction that re-checks every business
   rule (active student, one active rental per student, umbrella still
   available, valid pricing plan). The umbrella itself is **not** marked
   `RENTED` yet — only once payment is verified — so a student who
   abandons checkout doesn't lock the umbrella indefinitely (see §7 for
   the documented assumption here).

### 5.2 Payment
1. `POST /api/v1/payments/create-order { rentalId }` — server computes the
   amount from the rental's **snapshotted** price (never trusts a
   client-supplied amount) and creates a provider order.
2. `POST /api/v1/payments/verify { rentalId, providerOrderId, providerPaymentId, providerSignature }`
   — backend independently re-verifies the payment's signature with the
   provider before trusting anything the client reports.
3. `POST /api/v1/payments/webhook` — the provider's own webhook, verified
   via HMAC signature, **idempotent** by `providerOrderId`/payment status.
   Both the direct-verify path and the webhook path funnel into the same
   `activateRentalForVerifiedPayment` transaction, so whichever arrives
   first wins and the other is a safe no-op.

Payment amounts are stored and computed as **integer paise** everywhere;
see `src/utils/money.js`. Pricing is read from the database
(`PricingPlan`), never hardcoded in a controller, and each rental snapshots
`priceAtRentalPaise` / `durationMinutesAtRental` at creation time so later
admin price changes never retroactively alter historical rentals.

### 5.3 Return (staff Return QR)
1. Student physically hands the umbrella to staff at any participating
   station.
2. `POST /api/v1/returns/token { rentalId }` (STAFF) — generates a
   cryptographically random token (30s TTL by default,
   `RETURN_TOKEN_TTL_SECONDS`), single-use, bound to the rental, the
   student, the staff member, and the staff member's assigned station.
   Only a SHA-256 hash of the token is stored; the raw value is returned
   once, to be encoded into a temporary QR shown to the student.
3. `POST /api/v1/returns/confirm { token }` (STUDENT) — the student scans
   the Return QR. Everything (token validity, expiry, single-use, student
   match, rental returnability, staff authorization, staff-station match,
   station status) is validated inside **one Prisma transaction**, then
   rental → `COMPLETED`, umbrella → `AVAILABLE` at the return station, and
   the token is marked used — atomically. If any check fails, the whole
   transaction rolls back and nothing is half-applied.

Note per spec: the student does **not** scan the umbrella's own QR during
return — only the staff-generated Return QR.

---

## 6. State machines

### Rental
```
CREATED → PAYMENT_PENDING → ACTIVE → RETURN_PENDING → COMPLETED
CREATED → CANCELLED
PAYMENT_PENDING → CANCELLED
ACTIVE → OVERDUE → RETURN_PENDING → COMPLETED
ACTIVE → LOST
OVERDUE → LOST
```

### Umbrella
```
AVAILABLE → RENTED → AVAILABLE
AVAILABLE → MAINTENANCE → AVAILABLE
AVAILABLE → MISSING / RETIRED
RENTED → MAINTENANCE / MISSING / LOST
MISSING → AVAILABLE / LOST / RETIRED
LOST → RETIRED
```

Every transition anywhere in the codebase goes through
`rentalStateMachine.assertTransition()` / `umbrellaStateMachine.assertTransition()`,
which throw a `409 INVALID_*_TRANSITION` error on anything not explicitly
listed above.

---

## 7. Documented assumptions (per "if ambiguous, choose the safest
implementation and document it" instruction)

1. **Umbrella locking window.** The spec doesn't say exactly when an
   umbrella stops being `AVAILABLE` — at rental *creation* or at *payment
   verification*. We chose: the umbrella stays `AVAILABLE` (and rentable by
   someone else) until payment is verified, at which point it flips to
   `RENTED`. A second `CREATED`/unpaid rental attempt on the same umbrella
   is still blocked (rule: "an umbrella can have only ONE active rental"),
   so there's no double-booking risk — this just avoids an abandoned
   checkout permanently locking a physical umbrella that a staff member can
   see sitting right there at the station.
2. **"Staff belongs to the station where the return occurs."** We
   implemented this as: the Return QR's station is always the staff
   member's own `assignedStationId` at the time of generation, and
   `returns/confirm` re-verifies the staff member's *current* assignment
   still matches the token's station. A staff member can't generate a
   Return QR for a station they aren't assigned to.
3. **Late fees.** Explicitly deferred per spec ("do not automatically
   charge penalties yet"). `ACTIVE → OVERDUE` transition and a student
   notification are implemented; fee calculation is a clearly marked
   future extension point, not built.
4. **Payment provider.** Spec asked for "a payment gateway compatible with
   India/UPI" without naming one. We built a `PaymentProvider` interface
   (`src/services/payment/PaymentProvider.js`) with a Razorpay-compatible
   adapter (`RazorpayProvider.js`, supports UPI/cards/netbanking via
   Razorpay Orders API conventions) that falls back to a deterministic
   sandbox mock when no real credentials are configured, so the full
   payment flow is testable without a live merchant account. Swapping
   providers means writing a new adapter against the same interface.
5. **Umbrella QR content.** We assumed the physical QR simply encodes the
   umbrella's human-readable `publicCode` (e.g. `UMB-0001`) as
   `qrIdentifier`, matching the spec's example. If your printed QR payload
   differs (e.g. a signed token), only `umbrellaService.validateForRental`
   and the seed script need to change.
6. **Damage reports on umbrellas mid-rental.** Staff can file a damage
   report against an umbrella that is `RENTED` (e.g. inspecting on
   return before the return flow completes) as well as `AVAILABLE`
   umbrellas at their own station; we block filing against `AVAILABLE`
   umbrellas sitting at a *different* station, since staff shouldn't be
   able to action inventory they don't physically have.
7. **Rebalancing tasks.** Spec lists "create/review rebalancing tasks" as
   an Admin capability but doesn't detail the workflow. We implemented
   a simple admin-created task record (`from`/`to` station, umbrella
   count, optional staff assignment, status) as a manual coordination
   tool — no automated umbrella movement, since the MVP is staff-assisted.

---

## 8. Security

- `helmet` for secure headers, `cors` restricted to `CORS_ORIGIN`.
- Global + per-category rate limits (auth, umbrella QR scan, return QR,
  payments) — see `src/middleware/rateLimiters.js` and the `.env` knobs.
- Centralized error handler: no stack traces or raw DB errors leak to
  clients in production; Prisma errors are normalized to safe messages.
- `passwordHash` is stripped from every API response (see `authService`
  and `authenticate` middleware).
- The structured logger (`src/utils/logger.js`) redacts known-sensitive
  keys (passwords, tokens, secrets) before writing any log line.
- Return tokens and refresh tokens are stored **hashed** (SHA-256), never
  raw, generated via `crypto.randomBytes`.
- The payment webhook route is mounted with `express.raw()` **before**
  the global JSON body parser specifically so its HMAC signature can be
  verified against the exact bytes received — see the comment block in
  `src/app.js`.
- Request bodies are size-capped (`1mb`) globally to reduce DoS surface.

---

## 9. Example API requests

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "lpuId": "LPU2026001",
  "name": "Aarav Sharma",
  "email": "aarav@lpu.test",
  "password": "Test@1234"
}
```

### Validate umbrella QR
```http
POST /api/v1/umbrellas/validate
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "qrIdentifier": "UMB-0001" }
```

### Create rental
```http
POST /api/v1/rentals
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "umbrellaId": "<uuid>", "pricingPlanId": "<uuid>" }
```

### Staff generates Return QR
```http
POST /api/v1/returns/token
Authorization: Bearer <staffAccessToken>
Content-Type: application/json

{ "rentalId": "<uuid>" }
```
Response:
```json
{ "token": "<raw-one-time-token>", "expiresAt": "...", "expiresInSeconds": 30 }
```

### Student confirms return
```http
POST /api/v1/returns/confirm
Authorization: Bearer <studentAccessToken>
Content-Type: application/json

{ "token": "<raw-one-time-token>" }
```

See `src/routes/` for the full endpoint list; every route's required role
and validator is declared right there in the router definition.

---

## 10. Seed data

`npm run seed` creates:
- 1 admin (`admin@lpu.test`)
- 2 staff (`staff1@lpu.test`, `staff2@lpu.test`), each assigned to a station
- 10 students (`student1@lpu.test` … `student10@lpu.test`)
- 5 stations (Main Gate, Central Library, two hostel complexes, Food Court)
- 30 umbrellas (6 per station), all `AVAILABLE`
- 4 pricing plans: Quick (30 min / ₹10), Campus (2 hr / ₹20), Day (6 hr / ₹30), Home (24 hr / ₹40)

All seeded accounts share the password `Test@1234`. This is obviously fake
test data — replace before any real deployment.

---

## 11. Payment sandbox setup

By default (no real `PAYMENT_KEY`/`PAYMENT_SECRET` in `.env`), the
`RazorpayProvider` adapter runs in **sandbox/mock mode**: `createOrder`
returns a deterministic mock order id, and `verifyPayment` checks an HMAC
computed with a fixed mock secret (`mock_secret`) instead of calling out to
a real gateway — see `tests/payment.test.js` for exactly how to compute a
valid mock signature. This lets you exercise the entire rent → pay →
activate flow locally with zero external dependencies.

To go live with a real Razorpay account:
1. Create a Razorpay account and generate API keys.
2. Set `PAYMENT_KEY`, `PAYMENT_SECRET`, `PAYMENT_WEBHOOK_SECRET` in `.env`.
3. Implement the marked TODO in `RazorpayProvider.createOrder` using the
   official `razorpay` npm SDK (left unimplemented here since it requires
   live credentials and network access this environment doesn't have).
4. Point your Razorpay webhook at `POST /api/v1/payments/webhook`.

---

## 12. Known limitations / next steps

- `prisma generate`/`migrate` could not be executed in the authoring
  sandbox (no access to `binaries.prisma.sh`) — run them yourself on
  first setup.
- Live Razorpay network calls are stubbed with a clearly marked TODO;
  sandbox/mock mode is fully functional for local development and tests.
- Late-fee calculation, LPU SSO integration, and automated
  rebalancing/dispatch are intentionally out of scope for this MVP, per
  the spec, but the module boundaries (`authService`, `RebalancingTask`
  model, overdue-rentals job) are structured so they can be added later
  without restructuring the codebase.
#   L P U B R E L L A  
 