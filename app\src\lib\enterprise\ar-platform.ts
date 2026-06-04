import { formatCurrency, mockCustomers, mockDisputes, mockInvoices } from '@/lib/mock-data';

export type EnterpriseSource = 'demo-intelligence';

export type CashApplicationItem = {
  id: string;
  payer: string;
  remittanceRef: string;
  receivedAmount: number;
  matchedAmount: number;
  unappliedAmount: number;
  confidence: number;
  status: 'auto_matched' | 'needs_review' | 'short_pay' | 'unapplied';
  invoiceNumbers: string[];
  recommendation: string;
};

export type DeductionCase = {
  id: string;
  customerName: string;
  invoiceNumber: string;
  code: string;
  claimedAmount: number;
  confidence: number;
  owner: string;
  status: 'open' | 'validating' | 'approved_credit' | 'rejected';
  nextStep: string;
  evidence: string[];
};

export type CreditRiskAccount = {
  id: string;
  customerName: string;
  exposure: number;
  creditLimit: number;
  utilization: number;
  riskScore: number;
  recommendedLimit: number;
  decision: 'hold' | 'reduce' | 'monitor' | 'expand';
  signals: string[];
};

export type ReconciliationJob = {
  id: string;
  system: string;
  entity: string;
  status: 'healthy' | 'delayed' | 'failed' | 'reconciling';
  lastRun: string;
  recordsChecked: number;
  exceptions: number;
  action: string;
};

export type PaymentLifecycleItem = {
  id: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  linkStatus: 'created' | 'sent' | 'opened' | 'paid' | 'failed';
  processorStatus: string;
  nextAction: string;
  timeline: string[];
};

export type EntityReceivables = {
  id: string;
  entity: string;
  region: string;
  currency: string;
  overdueAmount: number;
  collectionRate: number;
  dso: number;
  disputedAmount: number;
  owner: string;
};

export type GovernanceRule = {
  id: string;
  name: string;
  category: 'approval' | 'credit' | 'compliance' | 'routing' | 'writeoff';
  status: 'active' | 'draft' | 'needs_review';
  automationLevel: string;
  guardrail: string;
  lastChanged: string;
};

export type EnterprisePlatformSnapshot = {
  source: EnterpriseSource;
  cashApplication: CashApplicationItem[];
  deductions: DeductionCase[];
  creditRisk: CreditRiskAccount[];
  reconciliation: ReconciliationJob[];
  payments: PaymentLifecycleItem[];
  entities: EntityReceivables[];
  governance: GovernanceRule[];
  summary: {
    autoCashMatchRate: number;
    deductionsAtRisk: number;
    creditExposure: number;
    reconciliationExceptions: number;
    paymentLinksInFlight: number;
    globalOverdue: number;
    activePolicies: number;
  };
};

export function getEnterprisePlatformSnapshot(): EnterprisePlatformSnapshot {
  const cashApplication = buildCashApplication();
  const deductions = buildDeductions();
  const creditRisk = buildCreditRisk();
  const reconciliation = buildReconciliation();
  const payments = buildPaymentLifecycle();
  const entities = buildEntities();
  const governance = buildGovernance();

  return {
    source: 'demo-intelligence',
    cashApplication,
    deductions,
    creditRisk,
    reconciliation,
    payments,
    entities,
    governance,
    summary: {
      autoCashMatchRate: 84,
      deductionsAtRisk: deductions.reduce((sum, item) => sum + item.claimedAmount, 0),
      creditExposure: creditRisk.reduce((sum, item) => sum + item.exposure, 0),
      reconciliationExceptions: reconciliation.reduce((sum, item) => sum + item.exceptions, 0),
      paymentLinksInFlight: payments.filter((item) => item.linkStatus !== 'paid').length,
      globalOverdue: entities.reduce((sum, item) => sum + item.overdueAmount, 0),
      activePolicies: governance.filter((item) => item.status === 'active').length,
    },
  };
}

