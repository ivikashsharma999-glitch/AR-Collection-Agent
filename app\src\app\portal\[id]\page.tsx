'use client';

import React, { useState } from 'react';
import { CreditCard, Building2, Lock, ArrowRight, Download, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import styles from './page.module.css';

// Mock data for the portal since we don't have a real backend fetching [id]
const mockInvoice = {
  id: 'INV-2026-0158',
  customerName: 'Momentum Labs',
  issueDate: '2026-03-20',
  dueDate: '2026-04-20',
  amountDue: 12400.00,
  status: 'overdue',
  items: [
    { desc: 'Enterprise SaaS License (Annual)', qty: 1, rate: 10000.00, amount: 10000.00 },
    { desc: 'Premium Support SLA', qty: 1, rate: 2400.00, amount: 2400.00 },
  ]
};

export default function CustomerPortal({ params }: { params: { id: string } }) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'ach'>('card');
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const invoiceId = params.id || mockInvoice.id;

  // In a real app, you would fetch the invoice using params.id

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaid(true);
    }, 2000);
  };

  if (paid) {
    return (
      <div className={styles.container}>
        <div className={styles.main} style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className={styles.paymentCard} style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
              ✓
            </div>
            <h2 className={styles.paymentTitle}>Payment Successful</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Thank you! Your payment of {formatCurrency(mockInvoice.amountDue)} for invoice {invoiceId} has been processed. A receipt has been emailed to you.
            </p>
            <button className={styles.stripeBtn} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
              <Download size={18} /> Download Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Public Header */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>AR</div>
          <div className={styles.logoText}>CollectionsOS</div>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <HelpCircle size={18} /> Need Help?
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.invoiceWrapper}>
          
          {/* Left: Invoice Paper */}
          <div className={styles.invoicePaper}>
            <div className={styles.statusBadge}>Overdue</div>
            
            <div className={styles.invoiceHeader}>
              <h1 className={styles.invoiceTitle}>Invoice {invoiceId}</h1>
              <div className={styles.invoiceMeta}>
                <div className={styles.metaBlock}>
                  <span className={styles.metaLabel}>Billed To</span>
                  <span className={styles.metaValue}>{mockInvoice.customerName}</span>
                </div>
                <div className={styles.metaBlock}>
                  <span className={styles.metaLabel}>Issue Date</span>
                  <span className={styles.metaValue}>{mockInvoice.issueDate}</span>
                </div>
                <div className={styles.metaBlock}>
                  <span className={styles.metaLabel}>Due Date</span>
                  <span className={styles.metaValue} style={{ color: 'var(--color-danger)' }}>{mockInvoice.dueDate}</span>
                </div>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={styles.itemDesc}>{item.desc}</td>
                    <td style={{ textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(mockInvoice.amountDue)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total Due</span>
                <span>{formatCurrency(mockInvoice.amountDue)}</span>
              </div>
            </div>
          </div>

          {/* Right: Payment Panel */}
          <div className={styles.paymentPanel}>
            <div className={styles.paymentCard}>
              <h3 className={styles.paymentTitle}>Payment Method</h3>
              
              <div className={styles.paymentOptions}>
                <div 
                  className={`${styles.paymentOption} ${selectedMethod === 'card' ? styles.selected : ''}`}
                  onClick={() => setSelectedMethod('card')}
                >
                  <div className={styles.optionLeft}>
                    <CreditCard size={20} color={selectedMethod === 'card' ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                    Credit Card
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--brand-primary)', background: selectedMethod === 'card' ? 'var(--brand-primary)' : 'transparent', boxShadow: selectedMethod === 'card' ? 'inset 0 0 0 3px var(--bg-surface)' : 'none' }} />
                </div>

                <div 
                  className={`${styles.paymentOption} ${selectedMethod === 'ach' ? styles.selected : ''}`}
                  onClick={() => setSelectedMethod('ach')}
                >
                  <div className={styles.optionLeft}>
                    <Building2 size={20} color={selectedMethod === 'ach' ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                    Bank Transfer (ACH)
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--brand-primary)', background: selectedMethod === 'ach' ? 'var(--brand-primary)' : 'transparent', boxShadow: selectedMethod === 'ach' ? 'inset 0 0 0 3px var(--bg-surface)' : 'none' }} />
                </div>
              </div>

              <button className={styles.stripeBtn} onClick={handlePay} disabled={isPaying}>
                {isPaying ? 'Processing...' : `Pay ${formatCurrency(mockInvoice.amountDue)}`} <ArrowRight size={18} />
              </button>

              <div className={styles.secureText}>
                <Lock size={12} /> Payments are secure and encrypted via Stripe.
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
