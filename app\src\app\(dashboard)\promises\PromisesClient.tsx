'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  Download,
  Search,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { PromiseRow } from '@/lib/operations/live-data';
import styles from './page.module.css';

const TABS = ['All', 'Pending', 'Fulfilled', 'Broken'];

export function PromisesClient({ promises }: { promises: PromiseRow[] }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const source = promises[0]?.source || 'mock';

  const filteredPromises = promises.filter(prom => {
    if (searchQuery && !prom.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeTab === 'All') return true;
    return prom.status.toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'broken': return <span className="badge badge-danger">Broken</span>;
      case 'pending': return <span className="badge badge-warning">Pending</span>;
      case 'fulfilled': return <span className="badge badge-success">Fulfilled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getDaysUntilDue = (dateStr: string) => {
    const due = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span className={styles.textDanger}>Past Due</span>;
    if (diff === 0) return <span className={styles.textWarning}>Due Today</span>;
    return `${diff} days`;
  };

  const totalPromised = promises.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.promised_amount, 0);
  const brokenCount = promises.filter(p => p.status === 'broken').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><CalendarCheck size={24} /> Promises to Pay</h1>
          <p className={styles.sourceNote}>{source === 'supabase' ? 'Live Supabase promises' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn}><Download size={16} /> Export</button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className="glass-panel metric-card animate-fade-in stagger-1">
          <div className="section-label">Active Promises</div>
          <div className={styles.kpiValue}>{formatCurrency(totalPromised)}</div>
          <div className={styles.kpiSub}>Expecting to clear this week</div>
        </div>
        <div className="glass-panel metric-card animate-fade-in stagger-2">
          <div className="section-label">Broken Promises</div>
          <div className={styles.kpiValue} style={{ color: 'var(--color-danger)' }}>{brokenCount}</div>
          <div className={styles.kpiSub}>Action required immediately</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.searchContainer}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by customer..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Invoice #</th>
                <th>Promised Amount</th>
                <th>Promised Date</th>
                <th>Countdown</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromises.map(prom => (
                <tr key={prom.id}>
                  <td className={styles.cellBold}>{prom.customer?.name}</td>
                  <td>{prom.invoice?.invoice_number}</td>
                  <td className="number-display font-medium">{formatCurrency(prom.promised_amount)}</td>
                  <td>{formatDate(prom.promised_date)}</td>
                  <td>{prom.status === 'pending' ? getDaysUntilDue(prom.promised_date) : '-'}</td>
                  <td>{getStatusBadge(prom.status)}</td>
                  <td>
                    {prom.status === 'broken' ? (
                      <button className={styles.dangerBtn}><AlertCircle size={14} /> Escalate</button>
                    ) : (
                      <button className={styles.actionBtn}>View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPromises.length === 0 && (
            <div className={styles.emptyState}>No promises match your criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}