function buildCashApplication(): CashApplicationItem[] {
  return [
    {
      id: 'cash-001',
      payer: 'CloudBridge Inc',
      remittanceRef: 'WIRE-8831',
      receivedAmount: 20500,
      matchedAmount: 18500,
      unappliedAmount: 2000,
      confidence: 91,
      status: 'short_pay',
      invoiceNumbers: ['INV-2026-0147'],
      recommendation: 'Apply $18.5k to invoice and route $2k short-pay to deductions.',
    },
    {
      id: 'cash-002',
      payer: 'Acme Corp',
      remittanceRef: 'ACH-7712',
      receivedAmount: 7600,
      matchedAmount: 7600,
      unappliedAmount: 0,
      confidence: 98,
      status: 'auto_matched',
      invoiceNumbers: ['INV-2026-0178'],
      recommendation: 'Auto-apply and close the related promise.',
    },
    {
      id: 'cash-003',
      payer: 'Momentum Labs',
      remittanceRef: 'LOCKBOX-229',
      receivedAmount: 6200,
      matchedAmount: 6200,
      unappliedAmount: 0,
      confidence: 76,
      status: 'needs_review',
      invoiceNumbers: ['INV-2026-0158'],
      recommendation: 'Confirm this is installment one of the approved split-payment plan.',
    },
    {
      id: 'cash-004',
      payer: 'Unknown payer',
      remittanceRef: 'ACH-UNAPPLIED-14',
      receivedAmount: 4400,
      matchedAmount: 0,
      unappliedAmount: 4400,
      confidence: 38,
      status: 'unapplied',
      invoiceNumbers: [],
      recommendation: 'Review bank memo and customer aliases before posting.',
    },
  ];
}

function buildDeductions(): DeductionCase[] {
  return mockDisputes.slice(0, 3).map((dispute, index) => ({
    id: `ded-${dispute.id}`,
    customerName: dispute.customer?.name || 'Unknown customer',
    invoiceNumber: dispute.invoice?.invoice_number || 'Unlinked invoice',
    code: dispute.reason_tag,
    claimedAmount: Math.round((dispute.invoice?.amount_due || 5000) * [0.15, 0.12, 1][index]),
    confidence: [88, 81, 74][index],
    owner: index === 1 ? 'Customer Success' : 'AR Analyst',
    status: index === 0 ? 'open' : index === 1 ? 'validating' : 'approved_credit',
    nextStep: [
      'Validate quote terms and issue approved credit memo if pricing mismatch is confirmed.',
      'Compare uptime logs with SLA threshold before releasing payment hold.',
      'Match bank reference to lockbox deposit and clear duplicate collection activity.',
    ][index],
    evidence: [
      dispute.description,
      `Invoice exposure: ${formatCurrency(dispute.invoice?.amount_due || 0)}`,
      `Current status: ${dispute.status}`,
    ],
  }));
}

function buildCreditRisk(): CreditRiskAccount[] {
  return mockCustomers
    .filter((customer) => customer.total_outstanding > 0)
    .slice(0, 6)
    .map((customer) => {
      const exposure = customer.total_outstanding;
      const creditLimit = customer.strategic_flag ? 75000 : exposure > 15000 ? 30000 : 15000;
      const utilization = Math.round((exposure / creditLimit) * 100);
      const riskScore = Math.max(8, Math.min(96, 100 - (customer.propensity_score || 50) + utilization / 3));
      const decision = riskScore > 78 ? 'hold' : riskScore > 62 ? 'reduce' : utilization > 80 ? 'monitor' : 'expand';

      return {
        id: `credit-${customer.id}`,
        customerName: customer.name,
        exposure,
        creditLimit,
        utilization,
        riskScore: Math.round(riskScore),
        recommendedLimit: decision === 'hold' ? Math.max(5000, Math.round(exposure * 0.8)) : decision === 'expand' ? Math.round(creditLimit * 1.2) : creditLimit,
        decision,
        signals: [
          `${customer.behavioral_profile?.avg_days_late || 0} avg days late`,
          `${Math.round((customer.behavioral_profile?.dispute_rate || 0) * 100)}% dispute rate`,
          customer.strategic_flag ? 'Strategic account override required' : `${customer.risk_segment?.replace(/_/g, ' ') || 'medium risk'} segment`,
        ],
      };
    });
}

