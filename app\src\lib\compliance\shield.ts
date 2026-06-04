// ============================================
// Compliance Shield
// Gatekeeper that prevents illegal/aggressive collections behavior
// ============================================

export interface ComplianceCheckResult {
  allowed: boolean;
  blockedReason: string | null;
  blockedBy: 'curfew' | 'frequency_cap' | 'active_dispute' | 'suppressed' | 'strategic_hold' | null;
  details: string | null;
}

type SupabaseClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

interface ComplianceContext {
  customerId: string;
  orgId: string;
  // Optional overrides for testing
  nowOverride?: Date;
  supabaseOverride?: SupabaseClient;
}

// ── Main gatekeeper function ──

export async function canSendReminder(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
  const supabase = ctx.supabaseOverride || await getSupabaseClient();
  const now = ctx.nowOverride || new Date();

  // 1. Fetch org settings
  const { data: org } = await supabase
    .from('organizations')
    .select('timezone, max_touches_per_week')
    .eq('id', ctx.orgId)
    .single();

  if (!org) {
    return block('frequency_cap', 'Organization not found.');
  }

  // 2. Fetch customer details
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, strategic_flag, renewal_date')
    .eq('id', ctx.customerId)
    .eq('org_id', ctx.orgId)
    .single();

  if (!customer) {
    return block('frequency_cap', 'Customer not found.');
  }

  // ── CHECK 1: Curfew Bound ──
  // No emails before 8 AM or after 6 PM in the org's timezone
  const curfewResult = checkCurfew(now, org.timezone || 'America/New_York');
  if (!curfewResult.allowed) {
    return curfewResult;
  }

  // ── CHECK 2: Weekend Guard ──
  const weekendResult = checkWeekend(now, org.timezone || 'America/New_York');
  if (!weekendResult.allowed) {
    return weekendResult;
  }

  // ── CHECK 3: Frequency Cap ──
  const maxTouches = org.max_touches_per_week || 3;
  const frequencyResult = await checkFrequencyCap(supabase, ctx.orgId, ctx.customerId, maxTouches);
  if (!frequencyResult.allowed) {
    return frequencyResult;
  }

  // ── CHECK 4: Active Dispute ──
  const disputeResult = await checkActiveDispute(supabase, ctx.orgId, ctx.customerId);
  if (!disputeResult.allowed) {
    return disputeResult;
  }

  // ── CHECK 5: Suppressed Conversations ──
  const suppressResult = await checkSuppressed(supabase, ctx.orgId, ctx.customerId);
  if (!suppressResult.allowed) {
    return suppressResult;
  }

  // ── CHECK 6: Strategic Account + Renewal Hold ──
  const strategicResult = checkStrategicHold(customer, now);
  if (!strategicResult.allowed) {
    return strategicResult;
  }

  // All checks passed
  return {
    allowed: true,
    blockedReason: null,
    blockedBy: null,
    details: null,
  };
}

async function getSupabaseClient() {
  const { createClient } = await import('../supabase/server');
  return createClient();
}

// ── Individual Check Functions ──

function checkCurfew(now: Date, timezone: string): ComplianceCheckResult {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const hourStr = formatter.format(now);
    const hour = parseInt(hourStr, 10);

    // Block before 8 AM or after 6 PM
    if (hour < 8 || hour >= 18) {
      return block(
        'curfew',
        `Email blocked by curfew. Current time in ${timezone} is ${hour}:00. Allowed window: 8 AM – 6 PM.`
      );
    }
  } catch {
    // If timezone is invalid, allow but log warning
    console.warn(`Invalid timezone: ${timezone}. Skipping curfew check.`);
  }

  return allow();
}

function checkWeekend(now: Date, timezone: string): ComplianceCheckResult {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    });
    const dayOfWeek = formatter.format(now);

    if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
      return block(
        'curfew',
        `Email blocked on weekends. Today is ${dayOfWeek} in ${timezone}.`
      );
    }
  } catch {
    console.warn(`Invalid timezone: ${timezone}. Skipping weekend check.`);
  }

  return allow();
}

async function checkFrequencyCap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  customerId: string,
  maxTouches: number
): Promise<ComplianceCheckResult> {
  // Count reminders sent to this customer in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count } = await supabase
    .from('reminders')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('customer_id', customerId)
    .eq('status', 'sent')
    .gte('sent_at', sevenDaysAgo.toISOString());

  if ((count || 0) >= maxTouches) {
    return block(
      'frequency_cap',
      `Frequency cap reached. ${count} of ${maxTouches} allowed touches sent this week.`
    );
  }

  return allow();
}

async function checkActiveDispute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  customerId: string
): Promise<ComplianceCheckResult> {
  const { count } = await supabase
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('customer_id', customerId)
    .eq('status', 'open');

  if ((count || 0) > 0) {
    return block(
      'active_dispute',
      `Email blocked. Customer has ${count} active dispute(s). Resolve disputes before sending reminders.`
    );
  }

  return allow();
}

async function checkSuppressed(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  customerId: string
): Promise<ComplianceCheckResult> {
  const { count } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('customer_id', customerId)
    .eq('status', 'suppressed');

  if ((count || 0) > 0) {
    return block(
      'suppressed',
      `Email blocked. This customer's conversations are currently suppressed.`
    );
  }

  return allow();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkStrategicHold(customer: any, now: Date): ComplianceCheckResult {
  // If renewal is within 90 days, require human approval (block auto-send)
  if (customer.renewal_date) {
    const renewalDate = new Date(customer.renewal_date);
    const daysUntilRenewal = Math.floor((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilRenewal > 0 && daysUntilRenewal <= 90) {
      return block(
        'strategic_hold',
        `Renewal in ${daysUntilRenewal} days. Automated reminders blocked — requires human approval.`
      );
    }
  }

  return allow();
}

// ── Helpers ──

function block(
  by: ComplianceCheckResult['blockedBy'],
  details: string
): ComplianceCheckResult {
  return {
    allowed: false,
    blockedReason: by,
    blockedBy: by,
    details,
  };
}

function allow(): ComplianceCheckResult {
  return { allowed: true, blockedReason: null, blockedBy: null, details: null };
}
