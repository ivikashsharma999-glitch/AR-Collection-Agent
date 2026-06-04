import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CUSTOMER_IDS = {
  acme: '22222222-2222-4222-8222-222222222201',
  cloudbridge: '22222222-2222-4222-8222-222222222202',
  brightpixel: '22222222-2222-4222-8222-222222222203',
  northstar: '22222222-2222-4222-8222-222222222204',
  momentum: '22222222-2222-4222-8222-222222222205',
};
const INVOICE_IDS = {
  acmeEnterprise: '33333333-3333-4333-8333-333333333301',
  cloudbridgeAnnual: '33333333-3333-4333-8333-333333333302',
  brightpixelRetainer: '33333333-3333-4333-8333-333333333303',
  northstarServices: '33333333-3333-4333-8333-333333333304',
  momentumPlatform: '33333333-3333-4333-8333-333333333305',
  acmeExpansion: '33333333-3333-4333-8333-333333333306',
};
const CONVERSATION_IDS = {
  cloudbridge: '44444444-4444-4444-8444-444444444401',
  acme: '44444444-4444-4444-8444-444444444402',
  momentum: '44444444-4444-4444-8444-444444444403',
};
const REMINDER_IDS = {
  cloudbridge: '55555555-5555-4555-8555-555555555501',
  acme: '55555555-5555-4555-8555-555555555502',
  momentum: '55555555-5555-4555-8555-555555555503',
};
const APPROVAL_IDS = {
  cloudbridge: '66666666-6666-4666-8666-666666666601',
  acme: '66666666-6666-4666-8666-666666666602',
  momentum: '66666666-6666-4666-8666-666666666603',
};

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const orgId = user.id;

    const { data: bootstrapOrgId, error: bootstrapError } = await supabase.rpc(
      'bootstrap_demo_workspace',
      {
        profile_email: user.email,
        profile_name: user.user_metadata?.full_name || 'Finance Demo User',
      }
    );

    if (bootstrapError) {
      return NextResponse.json(
        {
          error: 'Unable to bootstrap demo workspace. Run the latest bootstrap SQL in Supabase.',
          details: bootstrapError.message,
        },
        { status: 500 }
      );
    }

    const seededOrgId = bootstrapOrgId || orgId;

    await upsertOrThrow(supabase, 'customers', buildCustomers(seededOrgId, now));
    await upsertOrThrow(supabase, 'invoices', buildInvoices(seededOrgId, now));
    await upsertOrThrow(supabase, 'conversations', buildConversations(seededOrgId, now));
    await upsertOrThrow(supabase, 'reminders', buildReminders(seededOrgId, now));
    await upsertOrThrow(supabase, 'approvals', buildApprovals(seededOrgId, now));
    await upsertOrThrow(supabase, 'promises', buildPromises(seededOrgId, now));
    await upsertOrThrow(supabase, 'disputes', buildDisputes(seededOrgId, now));
    await upsertOrThrow(supabase, 'action_history', buildActionHistory(seededOrgId, user.id, now));

    const diagnostics = await Promise.all([
      countRows(supabase, 'customers'),
      countRows(supabase, 'invoices'),
      countRows(supabase, 'reminders'),
      countRows(supabase, 'approvals'),
    ]);

    return NextResponse.json({
      success: true,
      orgId: seededOrgId,
      seededAt: now,
      records: {
        customers: Object.keys(CUSTOMER_IDS).length,
        invoices: Object.keys(INVOICE_IDS).length,
        approvals: Object.keys(APPROVAL_IDS).length,
      },
      diagnostics,
    });
  } catch (error) {
    console.error('Demo seed failed:', error);
    return NextResponse.json({ error: 'Demo seed failed', details: String(error) }, { status: 500 });
  }
}

async function upsertOrThrow(supabase: Awaited<ReturnType<typeof createClient>>, table: string, rows: unknown[]) {
  const { error } = await supabase.from(table).upsert(rows);

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function countRows(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true });

  return {
    table,
    count: count || 0,
    error: error?.message || null,
  };
}

