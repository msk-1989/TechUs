# TechUs — QA Reporting System

Production-grade QA reporting platform for **Hidayah Connect & TeachUs**. Track 506+ test cases across 12 modules, manage testers, log bugs, and audit every action.

## Features

- **Authentication** — Secure email/password login via NextAuth.js (JWT sessions)
- **506 Pre-loaded Test Cases** — Across 12 modules including Refund Policy & Escrow, Parent Journey, Conditional & Edge Cases, Worked Scenarios E2E, Notifications Matrix
- **Tester Tracking** — Every test execution and bug is attributed to a specific tester
- **Bug Tracker** — Full lifecycle (Open → In Progress → Fixed → Verified), severity, priority, assignee
- **DECISION NEEDED Flags** — 5 refund-policy items pending founder confirmation (per Sec 11.12 of spec)
- **Spec References** — Every test case tagged with PDF section (e.g. "Sec 5.2", "Sec 11.4 / 11.12 #1")
- **Audit Log** — Every action (login, test exec, bug create/update) is logged with user + timestamp
- **In-app Notifications** — Bell icon with unread badge; notified on bug assignment
- **Milestones** — Track testing progress against project milestones
- **Test Run Sessions** — Group executions into named sessions
- **Reports & Exports** — CSV/JSON export of test cases, bugs, and full QA snapshots
- **Dashboard with KPIs** — Coverage, pass rate, decisions needed, open bugs, critical bugs
- **Module Reports** — Per-module coverage and pass rate breakdown
- **Multi-channel Notifications Matrix** — Email/SMS/WhatsApp/Push/Admin alerts (per Sec 12)

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: NextAuth.js v4 (Credentials provider, JWT sessions, bcrypt password hashing)
- **Charts**: Recharts
- **State**: Zustand (current tester) + TanStack Query patterns
- **Animations**: Framer Motion

## Demo Accounts

- **Admin**: `admin@techus.app` / `admin123`
- **Tester**: `priya.n@hidayah.test` / `tester123`
- **Tester**: `aarav.s@hidayah.test` / `tester123` (QA Lead)
- **Tester**: `imran.k@hidayah.test` / `tester123`
- **Tester**: `sarah.j@teachus.test` / `tester123`
- **Tester**: `bilal.a@teachus.test` / `tester123`

## Local Development

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Push database schema
bun run db:push

# Seed the database (506 test cases + 6 users)
bun run scripts/seed.ts

# Start dev server
bun run dev
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project on Vercel
3. Set environment variables:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `NEXTAUTH_SECRET` — Random 32+ character string
   - `NEXTAUTH_URL` — Your Vercel URL (e.g. `https://techus.vercel.app`)
4. Deploy

## Database Schema

12 Prisma models:
- **Auth**: User, Account, Session, VerificationToken (NextAuth)
- **QA Domain**: Module, TestSuite, TestCase, TestExecution, Bug, Tester
- **New**: TestRun (sessions), Milestone, AuditLog, Notification

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes (auth, test-cases, bugs, stats, etc.)
│   ├── page.tsx                # Main app (auth-gated SPA)
│   ├── layout.tsx              # Root layout with SessionProvider
│   └── globals.css             # Tailwind + theme
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth-gate.tsx           # Auth wrapper
│   ├── auth-modal.tsx          # Login/signup modal
│   └── providers.tsx           # NextAuth SessionProvider
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── db.ts                   # Prisma client
│   ├── audit.ts                # Audit log + notification helpers
│   ├── seed-data.ts           # 506 test cases
│   ├── testing-types.ts        # Shared TypeScript types
│   └── tester-store.ts         # Zustand store for current tester
└── scripts/
    └── seed.ts                 # Database seed script
```

## License

Private — Hidayah Technologies Private Limited
