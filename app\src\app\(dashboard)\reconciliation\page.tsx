import React from 'react';
import { DatabaseZap, RefreshCw } from 'lucide-react';
import { getEnterprisePlatformSnapshot } from '@/lib/enterprise/ar-platform';
import styles from '../enterprise.module.css';

export const dynamic = 'force-dynamic';

const statusTone = {
  healthy: styles.success,
  delayed: styles.warning,
  failed: styles.danger,
  reconciling: styles.info,
};

export default function ReconciliationPage() {
  const snapshot = getEnterprisePlatformSnapshot();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ERP & Reconciliation</p>
          <h1 className={styles.title}><DatabaseZap size={24} /> Ledger Sync Reliability Center</h1>
          <p className={styles.subtitle}>
            Track invoice, payment, lockbox, and email sync health so collectors know when the system of record can be trusted.
          </p>
        </div>
        <span className={styles.sourcePill}>Exception-aware sync</span>
      </header>

      <section className={styles.summaryGrid}>
        <Summary label="Systems monitored" value={String(snapshot.reconciliation.length)} />
        <Summary label="Exceptions" value={String(snapshot.summary.reconciliationExceptions)} />
        <Summary label="Healthy systems" value={String(snapshot.reconciliation.filter((item) => item.status === 'healthy').length)} />
        <Summary label="Failed systems" value={String(snapshot.reconciliation.filter((item) => item.status === 'failed').length)} />
      </section>

      <section className={styles.gridThree}>
        {snapshot.reconciliation.map((job) => (
          <article key={job.id} className={styles.insightCard}>
            <div className={styles.insightTop}>
              <div>
                <h3>{job.system}</h3>
                <p className={styles.muted}>{job.entity}</p>
              </div>
              <span className={`${styles.badge} ${statusTone[job.status]}`}>{job.status}</span>
            </div>
            <div className={styles.metricRow}>
              <Mini label="Records" value={String(job.recordsChecked)} />
              <Mini label="Exceptions" value={String(job.exceptions)} />
              <Mini label="Last run" value={formatDate(job.lastRun)} />
            </div>
            <p style={{ marginTop: '0.85rem' }}>{job.action}</p>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Collector Protection</h2>
            <p className={styles.panelNote}>Pages that rely on stale or failed syncs surface blockers instead of letting teams chase paid or invalid invoices.</p>
          </div>
          <RefreshCw size={18} />
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className={styles.summaryCard}><span>{label}</span><strong>{value}</strong></div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className={styles.miniMetric}><span>{label}</span><strong>{value}</strong></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric' }).format(new Date(value));
}
