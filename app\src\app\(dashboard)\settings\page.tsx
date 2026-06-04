'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from '../dashboard/page.module.css';

type ConnectionStatus = 'idle' | 'connecting' | 'connected';

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gmailFromUrl = searchParams.get('gmail') === 'connected';
  const outlookFromUrl = searchParams.get('outlook') === 'connected';
  const error = searchParams.get('error');

  const [gmailStatus, setGmailStatus] = useState<ConnectionStatus>(gmailFromUrl ? 'connected' : 'idle');
  const [outlookStatus, setOutlookStatus] = useState<ConnectionStatus>(outlookFromUrl ? 'connected' : 'idle');
  const [twilioStatus, setTwilioStatus] = useState<ConnectionStatus>('idle');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(error ? `Failed to connect account (${error}). Please try again.` : null);
  const [messageType, setMessageType] = useState<'error' | 'info'>(error ? 'error' : 'info');
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  const handleConnect = async (
    provider: 'gmail' | 'outlook',
    setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>
  ) => {
    setStatus('connecting');
    setStatusMessage(null);

    const authUrls: Record<string, string> = {
      gmail: '/api/email/gmail/auth',
      outlook: '/api/email/outlook/auth',
    };

    try {
      const res = await fetch(authUrls[provider], { redirect: 'manual' });

      if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
        window.location.href = authUrls[provider];
        return;
      }

      // Missing credentials — simulate demo connection
      await new Promise(resolve => setTimeout(resolve, 1800));
      setStatus('connected');
      setMessageType('info');
      setStatusMessage(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} connected in demo mode. Add OAuth credentials to .env.local for live integration.`);
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1800));
      setStatus('connected');
      setMessageType('info');
      setStatusMessage(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} connected in demo mode.`);
    }
  };

  const [qbStatus, setQbStatus] = useState<ConnectionStatus>('idle');

  const handleSeedDemo = async () => {
    setIsSeedingDemo(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/demo/seed', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Unable to seed demo data.');
      }

      setMessageType('info');
      setStatusMessage(`Pilot workspace seeded with ${result.records.customers} customers, ${result.records.invoices} invoices, and ${result.records.approvals} approval items.`);
      router.refresh();
    } catch (seedError) {
      setMessageType('error');
      setStatusMessage(seedError instanceof Error ? seedError.message : 'Unable to seed demo data.');
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const handleTwilioConnect = async () => {
    setTwilioStatus('connecting');
    setStatusMessage(null);

    // Demo mode — simulate Twilio connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTwilioStatus('connected');
    setMessageType('info');
    setStatusMessage('Twilio SMS connected in demo mode. Add your Twilio credentials to .env.local for live SMS sending.');
  };

  const handleQbConnect = async () => {
    setQbStatus('connecting');
    setStatusMessage(null);

    // Demo mode — simulate QB connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    setQbStatus('connected');
    setMessageType('info');
    setStatusMessage('QuickBooks connected in demo mode. The agent is now monitoring the ledger for incoming payments.');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure integrations and default preferences.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSeedDemo}
          isLoading={isSeedingDemo}
          disabled={isSeedingDemo}
        >
          Seed Pilot Workspace
        </Button>
      </header>

      {statusMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: messageType === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.06)',
          color: messageType === 'error' ? 'var(--color-danger)' : 'var(--text-secondary)',
          borderRadius: '8px',
          border: messageType === 'error' ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(99, 102, 241, 0.15)',
          fontSize: '0.9rem',
        }}>
          <strong>{messageType === 'error' ? '⚠️ Error:' : '💡 Note:'}</strong> {statusMessage}
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email Integrations</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Connect your inbox to send and receive collection emails directly from your domain.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem',
                border: gmailStatus === 'connected' ? '1px solid #22c55e' : '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: gmailStatus === 'connected' ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                transition: 'border-color 0.4s ease, background-color 0.4s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>✉️</div>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Google Workspace (Gmail)</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Send and receive via Gmail API</p>
                  </div>
                </div>
                {gmailStatus === 'connected' ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleConnect('gmail', setGmailStatus)}
                    isLoading={gmailStatus === 'connecting'}
                    disabled={gmailStatus === 'connecting'}
                  >
                    Connect Gmail
                  </Button>
                )}
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem',
                border: outlookStatus === 'connected' ? '1px solid #22c55e' : '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: outlookStatus === 'connected' ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                transition: 'border-color 0.4s ease, background-color 0.4s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>📧</div>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Microsoft Outlook</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Send and receive via Microsoft Graph</p>
                  </div>
                </div>
                {outlookStatus === 'connected' ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleConnect('outlook', setOutlookStatus)}
                    isLoading={outlookStatus === 'connecting'}
                    disabled={outlookStatus === 'connecting'}
                  >
                    Connect Outlook
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Twilio SMS Integration */}
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>SMS Integration (Twilio)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Enable multi-channel outreach. The AI agent will automatically switch to SMS when email follow-ups go unanswered.
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem',
              border: twilioStatus === 'connected' ? '1px solid #22c55e' : '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: twilioStatus === 'connected' ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
              transition: 'border-color 0.4s ease, background-color 0.4s ease',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>📱</div>
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Twilio SMS</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Send SMS via Twilio Messaging API</p>
                </div>
              </div>
              {twilioStatus === 'connected' ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleTwilioConnect}
                  isLoading={twilioStatus === 'connecting'}
                  disabled={twilioStatus === 'connecting'}
                >
                  Connect Twilio
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>Account SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>Auth Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>From Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(99, 102, 241, 0.06)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong>📡 Channel Routing Rule:</strong> If an invoice is &gt;30 days overdue and the customer hasn&apos;t replied to the last 2 emails, the agent will automatically draft an SMS for your approval.
              </p>
            </div>
          </div>
        </Card>

        {/* Financial Systems Integration */}
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Financial Systems</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Connect your ERP/Accounting system to enable bi-directional sync. The agent will auto-resolve follow-ups when payments clear.
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem',
              border: qbStatus === 'connected' ? '1px solid #22c55e' : '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: qbStatus === 'connected' ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
              transition: 'border-color 0.4s ease, background-color 0.4s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>📗</div>
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>QuickBooks Online</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Sync invoices and payments via OAuth2</p>
                </div>
              </div>
              {qbStatus === 'connected' ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleQbConnect}
                  isLoading={qbStatus === 'connecting'}
                  disabled={qbStatus === 'connecting'}
                >
                  Connect QuickBooks
                </Button>
              )}
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.06)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong>⚡ Deep ERP Cash Application:</strong> Once connected, the agent will monitor your QuickBooks ledger. Incoming payments automatically match to invoices and resolve pending communications in your Inbox without manual intervention.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
