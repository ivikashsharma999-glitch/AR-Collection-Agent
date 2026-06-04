import Link from 'next/link';
import type React from 'react';
import { Activity, AlertTriangle, CheckCircle2, CircleDashed, Clock3, Database, PlugZap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Card } from '@/components/ui/Card/Card';
import { getIntegrationHealth, type IntegrationHealth, type IntegrationStatus } from '@/lib/operations/integration-health';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const statusVariant: Record<IntegrationStatus, React.ComponentProps<typeof Badge>['variant']> = {
  connected: 'success',
  demo: 'info',
  disconnected: 'default',
  degraded: 'warning',
  expired: 'danger',
};

const statusIcon: Record<IntegrationStatus, React.ReactNode> = {
  connected: <CheckCircle2 size={16} />,
  demo: <CircleDashed size={16} />,
  disconnected: <PlugZap size={16} />,
  degraded: <AlertTriangle size={16} />,
  expired: <Clock3 size={16} />,
};

export default async function OperationsPage() {
  const integrations = await getIntegrationHealth();
  const connectedCount = integrations.filter((item) => item.status === 'connected').length;
  const attentionCount = integrations.filter((item) => ['degraded', 'expired', 'disconnected'].includes(item.status)).length;
  const demoCount = integrations.filter((item) => item.status === 'demo').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Live Readiness</p>
          <h1 className={styles.title}>Operations Health</h1>
          <p className={styles.subtitle}>
            Track the systems that must be healthy before running a live AR collections workflow.
          </p>
        </div>
        <Link href="/settings" className={styles.settingsLink}>
          Configure
        </Link>
      </header>

      <section className={styles.summaryGrid}>
        <SummaryCard label="Connected" value={connectedCount} tone="success" />
        <SummaryCard label="Demo Mode" value={demoCount} tone="info" />
        <SummaryCard label="Needs Attention" value={attentionCount} tone="warning" />
      </section>

      <section className={styles.grid}>
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </section>

      <Card className={styles.checklistCard}>
        <div className={styles.checklistHeader}>
          <Activity size={18} />
          <h2>Pilot Demo Checklist</h2>
        </div>
        <div className={styles.checklist}>
          <ChecklistItem done={connectedCount > 0} text="Authenticated workspace is available." />
          <ChecklistItem done={integrations.some((item) => item.id === 'supabase' && item.status === 'connected')} text="Pilot receivables data is seeded in Supabase." />
          <ChecklistItem done={integrations.some((item) => ['gmail', 'outlook'].includes(item.id) && item.status === 'connected')} text="At least one email provider is connected for real sends." />
          <ChecklistItem done={integrations.some((item) => item.id === 'quickbooks' && item.status === 'connected')} text="Ledger sync is connected or clearly presented as demo mode." soft />
          <ChecklistItem done={attentionCount === 0} text="No expired tokens or degraded integrations are blocking the walkthrough." />
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'success' | 'info' | 'warning' }) {
  return (
    <Card className={`${styles.summaryCard} ${styles[tone]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

function IntegrationCard({ integration }: { integration: IntegrationHealth }) {
  return (
    <Card className={styles.integrationCard}>
      <div className={styles.cardTop}>
        <div className={styles.integrationIcon}>
          <Database size={18} />
        </div>
        <Badge variant={statusVariant[integration.status]} size="sm">
          <span className={styles.badgeContent}>
            {statusIcon[integration.status]}
            {integration.status}
          </span>
        </Badge>
      </div>
      <h2>{integration.name}</h2>
      <p>{integration.detail}</p>
      <dl className={styles.meta}>
        <div>
          <dt>Last sync</dt>
          <dd>{integration.lastSyncAt ? formatDateTime(integration.lastSyncAt) : 'Not yet synced'}</dd>
        </div>
        <div>
          <dt>Last error</dt>
          <dd className={integration.lastError ? styles.errorText : ''}>{integration.lastError || 'None'}</dd>
        </div>
      </dl>
      {integration.actionHref && (
        <Link href={integration.actionHref} className={styles.cardLink}>
          Manage integration
        </Link>
      )}
    </Card>
  );
}

function ChecklistItem({ done, text, soft = false }: { done: boolean; text: string; soft?: boolean }) {
  return (
    <div className={styles.checklistItem}>
      <span className={`${styles.checkDot} ${done ? styles.checkDotDone : soft ? styles.checkDotSoft : ''}`}>
        {done ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}
      </span>
      <span>{text}</span>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
