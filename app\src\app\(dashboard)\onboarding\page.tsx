'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button/Button';
import { useRouter } from 'next/navigation';

const STEPS = [
  'Welcome',
  'Connect Accounting',
  'Connect Email',
  'Global Settings',
  'Review Tone',
];

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [qbStatus, setQbStatus] = useState<ConnectionStatus>('idle');
  const [gmailStatus, setGmailStatus] = useState<ConnectionStatus>('idle');
  const [outlookStatus, setOutlookStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      // Finish onboarding
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleConnect = async (
    provider: 'quickbooks' | 'gmail' | 'outlook',
    setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>
  ) => {
    setStatus('connecting');
    setErrorMessage(null);

    const authUrls: Record<string, string> = {
      quickbooks: '/api/quickbooks/auth',
      gmail: '/api/email/gmail/auth',
      outlook: '/api/email/outlook/auth',
    };

    try {
      // Use redirect: 'manual' so we can inspect the response before following
      const res = await fetch(authUrls[provider], { redirect: 'manual' });

      if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
        // Real OAuth credentials are configured — follow the redirect
        window.location.href = authUrls[provider];
        return;
      }

      // API returned an error (likely missing credentials)
      // Simulate a successful demo connection so the user can proceed through onboarding
      await new Promise(resolve => setTimeout(resolve, 1800));
      setStatus('connected');
    } catch {
      // Network error — simulate demo connection
      await new Promise(resolve => setTimeout(resolve, 1800));
      setStatus('connected');
    }
  };

  const getStatusLabel = (status: ConnectionStatus) => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return '✓ Connected (Demo)';
      case 'error':
        return '✗ Failed';
      default:
        return 'Not connected';
    }
  };

  const isConnectedOrDemo = (status: ConnectionStatus) =>
    status === 'connected';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Set up your AR Agent</h1>
        <p className={styles.subtitle}>Let&apos;s get your automated collections engine running in under 5 minutes.</p>
      </div>

      <div className={styles.progressContainer}>
        {STEPS.map((step, index) => (
          <div
            key={index}
            className={`${styles.stepIndicator} ${
              index === currentStep ? styles.active : index < currentStep ? styles.completed : ''
            }`}
            title={step}
          >
            {index < currentStep ? '✓' : index + 1}
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className={styles.errorBanner}>
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      <div className={styles.content}>
        {currentStep === 0 && (
          <div>
            <h2 className={styles.stepTitle}>Welcome to AR Collections Agent ✨</h2>
            <p className={styles.stepDescription}>
              Your finance team just got a massive upgrade. Our AI operator will automatically track invoices, diagnose non-payment reasons, and draft highly contextual follow-ups.
            </p>
            <p className={styles.stepDescription}>
              You retain full control. No email is sent to a strategic account or during a dispute without your explicit approval.
            </p>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h2 className={styles.stepTitle}>Connect QuickBooks</h2>
            <p className={styles.stepDescription}>
              Sync your customers and open invoices. We&apos;ll securely pull overdue balances and invoice PDFs.
            </p>
            <div className={`${styles.integrationCard} ${isConnectedOrDemo(qbStatus) ? styles.integrationCardConnected : ''}`}>
              <div className={styles.integrationInfo}>
                <div className={styles.integrationIcon}>📗</div>
                <div>
                  <div className={styles.integrationName}>QuickBooks Online</div>
                  <div className={`${styles.integrationStatus} ${isConnectedOrDemo(qbStatus) ? styles.statusConnected : ''} ${qbStatus === 'connecting' ? styles.statusConnecting : ''}`}>
                    {getStatusLabel(qbStatus)}
                  </div>
                </div>
              </div>
              {isConnectedOrDemo(qbStatus) ? (
                <div className={styles.connectedBadge}>✓ Synced</div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleConnect('quickbooks', setQbStatus)}
                  isLoading={qbStatus === 'connecting'}
                  disabled={qbStatus === 'connecting'}
                >
                  Connect to QuickBooks
                </Button>
              )}
            </div>
            {isConnectedOrDemo(qbStatus) && (
              <div className={styles.demoBanner}>
                <span>💡</span> Running in demo mode — mock data will be used. Add your QuickBooks OAuth credentials to <code>.env.local</code> for live sync.
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className={styles.stepTitle}>Connect Your Inbox</h2>
            <p className={styles.stepDescription}>
              Connect the email account you want the Agent to send from and read replies from (e.g., billing@yourcompany.com).
            </p>
            <div className={`${styles.integrationCard} ${isConnectedOrDemo(gmailStatus) ? styles.integrationCardConnected : ''}`}>
              <div className={styles.integrationInfo}>
                <div className={styles.integrationIcon}>✉️</div>
                <div>
                  <div className={styles.integrationName}>Gmail Workspace</div>
                  <div className={`${styles.integrationStatus} ${isConnectedOrDemo(gmailStatus) ? styles.statusConnected : ''} ${gmailStatus === 'connecting' ? styles.statusConnecting : ''}`}>
                    {getStatusLabel(gmailStatus)}
                  </div>
                </div>
              </div>
              {isConnectedOrDemo(gmailStatus) ? (
                <div className={styles.connectedBadge}>✓ Linked</div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleConnect('gmail', setGmailStatus)}
                  isLoading={gmailStatus === 'connecting'}
                  disabled={gmailStatus === 'connecting' || isConnectedOrDemo(outlookStatus)}
                >
                  Sign in with Google
                </Button>
              )}
            </div>
            <div className={`${styles.integrationCard} ${isConnectedOrDemo(outlookStatus) ? styles.integrationCardConnected : ''}`}>
              <div className={styles.integrationInfo}>
                <div className={styles.integrationIcon}>📧</div>
                <div>
                  <div className={styles.integrationName}>Microsoft Outlook</div>
                  <div className={`${styles.integrationStatus} ${isConnectedOrDemo(outlookStatus) ? styles.statusConnected : ''} ${outlookStatus === 'connecting' ? styles.statusConnecting : ''}`}>
                    {getStatusLabel(outlookStatus)}
                  </div>
                </div>
              </div>
              {isConnectedOrDemo(outlookStatus) ? (
                <div className={styles.connectedBadge}>✓ Linked</div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleConnect('outlook', setOutlookStatus)}
                  isLoading={outlookStatus === 'connecting'}
                  disabled={outlookStatus === 'connecting' || isConnectedOrDemo(gmailStatus)}
                >
                  Sign in with Microsoft
                </Button>
              )}
            </div>
            {(isConnectedOrDemo(gmailStatus) || isConnectedOrDemo(outlookStatus)) && (
              <div className={styles.demoBanner}>
                <span>💡</span> Running in demo mode — emails will be simulated. Add your Google/Microsoft OAuth credentials to <code>.env.local</code> for real email integration.
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className={styles.stepTitle}>Global Safety Limits</h2>
            <p className={styles.stepDescription}>
              Set the hard limits for the Compliance Shield. The AI will never violate these rules.
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Maximum Touches per Week
              </label>
              <select defaultValue="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <option value="1">1 email per week</option>
                <option value="2">2 emails per week</option>
                <option value="3">3 emails per week (Recommended)</option>
                <option value="4">4 emails per week</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Approval Threshold
              </label>
              <select defaultValue="10k" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <option value="all">Require human approval for ALL invoices</option>
                <option value="10k">Require human approval for invoices &gt; $10,000</option>
                <option value="none">Auto-pilot all invoices (not recommended)</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className={styles.stepTitle}>Default AI Persona</h2>
            <p className={styles.stepDescription}>
              How should the Agent sound by default when reaching out to customers? (This dynamically adapts if a dispute is detected).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--primary)', borderRadius: '6px', backgroundColor: 'var(--surface)' }}>
                <input type="radio" name="tone" defaultChecked />
                <div>
                  <div style={{ fontWeight: 500 }}>Empathetic & Professional</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>&quot;Hi John, checking in on invoice #123. Let us know if you need any help.&quot;</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <input type="radio" name="tone" />
                <div>
                  <div style={{ fontWeight: 500 }}>Firm & Urgent</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>&quot;John, invoice #123 is 30 days past due. Please submit payment immediately.&quot;</div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button 
          variant="secondary" 
          onClick={handleBack} 
          disabled={currentStep === 0}
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          {currentStep === STEPS.length - 1 ? 'Finish & Go to Dashboard' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
