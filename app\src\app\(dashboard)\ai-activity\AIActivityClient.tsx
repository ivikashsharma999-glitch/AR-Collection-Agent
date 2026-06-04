'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Search,
} from 'lucide-react';
import { timeAgo } from '@/lib/mock-data';
import type { AuditLogRow } from '@/lib/operations/live-data';
import styles from './page.module.css';

const TABS = ['All', 'Reminders', 'Replies', 'Promises', 'Disputes', 'Payments', 'Escalations'];

export function AIActivityClient({ activity }: { activity: AuditLogRow[] }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivity = activity.filter(act => {
    if (searchQuery && !act.outcome?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeTab === 'All') return true;
    if (activeTab === 'Reminders' && act.action_type.includes('reminder')) return true;
    if (activeTab === 'Replies' && act.action_type.includes('reply')) return true;
    if (activeTab === 'Promises' && act.action_type.includes('promise')) return true;
    if (activeTab === 'Disputes' && act.action_type.includes('dispute')) return true;
    if (activeTab === 'Payments' && act.action_type.includes('payment')) return true;
    if (activeTab === 'Escalations' && act.action_type.includes('escalation')) return true;
    return false;
  });

  const getIcon = (type: string) => {
    if (type.includes('promise')) return <CheckCircle2 size={16} className={styles.iconSuccess} />;
    if (type.includes('dispute')) return <AlertCircle size={16} className={styles.iconDanger} />;
    if (type.includes('reminder') || type.includes('reply')) return <Mail size={16} className={styles.iconInfo} />;
    return <Clock size={16} className={styles.iconMuted} />;
  };

  const actionsToday = activity.filter((act) => isToday(act.created_at)).length;
  const emailsSent = activity.filter((act) => act.action_type.includes('reminder_sent')).length;
  const promisesCaptured = activity.filter((act) => act.action_type.includes('promise')).length;
  const disputesDetected = activity.filter((act) => act.action_type.includes('dispute')).length;

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.summaryBar}`}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{actionsToday}</div>
          <div className={styles.summaryLabel}>Actions today</div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{emailsSent}</div>
          <div className={styles.summaryLabel}>Emails sent</div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{promisesCaptured}</div>
          <div className={styles.summaryLabel}>Promises captured</div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{disputesDetected}</div>
          <div className={styles.summaryLabel}>Disputes detected</div>
        </div>
      </div>

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
            placeholder="Search activity..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.activityList}>
        {filteredActivity.length > 0 ? (
          filteredActivity.map((act, index) => (
            <div key={act.id} className={`glass-panel animate-fade-in stagger-${(index % 4) + 1} ${styles.activityCard}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <div className={styles.iconBox}>{getIcon(act.action_type)}</div>
                  <span className={styles.actionBadge}>
                    {act.action_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className={styles.timestamp}>{timeAgo(act.created_at)}</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.outcome}>{act.outcome}</div>
                <div className={styles.details}>
                  {Object.entries(act.details).map(([key, val]) => (
                    <span key={key} className={styles.detailTag}>
                      <span className={styles.detailKey}>{key}:</span> {String(val)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <FileText size={48} className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>No activity found</div>
            <div className={styles.emptySub}>Try adjusting your search or filters</div>
          </div>
        )}
      </div>
    </div>
  );
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
