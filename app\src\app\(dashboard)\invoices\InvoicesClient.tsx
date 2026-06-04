'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Filter,
  Mail,
  Search,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/mock-data';
import type { InvoiceRow } from '@/lib/operations/live-data';
import styles from './page.module.css';

const TABS = ['All', 'Due Today', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];

export function InvoicesClient({ invoices }: { invoices: InvoiceRow[] }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const source = invoices[0]?.source || 'mock';

  const filteredInvoices = invoices.filter(inv => {
    if (
      searchQuery &&
      !inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inv.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    if (activeTab === 'All') return true;
    if (activeTab === 'Due Today' && inv.days_overdue === 0) return true;
    if (activeTab === '1-30 Days' && inv.days_overdue > 0 && inv.days_overdue <= 30) return true;
    if (activeTab === '31-60 Days' && inv.days_overdue > 30 && inv.days_overdue <= 60) return true;
    if (activeTab === '61-90 Days' && inv.days_overdue > 60 && inv.days_overdue <= 90) return true;
    if (activeTab === '90+ Days' && inv.days_overdue > 90) return true;
    return false;
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedInvoices);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedInvoices(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(i => i.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'overdue': return <span className="badge badge-danger">Overdue</span>;
      case 'promised': return <span className="badge badge-warning">Promised</span>;
      case 'disputed': return <span className="badge badge-brand">Disputed</span>;
      case 'paid': return <span className="badge badge-success">Paid</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><FileSpreadsheet size={24} /> Invoices</h1>
          <p className={styles.sourceNote}>{source === 'supabase' ? 'Live Supabase receivables' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn}><Filter size={16} /> Filters</button>
          <button className={styles.outlineBtn}><Download size={16} /> Export</button>
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
              placeholder="Search invoice # or customer..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {selectedInvoices.size > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.selectedCount}>{selectedInvoices.size} selected</span>
            <div className={styles.bulkBtns}>
              <button className={styles.primaryBtn}><Mail size={14} /> Send Reminders</button>
              <button className={styles.dangerBtn}><AlertTriangle size={14} /> Escalate</button>
            </div>
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedInvoices.size === filteredInvoices.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Overdue</th>
                <th>Status</th>
                <th>Priority Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className={selectedInvoices.has(inv.id) ? styles.rowSelected : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedInvoices.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                    />
                  </td>
                  <td className={styles.cellBold}>{inv.invoice_number}</td>
                  <td>{inv.customer?.name || 'Unknown'}</td>
                  <td className="number-display font-medium">{formatCurrency(inv.amount_due)}</td>
                  <td>{formatDate(inv.due_date)}</td>
                  <td className={inv.days_overdue > 30 ? styles.textDanger : ''}>
                    {inv.days_overdue} days
                  </td>
                  <td>{getStatusBadge(inv.status)}</td>
                  <td>
                    <div className={styles.scoreContainer}>
                      <div className={styles.scoreTrack}>
                        <div
                          className={styles.scoreFill}
                          style={{
                            width: `${inv.priority_score}%`,
                            backgroundColor: inv.priority_score > 80 ? 'var(--color-danger)' :
                                           inv.priority_score > 50 ? 'var(--color-warning)' : 'var(--color-success)'
                          }}
                        />
                      </div>
                      <span className={styles.scoreText}>{inv.priority_score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className={styles.emptyState}>No invoices match your criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}
