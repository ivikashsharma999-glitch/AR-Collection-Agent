import { createClient } from '@/lib/supabase/server';
import { mockApprovals, mockDisputes, mockInvoices, mockPromises } from '@/lib/mock-data';

type InvoiceMetricRow = {
  amount: number | string | null;
  amount_due: number | string | null;
  due_date: string | null;
  status: string | null;
  priority_score: number | string | null;
  updated_at: string | null;
};

type AgingBucket = {
  label: string;
  amount: number;
  count: number;
  color: string;
};

export type DashboardMetrics = {
  totalOutstanding: number;
  overdueAmount: number;
  recoveredThisMonth: number;
  dsoDays: number;
  recoveryRate: number;
  atRisk90Amount: number;
  approvalQueueCount: number;
  promisesPendingAmount: number;
  disputesOpenCount: number;
  agingBuckets: AgingBucket[];
  source: 'supabase' | 'mock';
};

const AGING_BUCKETS = [
  { label: 'Due Today', min: -Infinity, max: 0, color: '#ef4444' },
  { label: '1-30 Days', min: 1, max: 30, color: '#f97316' },
  { label: '31-60 Days', min: 31, max: 60, color: '#facc15' },
  { label: '61-90 Days', min: 61, max: 90, color: '#8b5cf6' },
  { label: '90+ Days', min: 91, max: Infinity, color: '#3b82f6' },
  { label: 'Legal / Write-off', min: Infinity, max: Infinity, color: '#94a3b8' },
];

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return getMockDashboardMetrics();
    }

    const [
      invoicesResult,
      approvalsResult,
      promisesResult,
      disputesResult,
    ] = await Promise.all([
      supabase
        .from('invoices')
        .select('amount, amount_due, due_date, status, priority_score, updated_at'),
      supabase
        .from('approvals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('promises')
        .select('promised_amount, status')
        .eq('status', 'pending'),
      supabase
        .from('disputes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
    ]);

    const invoiceRows = (invoicesResult.data || []) as InvoiceMetricRow[];
    if (invoicesResult.error || invoiceRows.length === 0) {
      return getMockDashboardMetrics();
    }

    return {
      ...buildMetrics({
        invoices: invoiceRows,
        approvalQueueCount: approvalsResult.count || 0,
        promisesPendingAmount: sumAmounts(
          (promisesResult.data || []).map((promise) => promise.promised_amount)
        ),
        disputesOpenCount: disputesResult.count || 0,
      }),
      source: 'supabase',
    };
  } catch (error) {
    console.warn('Falling back to mock dashboard metrics:', error);
    return getMockDashboardMetrics();
  }
}

function getMockDashboardMetrics(): DashboardMetrics {
  return {
    ...buildMetrics({
      invoices: mockInvoices,
      approvalQueueCount: mockApprovals.filter((approval) => approval.status === 'pending').length,
      promisesPendingAmount: mockPromises
        .filter((promise) => promise.status === 'pending')
        .reduce((sum, promise) => sum + promise.promised_amount, 0),
      disputesOpenCount: mockDisputes.filter((dispute) => dispute.status === 'open').length,
    }),
    source: 'mock',
  };
}

function buildMetrics({
  invoices,
  approvalQueueCount,
  promisesPendingAmount,
  disputesOpenCount,
}: {
  invoices: InvoiceMetricRow[];
  approvalQueueCount: number;
  promisesPendingAmount: number;
  disputesOpenCount: number;
}): Omit<DashboardMetrics, 'source'> {
  const totalAmount = sumAmounts(invoices.map((invoice) => invoice.amount));
  const totalOutstanding = sumAmounts(invoices.map((invoice) => invoice.amount_due));
  const openInvoices = invoices.filter((invoice) => invoice.status !== 'paid');
  const overdueInvoices = openInvoices.filter((invoice) => getDaysOverdue(invoice.due_date) > 0);
  const overdueAmount = sumAmounts(overdueInvoices.map((invoice) => invoice.amount_due));
  const recoveredThisMonth = sumAmounts(
    invoices
      .filter((invoice) => invoice.status === 'paid' && isThisMonth(invoice.updated_at))
      .map((invoice) => invoice.amount)
  );
  const paidAmount = sumAmounts(
    invoices
      .filter((invoice) => invoice.status === 'paid')
      .map((invoice) => invoice.amount)
  );
  const averageDaysOverdue = average(overdueInvoices.map((invoice) => getDaysOverdue(invoice.due_date)));
  const atRisk90Amount = sumAmounts(
    overdueInvoices
      .filter((invoice) => getDaysOverdue(invoice.due_date) > 90 || toNumber(invoice.priority_score) >= 90)
      .map((invoice) => invoice.amount_due)
  );

  return {
    totalOutstanding,
    overdueAmount,
    recoveredThisMonth,
    dsoDays: Math.round(averageDaysOverdue),
    recoveryRate: totalAmount > 0 ? paidAmount / totalAmount : 0,
    atRisk90Amount,
    approvalQueueCount,
    promisesPendingAmount,
    disputesOpenCount,
    agingBuckets: buildAgingBuckets(openInvoices),
  };
}

function buildAgingBuckets(invoices: InvoiceMetricRow[]) {
  return AGING_BUCKETS.map((bucket) => {
    const bucketInvoices = invoices.filter((invoice) => {
      if (bucket.label === 'Legal / Write-off') {
        return invoice.status === 'written_off';
      }

      if (invoice.status === 'written_off') {
        return false;
      }

      const daysOverdue = getDaysOverdue(invoice.due_date);
      return daysOverdue >= bucket.min && daysOverdue <= bucket.max;
    });

    return {
      label: bucket.label,
      amount: sumAmounts(bucketInvoices.map((invoice) => invoice.amount_due)),
      count: bucketInvoices.length,
      color: bucket.color,
    };
  });
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

function isThisMonth(dateValue: string | null | undefined) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
