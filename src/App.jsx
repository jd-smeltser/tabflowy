import React, { useState, useEffect, useRef, useCallback } from 'react';
import Outliner from './components/Outliner';
import Timer from './components/Timer';

const App = () => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(0);
  const titleInputRef = useRef(null);
  const outlinerRef = useRef(null);

  // Load initial state from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTitle = params.get('title');
    const urlTimerRunning = params.get('timerRunning') === 'true';
    const urlTime = parseInt(params.get('time'), 10);

    if (urlTitle) {
      setTitle(urlTitle);
    } else {
      titleInputRef.current?.focus();
    }

    if (!isNaN(urlTime)) {
      setTime(urlTime);
    }

    setIsTimerActive(urlTimerRunning);
  }, []);

  // URL state management
  const updateURL = useCallback((params) => {
    const urlParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value || value === 0) {
        urlParams.set(key, value.toString());
      } else {
        urlParams.delete(key);
      }
    });
    window.history.replaceState(null, '', `?${urlParams.toString()}`);
  }, []);

  // Title handling
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateURL({ title: newTitle });
  }, [updateURL]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      outlinerRef.current?.focusFirstItem();
    }
  }, []);

  // Timer handling
  const toggleTimer = useCallback(() => {
    setIsTimerActive(prev => !prev);
    updateURL({ timerRunning: !isTimerActive });
  }, [isTimerActive, updateURL]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Timer toggle
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleTimer();
      }
      
      // New task shortcut
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.open(window.location.pathname, '_blank');
      }

      // Focus title shortcut
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        titleInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer]);

  // Update document title
  useEffect(() => {
    const displayTitle = title || 'Untitled';
    const timerPrefix = isTimerActive ? '⏱ ' : '';
    document.title = `${timerPrefix}${displayTitle}`;
  }, [title, isTimerActive]);

  return (
    <div className="min-h-screen bg-[#333] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline gap-4 input-container">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled"
            className="bg-transparent text-3xl font-bold outline-none flex-grow font-mono"
            style={{ border: 'none' }}
          />
          <Timer 
            isActive={isTimerActive} 
            initialTime={time}
            onTimeUpdate={(newTime) => {
              setTime(newTime);
              updateURL({ time: newTime });
            }}
            className={`text-lg font-mono transition-colors ${
              isTimerActive ? 'text-timer-active' : 'text-timer-inactive'
            }`}
          />
        </div>
        <Outliner ref={outlinerRef} />
      </div>
    </div>
  );
};

export default App;