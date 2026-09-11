# Pocketwise

Pocketwise is a cross-platform personal finance app designed for students. It
combines day-to-day expense tracking with budgets, recurring costs, savings
goals, shared expenses, and practical cash-flow guidance in one responsive
Expo application.

The project runs on iOS, Android, and the web from a shared React Native
codebase. Authenticated data is synchronized with Supabase, while local storage
keeps sessions and demo data available on the device.

## Highlights

- Expense and income tracking with editing, notes, categories, and monthly history
- Category budgets with live progress and over-budget indicators
- Recurring bills and subscriptions with renewals, trials, and annual cost insights
- Savings goals with templates, deadlines, recommended pace, and contribution history
- Shared-expense tracking and settlement status
- Money calendar, reports, financial-health guidance, and safe-to-spend estimates
- Responsive layouts for mobile and desktop web
- Guided onboarding, authenticated accounts, demo mode, JSON export, and account deletion

## Technical overview

| Area | Implementation |
| --- | --- |
| Client | Expo SDK 57, React 19, React Native 0.86 |
| Navigation | React Navigation 7 |
| Backend | Supabase Auth and PostgreSQL |
| Security | Row Level Security, per-user policies, restricted account-deletion RPC |
| Persistence | Supabase cloud sync and AsyncStorage local cache/demo data |
| Quality | ESLint, Jest, Expo Doctor, and production exports for web, iOS, and Android |

The application is organized by responsibility: reusable UI components live in
`src/components`, feature screens in `src/screens`, state and synchronization in
`src/context`, pure calculations in `src/utils`, and Supabase access in
`src/services` and `src/lib`.

## Local setup

Node.js 22.13 or newer is required. The included `.nvmrc` targets Node 22.21.0.

```powershell
npm install
Copy-Item .env.example .env.local
npm start
```

Set these public client values in `.env.local` before using authenticated cloud
features:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never place a database password or Supabase `service_role` key in the client or
repository.

### Run on a device

Install Expo Go, sign in to the same Expo account used by the CLI, and scan the
QR code shown by `npm start`. The phone and computer should normally be on the
same Wi-Fi network. If local discovery is blocked, use:

```powershell
npm run start:tunnel
```

## Database setup

The SQL files in `supabase/migrations` are the versioned production schema, not
sample data. They create the tables, constraints, indexes, signup trigger, Data
API grants, Row Level Security policies, and the self-service account-deletion
function used by the app.

Apply migrations in filename order through the Supabase CLI or SQL Editor. A
database that already has the initial schema only needs migrations that have not
previously been applied. More detail is available in
[`supabase/README.md`](supabase/README.md).

## Quality checks

```powershell
npm run lint
npm test
npx expo-doctor
npm run export
```

Run the complete local verification pipeline with:

```powershell
npm run check
```

The utility test suite covers date handling, calculations, coaching logic, and
subscription projections. Production export validates all three supported
targets: web, iOS, and Android.

## Privacy and current scope

Authenticated records are isolated by user ID through PostgreSQL Row Level
Security. Users can export their data and permanently delete their account.
There are no analytics or advertising integrations.

The Pro paywall is an interface preview only; purchases are intentionally
disabled until store products, receipt validation, entitlement handling,
restore purchases, legal documents, and production email delivery are
configured. The UI never reports a successful purchase without store-backed
verification.
