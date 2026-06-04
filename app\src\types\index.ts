// ============================================
// AR Collections Agent — Type Definitions
// ============================================

export interface Organization {
  id: string;
  name: string;
  qb_realm_id?: string;
  qb_connected: boolean;
  gmail_connected: boolean;
  outlook_connected: boolean;
  send_from_email?: string;
  reply_to_email?: string;
  approval_threshold_amount: number;
  max_touches_per_week: number;
  auto_send_confidence_threshold: number;
  timezone: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member';
  avatar_url?: string;
  created_at: string;
}

export type RiskSegment = 'good_payer' | 'low_risk' | 'medium_risk' | 'high_risk' | 'chronic_late';

export interface Customer {
  id: string;
  org_id: string;
  qb_customer_id?: string;
  name: string;
  email?: string;
  secondary_emails: string[];
  phone?: string;
  strategic_flag: boolean;
  renewal_date?: string;
  internal_owner_id?: string;
  internal_owner_name?: string;
  notes?: string;
  total_outstanding: number;
  invoice_count: number;
  propensity_score?: number; // 0-100% Payment Likelihood
  risk_segment?: RiskSegment;
  behavioral_profile?: BehavioralProfile;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'overdue' | 'promised' | 'disputed' | 'paid' | 'written_off' | 'pending';

export interface Invoice {
  id: string;
  org_id: string;
  customer_id: string;
  customer?: Customer;
  qb_invoice_id?: string;
  invoice_number: string;
  amount: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  status: InvoiceStatus;
  priority_score: number;
  propensity_score?: number; // Invoice-specific payment likelihood
  risk_segment?: RiskSegment;
  pay_now_link?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'suppressed';
export type ChannelType = 'email' | 'sms' | 'call';

export interface Conversation {
  id: string;
  org_id: string;
  customer_id: string;
  customer?: Customer;
  invoice_ids: string[];
  email_thread_id?: string;
  channel: ChannelType;
  status: ConversationStatus;
  last_activity_at: string;
  created_at: string;
}

export type ReminderTone = 'soft' | 'professional' | 'firm' | 'escalation';
export type ReminderStatus = 'draft' | 'queued' | 'approved' | 'sent' | 'recalled';

export interface Reminder {
  id: string;
  org_id: string;
  conversation_id: string;
  customer_id: string;
  customer?: Customer;
  invoice_id: string;
  invoice?: Invoice;
  channel: ChannelType;
  subject: string;
  body: string;
  tone: ReminderTone;
  template_id?: string;
  confidence_score: number;
  status: ReminderStatus;
  drafted_at: string;
  queued_at?: string;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  recalled_at?: string;
}

export type ReplyClassification =
  | 'promise_to_pay'
  | 'dispute'
  | 'already_paid'
  | 'partial_pay'
  | 'no_intent'
  | 'unclear'
  | 'opt_out';

export interface Reply {
  id: string;
  org_id: string;
  conversation_id: string;
  customer_id: string;
  customer?: Customer;
  received_at: string;
  from_email: string;
  subject: string;
  raw_body: string;
  cleaned_body?: string;
  classification: ReplyClassification;
  intent_detail?: string;
  confidence_score: number;
  reviewed_by?: string;
  reviewed_at?: string;
}

export type PromiseStatus = 'pending' | 'fulfilled' | 'broken';

export interface PromiseToPay {
  id: string;
  org_id: string;
  customer_id: string;
  customer?: Customer;
  invoice_id: string;
  invoice?: Invoice;
  reply_id: string;
  promised_amount: number;
  promised_date: string;
  status: PromiseStatus;
  captured_at: string;
  fulfilled_at?: string;
  broken_at?: string;
}

export type DisputeReasonTag =
  | 'pricing_error'
  | 'already_paid'
  | 'service_issue'
  | 'contract_dispute'
  | 'wrong_contact'
  | 'DED-01: Already Paid'
  | 'DED-04: Pricing Mismatch'
  | 'DED-07: Wrong Entity'
  | 'DED-09: SLA Failure'
  | 'other';

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'escalated';

export interface Dispute {
  id: string;
  org_id: string;
  customer_id: string;
  customer?: Customer;
  invoice_id: string;
  invoice?: Invoice;
  reply_id: string;
  reason_tag: DisputeReasonTag;
  description: string;
  status: DisputeStatus;
  assigned_to?: string;
  resolution_note?: string;
  opened_at: string;
  resolved_at?: string;
}

export type ActionType =
  | 'reminder_drafted'
  | 'reminder_sent'
  | 'reminder_recalled'
  | 'send_blocked'
  | 'send_failed'
  | 'sync_failed'
  | 'reply_received'
  | 'reply_classified'
  | 'promise_captured'
  | 'promise_fulfilled'
  | 'promise_broken'
  | 'dispute_flagged'
  | 'dispute_resolved'
  | 'escalation_created'
  | 'approval_granted'
  | 'approval_rejected'
  | 'invoice_synced'
  | 'account_suppressed'
  | 'back_off_triggered';

export interface ActionHistory {
  id: string;
  org_id: string;
  action_type: ActionType;
  customer_id?: string;
  customer?: Customer;
  invoice_id?: string;
  invoice?: Invoice;
  conversation_id?: string;
  actor_type: 'agent' | 'human' | 'system';
  actor_id?: string;
  details: Record<string, unknown>;
  outcome?: string;
  created_at: string;
}

export type ApprovalReason =
  | 'high_amount'
  | 'strategic_account'
  | 'low_confidence'
  | 'first_contact'
  | 'open_dispute'
  | 'payment_plan_requested'
  | 'renewal_proximity'
  | 'legal_sensitive';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Approval {
  id: string;
  org_id: string;
  reminder_id: string;
  reminder?: Reminder;
  reason: ApprovalReason;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: ApprovalStatus;
  queued_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  override_note?: string;
}

export type PayPattern = 'always_on_time' | 'usually_late' | 'chronic_late' | 'unpredictable';

export interface BehavioralProfile {
  id: string;
  org_id: string;
  customer_id: string;
  pay_pattern: PayPattern;
  avg_days_late: number;
  total_invoices_paid: number;
  total_invoices_disputed: number;
  dispute_rate: number;
  response_channel_preference: string;
  typical_response_day?: string;
  typical_response_time?: string;
  payment_cycle_day?: number;
  notes?: string;
  updated_at: string;
}

export type DataIssueType =
  | 'missing_email'
  | 'duplicate_invoice'
  | 'zero_amount'
  | 'stale_record'
  | 'missing_po'
  | 'already_paid_mismatch';

export interface DataIssue {
  id: string;
  org_id: string;
  customer_id: string;
  invoice_id?: string;
  issue_type: DataIssueType;
  description: string;
  status: 'open' | 'resolved' | 'ignored';
  resolved_at?: string;
  created_at: string;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  total_overdue: number;
  total_overdue_amount: number;
  recovered_this_month: number;
  promises_pending: number;
  promises_pending_amount: number;
  disputes_open: number;
  approval_queue_count: number;
  avg_days_overdue: number;
  collection_rate: number;
}

// ── Priority Score Breakdown ──
export interface PriorityBreakdown {
  age_score: number;
  amount_score: number;
  history_score: number;
  dispute_score: number;
  renewal_score: number;
  total: number;
}

// ── Non-payment Diagnosis ──
export type DiagnosisReason =
  | 'forgot_or_missed'
  | 'cash_flow_problem'
  | 'approval_stuck'
  | 'genuine_dispute'
  | 'relationship_cold'
  | 'financial_trouble'
  | 'tracking_error';

export interface Diagnosis {
  reason: DiagnosisReason;
  confidence: number;
  signals: string[];
  recommended_action: string;
  recommended_tone: ReminderTone;
}

// ── V3 Entities ──

export interface Communication {
  id: string;
  org_id: string;
  customer_id: string;
  customer?: Customer;
  channel: ChannelType;
  direction: 'outbound' | 'inbound';
  subject?: string;
  preview: string;
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  timestamp: string;
  thread_id?: string;
  ai_summary?: string;
}

export type RecommendationType = 'recover_now' | 'escalate' | 'payment_plan' | 'risk_alert';

export interface Recommendation {
  id: string;
  org_id: string;
  customer_id: string;
  customer?: Customer;
  type: RecommendationType;
  title: string;
  description: string;
  amount_at_risk: number;
  recovery_probability: number;
  action_label: string;
  created_at: string;
}

export interface CashForecast {
  period: 'today' | '7_days' | '30_days' | 'quarter';
  expected_amount: number;
  best_case_amount: number;
  worst_case_amount: number;
  confidence_percentage: number;
}

export interface AgentMetrics {
  actions_today: number;
  emails_sent: number;
  promises_captured: number;
  disputes_detected: number;
  auto_resolved: number;
}
