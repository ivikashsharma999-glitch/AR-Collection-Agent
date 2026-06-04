'use client';

import React from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  AlertTriangle, 
  Save, 
  Settings2,
  Clock,
  GitMerge
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.css';

export default function PlaybooksPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Workflow Rules Editor</h1>
          <p className={styles.subtitle}>Visually build AI escalation paths, tone shifts, and channel orchestration.</p>
        </div>
        <Button variant="primary">
          <Save size={16} /> Save Playbook
        </Button>
      </header>

      <div className={styles.workspace}>
        {/* ── Left Sidebar (Node Palette) ── */}
        <div className={styles.sidebarPanel}>
          <div>
            <h3 className={styles.panelTitle}>Triggers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className={`${styles.draggableNode} ${styles.trigger}`}>
                <div className={styles.iconWrapper}><Clock size={16} /></div>
                Invoice Overdue
              </div>
              <div className={`${styles.draggableNode} ${styles.trigger}`}>
                <div className={styles.iconWrapper}><AlertTriangle size={16} /></div>
                High Risk Account
              </div>
              <div className={`${styles.draggableNode} ${styles.trigger}`}>
                <div className={styles.iconWrapper}><MessageSquare size={16} /></div>
                Customer Replied
              </div>
            </div>
          </div>

          <div>
            <h3 className={styles.panelTitle} style={{ marginTop: '1rem' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className={`${styles.draggableNode} ${styles.action}`}>
                <div className={styles.iconWrapper}><Mail size={16} /></div>
                Send Email
              </div>
              <div className={`${styles.draggableNode} ${styles.action}`}>
                <div className={styles.iconWrapper}><MessageSquare size={16} /></div>
                Send SMS
              </div>
              <div className={`${styles.draggableNode} ${styles.action}`}>
                <div className={styles.iconWrapper}><Phone size={16} /></div>
                AI Voice Call (Beta)
              </div>
              <div className={`${styles.draggableNode} ${styles.action}`}>
                <div className={styles.iconWrapper}><Settings2 size={16} /></div>
                Change Agent Tone
              </div>
            </div>
          </div>
        </div>

        {/* ── Canvas Area ── */}
        <div className={styles.canvas}>
          <div className={styles.toolbar}>
            <Button variant="outline" size="sm">Undo</Button>
            <Button variant="outline" size="sm">Zoom In</Button>
            <Button variant="outline" size="sm">Test Run</Button>
          </div>

          <div className={styles.flowContainer}>
            {/* Start Node */}
            <div className={`${styles.canvasNode} ${styles.startNode}`}>
              <div className={styles.nodeHeader}>
                <div className={styles.iconWrapper}><Clock size={16} style={{ color: 'var(--brand-accent)' }} /></div>
                Trigger: Invoice Overdue
              </div>
              <div className={styles.nodeBody}>
                <div className={styles.conditionBox}>IF days_overdue &gt;= 30</div>
                <div className={styles.conditionBox}>AND risk_segment == &quot;high_risk&quot;</div>
              </div>
            </div>

            <div className={styles.connectionLine} />

            {/* Split Node / Condition */}
            <div className={styles.canvasNode} style={{ width: '220px', alignItems: 'center', borderColor: 'var(--border-strong)' }}>
              <div className={styles.nodeHeader} style={{ justifyContent: 'center' }}>
                <GitMerge size={16} style={{ color: 'var(--text-tertiary)' }} />
                Check Channel Pref
              </div>
            </div>

            <div className={styles.connectionLine} style={{ height: '1.5rem' }} />

            {/* Split Flow */}
            <div className={styles.splitFlow}>
              <div className={styles.horizontalLine} />
              
              {/* Path A */}
              <div className={styles.splitPath}>
                <div className={styles.connectionLine} style={{ height: '1rem' }} />
                <div className={styles.canvasNode} style={{ width: '240px' }}>
                  <div className={styles.nodeHeader} style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    If preference == &quot;email&quot;
                  </div>
                  <div className={`${styles.canvasNode} ${styles.actionNode}`} style={{ width: '100%', marginTop: '0.5rem' }}>
                    <div className={styles.nodeHeader}>
                      <div className={styles.iconWrapper}><Settings2 size={16} /></div>
                      Switch Tone
                    </div>
                    <div className={styles.nodeBody}>
                      {'Set Tone = '}<strong>Firm & Assertive</strong>
                    </div>
                  </div>
                </div>
                
                <div className={`${styles.connectionLine} ${styles.activeLine}`} />
                
                <div className={`${styles.canvasNode} ${styles.actionNode}`} style={{ width: '240px' }}>
                  <div className={styles.nodeHeader}>
                    <div className={styles.iconWrapper}><Mail size={16} /></div>
                    Draft Email
                  </div>
                  <div className={styles.nodeBody}>
                    Queue for Human Approval
                  </div>
                </div>
              </div>

              {/* Path B */}
              <div className={styles.splitPath}>
                <div className={styles.connectionLine} style={{ height: '1rem' }} />
                <div className={styles.canvasNode} style={{ width: '240px' }}>
                  <div className={styles.nodeHeader} style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    If preference == &quot;sms&quot;
                  </div>
                  <div className={`${styles.canvasNode} ${styles.actionNode}`} style={{ width: '100%', marginTop: '0.5rem' }}>
                    <div className={styles.nodeHeader}>
                      <div className={styles.iconWrapper}><MessageSquare size={16} /></div>
                      Send SMS
                    </div>
                    <div className={styles.nodeBody}>
                      Template: <strong>Urgent Payment Link</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
