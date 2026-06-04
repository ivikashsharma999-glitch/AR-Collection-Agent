// ============================================
// Email Deliverability Hardening
// ============================================

import { createClient } from '@/lib/supabase/server';

export interface DeliverabilityCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks if the organization is currently rate-limited.
 * For example, preventing more than 10 outbound emails per minute 
 * across the org to prevent triggering Gmail/Outlook spam flags.
 */
export async function checkRateLimit(orgId: string): Promise<DeliverabilityCheckResult> {
  const supabase = await createClient();
  
  // Look back 1 minute
  const oneMinuteAgo = new Date();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

  const { count } = await supabase
    .from('action_history')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('action_type', 'reminder_sent')
    .gte('created_at', oneMinuteAgo.toISOString());

  // Cap at 10 emails per minute per org
  const RATE_LIMIT_PER_MINUTE = 10;
  
  if ((count || 0) >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit exceeded. Maximum ${RATE_LIMIT_PER_MINUTE} emails per minute allowed.`,
    };
  }

  return { allowed: true };
}

/**
 * Mocks checking DNS records (SPF, DKIM, DMARC) for a given sending domain.
 * In production, you would use 'dns' module in Node.js to resolve TXT records.
 */
export async function checkDnsConfiguration(domain: string): Promise<{
  spfConfigured: boolean;
  dkimConfigured: boolean;
  dmarcConfigured: boolean;
}> {
  void domain;
  // Simulate network check
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For the MVP, we assume it's configured if they connected via OAuth,
  // but in reality we'd parse the DNS TXT records.
  return {
    spfConfigured: true,
    dkimConfigured: true,
    dmarcConfigured: true,
  };
}
