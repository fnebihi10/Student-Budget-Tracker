# Pocketwise

Pocketwise is a polished, local-first student budgeting app built with Expo and React Native.

## What works

- Guided first-run setup and a ready-made demo mode
- Persistent on-device transactions, income, and notes
- Category budgets with live progress and over-budget states
- Monthly bills with paid/unpaid tracking
- Personal subscription tracker with popular services, custom memberships, renewal calendar, pause/resume, free trials, reminders, and monthly/yearly cost insights
- Savings goals with templates, deadlines, recommended pace, deposits, withdrawals, progress, and contribution history
- Student Money Hub with a unified money calendar, transparent financial-health coach, and shared-expense settlement tracking
- Expanded profile hub with financial snapshots, centered settings controls, non-destructive local sign-out, returning-profile access, JSON data export, and a dedicated privacy center
- Searchable and filterable transaction history
- Monthly cash-flow dashboard and safe-to-spend guidance
- Four-month reporting, category breakdowns, and useful nudges
- Currency, reminder, profile, and monthly-plan settings
- Professional Pro paywall preview with honest billing disclosure

## Run on an iPhone with Expo Go

1. Install **Expo Go** from the iOS App Store.
2. Make sure the laptop and iPhone are on the same Wi-Fi network.
3. In this project folder, run:

   ```powershell
   npm install
   npx expo start
   ```

4. Scan the QR code with the iPhone Camera app, then open it in Expo Go.
5. If local network discovery is blocked, run `npx expo start --tunnel` instead.

## Data and privacy

App data is currently stored locally with AsyncStorage. There is no account, cloud sync, analytics, or external database in this version. Deleting the app also deletes its local data.

## Subscription status

The paywall UI is implemented, but purchases are intentionally disabled. A production subscription requires:

1. Apple App Store Connect subscription products and agreements.
2. A RevenueCat project (or a custom StoreKit 2 backend).
3. Product identifiers, entitlement mapping, API keys, restore handling, and webhook verification.
4. A development build; real in-app purchases do not run inside standard Expo Go.
5. Final pricing, privacy policy, terms, renewal language, and App Store review.

Never present a successful purchase until the store receipt and entitlement have been verified.

## Useful commands

```powershell
npm start
npm run web
npx expo export --platform web
```
