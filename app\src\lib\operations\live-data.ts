import { createClient } from '@/lib/supabase/server';
import {
  mockApprovals,
  mockCustomers,
  mockInvoices,
  mockCashForecast,
  mockRecommendations,
  mockDisputes,
  mockPromises,
  mockDashboardStats,
  mockRecentActivity,
} from '@/lib/mock-data';
import type { ActionHistory, Approval, CashForecast, Customer, Dispute, Invoice, PromiseToPay, Recommendation, RiskSegment } from '@/types';

export type DataSource = 'supabase' | 'mock';

export type AccountRow = Customer & {
  total_outstanding: number;
  invoice_count: number;
  max_days_overdue: number;
  source: DataSource;
};

export type InvoiceRow = Invoice & {
  source: DataSource;
};

export type ApprovalRow = Approval & {
  source: DataSource;
};

export type AuditLogRow = ActionHistory & {
  source: DataSource;
};

export type DisputeRow = Dispute & {
  source: DataSource;
};

export type PromiseRow = PromiseToPay & {
  source: DataSource;
};

export type RecommendationRow = Recommendation & {
  source: DataSource;
};

export type ForecastSnapshot = CashForecast & {
  todayExpected: number;
  sevenDayExpected: number;
  quarterlyExpected: number;
  segments: Array<{ name: string; amount: number; percent: number; color: string }>;
  dsoData: Array<{ month: string; value: number }>;
  source: DataSource;
};

export type AnalyticsSnapshot = {
  collectionRate: number;
  totalOverdue: number;
  totalOverdueAmount: number;
  recoveredThisMonth: number;
  avgDaysOverdue: number;
  agingData: Array<{ label: string; amount: number; color: string }>;
  agentPerformance: Array<{ label: string; count: number; change: string }>;
  source: DataSource;
};

type CurrentOrg = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  orgId: string;
};

