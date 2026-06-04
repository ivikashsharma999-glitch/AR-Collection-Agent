'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Pause,
  PhoneCall,
  Volume2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.css';

// Mock Voice Logs
const MOCK_CALLS = [
  {
    id: 'call-001',
    customer: 'Momentum Labs',
    date: 'Today, 2:15 PM',
    duration: '04:12',
    status: 'success',
    intent: 'Payment Collected',
    amount: '$12,400.00',
    transcript: [
      { speaker: 'ai', text: 'Hi, this is Alex from AR Collections calling for the Accounts Payable team at Momentum Labs. Am I speaking with Sarah?' },
      { speaker: 'human', text: 'Yes, this is Sarah. What is this regarding?' },
      { speaker: 'ai', text: 'Hi Sarah. I\'m calling regarding invoice INV-2026-0158 for $12,400.00. Our records show it is currently 35 days past due. I wanted to see if we could get this resolved today.' },
      { speaker: 'human', text: 'Oh, right. We had a cash flow issue last month, so we held off on a few vendor payments. We can pay half now.' },
      { speaker: 'ai', text: 'I understand. I can authorize a split payment plan. If we process $6,200 today, can we schedule the remaining $6,200 for next Friday?' },
      { speaker: 'human', text: 'Yes, that works for me. Can you send me the payment link for the first half?' },
      { speaker: 'ai', text: 'Absolutely. I have just emailed the secure payment link to your address on file. Thank you for your time, Sarah.' }
    ]
  },
  {
    id: 'call-002',
    customer: 'Vertex Digital',
    date: 'Yesterday, 11:30 AM',
    duration: '01:45',
    status: 'escalated',
    intent: 'Dispute Logged',
    amount: '$3,200.00',
    transcript: [
      { speaker: 'ai', text: 'Hello, this is the automated collections assistant calling for Vertex Digital regarding invoice INV-2026-0152.' },
      { speaker: 'human', text: 'Listen, I told your account manager yesterday we aren\'t paying this until the software bug is fixed.' },
      { speaker: 'ai', text: 'I apologize for the frustration. I will immediately pause collections on this invoice and log a service dispute for our team to review.' }
    ]
  }
];

const WAVEFORM_HEIGHTS = Array.from({ length: 40 }, (_, i) => 20 + ((i * 37) % 80));

export default function VoiceCommunicationsPage() {
  const [activeCallId, setActiveCallId] = useState(MOCK_CALLS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeCall = MOCK_CALLS.find(c => c.id === activeCallId) || MOCK_CALLS[0];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}><PhoneCall size={24} style={{ color: 'var(--brand-primary)' }} /> Voice AI Agent</h1>
          <p className={styles.subtitle}>Review automated outbound phone calls and negotiated outcomes.</p>
        </div>
        <Button variant="primary">
          Configure Voice Settings
        </Button>
      </header>

      <div className={styles.workspace}>
        {/* ── Call List Sidebar ── */}
        <div className={styles.callList}>
          <div className={styles.listHeader}>Recent Calls</div>
          <div className={styles.listBody}>
            {MOCK_CALLS.map(call => (
              <div 
                key={call.id} 
                className={`${styles.callItem} ${activeCallId === call.id ? styles.active : ''}`}
                onClick={() => {
                  setActiveCallId(call.id);
                  setIsPlaying(false);
                }}
              >
                <div className={styles.callHeader}>
                  <span className={styles.callCustomer}>{call.customer}</span>
                  <span className={styles.callTime}>{call.date}</span>
                </div>
                <div className={styles.callMeta}>
                  {call.status === 'success' ? (
                    <CheckCircle2 size={14} color="var(--color-success)" />
                  ) : (
                    <AlertCircle size={14} color="var(--color-warning)" />
                  )}
                  {call.intent} • {call.duration}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Call Details & Transcript ── */}
        <div className={styles.callDetails}>
          {/* Audio Player Mockup */}
          <div className={styles.audioPlayer}>
            <button className={styles.playBtn} onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>
            <div className={styles.waveform}>
              {/* Fake Waveform Bars */}
              {WAVEFORM_HEIGHTS.map((height, i) => (
                <div 
                  key={i} 
                  className={`${styles.waveBar} ${isPlaying ? styles.played : ''}`} 
                  style={{ 
                    height: `${height}%`,
                    transitionDelay: isPlaying ? `${i * 0.05}s` : '0s'
                  }} 
                />
              ))}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
              {isPlaying ? '01:14' : '00:00'} / {activeCall.duration}
            </div>
          </div>

          {/* Transcript Area */}
          <div className={styles.transcriptArea}>
            {activeCall.transcript.map((msg, idx) => (
              <div key={idx} className={`${styles.message} ${styles[msg.speaker]}`}>
                <div className={styles.messageBubble}>
                  {msg.text}
                </div>
                <div className={styles.messageMeta}>
                  {msg.speaker === 'ai' ? <Volume2 size={12} /> : null}
                  {msg.speaker === 'ai' ? 'AI Voice Agent' : activeCall.customer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
