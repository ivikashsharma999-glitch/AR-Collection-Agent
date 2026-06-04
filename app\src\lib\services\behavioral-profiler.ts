// ============================================
// Behavioral Profiler Service
// Updates customer behavior profiles over time
// ============================================

import { createClient } from '@/lib/supabase/server';

export interface BehavioralProfileData {
  pay_pattern: 'pays_on_time' | 'late_but_pays' | 'requires_escalation' | 'chronic_nonpayer' | 'unknown';
  avg_days_late: number;
  dispute_rate: number;
  response_channel_preference: 'email' | 'phone' | 'portal' | 'unknown';
  typical_response_day: string | null;   // e.g., 'Monday', 'Wednesday'
  typical_response_time: string | null;  // e.g., 'morning', 'afternoon'
  total_invoices_tracked: number;
  total_disputes: number;
  total_promises: number;
  promises_kept: number;
  promises_broken: number;
  last_updated: string;
}

// ── Update profile after receiving a reply ──

export async function updateProfileOnReply(
  orgId: string,
  customerId: string,
  classification: string,
  replyReceivedAt: string
): Promise<void> {
  const supabase = await createClient();

  // Fetch the current profile
  const { data: customer } = await supabase
    .from('customers')
    .select('behavioral_profile')
    .eq('id', customerId)
    .eq('org_id', orgId)
    .single();

  const profile: BehavioralProfileData = customer?.behavioral_profile || getDefaultProfile();

  // Update response timing
  const replyDate = new Date(replyReceivedAt);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  profile.typical_response_day = dayNames[replyDate.getDay()];
  
  const hour = replyDate.getHours();
  if (hour < 12) profile.typical_response_time = 'morning';
  else if (hour < 17) profile.typical_response_time = 'afternoon';
  else profile.typical_response_time = 'evening';

  // Update dispute count if applicable
  if (classification === 'dispute') {
    profile.total_disputes += 1;
  }

  // Update promise count if applicable
  if (classification === 'promise_to_pay' || classification === 'partial_pay') {
    profile.total_promises += 1;
  }

  // Recalculate dispute rate
  profile.total_invoices_tracked = Math.max(profile.total_invoices_tracked, 1);
  profile.dispute_rate = profile.total_disputes / profile.total_invoices_tracked;

  // Update channel preference (since they replied via email)
  profile.response_channel_preference = 'email';

  profile.last_updated = new Date().toISOString();

  // Save
  await supabase
    .from('customers')
    .update({ behavioral_profile: profile })
    .eq('id', customerId)
    .eq('org_id', orgId);
}

// ── Update profile when an invoice is paid ──

export async function updateProfileOnPayment(
  orgId: string,
  customerId: string,
  daysLate: number
): Promise<void> {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('behavioral_profile')
    .eq('id', customerId)
    .eq('org_id', orgId)
    .single();

  const profile: BehavioralProfileData = customer?.behavioral_profile || getDefaultProfile();

  // Update tracked count
  profile.total_invoices_tracked += 1;

  // Recalculate average days late using running average
  const prevTotal = profile.total_invoices_tracked - 1;
  profile.avg_days_late = prevTotal > 0
    ? ((profile.avg_days_late * prevTotal) + daysLate) / profile.total_invoices_tracked
    : daysLate;

  // Recalculate pay pattern
  profile.pay_pattern = classifyPayPattern(profile.avg_days_late, profile.dispute_rate, profile.promises_broken);

  // Recalculate dispute rate
  profile.dispute_rate = profile.total_disputes / profile.total_invoices_tracked;

  profile.last_updated = new Date().toISOString();

  await supabase
    .from('customers')
    .update({ behavioral_profile: profile })
    .eq('id', customerId)
    .eq('org_id', orgId);
}

// ── Update profile when a promise is kept or broken ──

export async function updateProfileOnPromiseOutcome(
  orgId: string,
  customerId: string,
  kept: boolean
): Promise<void> {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('behavioral_profile')
    .eq('id', customerId)
    .eq('org_id', orgId)
    .single();

  const profile: BehavioralProfileData = customer?.behavioral_profile || getDefaultProfile();

  if (kept) {
    profile.promises_kept += 1;
  } else {
    profile.promises_broken += 1;
  }

  // Recalculate pay pattern
  profile.pay_pattern = classifyPayPattern(profile.avg_days_late, profile.dispute_rate, profile.promises_broken);

  profile.last_updated = new Date().toISOString();

  await supabase
    .from('customers')
    .update({ behavioral_profile: profile })
    .eq('id', customerId)
    .eq('org_id', orgId);
}

// ── Helpers ──

function classifyPayPattern(
  avgDaysLate: number,
  disputeRate: number,
  promisesBroken: number
): BehavioralProfileData['pay_pattern'] {
  if (avgDaysLate <= 5 && disputeRate < 0.1) {
    return 'pays_on_time';
  }
  if (avgDaysLate <= 30 && promisesBroken <= 1) {
    return 'late_but_pays';
  }
  if (promisesBroken >= 3 || avgDaysLate > 60) {
    return 'chronic_nonpayer';
  }
  return 'requires_escalation';
}

function getDefaultProfile(): BehavioralProfileData {
  return {
    pay_pattern: 'unknown',
    avg_days_late: 0,
    dispute_rate: 0,
    response_channel_preference: 'unknown',
    typical_response_day: null,
    typical_response_time: null,
    total_invoices_tracked: 0,
    total_disputes: 0,
    total_promises: 0,
    promises_kept: 0,
    promises_broken: 0,
    last_updated: new Date().toISOString(),
  };
}
