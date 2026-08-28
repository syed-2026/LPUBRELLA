import { useEffect, useState } from 'react';
import { secondsUntil } from '@/utils/date';

export function useCountdown(expiresAt: string | null): number {
  const [remaining, setRemaining] = useState(() => (expiresAt ? secondsUntil(expiresAt) : 0));

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(0);
      return;
    }
    setRemaining(secondsUntil(expiresAt));
    const interval = setInterval(() => {
      setRemaining(secondsUntil(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}
