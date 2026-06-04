-- ==========================================
-- AR Collections Agent — Initial Schema
-- ==========================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  qb_realm_id TEXT,              -- QuickBooks company ID
  qb_access_token TEXT,          -- Encrypted
  qb_refresh_token TEXT,         -- Encrypted
  gmail_connected BOOLEAN DEFAULT FALSE,
  outlook_connected BOOLEAN DEFAULT FALSE,
  send_from_email TEXT,
  reply_to_email TEXT,
  approval_threshold_amount NUMERIC DEFAULT 10000,
  max_touches_per_week INT DEFAULT 3,
  auto_send_confidence_threshold NUMERIC DEFAULT 0.90,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users within organizations
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member',    -- admin, member
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (synced from QuickBooks)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  qb_customer_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  secondary_emails TEXT[],
  phone TEXT,
  strategic_flag BOOLEAN DEFAULT FALSE,
  renewal_date DATE,
  internal_owner_id UUID REFERENCES users(id),
  internal_owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (synced from QuickBooks)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  qb_invoice_id TEXT,
  invoice_number TEXT,
  amount NUMERIC NOT NULL,
  amount_due NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  -- Note: days_overdue is calculated dynamically in the application layer 
  -- because CURRENT_DATE is not immutable in Postgres generated columns
  status TEXT DEFAULT 'overdue',  -- overdue, promised, disputed, paid, written_off
  priority_score NUMERIC DEFAULT 0,
  pay_now_link TEXT,
  stripe_payment_intent_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (email threads per customer/invoice group)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  invoice_ids UUID[] DEFAULT '{}',
  email_thread_id TEXT,          -- Gmail/Outlook thread ID
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active',  -- active, resolved, escalated, suppressed
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders (outbound messages)
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  conversation_id UUID REFERENCES conversations(id),
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  subject TEXT,
  body TEXT NOT NULL,
  tone TEXT DEFAULT 'professional', -- soft, professional, firm, escalation
  template_id TEXT,
  confidence_score NUMERIC,
  status TEXT DEFAULT 'draft',    -- draft, queued, approved, sent, recalled
  drafted_at TIMESTAMPTZ DEFAULT NOW(),
  queued_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recalled_at TIMESTAMPTZ,
  email_message_id TEXT           -- Gmail/Outlook message ID
);

-- Replies (inbound messages)
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  conversation_id UUID REFERENCES conversations(id),
  customer_id UUID REFERENCES customers(id),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  from_email TEXT,
  subject TEXT,
  raw_body TEXT,
  cleaned_body TEXT,              -- Sanitized for LLM
  classification TEXT,            -- promise_to_pay, dispute, already_paid, partial_pay, no_intent, unclear, opt_out
  intent_detail TEXT,
  confidence_score NUMERIC,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  email_message_id TEXT
);

-- Promises to Pay
CREATE TABLE promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  reply_id UUID REFERENCES replies(id),
  promised_amount NUMERIC,
  promised_date DATE,
  status TEXT DEFAULT 'pending',  -- pending, fulfilled, broken
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  broken_at TIMESTAMPTZ
);

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  reply_id UUID REFERENCES replies(id),
  reason_tag TEXT,                -- pricing_error, already_paid, service_issue, contract_dispute, wrong_contact, other
  description TEXT,
  status TEXT DEFAULT 'open',     -- open, investigating, resolved, escalated
  assigned_to UUID REFERENCES users(id),
  resolution_note TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Action History (append-only audit trail)
CREATE TABLE action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  action_type TEXT NOT NULL,      -- reminder_drafted, reminder_sent, reply_received, etc.
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  conversation_id UUID REFERENCES conversations(id),
  actor_type TEXT DEFAULT 'agent', -- agent, human
  actor_id UUID,
  details JSONB DEFAULT '{}',     -- Flexible payload
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Queue
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  reminder_id UUID REFERENCES reminders(id),
  reason TEXT NOT NULL,           -- high_amount, strategic_account, low_confidence, etc.
  priority TEXT DEFAULT 'normal', -- urgent, high, normal, low
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected, expired
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  override_note TEXT
);

-- Behavioral Profiles
CREATE TABLE behavioral_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id) UNIQUE,
  pay_pattern TEXT,               -- always_on_time, usually_late, chronic_late, unpredictable
  avg_days_late NUMERIC DEFAULT 0,
  total_invoices_paid INT DEFAULT 0,
  total_invoices_disputed INT DEFAULT 0,
  dispute_rate NUMERIC DEFAULT 0,
  response_channel_preference TEXT DEFAULT 'email',
  typical_response_day TEXT,      -- mon, tue, wed, etc.
  typical_response_time TEXT,     -- morning, afternoon, evening
  payment_cycle_day INT,          -- Day of month they typically pay
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Health Issues
CREATE TABLE data_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  issue_type TEXT NOT NULL,       -- missing_email, duplicate_invoice, etc.
  description TEXT,
  status TEXT DEFAULT 'open',     -- open, resolved, ignored
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Row Level Security (RLS) Setup
-- ==========================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_issues ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION public.user_org_id() 
RETURNS UUID 
LANGUAGE sql 
STABLE 
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid();
$$;

-- Generic RLS Policy Template ( applied to most tables )
-- Restricts read/write access to records where org_id matches the user's org_id.

CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (id = public.user_org_id());

CREATE POLICY "Users can view users in their org" ON users
  FOR SELECT USING (org_id = public.user_org_id());

CREATE POLICY "Users can manage users in their org" ON users
  FOR ALL USING (org_id = public.user_org_id());

-- Appending generic tenant isolation policies for all core business tables
DO $$
DECLARE
  tables text[] := ARRAY[
    'customers', 'invoices', 'conversations', 'reminders', 
    'replies', 'promises', 'disputes', 'action_history', 
    'approvals', 'behavioral_profiles', 'data_issues'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format(
      'CREATE POLICY "Tenant isolation %I" ON %I FOR ALL USING (org_id = public.user_org_id());',
      t, t
    );
  END LOOP;
END;
$$;
