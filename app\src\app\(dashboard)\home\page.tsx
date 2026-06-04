import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  BrainCircuit
} from 'lucide-react';
import { 
  mockCustomers, 
  mockRecommendations, 
  mockRecentActivity,
  formatCurrency,
  timeAgo
} from '@/lib/mock-data';
import styles from './page.module.css';

import { BurnDownChart } from '@/components/ui/BurnDownChart/BurnDownChart';
import { RingProgress } from '@/components/ui/RingProgress/RingProgress';

export default function HomeCommandCenter() {
  // High priority accounts (top 5 by propensity score / priority)
  const priorityAccounts = [...mockCustomers]
    .sort((a, b) => (a.propensity_score || 0) - (b.propensity_score || 0)) // lowest propensity first
    .slice(0, 5);

  const topRecommendations = mockRecommendations.slice(0, 3);
  const recentActivity = mockRecentActivity.slice(0, 6);

  // Generate mock burn-down data for the past 30 days
  const burnDownData = Array.from({ length: 30 }).map((_, i) => ({
    day: i + 1,
    expected: 250000 - (i * (250000 / 30)),
    actual: i < 20
      ? 250000 - (i * (250000 / 35)) - deterministicVariance(i)
      : 250000 - (19 * (250000 / 35)) - deterministicVariance(i) - ((i - 19) * (250000 / 25))
  }));

  return (
    <div className={styles.container}>
      {/* Top Visual Command Center */}
      <div className={styles.visualGrid}>
        <div className={`glass-panel ${styles.chartPanel} animate-fade-in stagger-1`}>
          <div className={styles.chartHeader}>
            <div>
              <div className="section-label">Cash Burn-down (30d)</div>
              <div className={styles.chartTitle}>{formatCurrency(142500)} <span className={styles.chartSub}>Collected</span></div>
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendExpected}>Expected</span>
              <span className={styles.legendActual}>Actual</span>
            </div>
          </div>
          <div className={styles.chartArea}>
            <BurnDownChart data={burnDownData} height={200} />
          </div>
        </div>

        <div className={`glass-panel ${styles.ringPanel} animate-fade-in stagger-2`}>
          <div className="section-label">AI Automation Rate</div>
          <RingProgress percentage={84} label="Success" subLabel="No Human Touch" color="var(--brand-primary)" size={160} />
        </div>

        <div className={`glass-panel ${styles.ringPanel} animate-fade-in stagger-3`}>
          <div className="section-label">Portfolio Coverage</div>
          <RingProgress percentage={92} label="Covered" subLabel="In Active Playbooks" color="var(--brand-accent)" size={160} />
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column: High Priority Accounts */}
        <div className="glass-panel animate-fade-in stagger-2">
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>High-Priority Accounts</h3>
            <Link href="/accounts" className={styles.viewAllLink}>View all</Link>
          </div>
          <div className={styles.accountList}>
            {priorityAccounts.map(account => {
              const riskSegment = account.risk_segment || 'unknown';

              return (
                <div key={account.id} className={styles.accountRow}>
                  <div className={styles.accountInfo}>
                    <div className={styles.accountName}>{account.name}</div>
                    <div className={styles.accountMeta}>
                      <span className={`badge badge-${riskSegment === 'high_risk' || riskSegment === 'chronic_late' ? 'danger' : 'warning'}`}>
                        {riskSegment.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className={styles.accountAmount}>
                    <div className="number-display">{formatCurrency(account.total_outstanding)}</div>
                    <Link href={`/accounts/${account.id}`} className={styles.accountLink}>Review <ArrowRight size={14}/></Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Recommendations */}
        <div className="glass-panel animate-fade-in stagger-3" style={{ background: 'var(--brand-primary-light)', color: 'white', borderColor: 'var(--brand-primary)' }}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle} style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit size={18} /> Top AI Recommendations
            </h3>
            <Link href="/recommendations" className={styles.viewAllLink} style={{ color: 'rgba(255,255,255,0.8)' }}>View all</Link>
          </div>
          <div className={styles.recommendationList}>
            {topRecommendations.map(rec => (
              <div key={rec.id} className={styles.recCard}>
                <div className={styles.recHeader}>
                  <div className={styles.recTitle}>{rec.title}</div>
                  <div className={styles.recAmount}>{formatCurrency(rec.amount_at_risk)}</div>
                </div>
                <div className={styles.recDesc}>{rec.description}</div>
                <button className={styles.recAction}>{rec.action_label}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: AI Activity Feed */}
      <div className={`glass-panel animate-fade-in stagger-4 ${styles.activityPanel}`}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Live Agent Activity</h3>
          <Link href="/ai-activity" className={styles.viewAllLink}>Full log</Link>
        </div>
        <div className={styles.activityFeed}>
          {recentActivity.map(act => (
            <div key={act.id} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {act.action_type.includes('promise') ? <CheckCircle2 size={16} className={styles.textSuccess} /> :
                 act.action_type.includes('dispute') ? <AlertCircle size={16} className={styles.textDanger} /> :
                 <Clock size={16} className={styles.textMuted} />}
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityOutcome}>{act.outcome}</div>
                <div className={styles.activityMeta}>
                  {act.actor_type === 'agent' ? '🤖 Agent' : '👤 Human'} • {timeAgo(act.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function deterministicVariance(index: number) {
  return ((index * 173) % 5000);
}
