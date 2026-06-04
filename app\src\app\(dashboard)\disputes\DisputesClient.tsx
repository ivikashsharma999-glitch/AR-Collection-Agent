'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  Plus,
  Search,
} from 'lucide-react';
import { formatCurrency, timeAgo } from '@/lib/mock-data';
import type { DisputeRow } from '@/lib/operations/live-data';
import styles from './page.module.css';

const COLUMNS = [
  { id: 'open', title: 'New' },
  { id: 'investigating', title: 'Investigating' },
  { id: 'escalated', title: 'Escalated' },
  { id: 'resolved', title: 'Resolved' }
];

export function DisputesClient({ disputes }: { disputes: DisputeRow[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const source = disputes[0]?.source || 'mock';

  const getReasonBadge = (reason: string) => {
    if (reason.startsWith('DED-')) {
      const parts = reason.split(':');
      const code = parts[0].trim();
      const desc = parts[1]?.trim() || '';

      let colorClass = styles.tagOther;
      if (code === 'DED-04') colorClass = styles.tagPricing;
      if (code === 'DED-09') colorClass = styles.tagService;
      if (code === 'DED-01') colorClass = styles.tagPaid;
      if (code === 'DED-07') colorClass = styles.tagContact;

      return (
        <span className={`${styles.deductionTag} ${colorClass}`} title="Auto-tagged by AI">
          <span className={styles.deductionCode}>{code}</span>
          <span className={styles.deductionDesc}>{desc}</span>
        </span>
      );
    }
    return <span className={styles.tagOther}>{reason}</span>;
  };

  const filteredDisputes = disputes.filter(d => {
    if (searchQuery && !d.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><AlertTriangle size={24} /> Disputes Workflow</h1>
          <p className={styles.sourceNote}>{source === 'supabase' ? 'Live Supabase disputes' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchContainer}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search customers..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.primaryBtn}><Plus size={16} /> Log Dispute</button>
        </div>
      </div>

      <div className={styles.kanbanBoard}>
        {COLUMNS.map(col => {
          const columnDisputes = filteredDisputes.filter(d => d.status === col.id);

          return (
            <div key={col.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <h3 className={styles.columnTitle}>{col.title}</h3>
                <span className={styles.columnCount}>{columnDisputes.length}</span>
              </div>

              <div className={styles.columnBody}>
                {columnDisputes.map((dispute, idx) => (
                  <div key={dispute.id} className={`glass-panel animate-fade-in stagger-${(idx % 4) + 1} ${styles.card}`}>
                    <div className={styles.cardHeader}>
                      {getReasonBadge(dispute.reason_tag)}
                      <span className={styles.cardAmount}>{formatCurrency(dispute.invoice?.amount_due || 0)}</span>
                    </div>

                    <div className={styles.cardCustomer}>{dispute.customer?.name}</div>
                    <div className={styles.cardInvoice}>Inv: {dispute.invoice?.invoice_number}</div>

                    <div className={styles.cardDesc}>{dispute.description}</div>

                    <div className={styles.cardFooter}>
                      <div className={styles.cardMeta}>
                        <Clock size={12} /> {timeAgo(dispute.opened_at)}
                      </div>
                      <button className={styles.iconBtn}><MessageSquare size={14} /></button>
                    </div>
                  </div>
                ))}

                {columnDisputes.length === 0 && (
                  <div className={styles.emptyColumn}>No items</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
