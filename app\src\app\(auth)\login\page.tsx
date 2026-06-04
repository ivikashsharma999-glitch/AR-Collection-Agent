'use client';

import React, { Suspense, useState, useEffect } from 'react';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button/Button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

const TAGLINES = [
  "Sign in to your dashboard",
  "AI-Powered Collections",
  "Compliance Built-In",
  "60% Faster Recovery"
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
  const [taglineIndex, setTaglineIndex] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const nextPath = getSafeNextPath(searchParams.get('next'));

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((current) => (current + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
        router.refresh(); // Refresh to update server components
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`${styles.container} mesh-bg`}>
      <div className={`${styles.loginCard} glass-panel`}>
        <div className={styles.header}>
          <div className={`${styles.logo} animate-float`}>✨</div>
          <h1 className={`${styles.title} gradient-text`}>AR Collections Agent</h1>
          <p className={`${styles.subtitle} animate-fade-in`} key={taglineIndex}>{TAGLINES[taglineIndex]}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorBox}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Work Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} style={{ marginTop: '8px' }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className={styles.footer}>
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button className={styles.footerLink} onClick={() => setIsSignUp(false)}>
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button className={styles.footerLink} onClick={() => setIsSignUp(true)}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
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
    <div className={`${styles.container} mesh-bg`}>
      <div className={`${styles.loginCard} glass-panel`}>
        <div className={styles.header}>
          <div className={`${styles.logo} animate-float`}>âœ¨</div>
          <h1 className={`${styles.title} gradient-text`}>AR Collections Agent</h1>
          <p className={styles.subtitle}>Sign in to your dashboard</p>
        </div>
      </div>
    </div>
  );
}