function buildCustomers(orgId: string, now: string) {
  return [
    {
      id: CUSTOMER_IDS.acme,
      org_id: orgId,
      qb_customer_id: 'pilot-acme',
      name: 'Acme Corp',
      email: 'billing@acmecorp.example',
      secondary_emails: ['controller@acmecorp.example'],
      phone: '+1 415 555 0142',
      strategic_flag: true,
      renewal_date: '2026-08-15',
      internal_owner_name: 'Sarah Mitchell',
      notes: 'Enterprise renewal in Q3. Keep tone warm and relationship-aware.',
      created_at: now,
      updated_at: now,
    },
    {
      id: CUSTOMER_IDS.cloudbridge,
      org_id: orgId,
      qb_customer_id: 'pilot-cloudbridge',
      name: 'CloudBridge Inc',
      email: 'ar@cloudbridge.example',
      secondary_emails: ['cfo@cloudbridge.example'],
      phone: '+1 206 555 0234',
      strategic_flag: true,
      renewal_date: '2026-07-01',
      internal_owner_name: 'James Park',
      notes: 'High-value account with active SLA concern.',
      created_at: now,
      updated_at: now,
    },
    {
      id: CUSTOMER_IDS.brightpixel,
      org_id: orgId,
      qb_customer_id: 'pilot-brightpixel',
      name: 'Bright Pixel Media',
      email: 'finance@brightpixel.example',
      secondary_emails: ['ap@brightpixel.example'],
      phone: '+1 646 555 0188',
      strategic_flag: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: CUSTOMER_IDS.northstar,
      org_id: orgId,
      qb_customer_id: 'pilot-northstar',
      name: 'Northstar Analytics',
      email: 'payments@northstar.example',
      secondary_emails: [],
      phone: '+1 312 555 0176',
      strategic_flag: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: CUSTOMER_IDS.momentum,
      org_id: orgId,
      qb_customer_id: 'pilot-momentum',
      name: 'Momentum Labs',
      email: 'finance@momentumlabs.example',
      secondary_emails: ['ops@momentumlabs.example'],
      phone: '+1 512 555 0191',
      strategic_flag: false,
      notes: 'Chronic late payer. Good candidate for payment plan workflow.',
      created_at: now,
      updated_at: now,
    },
  ];
}

function buildInvoices(orgId: string, now: string) {
  return [
    invoice(orgId, INVOICE_IDS.cloudbridgeAnnual, CUSTOMER_IDS.cloudbridge, 'pilot-inv-001', 'INV-2026-0147', 42500, 42500, '2026-03-01', 'overdue', 96, now),
    invoice(orgId, INVOICE_IDS.acmeEnterprise, CUSTOMER_IDS.acme, 'pilot-inv-002', 'INV-2026-0152', 24800, 24800, '2026-03-20', 'overdue', 88, now),
    invoice(orgId, INVOICE_IDS.momentumPlatform, CUSTOMER_IDS.momentum, 'pilot-inv-003', 'INV-2026-0158', 18900, 18900, '2026-04-15', 'promised', 91, now),
    invoice(orgId, INVOICE_IDS.brightpixelRetainer, CUSTOMER_IDS.brightpixel, 'pilot-inv-004', 'INV-2026-0163', 14200, 14200, '2026-04-25', 'disputed', 78, now),
    invoice(orgId, INVOICE_IDS.northstarServices, CUSTOMER_IDS.northstar, 'pilot-inv-005', 'INV-2026-0189', 5600, 5600, '2026-05-12', 'overdue', 55, now),
    invoice(orgId, INVOICE_IDS.acmeExpansion, CUSTOMER_IDS.acme, 'pilot-inv-006', 'INV-2026-0199', 7600, 0, '2026-05-30', 'paid', 22, now),
  ];
}

function invoice(orgId: string, id: string, customerId: string, qbId: string, number: string, amount: number, due: number, dueDate: string, status: string, score: number, now: string) {
  return {
    id,
    org_id: orgId,
    customer_id: customerId,
    qb_invoice_id: qbId,
    invoice_number: number,
    amount,
    amount_due: due,
    due_date: dueDate,
    status,
    priority_score: score,
    last_synced_at: now,
    created_at: now,
    updated_at: now,
  };
}

function buildConversations(orgId: string, now: string) {
  return [
    conversation(orgId, CONVERSATION_IDS.cloudbridge, CUSTOMER_IDS.cloudbridge, [INVOICE_IDS.cloudbridgeAnnual], 'active', now),
    conversation(orgId, CONVERSATION_IDS.acme, CUSTOMER_IDS.acme, [INVOICE_IDS.acmeEnterprise], 'active', now),
    conversation(orgId, CONVERSATION_IDS.momentum, CUSTOMER_IDS.momentum, [INVOICE_IDS.momentumPlatform], 'active', now),
  ];
}

function conversation(orgId: string, id: string, customerId: string, invoiceIds: string[], status: string, now: string) {
  return {
    id,
    org_id: orgId,
    customer_id: customerId,
    invoice_ids: invoiceIds,
    channel: 'email',
    status,
    last_activity_at: now,
    created_at: now,
  };
}

