import React from 'react';
import { GitBranch, ShieldCheck } from 'lucide-react';
import { getEnterprisePlatformSnapshot } from '@/lib/enterprise/ar-platform';
import styles from '../enterprise.module.css';

export const dynamic = 'force-dynamic';

const statusTone = {
  active: styles.success,
  draft: styles.info,
  needs_review: styles.warning,
};

export default function GovernancePage() {
  const snapshot = getEnterprisePlatformSnapshot();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin Governance</p>
          <h1 className={styles.title}><ShieldCheck size={24} /> Rules, Guardrails & Policy Control</h1>
          <p className={styles.subtitle}>
            Govern autonomous collections with approval thresholds, legal guardrails, regional routing, credit rules, and write-off controls.
          </p>
        </div>
        <span className={styles.sourcePill}>{snapshot.summary.activePolicies} active policies</span>
      </header>

      <section className={styles.summaryGrid}>
        <Summary label="Rules" value={String(snapshot.governance.length)} />
        <Summary label="Active" value={String(snapshot.summary.activePolicies)} />
        <Summary label="Draft" value={String(snapshot.governance.filter((item) => item.status === 'draft').length)} />
        <Summary label="Needs review" value={String(snapshot.governance.filter((item) => item.status === 'needs_review').length)} />
      </section>

      <section className={styles.tablePanel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Category</th>
              <th>Status</th>
              <th>Automation</th>
              <th>Guardrail</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.governance.map((rule) => (
              <tr key={rule.id}>
                <td><span className={styles.strong}>{rule.name}</span></td>
                <td><span className={styles.badge}>{rule.category}</span></td>
                <td><span className={`${styles.badge} ${statusTone[rule.status]}`}>{rule.status.replace(/_/g, ' ')}</span></td>
                <td>{rule.automationLevel}</td>
                <td>{rule.guardrail}</td>
                <td>{rule.lastChanged}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.gridTwo}>
        <div className={styles.insightCard}>
          <h3><GitBranch size={16} /> Policy versioning</h3>
          <p>Every future rule change should write a before/after audit event so pilots can prove who changed automation behavior and when.</p>
        </div>
        <div className={styles.insightCard}>
          <h3><ShieldCheck size={16} /> Compliance by design</h3>
          <p>The existing legal filter, compliance shield, approval inbox, and audit log now have a governance surface to explain the controls.</p>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className={styles.summaryCard}><span>{label}</span><strong>{value}</strong></div>;
}
