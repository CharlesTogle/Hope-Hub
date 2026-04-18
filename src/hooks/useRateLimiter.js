import { useRef, useCallback } from 'react';

export default function useRateLimiter ({
  maxAttempts = 5,
  cooldownMs = 300000,
  minIntervalMs = 11500,
} = {}) {
  const attemptCount = useRef(0);
  const lastAttemptTime = useRef(0);

  const isRateLimited = useCallback(() => {
    const now = Date.now();

    // Handle first call when lastAttemptTime is 0
    if (lastAttemptTime.current === 0) {
      attemptCount.current++;
      lastAttemptTime.current = now;
      return false;
    }

    const timeDiff = now - lastAttemptTime.current;
    console.log(now, lastAttemptTime.current);

    // Reset count if cooldown period has passed
    if (timeDiff > cooldownMs) {
      attemptCount.current = 0;
    }

    // Check if max attempts exceeded
    if (attemptCount.current >= maxAttempts) {
      return { type: 'exceeded' };
    }

    // Check if attempting too fast
    if (timeDiff < minIntervalMs) {
      return { type: 'too-fast' };
    }

    // Update counters for successful attempt
    attemptCount.current++;
    lastAttemptTime.current = now;
    return false;
  }, [maxAttempts, cooldownMs, minIntervalMs]);

  return isRateLimited;
}
