import {
  getLiveAccounts,
  getLiveApprovals,
  getLiveDisputes,
  getLiveInvoices,
  getLivePromises,
  type ApprovalRow,
  type DataSource,
  type InvoiceRow,
} from '@/lib/operations/live-data';
import { getIntegrationHealth } from '@/lib/operations/integration-health';

export type WorklistCategory = 'approval' | 'dispute' | 'promise' | 'invoice' | 'operations';
export type WorklistPriority = 'urgent' | 'high' | 'medium' | 'low';
export type WorklistTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

export type CollectorWorklistItem = {
  id: string;
  rank: number;
  category: WorklistCategory;
  priority: WorklistPriority;
  tone: WorklistTone;
  score: number;
  title: string;
  customerName: string;
  invoiceNumber?: string;
  amountAtRisk: number;
  daysOverdue: number;
  recoveryProbability: number;
  recommendedAction: string;
  rationale: string[];
  blockers: string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  statusLabel: string;
};

export type CollectorWorklistSnapshot = {
  source: DataSource;
  items: CollectorWorklistItem[];
  stats: {
    urgentCount: number;
    blockedCount: number;
    totalAtRisk: number;
    approvalCount: number;
    disputeCount: number;
    promiseCount: number;
  };
};

export async function getCollectorWorklist(): Promise<CollectorWorklistSnapshot> {
  const [accounts, invoices, approvals, disputes, promises, integrations] = await Promise.all([
    getLiveAccounts(),
    getLiveInvoices(),
    getLiveApprovals(),
    getLiveDisputes(),
    getLivePromises(),
    getIntegrationHealth(),
  ]);

  const source = accounts[0]?.source || invoices[0]?.source || approvals[0]?.source || 'mock';
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const representedInvoiceIds = new Set<string>();
  const items: Array<Omit<CollectorWorklistItem, 'rank'>> = [];
  const emailReady = integrations.some((item) => ['gmail', 'outlook'].includes(item.id) && item.status === 'connected');

  for (const approval of approvals.filter((item) => item.status === 'pending')) {
    const reminder = approval.reminder;
    const invoice = reminder?.invoice;
    const customer = reminder?.customer || (reminder ? accountsById.get(reminder.customer_id) : undefined);
    if (invoice?.id) representedInvoiceIds.add(invoice.id);

    const blockers = reminder?.channel === 'email' && !emailReady
      ? ['No Gmail or Outlook provider connected for delivery after approval.']
      : [];

    items.push({
      id: `approval-${approval.id}`,
      category: 'approval',
      priority: approval.priority === 'urgent' ? 'urgent' : approval.priority === 'high' ? 'high' : 'medium',
      tone: approval.priority === 'urgent' || approval.priority === 'high' ? 'warning' : 'info',
      score: 85 + priorityWeight(approval.priority) + (invoice?.amount_due || 0) / 1000,
      title: approval.reason === 'payment_plan_requested'
        ? 'Approve payment plan proposal'
        : 'Review drafted reminder',
      customerName: customer?.name || 'Unknown customer',
      invoiceNumber: invoice?.invoice_number,
      amountAtRisk: invoice?.amount_due || 0,
      daysOverdue: invoice?.days_overdue || 0,
      recoveryProbability: approval.reason === 'payment_plan_requested' ? 74 : 62,
      recommendedAction: approval.reason === 'payment_plan_requested'
        ? 'Approve the plan, then monitor promise compliance.'
        : 'Approve or edit the draft before outreach.',
      rationale: [
        humanize(approval.reason),
        reminder?.tone ? `${humanize(reminder.tone)} tone drafted` : 'Agent draft is waiting',
        reminder?.confidence_score ? `${Math.round(reminder.confidence_score * 100)}% draft confidence` : 'Human-in-the-loop required',
      ],
      blockers,
      primaryHref: '/inbox',
      primaryLabel: 'Open approval',
      secondaryHref: invoice ? `/accounts/${invoice.customer_id}` : undefined,
      secondaryLabel: invoice ? 'View account' : undefined,
      statusLabel: 'Pending human approval',
    });
  }

  for (const dispute of disputes.filter((item) => item.status === 'open' || item.status === 'investigating')) {
    const invoice = dispute.invoice;
    const customer = dispute.customer || accountsById.get(dispute.customer_id);
    if (invoice?.id) representedInvoiceIds.add(invoice.id);

    items.push({
      id: `dispute-${dispute.id}`,
      category: 'dispute',
      priority: invoice && invoice.amount_due >= 20000 ? 'urgent' : 'high',
      tone: 'danger',
      score: 90 + (invoice?.amount_due || 0) / 900 + (customer?.strategic_flag ? 8 : 0),
      title: 'Resolve collections-blocking dispute',
      customerName: customer?.name || 'Unknown customer',
      invoiceNumber: invoice?.invoice_number,
      amountAtRisk: invoice?.amount_due || 0,
      daysOverdue: invoice?.days_overdue || 0,
      recoveryProbability: dispute.status === 'open' ? 68 : 76,
      recommendedAction: 'Review validity, assign owner, and unblock the next customer touch.',
      rationale: [
        humanize(dispute.reason_tag),
        dispute.status === 'investigating' ? 'Investigation already started' : 'Open dispute blocks normal collections',
        customer?.strategic_flag ? 'Strategic account' : 'Customer response requires resolution',
      ],
      blockers: ['Compliance shield should pause aggressive reminders until the dispute is resolved.'],
      primaryHref: '/disputes',
      primaryLabel: 'Review dispute',
      secondaryHref: customer ? `/accounts/${customer.id}` : undefined,
      secondaryLabel: customer ? 'View account' : undefined,
      statusLabel: humanize(dispute.status),
    });
  }

  for (const promise of promises.filter((item) => item.status === 'broken' || item.status === 'pending')) {
    const invoice = promise.invoice;
    const customer = promise.customer || accountsById.get(promise.customer_id);
    const daysUntilPromise = daysUntil(promise.promised_date);
    const isBroken = promise.status === 'broken';
    const isDueSoon = promise.status === 'pending' && daysUntilPromise <= 3;

    if (!isBroken && !isDueSoon) continue;
    if (invoice?.id) representedInvoiceIds.add(invoice.id);

    items.push({
      id: `promise-${promise.id}`,
      category: 'promise',
      priority: isBroken ? 'urgent' : 'medium',
      tone: isBroken ? 'danger' : 'info',
      score: (isBroken ? 86 : 62) + promise.promised_amount / 1200,
      title: isBroken ? 'Broken promise needs escalation' : 'Promise due soon',
      customerName: customer?.name || 'Unknown customer',
      invoiceNumber: invoice?.invoice_number,
      amountAtRisk: promise.promised_amount,
      daysOverdue: invoice?.days_overdue || 0,
      recoveryProbability: isBroken ? 34 : 82,
      recommendedAction: isBroken
        ? 'Escalate with a firm but relationship-safe follow-up.'
        : 'Hold reminders and check payment status on the promised date.',
      rationale: [
        isBroken ? 'Promise date missed' : `Promise due ${daysUntilPromise <= 0 ? 'today' : `in ${daysUntilPromise}d`}`,
        invoice?.status ? `${humanize(invoice.status)} invoice` : 'Promise captured from customer response',
        customer?.risk_segment ? `${humanize(customer.risk_segment)} segment` : 'Payment commitment exists',
      ],
      blockers: isBroken ? [] : ['Avoid duplicate outreach before the promise window closes.'],
      primaryHref: '/promises',
      primaryLabel: 'Track promise',
      secondaryHref: customer ? `/accounts/${customer.id}` : undefined,
      secondaryLabel: customer ? 'View account' : undefined,
      statusLabel: humanize(promise.status),
    });
  }

  const invoiceItems = invoices
    .filter((invoice) => invoice.status !== 'paid' && invoice.days_overdue > 0 && !representedInvoiceIds.has(invoice.id))
    .sort((a, b) => invoiceScore(b, accountsById.get(b.customer_id)) - invoiceScore(a, accountsById.get(a.customer_id)))
    .slice(0, 5);

  for (const invoice of invoiceItems) {
    const customer = invoice.customer || accountsById.get(invoice.customer_id);
    const isSevere = invoice.days_overdue >= 45 || invoice.priority_score >= 80;

    items.push({
      id: `invoice-${invoice.id}`,
      category: 'invoice',
      priority: isSevere ? 'high' : 'medium',
      tone: isSevere ? 'warning' : 'neutral',
      score: invoiceScore(invoice, customer),
      title: customer?.strategic_flag ? 'Strategic account follow-up' : 'Prioritize overdue invoice',
      customerName: customer?.name || 'Unknown customer',
      invoiceNumber: invoice.invoice_number,
      amountAtRisk: invoice.amount_due,
      daysOverdue: invoice.days_overdue,
      recoveryProbability: estimateRecovery(invoice, customer),
      recommendedAction: customer?.strategic_flag
        ? 'Draft a soft, human-approved follow-up.'
        : invoice.days_overdue > 30
          ? 'Generate a firm reminder or payment plan offer.'
          : 'Send a standard reminder with payment link.',
      rationale: [
        `${invoice.days_overdue}d overdue`,
        `${Math.round(invoice.priority_score)} priority score`,
        customer?.risk_segment ? `${humanize(customer.risk_segment)} segment` : 'Open receivable',
      ],
      blockers: !emailReady ? ['Email provider not connected; sending will be blocked after approval.'] : [],
      primaryHref: `/accounts/${invoice.customer_id}`,
      primaryLabel: 'Open account',
      secondaryHref: '/invoices',
      secondaryLabel: 'View invoices',
      statusLabel: humanize(invoice.status),
    });
  }

  if (!emailReady) {
    items.push({
      id: 'operations-email-provider',
      category: 'operations',
      priority: 'urgent',
      tone: 'danger',
      score: 100,
      title: 'Connect outbound email provider',
      customerName: 'Operations blocker',
      amountAtRisk: items.reduce((sum, item) => sum + item.amountAtRisk, 0),
      daysOverdue: 0,
      recoveryProbability: 0,
      recommendedAction: 'Connect Gmail or Outlook so approved reminders can be sent.',
      rationale: [
        'Approvals can be completed, but delivery is blocked without an email token.',
        'This is now logged in audit history when approval tries to send.',
      ],
      blockers: ['No Gmail or Outlook provider connected.'],
      primaryHref: '/settings',
      primaryLabel: 'Connect provider',
      secondaryHref: '/operations',
      secondaryLabel: 'Open health',
      statusLabel: 'Delivery blocked',
    });
  }

  const ranked = items
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    source,
    items: ranked,
    stats: {
      urgentCount: ranked.filter((item) => item.priority === 'urgent').length,
      blockedCount: ranked.filter((item) => item.blockers.length > 0).length,
      totalAtRisk: ranked.reduce((sum, item) => sum + item.amountAtRisk, 0),
      approvalCount: ranked.filter((item) => item.category === 'approval').length,
      disputeCount: ranked.filter((item) => item.category === 'dispute').length,
      promiseCount: ranked.filter((item) => item.category === 'promise').length,
    },
  };
}

function invoiceScore(invoice: InvoiceRow, customer: { strategic_flag?: boolean } | undefined) {
  return invoice.priority_score + invoice.amount_due / 1500 + invoice.days_overdue / 2 + (customer?.strategic_flag ? 8 : 0);
}

function estimateRecovery(invoice: InvoiceRow, customer: { propensity_score?: number } | undefined) {
  const base = customer?.propensity_score || Math.max(20, 85 - invoice.days_overdue);
  const disputePenalty = invoice.status === 'disputed' ? 25 : 0;
  return Math.max(12, Math.min(92, Math.round(base - disputePenalty)));
}

function priorityWeight(priority: ApprovalRow['priority']) {
  if (priority === 'urgent') return 14;
  if (priority === 'high') return 10;
  if (priority === 'normal') return 4;
  return 0;
}

function daysUntil(value: string) {
  const target = new Date(`${value}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today.getTime()) / (1000 * 60 * 60 * 24));
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
