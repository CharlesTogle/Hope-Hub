import { useState, useEffect, useRef, useCallback } from 'react';
import timerIcon from '@/assets/icons/timer_pft.png';

export function Timer ({
  onEnd = () => {},
  onStart = () => {},
  time = 320,
  className,
  setTimerCustom = null,
  storageKey = 'timer',
}) {
  const timerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(time);
  const [hasInitialized, setHasInitialized] = useState(false);

  const updateTime = useCallback(
    secondsLeft => {
      if (typeof setTimerCustom === 'function') {
        setTimerCustom(secondsLeft);
      } else {
        setCurrentTime(secondsLeft);
      }
    },
    [setTimerCustom],
  );
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    localStorage.removeItem(`${storageKey}RemainingTime`);
    localStorage.removeItem(`${storageKey}IsRunning`);
  }, [storageKey]);
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const startTimer = useCallback(
    durationInSeconds => {
      localStorage.setItem(
        `${storageKey}RemainingTime`,
        durationInSeconds.toString(),
      );
      localStorage.setItem(`${storageKey}IsRunning`, 'true');

      timerRef.current = setInterval(() => {
        const currentRemaining =
          parseInt(localStorage.getItem(`${storageKey}RemainingTime`)) || 0;
        const newTime = currentRemaining - 1;

        if (newTime > 0) {
          updateTime(newTime);
          localStorage.setItem(
            `${storageKey}RemainingTime`,
            newTime.toString(),
          );
        } else {
          updateTime(0);
          stopTimer();
          onEnd();
        }
      }, 1000);
    },
    [updateTime, stopTimer, onEnd, storageKey],
  );
  useEffect(() => {
    if (hasInitialized) return; // Only run once

    const savedRemainingTime = localStorage.getItem(
      `${storageKey}RemainingTime`,
    );
    const savedIsRunning = localStorage.getItem(`${storageKey}IsRunning`);

    const remainingTime = parseInt(savedRemainingTime);
    const isRunning = savedIsRunning === 'true';

    if (
      savedRemainingTime &&
      isRunning &&
      !isNaN(remainingTime) &&
      remainingTime > 0
    ) {
      updateTime(remainingTime);

      // Continue timer from saved remaining time
      timerRef.current = setInterval(() => {
        const currentRemaining =
          parseInt(localStorage.getItem(`${storageKey}RemainingTime`)) || 0;
        const newTime = currentRemaining - 1;

        if (newTime > 0) {
          updateTime(newTime);
          localStorage.setItem(
            `${storageKey}RemainingTime`,
            newTime.toString(),
          );
        } else {
          updateTime(0);
          stopTimer();
          onEnd();
        }
      }, 1000);

      onStart();
    } else {
      // No saved timer or timer finished - start fresh
      updateTime(time);
      startTimer(time);
      onStart();
    }
    setHasInitialized(true);

    return () => {
      pauseTimer(); // Only pause, don't clear localStorage on unmount
    };
  }, [storageKey]);

  const displayTime =
    typeof setTimerCustom === 'function' ? currentTime : currentTime;

  return (
    <div className={className}>
      <img src={timerIcon} alt='timer' className='w-[15%]' />
      <p className='text-wrap text-sm'>
        {Math.floor(displayTime / 60)} :{' '}
        {String(displayTime % 60).padStart(2, '0')}{' '}
        <span>{displayTime < 60 ? 'seconds' : 'mins'}</span>
      </p>
    </div>
  );
}
