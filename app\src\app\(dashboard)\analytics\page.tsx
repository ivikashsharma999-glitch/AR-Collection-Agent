import React from 'react';
import {
  Activity,
  ArrowRight,
  BarChart2,
  Calendar,
  Download,
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getLiveAnalytics } from '@/lib/operations/live-data';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const stats = await getLiveAnalytics();
  const totalAging = Math.max(1, stats.agingData.reduce((acc, curr) => acc + curr.amount, 0));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><BarChart2 size={24} /> Executive Analytics</h1>
          <p className={styles.sourceNote}>{stats.source === 'supabase' ? 'Live Supabase analytics' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn}><Calendar size={16} /> Last 30 Days</button>
          <button className={styles.outlineBtn}><Download size={16} /> Export Report</button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className="glass-panel metric-card animate-fade-in stagger-1">
          <div className="section-label">Collection Rate</div>
          <div className={styles.kpiValue}>{(stats.collectionRate * 100).toFixed(1)}%</div>
          <div className={styles.kpiSub}>Target: 75%</div>
        </div>
        <div className="glass-panel metric-card animate-fade-in stagger-2">
          <div className="section-label">Total Overdue</div>
          <div className={styles.kpiValue}>{formatCurrency(stats.totalOverdueAmount)}</div>
          <div className={styles.kpiSub}>Across {stats.totalOverdue} invoices</div>
        </div>
        <div className="glass-panel metric-card animate-fade-in stagger-3">
          <div className="section-label">Cash Recovered (30d)</div>
          <div className={styles.kpiValue}>{formatCurrency(stats.recoveredThisMonth)}</div>
          <div className={styles.kpiSub}>Live from paid invoices</div>
        </div>
        <div className="glass-panel metric-card animate-fade-in stagger-4">
          <div className="section-label">Avg Days Overdue</div>
          <div className={styles.kpiValue}>{stats.avgDaysOverdue}d</div>
          <div className={styles.kpiSub}>Open overdue invoices</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={`glass-panel animate-fade-in stagger-2 ${styles.chartPanel}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Aging Analysis</h3>
          </div>
          <div className={styles.agingContent}>
            <div className={styles.agingBar}>
              {stats.agingData.map(bucket => (
                <div
                  key={bucket.label}
                  className={styles.agingSegment}
                  style={{
                    width: `${(bucket.amount / totalAging) * 100}%`,
                    backgroundColor: bucket.color
                  }}
                  title={`${bucket.label}: ${formatCurrency(bucket.amount)}`}
                />
              ))}
            </div>

            <div className={styles.agingLegend}>
              {stats.agingData.map(bucket => (
                <div key={bucket.label} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: bucket.color }} />
                  <div className={styles.legendInfo}>
                    <div className={styles.legendLabel}>{bucket.label}</div>
                    <div className={styles.legendAmount}>{formatCurrency(bucket.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`glass-panel animate-fade-in stagger-3 ${styles.chartPanel}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              <Activity size={18} className={styles.iconBrand} /> AI Agent Performance
            </h3>
          </div>
          <div className={styles.agentGrid}>
            {stats.agentPerformance.map(perf => (
              <div key={perf.label} className={styles.agentMetric}>
                <div className={styles.agentCount}>{perf.count}</div>
                <div className={styles.agentLabel}>{perf.label}</div>
                <div className={styles.agentChange}>{perf.change}</div>
              </div>
            ))}
          </div>
          <div className={styles.agentFooter}>
            <button className={styles.actionLink}>View Detailed Logs <ArrowRight size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
