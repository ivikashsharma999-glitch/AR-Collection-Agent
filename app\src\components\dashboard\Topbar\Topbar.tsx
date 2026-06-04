'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { SignOutButton } from './SignOutButton';
import { useTheme } from '@/components/ThemeProvider';
import styles from './Topbar.module.css';

const routeTitles: Record<string, string> = {
  '/home': 'Command Center',
  '/ai-activity': 'AI Activity Center',
  '/recommendations': 'Recommendations Hub',
  '/accounts': 'Accounts',
  '/invoices': 'Invoices',
  '/communications': 'Communications',
  '/promises': 'Promises to Pay',
  '/disputes': 'Disputes',
  '/inbox': 'Approvals',
  '/audit': 'Audit Log',
  '/cash-forecast': 'Cash Forecast',
  '/analytics': 'Analytics',
  '/ask-agent': 'Ask AR Agent',
  '/settings': 'Settings',
  '/dashboard': 'Command Center',
};

export function Topbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  // Get base path (e.g. /accounts from /accounts/123)
  const basePath = '/' + pathname.split('/')[1];
  const title = routeTitles[pathname] || routeTitles[basePath] || 'AR Collections OS';

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.title} style={{ fontSize: '1.25rem' }}>
          {title}
        </div>
      </div>
      
      <div className={styles.right}>
        <div className={styles.searchContainer}>
          <Search size={14} className={styles.searchIcon} />
          <input type="text" placeholder="Search invoices, customers, notes..." className={styles.searchInput} />
          <div className={styles.shortcut}>⌘K</div>
        </div>
        
        <div className={styles.actions}>
          <button 
            onClick={toggleTheme}
            className={styles.filterBtn} 
            style={{ padding: '0.5rem', borderRadius: '50%' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={styles.filterBtn} style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <Bell size={18} />
          </button>
          <SignOutButton />
          <Link href="/settings" aria-label="Open profile settings">
            <div className={styles.profileInitials}>RS</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
