'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';

export function SuppressButton({ customerId, customerName }: { customerId: string, customerName: string }) {
  const [isSuppressed, setIsSuppressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    const action = isSuppressed ? 'unsuppress' : 'suppress';
    if (action === 'suppress' && !confirm(`Are you sure you want to suppress ${customerName}? This will pause all automated reminders.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/accounts/suppress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, action })
      });
      
      if (res.ok) {
        setIsSuppressed(!isSuppressed);
      } else {
        alert('Failed to update suppression status.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={isSuppressed ? 'outline' : 'danger'} 
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? 'Updating...' : isSuppressed ? 'Unsuppress Account' : 'Suppress Account'}
    </Button>
  );
}
