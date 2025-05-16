import { useState, useCallback, useEffect } from 'react';
import { formatTime } from './sudoku-utils';

export const useTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Start the timer
  const startTimer = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      const id = window.setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
      setIntervalId(id);
    }
  }, [isRunning]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (isRunning && intervalId !== null) {
      clearInterval(intervalId);
      setIsRunning(false);
      setIntervalId(null);
    }
  }, [isRunning, intervalId]);

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    setTime(0);
    setIsRunning(false);
    setIntervalId(null);
  }, [intervalId]);

  // Format time as MM:SS
  const formattedTime = formatTime(time);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    time,
    setTime,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    formattedTime,
  };
};