type CustomerDbRow = {
  id: string;
  org_id: string;
  qb_customer_id?: string | null;
  name: string;
  email?: string | null;
  secondary_emails?: string[] | null;
  phone?: string | null;
  strategic_flag?: boolean | null;
  renewal_date?: string | null;
  internal_owner_name?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

type InvoiceDbRow = {
  id: string;
  org_id: string;
  customer_id: string;
  qb_invoice_id?: string | null;
  invoice_number: string;
  amount: number | string;
  amount_due: number | string;
  due_date: string;
  status: Invoice['status'];
  priority_score: number | string | null;
  pay_now_link?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
  customer?: CustomerDbRow | CustomerDbRow[] | null;
};

type ReminderDbRow = {
  id: string;
  org_id: string;
  conversation_id: string;
  customer_id: string;
  invoice_id: string;
  channel?: 'email' | 'sms' | 'call' | null;
  subject: string;
  body: string;
  tone: 'soft' | 'professional' | 'firm' | 'escalation';
  confidence_score: number | string | null;
  status: 'draft' | 'queued' | 'approved' | 'sent' | 'recalled';
  drafted_at: string;
  queued_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  sent_at?: string | null;
  recalled_at?: string | null;
  customer?: CustomerDbRow | CustomerDbRow[] | null;
  invoice?: InvoiceDbRow | InvoiceDbRow[] | null;
};

type ApprovalDbRow = {
  id: string;
  org_id: string;
  reminder_id: string;
  reason: Approval['reason'];
  priority: Approval['priority'];
  status: Approval['status'];
  queued_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  override_note?: string | null;
  reminder?: ReminderDbRow | ReminderDbRow[] | null;
};

export async function getLiveAccounts(): Promise<AccountRow[]> {
  const current = await getCurrentOrg();
  if (!current) return getMockAccounts();

  try {
    const [{ data: customers, error: customersError }, { data: invoices, error: invoicesError }] = await Promise.all([
      current.supabase
        .from('customers')
        .select('id, org_id, qb_customer_id, name, email, secondary_emails, phone, strategic_flag, renewal_date, internal_owner_name, notes, created_at, updated_at')
        .order('name'),
      current.supabase
        .from('invoices')
        .select('id, org_id, customer_id, amount, amount_due, due_date, status, priority_score, created_at, updated_at')
        .neq('status', 'paid'),
    ]);

    if (customersError || invoicesError || !customers?.length) return getMockAccounts();

    return (customers as CustomerDbRow[]).map((customer) => {
      const customerInvoices = ((invoices || []) as InvoiceDbRow[]).filter((invoice) => invoice.customer_id === customer.id);
      const totalOutstanding = sumAmounts(customerInvoices.map((invoice) => invoice.amount_due));
      const maxDaysOverdue = Math.max(0, ...customerInvoices.map((invoice) => getDaysOverdue(invoice.due_date)));
      const maxPriority = Math.max(0, ...customerInvoices.map((invoice) => toNumber(invoice.priority_score)));
      const riskSegment = inferRiskSegment(maxPriority, maxDaysOverdue, totalOutstanding);

      return {
        id: customer.id,
        org_id: customer.org_id,
        qb_customer_id: customer.qb_customer_id || undefined,
        name: customer.name,
        email: customer.email || undefined,
        secondary_emails: customer.secondary_emails || [],
        phone: customer.phone || undefined,
        strategic_flag: Boolean(customer.strategic_flag),
        renewal_date: customer.renewal_date || undefined,
        internal_owner_name: customer.internal_owner_name || undefined,
        notes: customer.notes || undefined,
        total_outstanding: totalOutstanding,
        invoice_count: customerInvoices.length,
        propensity_score: Math.max(5, Math.min(95, 100 - maxPriority)),
        risk_segment: riskSegment,
        behavioral_profile: {
          id: `derived-${customer.id}`,
          org_id: customer.org_id,
          customer_id: customer.id,
          pay_pattern: maxDaysOverdue > 45 ? 'chronic_late' : maxDaysOverdue > 20 ? 'usually_late' : 'always_on_time',
          avg_days_late: maxDaysOverdue,
          total_invoices_paid: 0,
          total_invoices_disputed: customerInvoices.filter((invoice) => invoice.status === 'disputed').length,
          dispute_rate: customerInvoices.length > 0
            ? customerInvoices.filter((invoice) => invoice.status === 'disputed').length / customerInvoices.length
            : 0,
          response_channel_preference: 'email',
          updated_at: customer.updated_at,
        },
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        max_days_overdue: maxDaysOverdue,
        source: 'supabase',
      };
    });
  } catch {
    return getMockAccounts();
  }
}

export async function getLiveAccountDetail(id: string): Promise<{ customer: AccountRow; invoices: InvoiceRow[] } | null> {
  const [accounts, invoices] = await Promise.all([getLiveAccounts(), getLiveInvoices()]);
  const customer = accounts.find((account) => account.id === id);
  if (!customer) return null;

  return {
    customer,
    invoices: invoices.filter((invoice) => invoice.customer_id === id && invoice.status !== 'paid'),
  };
}

export async function getLiveInvoices(): Promise<InvoiceRow[]> {
  const current = await getCurrentOrg();
  if (!current) return getMockInvoices();

  try {
    const { data, error } = await current.supabase
      .from('invoices')
      .select(`
        id,
        org_id,
        customer_id,
        qb_invoice_id,
        invoice_number,
        amount,
        amount_due,
        due_date,
        status,
        priority_score,
        pay_now_link,
        last_synced_at,
        created_at,
        updated_at,
        customer:customers(id, org_id, name, email, secondary_emails, phone, strategic_flag, created_at, updated_at)
      `)
      .order('due_date', { ascending: true });

    if (error || !data?.length) return getMockInvoices();

    return (data as unknown as InvoiceDbRow[]).map((invoice) => ({
      id: invoice.id,
      org_id: invoice.org_id,
      customer_id: invoice.customer_id,
      customer: one(invoice.customer) ? dbCustomerToCustomer(one(invoice.customer)!) : undefined,
      qb_invoice_id: invoice.qb_invoice_id || undefined,
      invoice_number: invoice.invoice_number,
      amount: toNumber(invoice.amount),
      amount_due: toNumber(invoice.amount_due),
      due_date: invoice.due_date,
      days_overdue: getDaysOverdue(invoice.due_date),
      status: invoice.status,
      priority_score: toNumber(invoice.priority_score),
      pay_now_link: invoice.pay_now_link || undefined,
      last_synced_at: invoice.last_synced_at || undefined,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      source: 'supabase',
    }));
  } catch {
    return getMockInvoices();
  }
}

export async function getLiveApprovals(): Promise<ApprovalRow[]> {
  const current = await getCurrentOrg();
  if (!current) return getMockApprovals();

  try {
    const [
      approvalsResult,
      remindersResult,
      customersResult,
      invoicesResult,
    ] = await Promise.all([
      current.supabase
        .from('approvals')
        .select('id, org_id, reminder_id, reason, priority, status, queued_at, reviewed_by, reviewed_at, override_note')
        .order('queued_at', { ascending: false }),
      current.supabase
        .from('reminders')
        .select('id, org_id, conversation_id, customer_id, invoice_id, subject, body, tone, confidence_score, status, drafted_at, queued_at, approved_by, approved_at, sent_at, recalled_at'),
      current.supabase
        .from('customers')
        .select('id, org_id, qb_customer_id, name, email, secondary_emails, phone, strategic_flag, renewal_date, internal_owner_name, notes, created_at, updated_at'),
      current.supabase
        .from('invoices')
        .select('id, org_id, customer_id, qb_invoice_id, invoice_number, amount, amount_due, due_date, status, priority_score, pay_now_link, last_synced_at, created_at, updated_at'),
    ]);

    if (
      approvalsResult.error ||
      remindersResult.error ||
      customersResult.error ||
      invoicesResult.error ||
      !approvalsResult.data?.length
    ) {
      return getMockApprovals();
    }

    const remindersById = new Map((remindersResult.data as unknown as ReminderDbRow[]).map((reminder) => [reminder.id, reminder]));
    const customersById = new Map((customersResult.data as unknown as CustomerDbRow[]).map((customer) => [customer.id, customer]));
    const invoicesById = new Map((invoicesResult.data as unknown as InvoiceDbRow[]).map((invoice) => [invoice.id, invoice]));

    return (approvalsResult.data as unknown as ApprovalDbRow[]).map((approval) => {
      const reminder = remindersById.get(approval.reminder_id);
      const customer = reminder ? customersById.get(reminder.customer_id) : null;
      const invoice = reminder ? invoicesById.get(reminder.invoice_id) : null;

      return {
        ...approval,
        reminder: reminder
        ? {
            ...reminder,
            channel: reminder.channel || 'email',
            confidence_score: toNumber(reminder.confidence_score),
            customer: customer ? dbCustomerToCustomer(customer) : undefined,
            invoice: invoice ? dbInvoiceToInvoice(invoice) : undefined,
          }
        : undefined,
        source: 'supabase',
      };
    }) as ApprovalRow[];
  } catch {
    return getMockApprovals();
  }
}

export async function getLiveAuditLogs(): Promise<AuditLogRow[]> {
  const current = await getCurrentOrg();
  if (!current) return getMockAuditLogs();

  try {
    const { data, error } = await current.supabase
      .from('action_history')
      .select('id, org_id, action_type, customer_id, invoice_id, conversation_id, actor_type, actor_id, details, outcome, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data?.length) return getMockAuditLogs();
    return (data as ActionHistory[]).map((log) => ({ ...log, source: 'supabase' }));
  } catch {
    return getMockAuditLogs();
  }
}

export async function getLiveDisputes(): Promise<DisputeRow[]> {
  const current = await getCurrentOrg();
  if (!current) return getMockDisputes();

  try {
    const { data, error } = await current.supabase
      .from('disputes')
      .select(`
        id,
        org_id,
        customer_id,
        invoice_id,
        reply_id,
        reason_tag,
        description,
        status,
        assigned_to,
        resolution_note,
        opened_at,
        resolved_at,
        customer:customers(id, org_id, name, email, secondary_emails, phone, strategic_flag, created_at, updated_at),
        invoice:invoices(id, org_id, customer_id, invoice_number, amount, amount_due, due_date, status, priority_score, created_at, updated_at)
      `)
      .order('opened_at', { ascending: false });

    if (error || !data?.length) return getMockDisputes();

    return (data as unknown as Array<Dispute & { customer?: CustomerDbRow | CustomerDbRow[] | null; invoice?: InvoiceDbRow | InvoiceDbRow[] | null }>).map((dispute) => ({
      ...dispute,
      customer: one(dispute.customer) ? dbCustomerToCustomer(one(dispute.customer)!) : undefined,
      invoice: one(dispute.invoice) ? dbInvoiceToInvoice(one(dispute.invoice)!) : undefined,
      source: 'supabase',
    }));
  } catch {
    return getMockDisputes();
  }
}

export async function getLivePromises(): Promise<PromiseRow[]> {
  const current = await getCurrentOrg();
  if (!current) return getMockPromises();

  try {
    const { data, error } = await current.supabase
      .from('promises')
      .select(`
        id,
        org_id,
        customer_id,
        invoice_id,
        reply_id,
        promised_amount,
        promised_date,
        status,
        captured_at,
        fulfilled_at,
        broken_at,
        customer:customers(id, org_id, name, email, secondary_emails, phone, strategic_flag, created_at, updated_at),
        invoice:invoices(id, org_id, customer_id, invoice_number, amount, amount_due, due_date, status, priority_score, created_at, updated_at)
      `)
      .order('promised_date', { ascending: true });

    if (error || !data?.length) return getMockPromises();

    return (data as unknown as Array<PromiseToPay & { promised_amount: number | string; customer?: CustomerDbRow | CustomerDbRow[] | null; invoice?: InvoiceDbRow | InvoiceDbRow[] | null }>).map((promise) => ({
      ...promise,
      promised_amount: toNumber(promise.promised_amount),
      customer: one(promise.customer) ? dbCustomerToCustomer(one(promise.customer)!) : undefined,
      invoice: one(promise.invoice) ? dbInvoiceToInvoice(one(promise.invoice)!) : undefined,
      source: 'supabase',
    }));
  } catch {
    return getMockPromises();
  }
}

export async function getLiveRecommendations(): Promise<RecommendationRow[]> {
  const [accounts, invoices, disputes, promises] = await Promise.all([
    getLiveAccounts(),
    getLiveInvoices(),
    getLiveDisputes(),
    getLivePromises(),
  ]);
  const source = accounts[0]?.source || invoices[0]?.source || 'mock';

  if (source === 'mock') return getMockRecommendations();

  const recommendations: RecommendationRow[] = [];
  const openDispute = disputes.find((dispute) => dispute.status === 'open' || dispute.status === 'investigating');
  if (openDispute?.customer && openDispute.invoice) {
    recommendations.push({
      id: `rec-dispute-${openDispute.id}`,
      org_id: openDispute.org_id,
      customer_id: openDispute.customer_id,
      customer: openDispute.customer,
      type: 'recover_now',
      title: `Resolve ${openDispute.customer.name} dispute`,
      description: `Open ${openDispute.reason_tag} dispute is blocking ${openDispute.invoice.invoice_number}.`,
      amount_at_risk: openDispute.invoice.amount_due,
      recovery_probability: 82,
      action_label: 'Review Dispute',
      created_at: openDispute.opened_at,
      source: 'supabase',
    });
  }

  const highRisk = accounts
    .filter((account) => account.total_outstanding > 0)
    .sort((a, b) => (b.max_days_overdue + b.total_outstanding / 1000) - (a.max_days_overdue + a.total_outstanding / 1000))[0];

  if (highRisk) {
    recommendations.push({
      id: `rec-risk-${highRisk.id}`,
      org_id: highRisk.org_id,
      customer_id: highRisk.id,
      customer: highRisk,
      type: highRisk.max_days_overdue > 45 ? 'escalate' : 'payment_plan',
      title: highRisk.max_days_overdue > 45 ? `Escalate ${highRisk.name}` : `Offer payment plan to ${highRisk.name}`,
      description: `${formatRiskLabel(highRisk.risk_segment)} account with ${highRisk.max_days_overdue} days overdue and ${formatCurrencyPlain(highRisk.total_outstanding)} outstanding.`,
      amount_at_risk: highRisk.total_outstanding,
      recovery_probability: Math.max(20, Math.min(78, 95 - highRisk.max_days_overdue)),
      action_label: highRisk.max_days_overdue > 45 ? 'Escalate Account' : 'Draft Plan',
      created_at: highRisk.updated_at,
      source: 'supabase',
    });
  }

  const pendingPromise = promises.find((promise) => promise.status === 'pending');
  if (pendingPromise?.customer) {
    recommendations.push({
      id: `rec-promise-${pendingPromise.id}`,
      org_id: pendingPromise.org_id,
      customer_id: pendingPromise.customer_id,
      customer: pendingPromise.customer,
      type: 'payment_plan',
      title: `Monitor ${pendingPromise.customer.name} promise`,
      description: `Promise for ${formatCurrencyPlain(pendingPromise.promised_amount)} is due ${pendingPromise.promised_date}.`,
      amount_at_risk: pendingPromise.promised_amount,
      recovery_probability: 74,
      action_label: 'Track Promise',
      created_at: pendingPromise.captured_at,
      source: 'supabase',
    });
  }

  const fallbackInvoice = invoices.find((invoice) => invoice.status !== 'paid' && invoice.priority_score >= 70);
  if (recommendations.length < 3 && fallbackInvoice?.customer) {
    recommendations.push({
      id: `rec-invoice-${fallbackInvoice.id}`,
      org_id: fallbackInvoice.org_id,
      customer_id: fallbackInvoice.customer_id,
      customer: fallbackInvoice.customer,
      type: 'recover_now',
      title: `Prioritize ${fallbackInvoice.invoice_number}`,
      description: `High priority invoice with score ${fallbackInvoice.priority_score}.`,
      amount_at_risk: fallbackInvoice.amount_due,
      recovery_probability: 69,
      action_label: 'Open Invoice',
      created_at: fallbackInvoice.updated_at,
      source: 'supabase',
    });
  }

  return recommendations.slice(0, 4);
}

export async function getLiveForecast(): Promise<ForecastSnapshot> {
  const invoices = await getLiveInvoices();
  const source = invoices[0]?.source || 'mock';
  if (source === 'mock') return getMockForecast();

  const openInvoices = invoices.filter((invoice) => invoice.status !== 'paid');
  const promised = openInvoices.filter((invoice) => invoice.status === 'promised');
  const expected = Math.round(
    openInvoices.reduce((sum, invoice) => {
      const days = invoice.days_overdue;
      const probability = invoice.status === 'promised' ? 0.82 : days > 60 ? 0.28 : days > 30 ? 0.48 : 0.68;
      return sum + invoice.amount_due * probability;
    }, 0)
  );
  const todayExpected = Math.round(promised.reduce((sum, invoice) => sum + invoice.amount_due * 0.35, 0));
  const sevenDayExpected = Math.round(expected * 0.42);
  const quarterlyExpected = Math.round(expected * 2.8);
  const segmentTotals = buildRiskSegmentTotals(openInvoices);

  return {
    period: '30_days',
    expected_amount: expected,
    best_case_amount: Math.round(expected * 1.18),
    worst_case_amount: Math.round(expected * 0.72),
    confidence_percentage: 78,
    todayExpected,
    sevenDayExpected,
    quarterlyExpected,
    segments: segmentTotals,
    dsoData: buildDsoData(openInvoices),
    source: 'supabase',
  };
}

export async function getLiveAnalytics(): Promise<AnalyticsSnapshot> {
  const [invoices, logs] = await Promise.all([getLiveInvoices(), getLiveAuditLogs()]);
  const source = invoices[0]?.source || 'mock';
  if (source === 'mock') return getMockAnalytics();

  const totalAmount = sumAmounts(invoices.map((invoice) => invoice.amount));
  const paidAmount = sumAmounts(invoices.filter((invoice) => invoice.status === 'paid').map((invoice) => invoice.amount));
  const openInvoices = invoices.filter((invoice) => invoice.status !== 'paid');
  const overdueInvoices = openInvoices.filter((invoice) => invoice.days_overdue > 0);

  return {
    collectionRate: totalAmount > 0 ? paidAmount / totalAmount : 0,
    totalOverdue: overdueInvoices.length,
    totalOverdueAmount: sumAmounts(overdueInvoices.map((invoice) => invoice.amount_due)),
    recoveredThisMonth: sumAmounts(invoices.filter((invoice) => invoice.status === 'paid' && isThisMonth(invoice.updated_at)).map((invoice) => invoice.amount)),
    avgDaysOverdue: Math.round(average(overdueInvoices.map((invoice) => invoice.days_overdue))),
    agingData: buildAgingData(openInvoices),
    agentPerformance: buildAgentPerformance(logs),
    source: 'supabase',
  };
}

async function getCurrentOrg(): Promise<CurrentOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (error || !data?.org_id) return null;
  return { supabase, orgId: data.org_id };
}

function dbCustomerToCustomer(customer: CustomerDbRow): Customer {
  return {
    id: customer.id,
    org_id: customer.org_id,
    qb_customer_id: customer.qb_customer_id || undefined,
    name: customer.name,
    email: customer.email || undefined,
    secondary_emails: customer.secondary_emails || [],
    phone: customer.phone || undefined,
    strategic_flag: Boolean(customer.strategic_flag),
    renewal_date: customer.renewal_date || undefined,
    internal_owner_name: customer.internal_owner_name || undefined,
    notes: customer.notes || undefined,
    total_outstanding: 0,
    invoice_count: 0,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
  };
}

function dbInvoiceToInvoice(invoice: InvoiceDbRow): Invoice {
  return {
    id: invoice.id,
    org_id: invoice.org_id,
    customer_id: invoice.customer_id,
    invoice_number: invoice.invoice_number,
    amount: toNumber(invoice.amount),
    amount_due: toNumber(invoice.amount_due),
    due_date: invoice.due_date,
    days_overdue: getDaysOverdue(invoice.due_date),
    status: invoice.status,
    priority_score: toNumber(invoice.priority_score),
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
  };
}

function getMockAccounts(): AccountRow[] {
  return mockCustomers.map((customer) => ({
    ...customer,
    max_days_overdue: customer.behavioral_profile?.avg_days_late || 0,
    source: 'mock',
  }));
}

function getMockInvoices(): InvoiceRow[] {
  return mockInvoices.map((invoice) => ({ ...invoice, source: 'mock' }));
}

function getMockApprovals(): ApprovalRow[] {
  return mockApprovals.map((approval) => ({ ...approval, source: 'mock' }));
}

function getMockAuditLogs(): AuditLogRow[] {
  return mockRecentActivity.map((log) => ({ ...log, source: 'mock' }));
}

function getMockDisputes(): DisputeRow[] {
  return mockDisputes.map((dispute) => ({ ...dispute, source: 'mock' }));
}

function getMockPromises(): PromiseRow[] {
  return mockPromises.map((promise) => ({ ...promise, source: 'mock' }));
}

function getMockRecommendations(): RecommendationRow[] {
  return mockRecommendations.map((recommendation) => ({ ...recommendation, source: 'mock' }));
}

function getMockForecast(): ForecastSnapshot {
  return {
    ...mockCashForecast,
    todayExpected: 12400,
    sevenDayExpected: 45800,
    quarterlyExpected: 420000,
    segments: [
      { name: 'Good Payer', amount: 85000, percent: 60, color: 'var(--color-success)' },
      { name: 'Low Risk', amount: 28000, percent: 20, color: 'var(--color-success-light)' },
      { name: 'Medium Risk', amount: 15000, percent: 10, color: 'var(--color-warning)' },
      { name: 'High Risk', amount: 14500, percent: 10, color: 'var(--color-danger)' },
    ],
    dsoData: [
      { month: 'Jan', value: 42 },
      { month: 'Feb', value: 45 },
      { month: 'Mar', value: 48 },
      { month: 'Apr', value: 44 },
      { month: 'May', value: 38 },
      { month: 'Jun', value: 35 },
    ],
    source: 'mock',
  };
}

function getMockAnalytics(): AnalyticsSnapshot {
  const agingData = [
    { label: 'Current', amount: 120000, color: 'var(--color-success)' },
    { label: '1-30 Days', amount: 85000, color: 'var(--color-warning)' },
    { label: '31-60 Days', amount: 42000, color: 'var(--brand-primary)' },
    { label: '61-90 Days', amount: 15000, color: 'var(--color-danger-light)' },
    { label: '90+ Days', amount: 6150, color: 'var(--color-danger)' },
  ];

  return {
    collectionRate: mockDashboardStats.collection_rate,
    totalOverdue: mockDashboardStats.total_overdue,
    totalOverdueAmount: mockDashboardStats.total_overdue_amount,
    recoveredThisMonth: mockDashboardStats.recovered_this_month,
    avgDaysOverdue: mockDashboardStats.avg_days_overdue,
    agingData,
    agentPerformance: [
      { label: 'Emails Sent', count: 1240, change: '+12%' },
      { label: 'SMS Sent', count: 450, change: '+5%' },
      { label: 'Promises Captured', count: 85, change: '+22%' },
      { label: 'Auto-resolved', count: 42, change: '+8%' },
    ],
    source: 'mock',
  };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function inferRiskSegment(priorityScore: number, daysOverdue: number, outstanding: number): RiskSegment {
  if (priorityScore >= 90 || daysOverdue >= 60) return 'chronic_late';
  if (priorityScore >= 75 || outstanding >= 25000) return 'high_risk';
  if (priorityScore >= 50 || daysOverdue >= 20) return 'medium_risk';
  if (priorityScore >= 25 || daysOverdue > 0) return 'low_risk';
  return 'good_payer';
}

function buildRiskSegmentTotals(invoices: InvoiceRow[]) {
  const buckets = [
    { name: 'Good Payer', amount: 0, color: 'var(--color-success)' },
    { name: 'Low Risk', amount: 0, color: 'var(--color-success-light)' },
    { name: 'Medium Risk', amount: 0, color: 'var(--color-warning)' },
    { name: 'High Risk', amount: 0, color: 'var(--color-danger)' },
  ];

  for (const invoice of invoices) {
    const index = invoice.priority_score >= 80 ? 3 : invoice.priority_score >= 55 ? 2 : invoice.priority_score >= 30 ? 1 : 0;
    buckets[index].amount += invoice.amount_due;
  }

  const total = Math.max(1, sumAmounts(buckets.map((bucket) => bucket.amount)));
  return buckets.map((bucket) => ({
    ...bucket,
    percent: Math.round((bucket.amount / total) * 100),
  }));
}

function buildDsoData(invoices: InvoiceRow[]) {
  const avg = Math.round(average(invoices.map((invoice) => invoice.days_overdue)));
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => ({
    month,
    value: Math.max(8, avg + 10 - index * 2),
  }));
}

function buildAgingData(invoices: InvoiceRow[]) {
  const buckets = [
    { label: 'Current', amount: 0, color: 'var(--color-success)' },
    { label: '1-30 Days', amount: 0, color: 'var(--color-warning)' },
    { label: '31-60 Days', amount: 0, color: 'var(--brand-primary)' },
    { label: '61-90 Days', amount: 0, color: 'var(--color-danger-light)' },
    { label: '90+ Days', amount: 0, color: 'var(--color-danger)' },
  ];

  for (const invoice of invoices) {
    const days = invoice.days_overdue;
    const index = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
    buckets[index].amount += invoice.amount_due;
  }

  return buckets;
}

function buildAgentPerformance(logs: AuditLogRow[]) {
  const sent = logs.filter((log) => log.action_type.includes('reminder_sent')).length;
  const promises = logs.filter((log) => log.action_type.includes('promise')).length;
  const disputes = logs.filter((log) => log.action_type.includes('dispute')).length;
  const resolved = logs.filter((log) => log.action_type.includes('resolved') || log.action_type.includes('suppressed')).length;

  return [
    { label: 'Emails Sent', count: sent, change: sent > 0 ? '+live' : '0%' },
    { label: 'SMS Sent', count: 0, change: '0%' },
    { label: 'Promises Captured', count: promises, change: promises > 0 ? '+live' : '0%' },
    { label: 'Auto-resolved', count: resolved + disputes, change: resolved > 0 ? '+live' : '0%' },
  ];
}

function formatRiskLabel(segment?: RiskSegment) {
  return (segment || 'medium_risk').replace(/_/g, ' ');
}

function formatCurrencyPlain(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function sumAmounts(values: Array<number | string | null | undefined>): number {
  return values.reduce<number>((sum, value) => sum + toNumber(value), 0);
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

function getDaysOverdue(dueDate: string | null | undefined) {
  if (!dueDate) return 0;

  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isThisMonth(value: string | null | undefined) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
