import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleTimeoutOptions {
  timeoutMinutes: number;
  warningMinutes?: number;
  onTimeout: () => void;
  onWarning?: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  timeoutMinutes,
  warningMinutes = 1,
  onTimeout,
  onWarning,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timeoutRef.current = null;
    warningRef.current = null;
    countdownRef.current = null;
  }, []);

  const resetTimers = useCallback(() => {
    if (!enabled) return;
    
    clearAllTimers();
    setIsWarningVisible(false);

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = warningMinutes * 60 * 1000;
    const warningStartMs = timeoutMs - warningMs;

    // Set warning timer
    if (warningStartMs > 0) {
      warningRef.current = setTimeout(() => {
        setIsWarningVisible(true);
        setRemainingSeconds(warningMinutes * 60);
        onWarning?.();

        // Start countdown
        countdownRef.current = setInterval(() => {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              clearInterval(countdownRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningStartMs);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      clearAllTimers();
      setIsWarningVisible(false);
      onTimeout();
    }, timeoutMs);
  }, [enabled, timeoutMinutes, warningMinutes, onTimeout, onWarning, clearAllTimers]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setIsWarningVisible(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (!isWarningVisible) {
        resetTimers();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimers();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [enabled, resetTimers, clearAllTimers, isWarningVisible]);

  return {
    isWarningVisible,
    remainingSeconds,
    extendSession,
  };
}
