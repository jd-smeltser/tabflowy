import React, { useState, useEffect, useCallback, memo } from 'react';

const Timer = memo(({ isActive, initialTime = 0, onTimeUpdate, className = '' }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    let interval = null;
    
    if (isActive) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          onTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, onTimeUpdate]);

  const formatTime = useCallback((timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={`text-2xl font-mono transition-colors duration-200 ${
      isActive ? 'text-[#3baed9]' : 'text-gray-400'
    } ${className}`}>
      {formatTime(time)}
    </div>
  );
});

Timer.displayName = 'Timer';

export default Timer;