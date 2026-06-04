import React from 'react';
import { FileWarning, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getEnterprisePlatformSnapshot } from '@/lib/enterprise/ar-platform';
import styles from '../enterprise.module.css';

export const dynamic = 'force-dynamic';

const statusTone = {
  open: styles.danger,
  validating: styles.warning,
  approved_credit: styles.success,
  rejected: styles.info,
};

export default function DeductionsPage() {
  const snapshot = getEnterprisePlatformSnapshot();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Deduction Management</p>
          <h1 className={styles.title}><FileWarning size={24} /> Dispute-to-Deduction Workbench</h1>
          <p className={styles.subtitle}>
            Convert customer short-pay claims into coded deductions with owner assignment, evidence, credit memo readiness, and collection holds.
          </p>
        </div>
        <span className={styles.sourcePill}>AI tagged deduction codes</span>
      </header>

      <section className={styles.summaryGrid}>
        <Summary label="Cases" value={String(snapshot.deductions.length)} />
        <Summary label="Claimed exposure" value={formatCurrency(snapshot.summary.deductionsAtRisk)} />
        <Summary label="Needs validation" value={String(snapshot.deductions.filter((item) => item.status !== 'approved_credit').length)} />
        <Summary label="Avg confidence" value={`${Math.round(snapshot.deductions.reduce((sum, item) => sum + item.confidence, 0) / snapshot.deductions.length)}%`} />
      </section>

      <section className={styles.gridThree}>
        {snapshot.deductions.map((deduction) => (
          <article key={deduction.id} className={styles.insightCard}>
            <div className={styles.insightTop}>
              <div>
                <h3>{deduction.customerName}</h3>
                <p className={styles.muted}>{deduction.invoiceNumber} | {deduction.code}</p>
              </div>
              <span className={`${styles.badge} ${statusTone[deduction.status]}`}>{deduction.status.replace(/_/g, ' ')}</span>
            </div>
            <div className={styles.metricRow}>
              <Mini label="Claim" value={formatCurrency(deduction.claimedAmount)} />
              <Mini label="AI confidence" value={`${deduction.confidence}%`} />
              <Mini label="Owner" value={deduction.owner} />
            </div>
            <p style={{ marginTop: '0.8rem' }}>{deduction.nextStep}</p>
            <ul className={styles.list}>
              {deduction.evidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Collections Guardrail</h2>
            <p className={styles.panelNote}>Open deductions pause firm reminders and route customers to resolution-first communication.</p>
          </div>
          <ShieldCheck size={18} />
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
