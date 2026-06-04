import React from 'react';
import Link from 'next/link';
import { CreditCard, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getEnterprisePlatformSnapshot } from '@/lib/enterprise/ar-platform';
import styles from '../enterprise.module.css';

export const dynamic = 'force-dynamic';

const statusTone = {
  created: styles.info,
  sent: styles.info,
  opened: styles.warning,
  paid: styles.success,
  failed: styles.danger,
};

export default function PaymentsPage() {
  const snapshot = getEnterprisePlatformSnapshot();
  const inFlight = snapshot.payments.filter((payment) => payment.linkStatus !== 'paid');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Payment Lifecycle</p>
          <h1 className={styles.title}><CreditCard size={24} /> Payment Link & Settlement Tracker</h1>
          <p className={styles.subtitle}>
            Follow every invoice from payment-link creation through customer open, processor result, ERP sync, and promise closure.
          </p>
        </div>
        <span className={styles.sourcePill}>Stripe-ready workflow</span>
      </header>

      <section className={styles.summaryGrid}>
        <Summary label="Links in flight" value={String(snapshot.summary.paymentLinksInFlight)} />
        <Summary label="Total link value" value={formatCurrency(inFlight.reduce((sum, item) => sum + item.amount, 0))} />
        <Summary label="Failed links" value={String(snapshot.payments.filter((item) => item.linkStatus === 'failed').length)} />
        <Summary label="Paid links" value={String(snapshot.payments.filter((item) => item.linkStatus === 'paid').length)} />
      </section>

      <section className={styles.tablePanel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Link status</th>
              <th>Processor</th>
              <th>Timeline</th>
              <th>Next action</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.payments.map((payment) => (
              <tr key={payment.id}>
                <td><span className={styles.strong}>{payment.customerName}</span><br /><span className={styles.muted}>{payment.invoiceNumber}</span></td>
                <td>{formatCurrency(payment.amount)}</td>
                <td><span className={`${styles.badge} ${statusTone[payment.linkStatus]}`}>{payment.linkStatus}</span></td>
                <td>{payment.processorStatus}</td>
                <td>{payment.timeline.join(' -> ')}</td>
                <td>{payment.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Customer Portal Connection</h2>
            <p className={styles.panelNote}>Every tracked link can land on the existing invoice portal while the backend logs send, open, failure, and paid events.</p>
          </div>
          <Link className={styles.actionLink} href="/portal/inv-001">View portal <ExternalLink size={14} /></Link>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className={styles.summaryCard}><span>{label}</span><strong>{value}</strong></div>;
}
