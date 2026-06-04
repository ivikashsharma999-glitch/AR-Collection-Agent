import React from 'react';
import {
  AlertCircle,
  Calendar,
  Download,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getLiveForecast } from '@/lib/operations/live-data';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function CashForecastPage() {
  const forecast = await getLiveForecast();
  const maxDSO = Math.max(50, ...forecast.dsoData.map((item) => item.value));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><TrendingUp size={24} /> Cash Forecast</h1>
          <p className={styles.sourceNote}>{forecast.source === 'supabase' ? 'Live Supabase forecast' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn}><Calendar size={16} /> Last 30 Days</button>
          <button className={styles.outlineBtn}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div className={styles.alertBox}>
        <AlertCircle size={16} className={styles.textWarning} />
        <span>Your 30-day forecast confidence is <strong>{forecast.confidence_percentage}%</strong>. Review high-risk accounts before the next approval batch.</span>
      </div>

      <div className={styles.horizonGrid}>
        <div className="glass-panel metric-card animate-fade-in stagger-1">
          <div className="section-label">Today&apos;s Expected</div>
          <div className={styles.kpiValue}>{formatCurrency(forecast.todayExpected)}</div>
          <div className={styles.kpiRange}>Near-term payment promises</div>
        </div>
        <div className="glass-panel metric-card animate-fade-in stagger-2">
          <div className="section-label">7 Day Forecast</div>
          <div className={styles.kpiValue}>{formatCurrency(forecast.sevenDayExpected)}</div>
          <div className={styles.kpiRange}>Based on open invoice risk</div>
        </div>
        <div className="glass-panel metric-card animate-fade-in stagger-3" style={{ borderTop: '4px solid var(--brand-primary)' }}>
          <div className="section-label">30 Day Forecast</div>
          <div className={styles.kpiValue} style={{ color: 'var(--brand-primary)' }}>{formatCurrency(forecast.expected_amount)}</div>
          <div className={styles.kpiRange}>Range: {formatCurrency(forecast.worst_case_amount)} - {formatCurrency(forecast.best_case_amount)}</div>
        </div>
        <div className="glass-panel metric-card animate-fade-in stagger-4">
          <div className="section-label">Quarterly Forecast</div>
          <div className={styles.kpiValue}>{formatCurrency(forecast.quarterlyExpected)}</div>
          <div className={styles.kpiRange}>Projected from 30-day recovery</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={`glass-panel animate-fade-in stagger-2 ${styles.chartPanel}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>DSO Trend (Days Sales Outstanding)</h3>
          </div>
          <div className={styles.chartContainer}>
            <div className={styles.barChart}>
              {forecast.dsoData.map(d => (
                <div key={d.month} className={styles.barCol}>
                  <div className={styles.barValue}>{d.value}d</div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        height: `${(d.value / maxDSO) * 100}%`,
                        backgroundColor: d.value > 40 ? 'var(--color-warning)' : 'var(--brand-primary)'
                      }}
                    />
                  </div>
                  <div className={styles.barLabel}>{d.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`glass-panel animate-fade-in stagger-3 ${styles.chartPanel}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>30-Day Forecast by Risk Segment</h3>
          </div>
          <div className={styles.segmentList}>
            {forecast.segments.map(seg => (
              <div key={seg.name} className={styles.segmentRow}>
                <div className={styles.segmentInfo}>
                  <div className={styles.segmentName}>{seg.name}</div>
                  <div className={styles.segmentAmount}>{formatCurrency(seg.amount)}</div>
                </div>
                <div className={styles.segmentTrack}>
                  <div
                    className={styles.segmentFill}
                    style={{ width: `${seg.percent}%`, backgroundColor: seg.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
