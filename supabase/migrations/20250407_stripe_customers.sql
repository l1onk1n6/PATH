-- Stripe customers: maps Supabase user_id ↔ Stripe customer_id
CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text        NOT NULL UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Only service-role (edge functions) may read/write
-- No user-facing RLS policy intentionally
