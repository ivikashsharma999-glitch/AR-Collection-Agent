import React from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getLiveRecommendations } from '@/lib/operations/live-data';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function RecommendationsHub() {
  const recommendations = await getLiveRecommendations();
  const source = recommendations[0]?.source || 'mock';

  const getIcon = (type: string) => {
    switch (type) {
      case 'recover_now': return <ShieldAlert size={20} className={styles.iconDanger} />;
      case 'escalate': return <TrendingUp size={20} className={styles.iconWarning} />;
      case 'payment_plan': return <Clock size={20} className={styles.iconInfo} />;
      default: return <BrainCircuit size={20} className={styles.iconBrand} />;
    }
  };

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'recover_now': return 'var(--color-danger)';
      case 'escalate': return 'var(--color-warning)';
      case 'payment_plan': return 'var(--color-info)';
      default: return 'var(--brand-primary)';
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.headerPanel}`}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>
            <BrainCircuit size={24} className={styles.titleIcon} />
            AI Recommendations
          </h1>
          <p className={styles.pageDesc}>
            Your AR Agent analyzes behavior patterns, dispute history, and cash flow to recommend the highest-impact actions.
          </p>
          <p className={styles.sourceNote}>{source === 'supabase' ? 'Live Supabase recommendations' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Total Value at Risk</div>
            <div className={styles.statValue}>{formatCurrency(recommendations.reduce((acc, rec) => acc + rec.amount_at_risk, 0))}</div>
          </div>
        </div>
      </div>

      <div className={styles.recommendationGrid}>
        {recommendations.map((rec, idx) => (
          <div 
            key={rec.id} 
            className={`glass-panel animate-fade-in stagger-${(idx % 4) + 1} ${styles.recCard}`}
            style={{ borderTop: `4px solid ${getAccentColor(rec.type)}` }}
          >
            <div className={styles.cardTop}>
              <div className={styles.cardHeader}>
                {getIcon(rec.type)}
                <span className={styles.recTypeBadge} style={{ color: getAccentColor(rec.type) }}>
                  {rec.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <h3 className={styles.recTitle}>{rec.title}</h3>
              <p className={styles.recDesc}>{rec.description}</p>
            </div>
            
            <div className={styles.cardMetrics}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Amount at risk</div>
                <div className={styles.metricValue}>{formatCurrency(rec.amount_at_risk)}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Recovery probability</div>
                <div className={styles.metricValue}>
                  <div className={styles.progressTrack}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${rec.recovery_probability}%`, backgroundColor: getAccentColor(rec.type) }} 
                    />
                  </div>
                  {rec.recovery_probability}%
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.customerContext}>
                <div className={styles.customerName}>{rec.customer?.name}</div>
                <button className={styles.contactBtn}><MessageSquare size={14} /></button>
              </div>
              <button className={styles.actionBtn} style={{ backgroundColor: getAccentColor(rec.type) }}>
                {rec.action_label} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
