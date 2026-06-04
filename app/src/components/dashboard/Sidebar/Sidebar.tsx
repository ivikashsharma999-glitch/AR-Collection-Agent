'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  FileText, 
  Settings,
  ChevronRight,
  Activity,
  Lightbulb,
  FileSpreadsheet,
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  BarChart2,
  Bot,
  ShieldCheck,
  ListChecks,
  Banknote,
  FileWarning,
  Gauge,
  DatabaseZap,
  CreditCard,
  Globe2,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navGroups = [
  {
    label: 'Command Center',
    items: [
      { name: 'Home', href: '/home', icon: LayoutDashboard },
      { name: 'AI Activity', href: '/ai-activity', icon: Activity },
      { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
    ]
  },
  {
    label: 'Collections',
    items: [
      { name: 'Worklist', href: '/worklist', icon: ListChecks },
      { name: 'Accounts', href: '/accounts', icon: Users },
      { name: 'Invoices', href: '/invoices', icon: FileSpreadsheet },
      { name: 'Communications', href: '/communications', icon: MessageSquare },
      { name: 'Promises to Pay', href: '/promises', icon: CalendarCheck },
      { name: 'Disputes', href: '/disputes', icon: AlertTriangle },
    ]
  },
  {
    label: 'Operations',
    items: [
      { name: 'Approvals', href: '/inbox', icon: CheckSquare },
      { name: 'Operations', href: '/operations', icon: ShieldCheck },
      { name: 'Playbooks', href: '/playbooks', icon: Settings },
      { name: 'Audit Log', href: '/audit', icon: FileText },
    ]
  },
  {
    label: 'Enterprise AR',
    items: [
      { name: 'Cash Application', href: '/cash-application', icon: Banknote },
      { name: 'Deductions', href: '/deductions', icon: FileWarning },
      { name: 'Credit Risk', href: '/credit-risk', icon: Gauge },
      { name: 'Reconciliation', href: '/reconciliation', icon: DatabaseZap },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Entities', href: '/entities', icon: Globe2 },
      { name: 'Governance', href: '/governance', icon: ShieldCheck },
    ]
  },
  {
    label: 'Executive',
    items: [
      { name: 'Cash Forecast', href: '/cash-forecast', icon: TrendingUp },
      { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    ]
  },
  {
    label: 'AI',
    items: [
      { name: 'Ask AR Agent', href: '/ask-agent', icon: Bot },
    ]
  },
  {
    label: 'Settings',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const routes = ['/dashboard', ...navGroups.flatMap((group) => group.items.map((item) => item.href))];
    const uniqueRoutes = [...new Set(routes)];
    const timer = window.setTimeout(() => {
      uniqueRoutes.forEach((href) => router.prefetch(href));
    }, 600);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>AR</div>
        <div>
          <div className={styles.logoText}>AR Agent</div>
          <div className={styles.logoSubtitle}>Collections OS</div>
        </div>
      </div>
      
      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <div className="section-label" style={{ paddingLeft: '12px', marginTop: '16px', marginBottom: '8px' }}>
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href === '/home' && pathname === '/dashboard');
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  prefetch
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onFocus={() => router.prefetch(item.href)}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.name === 'Approvals' && (
                    <span className={styles.badge}>3</span>
                  )}
                  {item.name === 'Disputes' && (
                    <span className={styles.badgeWarning}>1</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      
      <div className={styles.footer}>
        <div className={styles.profile}>
          <div className={styles.profileInitials}>RS</div>
          <div>
            <div className={styles.profileName}>Rohit Sharma</div>
            <div className={styles.profileRole}>Finance Manager</div>
          </div>
        </div>
        <Link href="/settings" aria-label="Open profile settings" style={{ color: 'var(--dark-text-secondary)', display: 'flex' }}><ChevronRight size={18} /></Link>
      </div>
    </aside>
  );
}
