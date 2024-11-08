import React, { useState, useEffect, useRef } from 'react';
import Outliner from './components/Outliner';
import Timer from './components/Timer';

const App = () => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(0);
  const titleInputRef = useRef(null);
  const outlinerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTitle = params.get('title');
    if (urlTitle) {
      setTitle(urlTitle);
    } else {
      // Auto-focus title input if no title exists
      titleInputRef.current?.focus();
    }
  }, []);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    updateURL({ title: e.target.value });
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      outlinerRef.current?.focusFirstItem();
    }
  };

  const updateURL = (params) => {
    const urlParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value);
      } else {
        urlParams.delete(key);
      }
    });
    window.history.replaceState(null, '', `?${urlParams.toString()}`);
  };

  const toggleTimer = () => {
    setIsTimerActive(!isTimerActive);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        toggleTimer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTimerActive]);

  return (
    <div className="min-h-screen bg-[#333] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline gap-4">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            className="bg-transparent text-3xl font-bold outline-none flex-grow font-mono"
            style={{ border: 'none' }}
          />
          {time > 0 && (
            <Timer 
              isActive={isTimerActive} 
              className={`text-lg font-mono transition-colors ${isTimerActive ? 'text-[#e6c07b]' : 'text-gray-400'}`}
            />
          )}
        </div>
        <Outliner ref={outlinerRef} />
      </div>
    </div>
  );
};

export default App;