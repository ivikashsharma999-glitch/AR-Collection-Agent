import React from 'react';
import { ArrowRight, Banknote, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getEnterprisePlatformSnapshot } from '@/lib/enterprise/ar-platform';
import styles from '../enterprise.module.css';

export const dynamic = 'force-dynamic';

const toneByStatus = {
  auto_matched: styles.success,
  needs_review: styles.warning,
  short_pay: styles.info,
  unapplied: styles.danger,
};

export default function CashApplicationPage() {
  const snapshot = getEnterprisePlatformSnapshot();
  const totalReceived = snapshot.cashApplication.reduce((sum, item) => sum + item.receivedAmount, 0);
  const totalUnapplied = snapshot.cashApplication.reduce((sum, item) => sum + item.unappliedAmount, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Cash Application</p>
          <h1 className={styles.title}><Banknote size={24} /> Remittance Matching Command Center</h1>
          <p className={styles.subtitle}>
            Match bank deposits, lockbox files, and Stripe payments to open invoices with confidence scoring and exception routing.
          </p>
        </div>
        <span className={styles.sourcePill}>Demo intelligence layer</span>
      </header>

      <section className={styles.summaryGrid}>
        <Summary label="Auto-match rate" value={`${snapshot.summary.autoCashMatchRate}%`} />
        <Summary label="Cash received" value={formatCurrency(totalReceived)} />
        <Summary label="Unapplied cash" value={formatCurrency(totalUnapplied)} />
        <Summary label="Exceptions" value={String(snapshot.cashApplication.filter((item) => item.status !== 'auto_matched').length)} />
      </section>

      <section className={styles.gridTwo}>
        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Payer</th>
                <th>Remittance</th>
                <th>Match</th>
                <th>Status</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.cashApplication.map((item) => (
                <tr key={item.id}>
                  <td><span className={styles.strong}>{item.payer}</span><br /><span className={styles.muted}>{item.invoiceNumbers.join(', ') || 'No invoice match'}</span></td>
                  <td>{item.remittanceRef}<br /><span className={styles.muted}>{formatCurrency(item.receivedAmount)} received</span></td>
                  <td>
                    <span className={styles.strong}>{item.confidence}%</span>
                    <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${item.confidence}%` }} /></div>
                  </td>
                  <td><span className={`${styles.badge} ${toneByStatus[item.status]}`}>{item.status.replace(/_/g, ' ')}</span></td>
                  <td>{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Exception Flow</h2>
              <p className={styles.panelNote}>What the agent does before touching the ledger.</p>
            </div>
            <Search size={18} />
          </div>
          <div className={styles.stack}>
            <Insight title="1. Identify payer aliases" text="Normalize bank memo, customer legal name, ERP ID, and email domain before invoice matching." />
            <Insight title="2. Score remittance fit" text="Compare amount, invoice references, partial-pay patterns, and promise history." />
            <Insight title="3. Route short-pays" text="Send deduction-like variances to dispute validation instead of silently writing them off." />
            <a className={styles.actionLink} href="/deductions">Open deduction queue <ArrowRight size={14} /></a>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className={styles.summaryCard}><span>{label}</span><strong>{value}</strong></div>;
}

function Insight({ title, text }: { title: string; text: string }) {
  return <div className={styles.insightCard}><h3>{title}</h3><p>{text}</p></div>;
}
