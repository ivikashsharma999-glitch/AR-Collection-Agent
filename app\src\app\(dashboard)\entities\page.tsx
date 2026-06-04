import React from 'react';
import { Building2, Globe2 } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { getEnterprisePlatformSnapshot } from '@/lib/enterprise/ar-platform';
import styles from '../enterprise.module.css';

export const dynamic = 'force-dynamic';

export default function EntitiesPage() {
  const snapshot = getEnterprisePlatformSnapshot();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Multi-Entity Reporting</p>
          <h1 className={styles.title}><Globe2 size={24} /> Global Receivables Control Tower</h1>
          <p className={styles.subtitle}>
            Roll up AR performance by legal entity, region, currency, owner, DSO, and disputed exposure for executive review.
          </p>
        </div>
        <span className={styles.sourcePill}>Global AR view</span>
      </header>

      <section className={styles.summaryGrid}>
        <Summary label="Entities" value={String(snapshot.entities.length)} />
        <Summary label="Global overdue" value={formatCurrency(snapshot.summary.globalOverdue)} />
        <Summary label="Avg collection rate" value={`${Math.round(snapshot.entities.reduce((sum, item) => sum + item.collectionRate, 0) / snapshot.entities.length)}%`} />
        <Summary label="Avg DSO" value={`${Math.round(snapshot.entities.reduce((sum, item) => sum + item.dso, 0) / snapshot.entities.length)}d`} />
      </section>

      <section className={styles.gridThree}>
        {snapshot.entities.map((entity) => (
          <article key={entity.id} className={styles.insightCard}>
            <div className={styles.insightTop}>
              <div>
                <h3><Building2 size={16} /> {entity.entity}</h3>
                <p className={styles.muted}>{entity.region} | {entity.currency} | Owner: {entity.owner}</p>
              </div>
              <span className={`${styles.badge} ${entity.collectionRate >= 72 ? styles.success : styles.warning}`}>{entity.collectionRate}%</span>
            </div>
            <div className={styles.metricRow}>
              <Mini label="Overdue" value={formatCurrency(entity.overdueAmount)} />
              <Mini label="DSO" value={`${entity.dso}d`} />
              <Mini label="Disputed" value={formatCurrency(entity.disputedAmount)} />
            </div>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${entity.collectionRate}%` }} /></div>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Executive Close Packet</h2>
            <p className={styles.panelNote}>This gives finance leaders the HighRadius-style global AR summary without hiding the collector-level actions underneath.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className={styles.summaryCard}><span>{label}</span><strong>{value}</strong></div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className={styles.miniMetric}><span>{label}</span><strong>{value}</strong></div>;
}
