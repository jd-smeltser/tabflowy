import React, { useState, useEffect, useRef, useCallback } from 'react';
import Outliner from './components/Outliner';
import Timer from './components/Timer';

/**
 * @typedef {Object} URLState
 * @property {string} title - Task title
 * @property {boolean} timerRunning - Timer active state
 * @property {number} time - Current time in seconds
 * @property {Array<{content: string, level: number}>} content - Outliner content
 */

const App = () => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(0);
  const titleInputRef = useRef(null);
  const outlinerRef = useRef(null);

  // Load initial state from URL with error handling
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTitle = params.get('title');
      const urlTimerRunning = params.get('timerRunning') === 'true';
      const urlTime = parseInt(params.get('time'), 10);

      if (urlTitle) {
        setTitle(urlTitle);
      } else {
        titleInputRef.current?.focus();
      }

      if (!isNaN(urlTime) && urlTime >= 0) {
        setTime(urlTime);
      }

      setIsTimerActive(urlTimerRunning);
    } catch (error) {
      console.error('Error loading initial state:', error);
      // Reset to default state on error
      setTitle('');
      setTime(0);
      setIsTimerActive(false);
      titleInputRef.current?.focus();
    }
  }, []);

  // Enhanced URL state management with validation
  const updateURL = useCallback((params) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      Object.entries(params).forEach(([key, value]) => {
        if (value || value === 0) {
          urlParams.set(key, value.toString());
        } else {
          urlParams.delete(key);
        }
      });
      const newUrl = `?${urlParams.toString()}`;
      if (newUrl !== window.location.search) {
        window.history.replaceState(null, '', newUrl);
      }
    } catch (error) {
      console.error('Error updating URL state:', error);
    }
  }, []);

  // Enhanced title handling with validation
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateURL({ title: newTitle.trim() || null });
  }, [updateURL]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      outlinerRef.current?.focusFirstItem();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      outlinerRef.current?.focusFirstItem();
    }
  }, []);

  // Enhanced timer handling with validation
  const toggleTimer = useCallback(() => {
    setIsTimerActive(prev => {
      const newState = !prev;
      updateURL({ timerRunning: newState || null });
      return newState;
    });
  }, [updateURL]);

  // Enhanced keyboard shortcuts with error handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      try {
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
      } catch (error) {
        console.error('Error handling keyboard shortcut:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer]);

  // Enhanced document title update with validation
  useEffect(() => {
    try {
      const displayTitle = title || 'Untitled';
      const timerPrefix = isTimerActive ? '⏱ ' : '';
      document.title = `${timerPrefix}${displayTitle}`;
    } catch (error) {
      console.error('Error updating document title:', error);
      document.title = 'Tabflowy';
    }
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