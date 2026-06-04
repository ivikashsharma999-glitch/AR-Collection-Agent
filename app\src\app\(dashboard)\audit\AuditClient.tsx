'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button/Button';
import type { AuditLogRow } from '@/lib/operations/live-data';

export function AuditClient({ logs }: { logs: AuditLogRow[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const source = logs[0]?.source || 'mock';

  const filteredLogs = logs.filter(log =>
    log.outcome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Date', 'Time', 'Actor', 'Action Type', 'Outcome', 'Details'];

    const rows = filteredLogs.map(log => {
      const date = new Date(log.created_at);
      const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
      const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
      const actor = log.actor_type === 'agent' ? 'AI Agent' : log.actor_type === 'human' ? 'Human' : 'System';
      const outcome = log.outcome || '';
      const detailsStr = log.details
        ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : '';

      return [
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${actor}"`,
        `"${log.action_type}"`,
        `"${outcome.replace(/"/g, '""')}"`,
        `"${detailsStr.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Audit Log</h1>
          <p className={styles.subtitle}>Immutable record of all decisions and human overrides.</p>
          <p className={styles.sourceNote}>{source === 'supabase' ? 'Live Supabase action history' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search logs (e.g., invoice number, action type)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <Button variant="ghost" size="sm">Filter by Actor</Button>
          <Button variant="ghost" size="sm">Filter by Date</Button>
        </div>
      </div>

      <div className={styles.logList}>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            No logs found matching your search.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const date = new Date(log.created_at);
            const timeDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
            const timeClock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
            const actorLabel = log.actor_type === 'agent' ? 'AI Agent' : log.actor_type === 'human' ? 'Human' : 'System';

            return (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.timeCol}>
                  <span className={styles.timeDay}>{timeDay}</span>
                  <span className={styles.timeClock}>{timeClock}</span>
                </div>

                <div className={styles.contentCol}>
                  <div className={styles.outcomeRow}>
                    <span className={`${styles.actorBadge} ${log.actor_type === 'agent' ? styles.actorAgent : styles.actorHuman}`}>
                      {actorLabel}
                    </span>
                    <span className={styles.outcomeText}>{log.outcome}</span>
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className={styles.detailsInline}>
                      {Object.entries(log.details).map(([k, v], i, arr) => (
                        <React.Fragment key={k}>
                          <span className={styles.detailKey}>
                            {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                          </span>
                          <span className={styles.detailValue}>{String(v)}</span>
                          {i < arr.length - 1 && <span className={styles.detailSeparator}>|</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
