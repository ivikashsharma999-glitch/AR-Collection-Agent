import React from 'react';
import { Gauge, LockKeyhole, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getEnterprisePlatformSnapshot } from '@/lib/enterprise/ar-platform';
import styles from '../enterprise.module.css';

export const dynamic = 'force-dynamic';

const decisionTone = {
  hold: styles.danger,
  reduce: styles.warning,
  monitor: styles.info,
  expand: styles.success,
};

export default function CreditRiskPage() {
  const snapshot = getEnterprisePlatformSnapshot();
  const holdCount = snapshot.creditRisk.filter((item) => item.decision === 'hold').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Credit Risk</p>
          <h1 className={styles.title}><Gauge size={24} /> Credit Limit & Exposure Intelligence</h1>
          <p className={styles.subtitle}>
            Score customer exposure using payment behavior, dispute frequency, strategic context, and overdue utilization before new orders ship.
          </p>
        </div>
        <span className={styles.sourcePill}>Risk model v1</span>
      </header>

      <section className={styles.summaryGrid}>
        <Summary label="Credit exposure" value={formatCurrency(snapshot.summary.creditExposure)} />
        <Summary label="Hold candidates" value={String(holdCount)} />
        <Summary label="Avg utilization" value={`${Math.round(snapshot.creditRisk.reduce((sum, item) => sum + item.utilization, 0) / snapshot.creditRisk.length)}%`} />
        <Summary label="Policy coverage" value="100%" />
      </section>

      <section className={styles.tablePanel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Account</th>
              <th>Exposure</th>
              <th>Utilization</th>
              <th>Risk</th>
              <th>Decision</th>
              <th>Signals</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.creditRisk.map((account) => (
              <tr key={account.id}>
                <td><span className={styles.strong}>{account.customerName}</span><br /><span className={styles.muted}>Recommended limit {formatCurrency(account.recommendedLimit)}</span></td>
                <td>{formatCurrency(account.exposure)}<br /><span className={styles.muted}>Limit {formatCurrency(account.creditLimit)}</span></td>
                <td>
                  <span className={styles.strong}>{account.utilization}%</span>
                  <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.min(account.utilization, 100)}%` }} /></div>
                </td>
                <td>{account.riskScore}</td>
                <td><span className={`${styles.badge} ${decisionTone[account.decision]}`}>{account.decision}</span></td>
                <td>{account.signals.join(' | ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.gridTwo}>
        <div className={styles.insightCard}>
          <h3><LockKeyhole size={16} /> Credit hold governance</h3>
          <p>Recommended holds create manager approval tasks and audit entries before any ERP credit block is posted.</p>
        </div>
        <div className={styles.insightCard}>
          <h3><TrendingUp size={16} /> Expansion intelligence</h3>
          <p>Good payers with low utilization are surfaced for safer account growth instead of only being chased when overdue.</p>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className={styles.summaryCard}><span>{label}</span><strong>{value}</strong></div>;
}
