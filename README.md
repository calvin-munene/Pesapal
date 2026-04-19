# PayFlow — Pesapal Payments Dashboard

A modern, full-stack payments application built on the Pesapal API. Features a beautiful **iOS 26 "Liquid Glass"** UI with vibrant gradients, frosted glass surfaces, and fluid animations. Customers can initiate payments directly from the homepage with a single tap, while merchants get a clean transactions dashboard for tracking and reconciliation.

![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle-336791?logo=postgresql&logoColor=white)
![Pesapal](https://img.shields.io/badge/Pesapal-v3-blue)

---

## ✨ Features

- **One-tap payment options on the homepage** — M-Pesa, Card, Airtel Money, Bank
- **Pesapal v3 integration** — full OAuth, IPN webhooks, order submission, status polling
- **Real-time payment callback** — beautiful animated success / pending / failed states with auto-polling
- **Transactions dashboard** — filterable list, status badges, manual status refresh
- **Settings panel** — credential health check, environment indicator, IPN endpoint reference
- **Liquid Glass aesthetic** — frosted glass cards, vivid aurora gradients, floating navigation pill, gradient buttons with depth
- **Production-ready** — short M-Pesa-style merchant references, automatic IPN registration, type-safe end-to-end with Drizzle + Zod
- **Secure** — credentials live in environment variables only, never exposed to the browser

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Wouter, TanStack Query, React Hook Form, Zod, Tailwind CSS v4, Radix UI |
| Backend | Express 5, TypeScript, tsx |
| Database | PostgreSQL with Drizzle ORM |
| Payments | Pesapal API v3 (OAuth, SubmitOrderRequest, GetTransactionStatus, IPN) |
| Validation | Zod schemas shared between client and server |

---

## 📂 Project Structure

```
.
├── client/              # React frontend (Vite)
│   ├── index.html
│   └── src/
│       ├── components/  # Layout + shadcn-style UI primitives
│       ├── pages/       # Home, Transactions, Settings, PaymentCallback
│       ├── lib/         # Query client + utils
│       └── index.css    # Liquid Glass theme tokens
├── server/              # Express backend
│   ├── index.ts         # App entry
│   ├── routes.ts        # API routes (initiate, status, IPN, transactions)
│   ├── pesapal.ts       # Pesapal API client (OAuth, orders, status)
│   ├── storage.ts       # DB storage layer
│   └── db.ts            # Drizzle pool
├── shared/
│   └── schema.ts        # Drizzle schema + Zod insert schemas
├── script/
│   └── build.ts         # Production build script
├── package.json
└── drizzle.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (any provider — Neon, Supabase, Railway, local Postgres, etc.)
- A Pesapal merchant account ([sign up](https://www.pesapal.com))

### 1. Clone & install

```bash
git clone https://github.com/calvin-munene/Pesapal.git
cd Pesapal
npm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Then set:

| Variable | Description |
|----------|-------------|
| `PESAPAL_CONSUMER_KEY` | Pesapal consumer key from your merchant dashboard |
| `PESAPAL_CONSUMER_SECRET` | Pesapal consumer secret |
| `PESAPAL_ENV` | `sandbox` for testing, `production` for live payments |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | (Optional) server port — defaults to `5000` |

### 3. Push the database schema

```bash
npm run db:push
```

This creates the `transactions` table (and any other defined schema) in your database.

### 4. Run in development

```bash
npm run dev
```

Open `http://localhost:5000` — you'll see the homepage with payment options ready.

### 5. Build for production

```bash
npm run build
npm start
```

The built server runs from `dist/index.cjs` and serves the bundled client.

---

## 🔄 Payment Flow

1. **Customer chooses a method** (M-Pesa, Card, Airtel, Bank) on the homepage
2. **Fills in amount & details** — quick-amount chips for KES 100 / 500 / 1k / 2.5k / 5k
3. **Server submits the order** to Pesapal v3 (`SubmitOrderRequest`) and stores a transaction with a short M-Pesa-style reference (e.g. `NY8AALRLY5`)
4. **Customer is redirected** to the secure Pesapal checkout
5. **Pesapal sends an IPN** to `/api/pesapal/ipn` once the payment status changes
6. **Customer is redirected back** to `/payment/callback`, which polls the status endpoint and shows an animated success / pending / failure state
7. **Transactions dashboard** reflects the final status in real time

---

## 🔐 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/pesapal/test-credentials` | Validate Pesapal OAuth credentials |
| `POST` | `/api/pesapal/initiate` | Create order + return Pesapal checkout URL |
| `GET`  | `/api/pesapal/ipn` | Pesapal webhook — updates transaction status |
| `GET`  | `/api/pesapal/status/:orderTrackingId` | Poll Pesapal for current status |
| `GET`  | `/api/transactions` | List all transactions |
| `GET`  | `/api/transactions/:id` | Get a single transaction |

---

## 🎨 Design System

The "Liquid Glass" theme is implemented via custom Tailwind utilities in `client/src/index.css`:

- `.glass`, `.glass-strong`, `.glass-pill` — frosted glass surfaces with backdrop-blur and inner highlights
- `.liquid-input` — translucent inputs with focus glow
- `.liquid-button` — gradient buttons with depth shadows
- `.liquid-method` — selectable payment method cards with active ring
- `.text-gradient` — multi-stop gradient text
- `.floating`, `.pulse-ring`, `.shimmer` — fluid animations

Both light and dark modes are fully supported.

---

## 📝 Notes

- **Pesapal does not support direct STK push.** All M-Pesa payments must go through Pesapal's hosted checkout. To trigger STK push directly from your own UI, integrate Safaricom Daraja API instead.
- The IPN ID is registered lazily on first payment and cached in memory.
- Pesapal returns `payment_details_not_found` ("Pending Payment") before the user completes checkout — this is normalized to `PENDING` server-side.

---

## 📄 License

MIT — feel free to use this as a starting point for your own Pesapal integration or to resell as a SaaS template.

---

Built with care for African fintech. 🌍
