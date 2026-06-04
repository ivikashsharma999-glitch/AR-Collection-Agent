import React from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import styles from '../../dashboard/page.module.css';
import { formatCurrency } from '@/lib/mock-data';
import { getLiveAccountDetail } from '@/lib/operations/live-data';
import Link from 'next/link';
import { SuppressButton } from '@/components/accounts/SuppressButton';

export const dynamic = 'force-dynamic';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Extract id from the dynamic route segment
  const { id } = await params;
  const detail = await getLiveAccountDetail(id);

  if (!detail) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Account Not Found</h1>
        </header>
      </div>
    );
  }

  const { customer, invoices: customerInvoices } = detail;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Link href="/accounts" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              &larr; Back to Accounts
            </Link>
          </div>
          <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {customer.name}
            {customer.strategic_flag && <Badge variant="brand">Strategic Account</Badge>}
          </h1>
          <p className={styles.subtitle}>{customer.email} • {customer.phone || 'No phone'}</p>
        </div>
        <div className={styles.headerActions}>
          <SuppressButton customerId={customer.id} customerName={customer.name} />
          <Button variant="primary">New Reminder</Button>
        </div>
      </header>

      <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Outstanding</span>
          </div>
          <div className={`${styles.kpiValue} number-display`}>
            {formatCurrency(customer.total_outstanding)}
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Payment Likelihood (ML)</span>
          </div>
          <div className={`${styles.kpiValue} number-display`} style={{ 
            color: (customer.propensity_score ?? 0) >= 80 ? 'var(--color-success)' :
                   (customer.propensity_score ?? 0) >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'
          }}>
            {customer.propensity_score !== undefined ? `${customer.propensity_score}%` : 'N/A'}
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Risk Segment</span>
          </div>
          <div className={styles.kpiValue} style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
            {customer.risk_segment ? (
              <Badge variant={
                customer.risk_segment === 'good_payer' ? 'success' :
                customer.risk_segment === 'low_risk' ? 'success' :
                customer.risk_segment === 'medium_risk' ? 'warning' : 'danger'
              } size="sm">
                {customer.risk_segment.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            ) : 'N/A'}
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Avg Days Late</span>
          </div>
          <div className={`${styles.kpiValue} number-display`}>
            {customer.behavioral_profile?.avg_days_late || 0}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <Card>
          <h2 className={styles.tableTitle} style={{ marginBottom: 'var(--space-4)' }}>Behavioral Profile</h2>
          {customer.behavioral_profile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pattern</span>
                <Badge>{customer.behavioral_profile.pay_pattern.replace(/_/g, ' ')}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Channel Pref</span>
                <span style={{ textTransform: 'capitalize' }}>{customer.behavioral_profile.response_channel_preference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Typical Reply</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {customer.behavioral_profile.typical_response_day || 'Unknown'} {customer.behavioral_profile.typical_response_time || ''}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)' }}>No profile data accumulated yet.</p>
          )}
        </Card>

        <Card padding="none" className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Open Invoices</h2>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customerInvoices.length > 0 ? customerInvoices.map(invoice => (
                  <tr key={invoice.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.invoiceInfo}>
                        <span className={styles.invoiceNumber}>{invoice.invoice_number}</span>
                        {invoice.days_overdue > 0 && <span className={styles.daysOverdue}>{invoice.days_overdue}d overdue</span>}
                      </div>
                    </td>
                    <td><span className="number-display">{formatCurrency(invoice.amount_due)}</span></td>
                    <td>
                      <Badge variant={invoice.status === 'overdue' ? 'warning' : invoice.status === 'disputed' ? 'danger' : 'info'}>
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-6)' }}>
                      No open invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
