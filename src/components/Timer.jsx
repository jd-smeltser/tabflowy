import React, { useState, useEffect } from 'react';

const Timer = ({ isActive }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval = null;
    
    if (isActive) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedTime = params.get('time');
    if (savedTime) {
      setTime(parseInt(savedTime, 10));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (time > 0) {
      params.set('time', time.toString());
    } else {
      params.delete('time');
    }
    params.set('timerRunning', isActive.toString());
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [time, isActive]);

  return (
    <div className={`text-2xl font-mono transition-colors ${isActive ? 'text-[#3baed9]' : 'text-gray-400'}`}>
      {formattedTime}
    </div>
  );
};

export default Timer;