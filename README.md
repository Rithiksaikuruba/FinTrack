# FinTrack — Loan Collection App

A production-ready mobile-first web app for daily loan collection management. Built for small finance business owners to track 100-day loans and daily payments.

---

## Features

- 📊 **Dashboard** — Daily summary with cash/UPI breakdown, collection %
- 👥 **Customer Management** — Add, search, filter, and track loan customers  
- 💳 **Fast Payment Entry** — Record payments in under 3 seconds
- 📱 **Mobile-First UI** — Large buttons, bottom nav, touch-optimized
- 📄 **PDF Reports** — Download daily collection reports
- ⚠️ **Missed Payment Tracker** — See who hasn't paid today
- ✅ **Auto-completion** — Loans auto-complete when fully paid

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| PDF | jsPDF + jspdf-autotable |
| Dates | dayjs |

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- npm or pnpm
- A Supabase account (free tier works)

---

### 2. Clone & Install

```bash
git clone <your-repo>
cd loan-collection-app
npm install
```

---

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Give it a name, set a strong database password
3. Choose a region close to you
4. Wait for project to be ready (~2 min)

---

### 4. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Paste the entire content and click **Run**
4. You should see "Success" — tables and views are now created

---

### 5. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
- Go to Supabase Dashboard → Settings → API
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 6. Create Owner Account

1. In Supabase dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter your email and password
4. This will be your single owner login

---

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You'll be redirected to `/login` — sign in with the credentials you created.

---

## Project Structure

```
loan-collection-app/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Redirects to dashboard
│   ├── login/              # Login page
│   ├── dashboard/          # Main dashboard
│   ├── customers/          # Customer list + [id] detail
│   ├── add-customer/       # Add new customer form
│   └── payments/           # Payments & daily collection
├── components/
│   ├── layout/             # AppLayout, BottomNav, PageHeader, Providers
│   ├── dashboard/          # StatCard, MissedPayments
│   ├── customers/          # CustomerCard, AddCustomerForm
│   └── payments/           # PaymentForm, PaymentRow
├── hooks/
│   ├── useCustomers.ts     # Customer queries & mutations
│   └── usePayments.ts      # Payment queries & mutations
├── services/
│   ├── customers.ts        # Supabase customer API calls
│   ├── payments.ts         # Supabase payment API calls
│   └── pdfReport.ts        # PDF generation
├── lib/
│   ├── supabase.ts         # Supabase browser client
│   ├── supabase-server.ts  # Supabase server client
│   └── utils.ts            # Formatting & calculation helpers
├── types/
│   └── index.ts            # TypeScript types
├── middleware.ts            # Auth protection
└── supabase/
    └── schema.sql          # Database schema & views
```

---

## Key Workflows

### Recording a Payment (< 3 seconds)

1. Tap **Payments** tab → **Add** button
2. Type customer name/phone (2+ chars to search)
3. Tap customer → amount auto-fills with daily due
4. Choose Cash or UPI
5. Tap **Record Payment** ✓

### Adding a Customer

1. Tap **Add** tab or **Add Customer** button
2. Fill name, phone, loan amount, interest
3. Total & daily amounts calculate automatically
4. Submit → redirected to customer detail page

### Downloading Daily Report

1. Go to Dashboard or Payments page
2. Select date using date picker
3. Tap download (↓) button
4. PDF saves to your device

---

## Database Schema

### customers
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Customer name |
| phone | text | Mobile number |
| loan_amount | numeric | Principal loan |
| interest | numeric | Interest added |
| total_amount | numeric | loan + interest |
| daily_amount | numeric | total / duration |
| duration_days | integer | Default 100 |
| start_date | date | Loan start |
| status | text | active / completed |

### payments
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| customer_id | uuid | FK → customers |
| amount | numeric | Payment amount |
| method | text | cash / upi |
| date | date | Payment date |
| notes | text | Optional remarks |

### Views
- **customer_summary** — customers with paid/pending totals
- **daily_collection_summary** — per-date cash/UPI/total stats

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Build for Production

```bash
npm run build
npm start
```

---

## Customization

**Business Name in PDF:** Edit `services/pdfReport.ts` → change `businessName` default.

**Loan Duration:** Default is 100 days. Change `duration_days` default in `AddCustomerForm.tsx`.

**Currency:** Currently INR (₹). Change in `lib/utils.ts` → `formatCurrency`.

---

## Troubleshooting

**Login not working?**
- Check Supabase Auth → Users — make sure you created the user
- Verify env variables are set correctly

**Database errors?**
- Re-run `supabase/schema.sql` in SQL Editor
- Check RLS policies are enabled

**PDF not downloading?**
- Check browser allows downloads
- Try in a different browser

---

Built with ❤️ for small finance business owners
