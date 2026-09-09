-- Backfill for PayFast payment 324512059 (maikezorkot@outlook.com, 31 Aug 2026).
--
-- The subscription webhook validated ITN signatures with the checkout-order
-- algorithm, so PayFast's notification was rejected: the customer paid R252.00
-- but the subscription stayed PENDING and no booking or payment record was
-- created. PayFast's ITN retries are exhausted, so this recovers the missed
-- first cycle by hand. Future cycles are handled by the fixed webhook.
--
-- Run in two passes against PRODUCTION:
--
--   1. Inspect:  psql "$PROD_DATABASE_URL" -f scripts/backfill-subscription-324512059.sql
--      (the DO block is a no-op until you set apply below; the SELECT shows
--       the subscription so you can confirm frequency and pick the date)
--
--   2. Set :'scheduled_date' and apply:
--      psql "$PROD_DATABASE_URL" \
--        -v scheduled_date="'2026-09-12 09:00:00'" \
--        -v apply=1 \
--        -f scripts/backfill-subscription-324512059.sql
--
-- scheduled_date is the first cleaning date to honour for the customer —
-- agree it with them; they have been waiting since 31 August.

\set ON_ERROR_STOP on

\echo '=== The customer and their pending subscription ==='
SELECT s.id            AS subscription_id,
       u.email,
       s.status,
       s.frequency,
       s.preferred_days,
       s.preferred_time_slot,
       s.final_price,
       s.start_date,
       s.created_at
FROM subscription s
JOIN "user" u ON u.id = s.user_id
WHERE lower(u.email) = 'maikezorkot@outlook.com'
ORDER BY s.created_at DESC;

\if :{?apply}
\echo '=== Applying backfill ==='
BEGIN;

WITH sub AS (
  SELECT s.*
  FROM subscription s
  JOIN "user" u ON u.id = s.user_id
  WHERE lower(u.email) = 'maikezorkot@outlook.com'
    AND s.status = 'PENDING'
  ORDER BY s.created_at DESC
  LIMIT 1
),
new_booking AS (
  INSERT INTO booking (id, user_id, address_id, service_id, cleaner_id,
                       tenant_id, subscription_id, status, scheduled_date,
                       duration, price, notes)
  SELECT md5(random()::text || clock_timestamp()::text),
         sub.user_id, sub.address_id, sub.service_id, sub.cleaner_id,
         (SELECT id FROM tenant WHERE is_platform_owner = true LIMIT 1),
         sub.id, 'CONFIRMED', :scheduled_date::timestamp,
         180, sub.final_price,
         'Recurring booking - ' || sub.frequency ||
         ' (backfilled: first ITN was rejected by the old signature check)'
  FROM sub
  RETURNING id, subscription_id
),
new_payment AS (
  INSERT INTO subscription_payment (id, subscription_id, booking_id, amount,
                                    status, payment_method, pay_fast_payment_id,
                                    pay_fast_reference, billing_period_start,
                                    billing_period_end, processed_at)
  SELECT md5(random()::text || clock_timestamp()::text),
         nb.subscription_id, nb.id, '252.00', 'COMPLETED', 'CREDIT_CARD',
         '324512059', '324512059',
         '2026-08-31'::timestamp,
         '2026-08-31'::timestamp + CASE sub.frequency
             WHEN 'WEEKLY'        THEN interval '7 days'
             WHEN 'BIWEEKLY'      THEN interval '14 days'
             WHEN 'TWICE_WEEKLY'  THEN interval '3 days'
             WHEN 'TWICE_MONTHLY' THEN interval '15 days'
         END,
         now()
  FROM new_booking nb JOIN sub ON sub.id = nb.subscription_id
  RETURNING subscription_id, billing_period_end
)
UPDATE subscription s
SET status = 'ACTIVE',
    -- pay_fast_token stays NULL: it only arrives in an ITN, and the fixed
    -- webhook now stores it off the next cycle's notification
    next_billing_date = np.billing_period_end,
    updated_at = now()
FROM new_payment np
WHERE s.id = np.subscription_id;

\echo '=== Result ==='
SELECT s.id, s.status, s.next_billing_date, b.id AS booking_id,
       b.scheduled_date, sp.amount, sp.pay_fast_payment_id
FROM subscription s
JOIN booking b ON b.subscription_id = s.id
JOIN subscription_payment sp ON sp.subscription_id = s.id
JOIN "user" u ON u.id = s.user_id
WHERE lower(u.email) = 'maikezorkot@outlook.com';

COMMIT;
\else
\echo '(inspect only — re-run with -v apply=1 -v scheduled_date=... to write)'
\endif