function buildReconciliation(): ReconciliationJob[] {
  return [
    {
      id: 'recon-qbo-us',
      system: 'QuickBooks',
      entity: 'US SaaS LLC',
      status: 'reconciling',
      lastRun: '2026-06-04T07:40:00Z',
      recordsChecked: 1284,
      exceptions: 7,
      action: 'Review invoice status mismatches before the next collector run.',
    },
    {
      id: 'recon-stripe',
      system: 'Stripe',
      entity: 'Global Payments',
      status: 'healthy',
      lastRun: '2026-06-04T07:55:00Z',
      recordsChecked: 412,
      exceptions: 0,
      action: 'No action required.',
    },
    {
      id: 'recon-lockbox',
      system: 'Bank lockbox',
      entity: 'US SaaS LLC',
      status: 'delayed',
      lastRun: '2026-06-03T22:05:00Z',
      recordsChecked: 98,
      exceptions: 4,
      action: 'Import latest BAI2 file and retry remittance matching.',
    },
    {
      id: 'recon-email',
      system: 'Gmail / Outlook',
      entity: 'Collections workspace',
      status: 'failed',
      lastRun: '2026-06-04T05:15:00Z',
      recordsChecked: 236,
      exceptions: 11,
      action: 'Reconnect outbound provider to unblock approved reminder delivery.',
    },
  ];
}

function buildPaymentLifecycle(): PaymentLifecycleItem[] {
  return mockInvoices.slice(0, 6).map((invoice, index) => ({
    id: `pay-${invoice.id}`,
    customerName: invoice.customer?.name || 'Unknown customer',
    invoiceNumber: invoice.invoice_number,
    amount: invoice.amount_due,
    linkStatus: ['opened', 'sent', 'created', 'failed', 'paid', 'opened'][index] as PaymentLifecycleItem['linkStatus'],
    processorStatus: ['Checkout viewed twice', 'Email delivered', 'Awaiting approval', 'Stripe link failed', 'Payment succeeded', 'Customer copied link'][index],
    nextAction: [
      'Send one-click payment nudge with ACH option.',
      'Wait 24 hours before second touch.',
      'Approve draft before creating payment link.',
      'Regenerate Stripe test link and log the failure.',
      'Sync paid status back to ERP.',
      'Offer split payment option.',
    ][index],
    timeline: [
      'Invoice synced',
      index < 3 ? 'Payment link generated' : 'Payment link attempted',
      index === 4 ? 'Paid in Stripe' : 'Awaiting customer action',
    ],
  }));
}

function buildEntities(): EntityReceivables[] {
  return [
    {
      id: 'entity-us',
      entity: 'US SaaS LLC',
      region: 'North America',
      currency: 'USD',
      overdueAmount: 148150,
      collectionRate: 68,
      dso: 38,
      disputedAmount: 33800,
      owner: 'Rohit Sharma',
    },
    {
      id: 'entity-eu',
      entity: 'EU Services GmbH',
      region: 'EMEA',
      currency: 'EUR',
      overdueAmount: 84200,
      collectionRate: 74,
      dso: 34,
      disputedAmount: 12600,
      owner: 'Maya Iyer',
    },
    {
      id: 'entity-apac',
      entity: 'APAC Cloud Pte',
      region: 'APAC',
      currency: 'USD',
      overdueAmount: 53100,
      collectionRate: 71,
      dso: 36,
      disputedAmount: 8400,
      owner: 'Alex Tan',
    },
  ];
}

function buildGovernance(): GovernanceRule[] {
  return [
    {
      id: 'rule-approval-high',
      name: 'Human approval above $10k or strategic account',
      category: 'approval',
      status: 'active',
      automationLevel: 'Agent drafts, human approves',
      guardrail: 'Prevents autonomous action on high-value or renewal-sensitive accounts.',
      lastChanged: '2026-06-03',
    },
    {
      id: 'rule-credit-hold',
      name: 'Credit hold when utilization exceeds 95% and risk score exceeds 75',
      category: 'credit',
      status: 'active',
      automationLevel: 'Recommend hold',
      guardrail: 'Requires finance manager confirmation before blocking future orders.',
      lastChanged: '2026-06-02',
    },
    {
      id: 'rule-dispute-pause',
      name: 'Pause firm reminders on open disputes',
      category: 'compliance',
      status: 'active',
      automationLevel: 'Fully automatic',
      guardrail: 'Routes disputed invoices to deduction workflow before customer escalation.',
      lastChanged: '2026-06-01',
    },
    {
      id: 'rule-routing-region',
      name: 'Route EMEA invoices to regional owner',
      category: 'routing',
      status: 'draft',
      automationLevel: 'Draft mode',
      guardrail: 'Pending tax and language review.',
      lastChanged: '2026-05-30',
    },
    {
      id: 'rule-writeoff',
      name: 'Write-off requires CFO approval above $2,500',
      category: 'writeoff',
      status: 'needs_review',
      automationLevel: 'Policy check only',
      guardrail: 'Creates approval task and audit log before ledger posting.',
      lastChanged: '2026-05-29',
    },
  ];
}
