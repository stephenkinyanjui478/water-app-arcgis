# WSP Water — Customer Self-Service Portal

A customer-facing web app (Calcite Design System + Next.js) where water customers
sign in to **pay bills via M-Pesa (STK Push)**, **track consumption trends**,
**report incidents**, and **verify field workers** before granting them access.

It is split into two Next.js (Pages Router) apps:

| App | Port | Role |
|-----|------|------|
| `customers-app/` | 3000 | Frontend — Calcite UI, SWR data fetching, Formik + Yup forms. No secrets. |
| `backend/` | 4000 | API — JWT auth, ArcGIS admin access, M-Pesa Daraja. **All secrets live here.** |

Data lives in ArcGIS Enterprise hosted feature layers/tables
(`https://development.esriea.com/portal`). The backend talks to them with an
admin token; the browser never does.

## Architecture

```
Browser ──(Bearer JWT)──▶  backend (:4000) ──(admin token)──▶  ArcGIS Enterprise
  Calcite UI                 /api/auth/*                        Water_Customers
  useSWR                     /api/meters/*                      Water_Invoices
  Formik + Yup               /api/payments/* (M-Pesa)           Water_Payments
                             /api/incidences, /api/support      Water_MeterReadings
                             /api/workers/verify                ServiceConnections
                                                                Water_FieldWorkers
                                         ▲                      Water_IncidenceTypes
                   Safaricom Daraja ─────┘ (STK push + callback) Water_CustomerAuth  ◀ PRIVATE
                                                                Water_MpesaTransactions ◀ PRIVATE
```

### Identity & data model
- A customer logs in with their **email** (the email already on their water
  account). Passwords are **bcrypt-hashed** and stored in the PRIVATE
  `Water_CustomerAuth` table — owner-only, never anonymously queryable.
- An **"account" is a meter.** A customer can own several. Ownership is derived by
  joining `Water_MeterReadings` (email↔meter) and
  `Water_Customers`→`ServiceConnections` (email↔name↔meter). Every per-meter route
  re-checks ownership server-side.
- **Paying a bill** settles specific unpaid `Water_Invoices`. On a confirmed STK
  payment the backend marks those invoices paid, inserts `Water_Payments` rows,
  and decrements the account balance + the meter's outstanding bill.
- **Field workers** are verified by a badge code (`FW-####`) on `Water_FieldWorkers`.

## 1. Provision the ArcGIS layers (once)

These scripts are idempotent and read the owner password from the environment
(never hard-code it). They live in the repo root `scripts/`.

```bash
# PowerShell: set for the session
$env:ESRIEA_PORTAL_PASSWORD = "<owner password>"

node scripts/create-customer-portal-layers.mjs   # Water_CustomerAuth + Water_MpesaTransactions (PRIVATE)
node scripts/add-worker-code.mjs                  # worker_code badge IDs on Water_FieldWorkers
node scripts/extend-incidences.mjs                # reporter_email / meter_no / channel on Water_Incidences
```

`create-customer-portal-layers.mjs` prints the two private-table URLs — put them
in `backend/.env.local` if they differ from the defaults.

## 2. Configure the backend

```bash
cd backend
cp .env.example .env.local      # then fill in the values
```

Required: `ARCGIS_PASSWORD` (or `ESRIEA_PORTAL_PASSWORD`), `JWT_SECRET`, and —
for payments — the five `MPESA_*` credentials plus a public
`MPESA_CALLBACK_URL`. In local dev, expose the callback with a tunnel
(e.g. `cloudflared`, `ngrok`) pointing at `http://localhost:4000/api/payments/callback`.
When the callback can't reach you, the frontend's status poll falls back to the
Daraja STK **query** API so payments still confirm.

```bash
npm run dev     # backend on http://localhost:4000
```

## 3. Configure & run the frontend

```bash
cd customers-app
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                     # frontend on http://localhost:3000
```

Open http://localhost:3000. Register with an email that already exists on a water
account (`Water_Customers` / `Water_MeterReadings`), then sign in.

## API surface (backend)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/register` | Set a password for a known customer email → JWT |
| POST | `/api/auth/login` | Email + password → JWT |
| GET | `/api/auth/me` | Current session profile |
| GET | `/api/meters` | The customer's meters + balances |
| GET | `/api/meters/[meterNo]/invoices` | Invoices (`?status=Unpaid,Partial`) |
| GET | `/api/meters/[meterNo]/payments` | Payment history |
| GET | `/api/meters/[meterNo]/consumption` | Consumption trend + summary |
| POST | `/api/payments/stk` | Initiate M-Pesa STK push for selected invoices |
| POST | `/api/payments/callback` | Daraja webhook (unauthenticated, idempotent) |
| GET | `/api/payments/status` | Poll a push's status (`?checkoutRequestId=…&query=1`) |
| GET/POST | `/api/incidences` | List / report incidents |
| GET | `/api/incidence-types` | Active incident types |
| GET | `/api/support` | Support contact details |
| GET | `/api/workers/verify` | Verify a field worker (`?code=FW-0007`) |

## Notes
- Calcite is loaded from the Esri CDN (`3.2.1`) in `_document.tsx`; the thin
  wrappers in `src/components/calcite/` bridge Calcite's custom events to
  Formik (React 19 doesn't auto-bind custom-element events).
- The two credential/transaction tables are **not** shared to everyone — keep it
  that way. Only the backend admin token reads them.
