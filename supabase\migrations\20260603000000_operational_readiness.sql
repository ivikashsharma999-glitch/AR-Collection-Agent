-- Operational readiness additions for pilot demos and live integration health.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS gmail_access_token TEXT,
  ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS gmail_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmail_last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmail_last_error TEXT,
  ADD COLUMN IF NOT EXISTS outlook_access_token TEXT,
  ADD COLUMN IF NOT EXISTS outlook_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS outlook_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outlook_last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outlook_last_error TEXT,
  ADD COLUMN IF NOT EXISTS qb_last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qb_last_error TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_last_error TEXT,
  ADD COLUMN IF NOT EXISTS twilio_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS twilio_last_error TEXT,
  ADD COLUMN IF NOT EXISTS demo_seeded_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Authenticated users can create organizations'
  ) THEN
    CREATE POLICY "Authenticated users can create organizations" ON public.organizations
      FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can create their own profile'
  ) THEN
    CREATE POLICY "Users can create their own profile" ON public.users
      FOR INSERT TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users (email);

-- Replace recursive user-table policies from the initial migration.
-- The original org-member policies call public.user_org_id(), which reads
-- public.users from inside public.users policies and can trigger recursion.
DROP POLICY IF EXISTS "Users can view users in their org" ON public.users;
DROP POLICY IF EXISTS "Users can manage users in their org" ON public.users;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Authenticated users can update their organization'
  ) THEN
    CREATE POLICY "Authenticated users can update their organization" ON public.organizations
      FOR UPDATE TO authenticated
      USING (id = public.user_org_id())
      WITH CHECK (id = public.user_org_id());
  END IF;
END;
$$;
