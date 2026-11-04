---
paths:
  - "src/lib/server/payment*.ts"
  - "src/lib/server/payfast*.ts"
  - "src/lib/server/hooks/**"
  - "src/lib/server/services/payment-processor.service.ts"
  - "src/lib/server/services/cleaner-earnings.service.ts"
  - "src/lib/utils/payout-calculator.ts"
  - "src/routes/api/payments/**"
  - "src/routes/api/subscriptions/**"
  - "src/routes/book/**"
---
# Payments, payouts, bookings

- PayFast ITN endpoint `/api/payments/ipn`: exempt from CSRF, accepts external requests. Also exempt: `/api/payments/success`, `/api/payments/cancel`, `/api/subscriptions/process-recurring`.
- Sandbox via `PAYFAST_SANDBOX_MODE`. Validation in `src/lib/server/payment.ts`; ITN logic in `src/lib/server/payfast-itn.ts`; post-payment hooks in `src/lib/server/hooks/post-payment-hooks.ts` (keep every side effect idempotent: ITNs arrive more than once).
- Payout split: platform commission is 15% of the net amount after PayFast fees. Use the actual fee from the ITN (`amount_fee` via `parseItnFee`); the per-method rates in `payout-calculator.ts` (editable in `/admin/pricing`) are only an estimate when it's missing.
- Cleaner earnings: `cleanerPayoutSummary` table; `payment-processor.service.ts`, `cleaner-earnings.service.ts`.
- Subscriptions: WEEKLY, BIWEEKLY, TWICE_WEEKLY, TWICE_MONTHLY, processed by `/api/subscriptions/process-recurring` (Netlify cron 02:00 UTC).
- Guest bookings: nullable `userId`/`addressId`; guest address stored as JSON in `guestAddress`.
- `docs/payment-processing.md` (Prisma, `VITE_PAYFAST_*`) is outdated; trust the code.
