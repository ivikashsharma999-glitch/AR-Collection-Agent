import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar/Topbar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <Topbar />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
