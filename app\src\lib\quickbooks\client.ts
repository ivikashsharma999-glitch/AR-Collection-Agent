import { createClient } from '@/lib/supabase/server';

interface QBCredentials {
  orgId: string;
  realmId: string;
  accessToken: string;
  refreshToken: string;
}

interface QuickBooksTokenResponse {
  access_token: string;
  refresh_token: string;
}

interface QBCustomer {
  Id: string;
  DisplayName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address?: string };
  PrimaryPhone?: { FreeFormNumber?: string };
}

interface QBInvoice {
  Id: string;
  DocNumber: string;
  TotalAmt: number;
  Balance: number;
  DueDate: string;
  CustomerRef: { value: string };
}

interface QBQueryResponse<T> {
  QueryResponse?: {
    Customer?: T[];
    Invoice?: T[];
  };
}

export class QuickBooksClient {
  private orgId: string;
  private realmId: string;
  private accessToken: string;
  private refreshToken: string;
  private environment: string;
  private baseUrl: string;

  constructor(creds: QBCredentials) {
    this.orgId = creds.orgId;
    this.realmId = creds.realmId;
    this.accessToken = creds.accessToken;
    this.refreshToken = creds.refreshToken;
    this.environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com/v3/company'
      : 'https://quickbooks.api.intuit.com/v3/company';
  }

  static async initForOrg(orgId: string): Promise<QuickBooksClient | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('qb_realm_id, qb_access_token, qb_refresh_token')
      .eq('id', orgId)
      .single();

    if (error || !data?.qb_realm_id || !data?.qb_access_token) {
      return null;
    }

    return new QuickBooksClient({
      orgId,
      realmId: data.qb_realm_id,
      accessToken: data.qb_access_token,
      refreshToken: data.qb_refresh_token,
    });
  }

  private async refreshTokens(): Promise<void> {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh QuickBooks tokens');
    }

    const tokenData = await response.json() as QuickBooksTokenResponse;
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;

    // Save back to database
    const supabase = await createClient();
    await supabase
      .from('organizations')
      .update({
        qb_access_token: this.accessToken,
        qb_refresh_token: this.refreshToken,
      })
      .eq('id', this.orgId);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/${this.realmId}${endpoint}`;
    
    let res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    // Handle Token Expiry
    if (res.status === 401) {
      await this.refreshTokens();
      // Retry request with new token
      res = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          ...options.headers,
        },
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`QuickBooks API Error (${res.status}): ${errText}`);
    }

    return res.json() as Promise<T>;
  }

  // ============================================
  // Sync Methods
  // ============================================

  async syncCustomers() {
    const query = "SELECT * FROM Customer WHERE Active = true";
    const data = await this.request<QBQueryResponse<QBCustomer>>(`/query?query=${encodeURIComponent(query)}&minorversion=65`);
    
    const qbCustomers = data.QueryResponse?.Customer || [];
    const supabase = await createClient();

    for (const c of qbCustomers) {
      // Upsert Customer logic here
      await supabase.from('customers').upsert({
        org_id: this.orgId,
        qb_customer_id: c.Id,
        name: c.DisplayName || c.CompanyName || 'Unknown',
        email: c.PrimaryEmailAddr?.Address || null,
        phone: c.PrimaryPhone?.FreeFormNumber || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id,qb_customer_id' });
    }

    return qbCustomers.length;
  }

  async syncInvoices() {
    // Fetch unpaid invoices
    const query = "SELECT * FROM Invoice WHERE Balance > 0";
    const data = await this.request<QBQueryResponse<QBInvoice>>(`/query?query=${encodeURIComponent(query)}&minorversion=65`);
    
    const qbInvoices = data.QueryResponse?.Invoice || [];
    const supabase = await createClient();

    for (const inv of qbInvoices) {
      // Look up customer UUID
      const { data: custData } = await supabase
        .from('customers')
        .select('id')
        .eq('qb_customer_id', inv.CustomerRef.value)
        .eq('org_id', this.orgId)
        .single();

      if (!custData) continue; // Skip if customer not synced

      await supabase.from('invoices').upsert({
        org_id: this.orgId,
        customer_id: custData.id,
        qb_invoice_id: inv.Id,
        invoice_number: inv.DocNumber,
        amount: inv.TotalAmt,
        amount_due: inv.Balance,
        due_date: inv.DueDate,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'org_id,qb_invoice_id' });
    }

    return qbInvoices.length;
  }
}
