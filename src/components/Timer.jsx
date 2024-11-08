import React, { useState, useEffect, useCallback, memo } from 'react';

/**
 * @typedef {Object} TimerProps
 * @property {boolean} isActive - Whether the timer is currently running
 * @property {number} initialTime - Initial time in seconds
 * @property {(time: number) => void} onTimeUpdate - Callback when time updates
 * @property {string} className - Additional CSS classes
 */

const Timer = memo(({ 
  isActive, 
  initialTime = 0, 
  onTimeUpdate, 
  className = '' 
}) => {
  const [time, setTime] = useState(initialTime);
  const [error, setError] = useState(null);

  // Reset time when initialTime changes
  useEffect(() => {
    try {
      if (typeof initialTime === 'number' && initialTime >= 0) {
        setTime(initialTime);
        setError(null);
      } else {
        throw new Error('Invalid initial time');
      }
    } catch (error) {
      console.error('Error setting initial time:', error);
      setTime(0);
      setError('Invalid time value');
    }
  }, [initialTime]);

  // Timer interval management
  useEffect(() => {
    let interval = null;
    
    if (isActive && !error) {
      interval = setInterval(() => {
        setTime(prevTime => {
          try {
            const newTime = prevTime + 1;
            onTimeUpdate?.(newTime);
            return newTime;
          } catch (error) {
            console.error('Error updating timer:', error);
            return prevTime;
          }
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, onTimeUpdate, error]);

  // Time formatting with validation
  const formatTime = useCallback((timeInSeconds) => {
    try {
      if (typeof timeInSeconds !== 'number' || timeInSeconds < 0) {
        throw new Error('Invalid time value');
      }
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '0:00';
    }
  }, []);

  if (error) {
    return (
      <div className={`text-2xl font-mono text-red-500 ${className}`}>
        0:00
      </div>
    );
  }

  return (
    <div 
      className={`text-2xl font-mono transition-colors duration-200 ${
        isActive ? 'text-[#3baed9]' : 'text-gray-400'
      } ${className}`}
      title={`${formatTime(time)} - ${isActive ? 'Running' : 'Paused'}`}
    >
      {formatTime(time)}
    </div>
  );
});

Timer.displayName = 'Timer';

export default Timer;