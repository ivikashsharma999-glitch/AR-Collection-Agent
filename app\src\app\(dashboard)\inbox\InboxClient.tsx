'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { formatCurrency, timeAgo } from '@/lib/mock-data';
import type { ApprovalRow } from '@/lib/operations/live-data';
import type { Reminder } from '@/types';

type DeliveryStatus = 'not_attempted' | 'blocked_missing_provider' | 'ready_to_send';

type InboxApproval = ApprovalRow & {
  deliveryStatus?: DeliveryStatus;
  deliveryMessage?: string;
};

type ApprovalActionResult = {
  success: boolean;
  approvalId: string;
  action: 'approve' | 'reject';
  reminderId: string;
  reminderStatus: Reminder['status'];
  delivery?: {
    status: DeliveryStatus;
    message: string;
  };
};

const toneColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  soft: 'success',
  professional: 'info',
  firm: 'warning',
  escalation: 'danger',
};

const TABS = ['All', 'Routine', 'Escalations', 'Payment Plans', 'Settlements'];

export function InboxClient({ initialApprovals }: { initialApprovals: ApprovalRow[] }) {
  const [activeTab, setActiveTab] = useState('All');
  const [approvals, setApprovals] = useState<InboxApproval[]>(initialApprovals);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const source = approvals[0]?.source || 'mock';

  const filtered = approvals.filter(app => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Routine') return app.priority === 'normal' || app.priority === 'low';
    if (activeTab === 'Escalations') return app.priority === 'high' || app.priority === 'urgent';
    if (activeTab === 'Payment Plans') return app.reason === 'payment_plan_requested' || app.reason === 'high_amount';
    if (activeTab === 'Settlements') return false;
    return true;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  async function handleAction(id: string, action: 'approve' | 'reject') {
    const approval = approvals.find((item) => item.id === id);
    setActionMessage(null);
    let result: ApprovalActionResult | null = null;

    if (approval?.source === 'supabase') {
      const response = await fetch('/api/approvals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId: id, action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setActionMessage(payload.error || `Unable to ${action} approval.`);
        return;
      }

      result = payload as ApprovalActionResult;
    }

    setApprovals(prev =>
      prev.map(a => {
        if (a.id !== id) return a;

        const status = action === 'approve' ? 'approved' : 'rejected';
        const reminderStatus = result?.reminderStatus || (action === 'approve' ? 'approved' : 'recalled');

        return {
          ...a,
          status,
          reviewed_at: new Date().toISOString(),
          deliveryStatus: result?.delivery?.status || (action === 'approve' ? 'blocked_missing_provider' : 'not_attempted'),
          deliveryMessage: result?.delivery?.message || (
            action === 'approve'
              ? 'Reminder approved, but send is blocked until Gmail or Outlook is connected.'
              : 'Reminder rejected. No delivery attempted.'
          ),
          reminder: a.reminder ? { ...a.reminder, status: reminderStatus } : a.reminder,
        };
      })
    );
    setActionMessage(
      result?.delivery?.message ||
      `Approval ${action === 'approve' ? 'approved' : 'rejected'} and audit trail updated.`
    );
  }

  async function handleSyncLedger() {
    setIsSyncing(true);
    setSyncMessage(null);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const pendingApproval = approvals.find(a => a.status === 'pending');

    if (pendingApproval) {
      setApprovals(prev => prev.filter(a => a.id !== pendingApproval.id));
      setSyncMessage(`Ledger synced - 1 payment matched. Follow-up for ${pendingApproval.reminder?.customer?.name} auto-resolved.`);
    } else {
      setSyncMessage('Ledger synced - no new payments matched.');
    }

    setIsSyncing(false);
    setTimeout(() => setSyncMessage(null), 5000);
  }

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Approval Inbox</h1>
          <p className={styles.subtitle}>Review and approve agent-drafted messages before they are sent.</p>
          <p className={styles.sourceNote}>{source === 'supabase' ? 'Live Supabase approval queue' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.queueCount} glass-panel`}>
            <span className={styles.queueCountNum}>{pendingCount}</span> pending review
          </span>
          <Button
            variant="outline"
            onClick={handleSyncLedger}
            isLoading={isSyncing}
            disabled={isSyncing}
            className={styles.syncBtn}
          >
            Sync ERP
          </Button>
        </div>
      </header>

      {syncMessage && <div className={styles.syncBanner}>{syncMessage}</div>}
      {actionMessage && <div className={styles.syncBanner}>{actionMessage}</div>}

      <div className={styles.filterTabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.filterTab} ${activeTab === tab ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === 'All' && pendingCount > 0 && <> ({pendingCount})</>}
          </button>
        ))}
      </div>

      <div className={styles.cardsList}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✓</div>
            <h3 className={styles.emptyTitle}>All caught up!</h3>
            <p className={styles.emptySubtitle}>No items matching this filter.</p>
          </div>
        ) : (
          filtered.map(approval => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={(id) => handleAction(id, 'approve')}
              onReject={(id) => handleAction(id, 'reject')}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: InboxApproval;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const reminder = approval.reminder;
  if (!reminder) return null;

  const customer = reminder.customer;
  const invoice = reminder.invoice;
  const channel = reminder.channel || 'email';
  const isActioned = approval.status !== 'pending';
  const deliveryTone = approval.deliveryStatus === 'blocked_missing_provider'
    ? styles.deliveryBlocked
    : approval.deliveryStatus === 'ready_to_send'
      ? styles.deliveryReady
      : '';

  const initials = customer?.name
    ? customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const truncatedBody = reminder.body.length > 100
    ? reminder.body.slice(0, 100) + '...'
    : reminder.body;

  return (
    <div className={`${styles.card} ${isActioned ? styles.cardActioned : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.customerInfo}>
          <span className={styles.customerName}>{customer?.name || 'Unknown'}</span>
          <span className={styles.customerEmail}>
            {channel === 'sms' ? customer?.phone || 'No phone' : customer?.email || '-'}
          </span>
        </div>
        <div className={styles.headerBadges}>
          <span className={styles.channelBadge}>
            {channel === 'sms' ? 'SMS' : 'Email'}
          </span>
          <Badge variant={toneColors[reminder.tone] || 'default'} size="sm">
            {reminder.tone}
          </Badge>
          <span className={styles.queuedTime}>{timeAgo(approval.queued_at)}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        {approval.reason === 'payment_plan_requested' ? (
          <div className={styles.negotiationBox}>
            <div className={styles.negotiationHeader}>
              <span className={styles.negotiationTitle}>AI Proposed Payment Plan</span>
            </div>
            <div className={styles.negotiationDetails}>
              <div className={styles.planTerm}><strong>Payment 1:</strong> {formatCurrency((invoice?.amount_due || 0) / 2)} (Due this Friday)</div>
              <div className={styles.planTerm}><strong>Payment 2:</strong> {formatCurrency((invoice?.amount_due || 0) / 2)} (Due June 15th)</div>
            </div>
            <div className={styles.bodyPreview} style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>{truncatedBody}</div>
          </div>
        ) : (
          <>
            <div className={styles.subject}>
              {channel === 'sms' ? 'SMS Message' : reminder.subject}
            </div>
            <div className={styles.bodyPreview}>{truncatedBody}</div>
          </>
        )}
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Invoice</span>
          <span className={styles.metaValue}>{invoice?.invoice_number || '-'}</span>
        </span>
        <span className={styles.metaDivider} />
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Amount</span>
          <span className={styles.metaValue}>{invoice ? formatCurrency(invoice.amount_due) : '-'}</span>
        </span>
        <span className={styles.metaDivider} />
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Overdue</span>
          <span className={styles.metaValue}>{invoice?.days_overdue || 0}d</span>
        </span>
      </div>

      {isActioned && approval.deliveryMessage && (
        <div className={`${styles.deliveryState} ${deliveryTone}`}>
          <span className={styles.deliveryLabel}>
            {approval.deliveryStatus === 'blocked_missing_provider'
              ? 'Send blocked'
              : approval.deliveryStatus === 'ready_to_send'
                ? 'Ready to send'
                : 'Delivery'}
          </span>
          <span>{approval.deliveryMessage}</span>
        </div>
      )}

      <div className={styles.cardFooter}>
        {isActioned ? (
          <div className={styles.actionedFooter}>
            <Badge variant={approval.status === 'approved' ? 'success' : 'danger'}>
              {approval.status === 'approved' ? 'Approved' : 'Rejected'}
            </Badge>
            {approval.reviewed_at && (
              <span className={styles.reviewedAt}>Human review {timeAgo(approval.reviewed_at)}</span>
            )}
          </div>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => onReject(approval.id)}>
              Reject
            </Button>
            <Button variant="outline" size="sm">
              Edit Draft
            </Button>
            <Button variant="primary" size="sm" onClick={() => onApprove(approval.id)}>
              {approval.reason === 'payment_plan_requested' ? 'Approve Payment Plan' : 'Approve & Send'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
