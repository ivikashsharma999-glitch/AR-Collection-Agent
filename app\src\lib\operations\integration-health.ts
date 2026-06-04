import { createClient } from '@/lib/supabase/server';

export type IntegrationStatus = 'connected' | 'demo' | 'disconnected' | 'degraded' | 'expired';

export type IntegrationHealth = {
  id: 'quickbooks' | 'gmail' | 'outlook' | 'stripe' | 'twilio' | 'supabase';
  name: string;
  status: IntegrationStatus;
  detail: string;
  lastSyncAt: string | null;
  lastError: string | null;
  actionHref?: string;
};

type OrganizationHealthRow = {
  qb_realm_id?: string | null;
  qb_last_sync_at?: string | null;
  qb_last_error?: string | null;
  gmail_connected?: boolean | null;
  gmail_access_token?: string | null;
  gmail_token_expires_at?: string | null;
  gmail_last_sync_at?: string | null;
  gmail_last_error?: string | null;
  outlook_connected?: boolean | null;
  outlook_access_token?: string | null;
  outlook_token_expires_at?: string | null;
  outlook_last_sync_at?: string | null;
  outlook_last_error?: string | null;
  stripe_connected?: boolean | null;
  stripe_last_error?: string | null;
  twilio_connected?: boolean | null;
  twilio_phone_number?: string | null;
  twilio_last_error?: string | null;
  demo_seeded_at?: string | null;
};

export async function getIntegrationHealth(): Promise<IntegrationHealth[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return getDisconnectedHealth('Sign in to inspect workspace health.');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!userData?.org_id) {
    return getDisconnectedHealth('Create or seed a workspace to enable live operations.');
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      qb_realm_id,
      qb_last_sync_at,
      qb_last_error,
      gmail_connected,
      gmail_access_token,
      gmail_token_expires_at,
      gmail_last_sync_at,
      gmail_last_error,
      outlook_connected,
      outlook_access_token,
      outlook_token_expires_at,
      outlook_last_sync_at,
      outlook_last_error,
      stripe_connected,
      stripe_last_error,
      twilio_connected,
      twilio_phone_number,
      twilio_last_error,
      demo_seeded_at
    `)
    .eq('id', userData.org_id)
    .single<OrganizationHealthRow>();

  if (error || !org) {
    return getDisconnectedHealth(error?.message || 'Organization health record unavailable.');
  }

  return [
    {
      id: 'supabase',
      name: 'Supabase Workspace',
      status: org.demo_seeded_at ? 'connected' : 'demo',
      detail: org.demo_seeded_at
        ? 'Pilot data is seeded and live queries can run against this workspace.'
        : 'Workspace exists, but pilot data has not been seeded yet.',
      lastSyncAt: org.demo_seeded_at || null,
      lastError: null,
      actionHref: '/settings',
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      status: withError(org.qb_last_error, org.qb_realm_id ? 'connected' : 'demo'),
      detail: org.qb_realm_id
        ? 'Ledger OAuth is connected for invoice and payment sync.'
        : 'Demo mode is using seeded receivables until QuickBooks OAuth is connected.',
      lastSyncAt: org.qb_last_sync_at || null,
      lastError: org.qb_last_error || null,
      actionHref: '/settings',
    },
    {
      id: 'gmail',
      name: 'Google Workspace',
      status: tokenStatus(org.gmail_last_error, org.gmail_connected, org.gmail_access_token, org.gmail_token_expires_at),
      detail: org.gmail_access_token
        ? 'Gmail API can be used for outbound and inbound collections email.'
        : 'Connect Gmail to send from your finance inbox.',
      lastSyncAt: org.gmail_last_sync_at || null,
      lastError: org.gmail_last_error || null,
      actionHref: '/settings',
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      status: tokenStatus(org.outlook_last_error, org.outlook_connected, org.outlook_access_token, org.outlook_token_expires_at),
      detail: org.outlook_access_token
        ? 'Microsoft Graph can be used for outbound and inbound collections email.'
        : 'Connect Outlook if Microsoft 365 is the finance inbox.',
      lastSyncAt: org.outlook_last_sync_at || null,
      lastError: org.outlook_last_error || null,
      actionHref: '/settings',
    },
    {
      id: 'stripe',
      name: 'Stripe Payment Links',
      status: withError(org.stripe_last_error, org.stripe_connected ? 'connected' : 'demo'),
      detail: org.stripe_connected
        ? 'Payment links are configured for customer portal checkout.'
        : 'Demo checkout links are generated until Stripe credentials are enabled.',
      lastSyncAt: null,
      lastError: org.stripe_last_error || null,
      actionHref: '/settings',
    },
    {
      id: 'twilio',
      name: 'Twilio SMS',
      status: withError(org.twilio_last_error, org.twilio_connected ? 'connected' : 'demo'),
      detail: org.twilio_phone_number
        ? `SMS sender configured as ${org.twilio_phone_number}.`
        : 'SMS outreach is simulated until Twilio credentials and sender number are configured.',
      lastSyncAt: null,
      lastError: org.twilio_last_error || null,
      actionHref: '/settings',
    },
  ];
}

function tokenStatus(
  lastError: string | null | undefined,
  connected: boolean | null | undefined,
  accessToken: string | null | undefined,
  expiresAt: string | null | undefined
): IntegrationStatus {
  if (lastError) return 'degraded';
  if (!connected || !accessToken) return 'disconnected';
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return 'expired';
  return 'connected';
}

function withError(lastError: string | null | undefined, status: IntegrationStatus): IntegrationStatus {
  return lastError ? 'degraded' : status;
}

function getDisconnectedHealth(detail: string): IntegrationHealth[] {
  return [
    {
      id: 'supabase',
      name: 'Supabase Workspace',
      status: 'disconnected',
      detail,
      lastSyncAt: null,
      lastError: null,
      actionHref: '/settings',
    },
  ];
}
