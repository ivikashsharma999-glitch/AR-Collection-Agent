'use client';

import Link from 'next/link';
import React, { Suspense, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

const TRUST_POINTS = [
  'Protected AR command center access',
  'Audit-ready activity and approval trails',
  'Secure customer and invoice workflows',
];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const nextPath = getSafeNextPath(searchParams.get('next'));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />
      <Link href="/" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to CollectionsOS
      </Link>

      <section className={styles.authShell}>
        <aside className={styles.brandPanel}>
          <div className={styles.logoRow}>
            <span className={styles.logoIcon}>AR</span>
            <span className={styles.logoText}>
              Collections<span>OS</span>
            </span>
          </div>

          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>SECURE COMMAND CENTER</span>
            <h1>Recover cash faster, with every workflow under control.</h1>
            <p>
              Sign in to approve AI-drafted follow-ups, review priority accounts,
              monitor promises to pay, and keep your collections engine moving.
            </p>
          </div>

          <div className={styles.metricGrid}>
            <div>
              <strong>20%</strong>
              <span>DSO reduction target</span>
            </div>
            <div>
              <strong>90%</strong>
              <span>less manual work</span>
            </div>
          </div>

          <div className={styles.trustList}>
            {TRUST_POINTS.map((point) => (
              <div key={point}>
                <CheckCircle2 size={18} />
                {point}
              </div>
            ))}
          </div>
        </aside>

        <section className={styles.formPanel} aria-label="CollectionsOS authentication">
          <div className={styles.formHeader}>
            <span className={styles.secureBadge}>
              <ShieldCheck size={15} />
              Encrypted session
            </span>
            <h2>{isSignUp ? 'Create your workspace' : 'Welcome back'}</h2>
            <p>
              {isSignUp
                ? 'Start your CollectionsOS trial and connect your AR workflow.'
                : 'Use your work email and password to enter the dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error ? <div className={styles.errorBox}>{error}</div> : null}

            <label className={styles.inputGroup} htmlFor="email">
              <span>Work email</span>
              <div className={styles.inputWrap}>
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </label>

            <label className={styles.inputGroup} htmlFor="password">
              <span>Password</span>
              <div className={styles.inputWrap}>
                <LockKeyhole size={18} />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
            </label>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Securing session...' : isSignUp ? 'Create Account' : 'Sign In'}
              {!isLoading ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          <div className={styles.switchBox}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => setIsSignUp((current) => !current)}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          <p className={styles.legalText}>
            By continuing, you agree to secure access controls for your finance workspace.
          </p>
        </section>
      </section>
    </main>
  );
}

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard';
  }

  return next;
}

function LoginShell() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />
      <section className={styles.loadingCard}>
        <span className={styles.logoIcon}>AR</span>
        <p>Loading secure sign in...</p>
      </section>
    </main>
  );
}
