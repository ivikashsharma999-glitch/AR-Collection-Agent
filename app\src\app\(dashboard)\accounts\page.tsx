import React from 'react';
import Link from 'next/link';
import { Users, Search, Filter, Download, ArrowRight, BrainCircuit, Activity } from 'lucide-react';
import { formatCurrency, timeAgo } from '@/lib/mock-data';
import { getLiveAccounts } from '@/lib/operations/live-data';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const accounts = await getLiveAccounts();
  const source = accounts[0]?.source || 'mock';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Users size={24} /> Accounts</h1>
          <p className={styles.sourceNote}>{source === 'supabase' ? 'Live Supabase receivables' : 'Demo fallback data'}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn}><Download size={16} /> Export</button>
        </div>
      </div>

      <div className="glass-panel">
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search size={14} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by customer name or email..." 
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filtersContainer}>
            <select className={styles.filterSelect}>
              <option value="">All Risk Segments</option>
              <option value="good_payer">Good Payer</option>
              <option value="low_risk">Low Risk</option>
              <option value="medium_risk">Medium Risk</option>
              <option value="high_risk">High Risk</option>
              <option value="chronic_late">Chronic Late</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="">Any Aging</option>
              <option value="current">Current</option>
              <option value="1-30">1-30 Days</option>
              <option value="31-60">31-60 Days</option>
              <option value="60+">60+ Days</option>
            </select>
            <button className={styles.outlineBtn}><Filter size={14} /> More</button>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Risk Segment</th>
                <th>Balance</th>
                <th>Aging</th>
                <th>Last Contact</th>
                <th>AI Strategy</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(customer => {
                const getBadgeClass = (segment?: string) => {
                  switch(segment) {
                    case 'good_payer': return 'badge-success';
                    case 'low_risk': return 'badge-success';
                    case 'medium_risk': return 'badge-warning';
                    case 'high_risk': return 'badge-danger';
                    case 'chronic_late': return 'badge-danger';
                    default: return 'badge-brand';
                  }
                };
                
                const getStrategy = (segment?: string) => {
                  switch(segment) {
                    case 'good_payer': return { text: 'Soft Monitoring', icon: <Activity size={12} className={styles.textSuccess} /> };
                    case 'low_risk': return { text: 'Standard Sequence', icon: <Activity size={12} className={styles.textSuccess} /> };
                    case 'medium_risk': return { text: 'Accelerated Follow-up', icon: <BrainCircuit size={12} className={styles.textWarning} /> };
                    case 'high_risk': return { text: 'Direct Escalation', icon: <BrainCircuit size={12} className={styles.textDanger} /> };
                    case 'chronic_late': return { text: 'Payment Plan Offer', icon: <BrainCircuit size={12} className={styles.textDanger} /> };
                    default: return { text: 'Standard', icon: <Activity size={12} /> };
                  }
                };
                
                const strategy = getStrategy(customer.risk_segment);
                
                // Mock last contact
                const lastContact = customer.updated_at;

                return (
                  <tr key={customer.id}>
                    <td>
                      <div className={styles.customerNameBox}>
                        <span className={styles.cellBold}>{customer.name}</span>
                        {customer.strategic_flag && <span className={styles.strategicTag}>Strategic</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getBadgeClass(customer.risk_segment)}`}>
                        {customer.risk_segment?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="number-display font-medium">{formatCurrency(customer.total_outstanding)}</td>
                    <td>
                      {customer.behavioral_profile?.avg_days_late ? (
                        <span className={customer.behavioral_profile.avg_days_late > 30 ? styles.textDanger : ''}>
                          Avg {customer.behavioral_profile.avg_days_late}d late
                        </span>
                      ) : customer.max_days_overdue > 0 ? (
                        <span className={customer.max_days_overdue > 30 ? styles.textDanger : ''}>
                          {customer.max_days_overdue}d overdue
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <div className={styles.lastContact}>{timeAgo(lastContact)}</div>
                    </td>
                    <td>
                      <div className={styles.strategyCell}>
                        {strategy.icon} {strategy.text}
                      </div>
                    </td>
                    <td>
                      <Link href={`/accounts/${customer.id}`} className={styles.actionLink}>
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
