'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownIcon,
  Banknote,
  CalendarDays,
  CheckCircle2,
  FileText,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { DashboardMetrics } from '@/lib/dashboard/metrics';
import styles from './page.module.css';

type ChartPoint = { value: number };

type KPICardProps = {
  title: string;
  amount: string;
  trend: string;
  trendUp: boolean;
  color: string;
  icon: React.ReactNode;
  bg: string;
  data: ChartPoint[];
};

export function DashboardClient({ metrics }: { metrics: DashboardMetrics }) {
  const sourceLabel = metrics.source === 'supabase' ? 'Live data' : 'Demo fallback';
  const agingTotal = metrics.agingBuckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const agingInvoiceCount = metrics.agingBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const ninetyPlusCount = metrics.agingBuckets.find((bucket) => bucket.label === '90+ Days')?.count || 0;
  const agingPieData = metrics.agingBuckets
    .filter((bucket) => bucket.amount > 0)
    .map((bucket) => ({
      name: bucket.label,
      value: agingTotal > 0 ? Number(((bucket.amount / agingTotal) * 100).toFixed(1)) : 0,
      amount: formatCompactCurrency(bucket.amount),
      color: bucket.color,
    }));

  return (
    <div className={styles.dashboard}>
      <div className={styles.kpiRow}>
        <KPICard title="Total Outstanding" amount={formatCompactCurrency(metrics.totalOutstanding)} trend={sourceLabel} trendUp color="var(--brand-primary)" icon={<Wallet size={20} color="white" />} bg="#f97316" data={sparkData1} />
        <KPICard title="Overdue Amount" amount={formatCompactCurrency(metrics.overdueAmount)} trend={`${agingInvoiceCount} open invoices`} trendUp={false} color="var(--color-danger)" icon={<FileText size={20} color="white" />} bg="#ef4444" data={sparkData2} />
        <KPICard title="Cash Recovered (MTD)" amount={formatCompactCurrency(metrics.recoveredThisMonth)} trend="This month" trendUp color="var(--color-success)" icon={<Banknote size={20} color="white" />} bg="#10b981" data={sparkData3} />
        <KPICard title="DSO (Days Sales Outstanding)" amount={`${metrics.dsoDays} Days`} trend="Avg overdue age" trendUp={metrics.dsoDays <= 45} color="var(--brand-accent)" icon={<CalendarDays size={20} color="white" />} bg="#8b5cf6" data={sparkData4} />
        <KPICard title="Recovery Rate" amount={formatPercent(metrics.recoveryRate)} trend="Paid / total" trendUp={metrics.recoveryRate >= 0.75} color="var(--color-info)" icon={<TrendingUp size={20} color="white" />} bg="#3b82f6" data={sparkData1} />
        <KPICard title="At Risk (90+ Days)" amount={formatCompactCurrency(metrics.atRisk90Amount)} trend="Priority risk" trendUp={false} color="var(--color-warning)" icon={<AlertTriangle size={20} color="white" />} bg="#f59e0b" data={sparkData2} />
      </div>

      <div className={styles.row}>
        <div className={`glass-panel ${styles.widget} ${styles.flex2}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>Collections Pipeline <AlertCircle size={14} color="var(--text-muted)" /></div>
            <Link className={styles.viewAll} href="/accounts">View all aging</Link>
          </div>
          <div className={styles.pipelineStages}>
            {metrics.agingBuckets.map((bucket) => (
              <div key={bucket.label} className={styles.pipelineStage} style={{ backgroundColor: bucket.color }} />
            ))}
          </div>
          <div className={styles.pipelineData}>
            {metrics.agingBuckets.map((bucket) => (
              <PipelineCol
                key={bucket.label}
                label={bucket.label}
                amount={formatCompactCurrency(bucket.amount)}
                count={`(${bucket.count})`}
                color={bucket.color}
              />
            ))}
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{formatCompactCurrency(agingTotal)}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{agingInvoiceCount} invoices</span>
          </div>
        </div>

        <div className={`glass-panel ${styles.widget} ${styles.flex1}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>Top Priorities</div>
            <Link className={styles.viewAll} href="/worklist">View worklist</Link>
          </div>
          <div className={styles.priorityList}>
            <PriorityItem letter="A" cls={styles.priorityA} title="Review and approve reminders" desc={`${metrics.approvalQueueCount} pending approvals`} amount={formatCompactCurrency(metrics.overdueAmount)} urgency="High" urgencyColor="#ef4444" />
            <PriorityItem letter="B" cls={styles.priorityB} title="Escalate overdue accounts" desc={`${ninetyPlusCount} invoices over 90 days`} amount={formatCompactCurrency(metrics.atRisk90Amount)} urgency="High" urgencyColor="#ef4444" />
            <PriorityItem letter="C" cls={styles.priorityC} title="Follow up payment promises" desc="Pending promise value" amount={formatCompactCurrency(metrics.promisesPendingAmount)} urgency="Medium" urgencyColor="#f97316" />
            <PriorityItem letter="D" cls={styles.priorityD} title="Resolve open disputes" desc={`${metrics.disputesOpenCount} active disputes`} amount={formatCompactCurrency(metrics.overdueAmount)} urgency="Low" urgencyColor="#10b981" />
            <PriorityItem letter="E" cls={styles.priorityE} title="Monitor recovery rate" desc="Paid versus total portfolio" amount={formatPercent(metrics.recoveryRate)} urgency="Medium" urgencyColor="#f97316" />
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link href="/inbox" style={{ fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              View agent worklist ({metrics.approvalQueueCount}) <ArrowDownIcon size={10} />
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={`glass-panel ${styles.widget} ${styles.flex1}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>Aging Analysis</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <ClientResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={agingPieData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                    {agingPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ClientResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{formatCompactCurrency(agingTotal)}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Overdue</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 150 }}>
              {agingPieData.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{item.value}%</span>
                  <span style={{ fontWeight: 600 }}>{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`glass-panel ${styles.widget} ${styles.flex2}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>DSO Trend</div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{metrics.dsoDays} Days</div>
                <div style={{ fontSize: '10px', color: 'var(--color-success)' }}>{sourceLabel}</div>
              </div>
              <select style={{ fontSize: '10px', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border-default)', background: 'transparent' }}>
                <option>This month</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <ClientResponsiveContainer width="100%" height="100%">
              <LineChart data={dsoData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
              </LineChart>
            </ClientResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '-10px', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={`glass-panel ${styles.widget} ${styles.flex1}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>Recent Activity</div>
            <Link className={styles.viewAll} href="/audit">View all</Link>
          </div>
          <div className={styles.priorityList}>
            <ActivityItem icon={<CheckCircle2 size={12} color="#10b981" />} title="Metrics refreshed from receivables data" desc={sourceLabel} time="Just now" bg="rgba(16,185,129,0.1)" />
            <ActivityItem icon={<FileText size={12} color="#ef4444" />} title="Open invoice exposure recalculated" desc={formatCompactCurrency(metrics.overdueAmount)} time="Just now" bg="rgba(239,68,68,0.1)" />
            <ActivityItem icon={<AlertTriangle size={12} color="#8b5cf6" />} title="90+ day risk reviewed" desc={formatCompactCurrency(metrics.atRisk90Amount)} time="Just now" bg="rgba(139,92,246,0.1)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, amount, trend, trendUp, color, icon, bg, data }: KPICardProps) {
  return (
    <div className={`glass-panel ${styles.kpiCard}`}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiTitle}>{title}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div className={styles.kpiValue}>{amount}</div>
      <div className={`${styles.kpiTrend} ${trendUp ? styles.kpiTrendUp : styles.kpiTrendDown}`}>
        {trend} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>portfolio</span>
      </div>
      <div className={styles.kpiChart}>
        <ClientResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ClientResponsiveContainer>
      </div>
    </div>
  );
}

function ClientResponsiveContainer(props: React.ComponentProps<typeof ResponsiveContainer>) {
  const mounted = React.useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) {
    return <div style={{ width: '100%', height: '100%' }} />;
  }

  return <ResponsiveContainer {...props} />;
}

function PipelineCol({ label, amount, count, color }: { label: string; amount: string; count: string; color: string }) {
  return (
    <div className={styles.pipelineCol}>
      <div className={styles.pipelineLabel} style={{ color }}>{label}</div>
      <div className={styles.pipelineAmount}>{amount}</div>
      <div className={styles.pipelineCount}>{count}</div>
    </div>
  );
}

function PriorityItem({
  letter,
  cls,
  title,
  desc,
  amount,
  urgency,
  urgencyColor,
}: {
  letter: string;
  cls: string;
  title: string;
  desc: string;
  amount: string;
  urgency: string;
  urgencyColor: string;
}) {
  return (
    <div className={styles.priorityItem}>
      <div className={`${styles.priorityLetter} ${cls}`}>{letter}</div>
      <div className={styles.priorityInfo}>
        <div className={styles.priorityTitle}>{title}</div>
        <div className={styles.priorityDesc}>{desc}</div>
      </div>
      <div className={styles.priorityValue}>
        <div className={styles.priorityAmount}>{amount}</div>
        <div className={styles.priorityUrgency} style={{ color: urgencyColor }}>{urgency}</div>
      </div>
    </div>
  );
}

function ActivityItem({
  icon,
  title,
  desc,
  time,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  time: string;
  bg: string;
}) {
  return (
    <div className={styles.priorityItem} style={{ border: 'none', paddingBottom: 0 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div className={styles.priorityInfo}>
        <div style={{ fontSize: '10px', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{desc}</div>
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{time}</div>
    </div>
  );
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 100000 ? 'compact' : 'standard',
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
}

const sparkData1 = [
  { value: 400 }, { value: 300 }, { value: 500 }, { value: 200 },
  { value: 600 }, { value: 400 }, { value: 700 }, { value: 500 }, { value: 800 },
];
const sparkData2 = [
  { value: 800 }, { value: 700 }, { value: 500 }, { value: 600 },
  { value: 400 }, { value: 500 }, { value: 300 }, { value: 200 }, { value: 400 },
];
const sparkData3 = [
  { value: 100 }, { value: 200 }, { value: 150 }, { value: 300 },
  { value: 400 }, { value: 350 }, { value: 500 }, { value: 450 }, { value: 600 },
];
const sparkData4 = [
  { value: 60 }, { value: 58 }, { value: 55 }, { value: 52 },
  { value: 50 }, { value: 48 }, { value: 45 }, { value: 43 }, { value: 42 },
];
const dsoData = [
  { name: 'May', value: 50 },
  { name: 'Jun', value: 48 },
  { name: 'Jul', value: 47 },
  { name: 'Aug', value: 45 },
  { name: 'Sep', value: 42 },
];
