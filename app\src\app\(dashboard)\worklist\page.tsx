import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Clock,
  FileText,
  ListChecks,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getCollectorWorklist, type CollectorWorklistItem } from '@/lib/operations/collector-worklist';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const categoryIcon = {
  approval: CheckSquare,
  dispute: ShieldAlert,
  promise: Clock,
  invoice: FileText,
  operations: AlertTriangle,
};

const categoryLabel = {
  approval: 'Approval',
  dispute: 'Dispute',
  promise: 'Promise',
  invoice: 'Invoice',
  operations: 'Operations',
};

export default async function CollectorWorklistPage() {
  const snapshot = await getCollectorWorklist();
  const sourceLabel = snapshot.source === 'supabase' ? 'Live Supabase worklist' : 'Demo fallback worklist';

  return (
    <div className={styles.container}>
      <header className={`glass-panel ${styles.headerPanel}`}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>
            <ListChecks size={24} />
            Collector Worklist
          </h1>
          <p className={styles.subtitle}>
            Agent-ranked next actions across approvals, disputes, promises, overdue invoices, and operational blockers.
          </p>
          <p className={styles.sourceNote}>{sourceLabel}</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/inbox" className={styles.secondaryButton}>
            Approvals <ArrowRight size={14} />
          </Link>
          <Link href="/operations" className={styles.primaryButton}>
            Health <SlidersHorizontal size={14} />
          </Link>
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="Worklist summary">
        <Stat label="Value in queue" value={formatCurrency(snapshot.stats.totalAtRisk)} tone="info" />
        <Stat label="Urgent actions" value={String(snapshot.stats.urgentCount)} tone="danger" />
        <Stat label="Blocked actions" value={String(snapshot.stats.blockedCount)} tone="warning" />
        <Stat label="Human approvals" value={String(snapshot.stats.approvalCount)} tone="success" />
      </section>

      <section className={styles.commandStrip}>
        <div>
          <span className={styles.commandLabel}>Recommended operating rhythm</span>
          <strong>Clear blockers, resolve disputes, approve drafts, then chase high-score invoices.</strong>
        </div>
        <div className={styles.commandPills}>
          <span>{snapshot.stats.disputeCount} disputes</span>
          <span>{snapshot.stats.promiseCount} promises</span>
        </div>
      </section>

      <section className={styles.worklist}>
        {snapshot.items.map((item) => (
          <WorklistCard key={item.id} item={item} />
        ))}
      </section>
    </div>
  );
}

function WorklistCard({ item }: { item: CollectorWorklistItem }) {
  const Icon = categoryIcon[item.category];

  return (
    <article className={`${styles.itemCard} ${styles[`tone_${item.tone}`]}`}>
      <div className={styles.rankCol}>
        <span className={styles.rankNumber}>{item.rank}</span>
      </div>

      <div className={styles.itemMain}>
        <div className={styles.itemTop}>
          <div className={styles.categoryLine}>
            <span className={styles.categoryBadge}>
              <Icon size={13} />
              {categoryLabel[item.category]}
            </span>
            <span className={`${styles.priorityBadge} ${styles[`priority_${item.priority}`]}`}>
              {item.priority}
            </span>
            <span className={styles.statusText}>{item.statusLabel}</span>
          </div>
          <div className={styles.scoreBlock}>
            <span>{Math.round(item.score)}</span>
            <small>score</small>
          </div>
        </div>

        <div className={styles.itemBody}>
          <div className={styles.itemCopy}>
            <h2 className={styles.itemTitle}>{item.title}</h2>
            <p className={styles.customerLine}>
              {item.customerName}
              {item.invoiceNumber && <span>{item.invoiceNumber}</span>}
            </p>
            <p className={styles.recommendation}>{item.recommendedAction}</p>
          </div>

          <div className={styles.metrics}>
            <Metric label="At risk" value={item.amountAtRisk ? formatCurrency(item.amountAtRisk) : '-'} />
            <Metric label="Overdue" value={item.daysOverdue ? `${item.daysOverdue}d` : '-'} />
            <Metric label="Recovery" value={item.recoveryProbability ? `${item.recoveryProbability}%` : '-'} />
          </div>
        </div>

        <div className={styles.rationaleRow}>
          {item.rationale.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>

        {item.blockers.length > 0 && (
          <div className={styles.blockerRow}>
            <AlertTriangle size={14} />
            <span>{item.blockers[0]}</span>
          </div>
        )}
      </div>

      <div className={styles.actionCol}>
        <Link href={item.primaryHref} className={styles.primaryAction}>
          {item.primaryLabel} <ArrowRight size={14} />
        </Link>
        {item.secondaryHref && item.secondaryLabel && (
          <Link href={item.secondaryHref} className={styles.secondaryAction}>
            {item.secondaryLabel}
          </Link>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'info' | 'danger' | 'warning' | 'success' }) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${tone}`]}`}>
      <span className={styles.statLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