function buildReminders(orgId: string, now: string) {
  return [
    reminder(orgId, REMINDER_IDS.cloudbridge, CONVERSATION_IDS.cloudbridge, CUSTOMER_IDS.cloudbridge, INVOICE_IDS.cloudbridgeAnnual, 'Action Required: Invoice INV-2026-0147', 'Hi James,\n\nI wanted to follow up on INV-2026-0147 for $42,500. I know there is an open SLA concern, so I can route this to our finance lead if helpful.\n\nCould you confirm whether the payment is blocked by the credit request or scheduled for release?', 'professional', 0.84, now),
    reminder(orgId, REMINDER_IDS.acme, CONVERSATION_IDS.acme, CUSTOMER_IDS.acme, INVOICE_IDS.acmeEnterprise, 'Friendly reminder: INV-2026-0152', 'Hi Sarah,\n\nQuick reminder that INV-2026-0152 for $24,800 is still open. Since Acme is close to renewal planning, I wanted to keep this low-friction and make sure AP has everything needed.\n\nWould you like me to resend the invoice packet?', 'soft', 0.93, now),
    reminder(orgId, REMINDER_IDS.momentum, CONVERSATION_IDS.momentum, CUSTOMER_IDS.momentum, INVOICE_IDS.momentumPlatform, 'Payment plan proposal for INV-2026-0158', 'Hello,\n\nThanks for the update on cash timing. We can propose a split payment plan for the $18,900 balance: $9,450 this Friday and $9,450 on June 15.\n\nPlease reply “I agree” and we will pause further reminders while the plan is active.', 'professional', 0.97, now),
  ];
}

function reminder(orgId: string, id: string, conversationId: string, customerId: string, invoiceId: string, subject: string, body: string, tone: string, confidence: number, now: string) {
  return {
    id,
    org_id: orgId,
    conversation_id: conversationId,
    customer_id: customerId,
    invoice_id: invoiceId,
    subject,
    body,
    tone,
    confidence_score: confidence,
    status: 'queued',
    drafted_at: now,
    queued_at: now,
  };
}

function buildApprovals(orgId: string, now: string) {
  return [
    approval(orgId, APPROVAL_IDS.cloudbridge, REMINDER_IDS.cloudbridge, 'open_dispute', 'high', now),
    approval(orgId, APPROVAL_IDS.acme, REMINDER_IDS.acme, 'strategic_account', 'high', now),
    approval(orgId, APPROVAL_IDS.momentum, REMINDER_IDS.momentum, 'payment_plan_requested', 'high', now),
  ];
}

function approval(orgId: string, id: string, reminderId: string, reason: string, priority: string, now: string) {
  return {
    id,
    org_id: orgId,
    reminder_id: reminderId,
    reason,
    priority,
    status: 'pending',
    queued_at: now,
  };
}

function buildPromises(orgId: string, now: string) {
  return [
    {
      id: '77777777-7777-4777-8777-777777777701',
      org_id: orgId,
      customer_id: CUSTOMER_IDS.momentum,
      invoice_id: INVOICE_IDS.momentumPlatform,
      promised_amount: 9450,
      promised_date: '2026-06-12',
      status: 'pending',
      captured_at: now,
    },
  ];
}

function buildDisputes(orgId: string, now: string) {
  return [
    {
      id: '88888888-8888-4888-8888-888888888801',
      org_id: orgId,
      customer_id: CUSTOMER_IDS.cloudbridge,
      invoice_id: INVOICE_IDS.cloudbridgeAnnual,
      reason_tag: 'DED-09: SLA Failure',
      description: 'Customer claims downtime credit must be resolved before the annual platform invoice can be released.',
      status: 'open',
      opened_at: now,
    },
  ];
}

function buildActionHistory(orgId: string, userId: string, now: string) {
  return [
    {
      id: '99999999-9999-4999-8999-999999999901',
      org_id: orgId,
      action_type: 'invoice_synced',
      actor_type: 'agent',
      actor_id: userId,
      details: { demo_seed: true, source: 'pilot_seed', invoices_synced: 6 },
      outcome: 'Pilot receivables synced from demo ledger.',
      created_at: now,
    },
    {
      id: '99999999-9999-4999-8999-999999999902',
      org_id: orgId,
      action_type: 'reminder_drafted',
      customer_id: CUSTOMER_IDS.momentum,
      invoice_id: INVOICE_IDS.momentumPlatform,
      conversation_id: CONVERSATION_IDS.momentum,
      actor_type: 'agent',
      actor_id: userId,
      details: { demo_seed: true, confidence_score: 0.97, workflow: 'payment_plan' },
      outcome: 'AI drafted payment plan for Momentum Labs.',
      created_at: now,
    },
  ];
}

