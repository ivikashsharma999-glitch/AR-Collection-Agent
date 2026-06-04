'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './Topbar.module.css';

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      className={styles.iconBtn}
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Sign out"
      title="Sign out"
      type="button"
    >
      <LogOut size={18} />
    </button>
  );
}
