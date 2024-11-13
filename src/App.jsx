import React, { useState, useEffect, useRef, useCallback } from 'react';
import Outliner from './components/Outliner';
import Timer from './components/Timer';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const App = () => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [time, setTime] = useState(0);
  const [title, setTitle] = useState('');
  const [zoomPath, setZoomPath] = useState([]);
  const [items, setItems] = useState([{ id: generateId(), content: '', level: 0 }]);
  
  const titleInputRef = useRef(null);
  const outlinerRef = useRef(null);

  // Load initial state from URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTitle = params.get('title');
      const urlTimerRunning = params.get('timerRunning') === 'true';
      const urlTime = parseInt(params.get('time'), 10);
      const urlContent = params.get('content');

      if (urlTitle) {
        setTitle(urlTitle);
      } else {
        titleInputRef.current?.focus();
      }

      if (!isNaN(urlTime) && urlTime >= 0) {
        setTime(urlTime);
      }

      setIsTimerActive(urlTimerRunning);

      if (urlContent) {
        try {
          const parsedContent = JSON.parse(urlContent);
          const contentWithIds = parsedContent.map(item => ({
            ...item,
            id: item.id || generateId()
          }));
          setItems(contentWithIds);
        } catch (e) {
          console.error('Failed to parse content from URL');
        }
      }
    } catch (error) {
      console.error('Error loading initial state:', error);
      setTitle('');
      setTime(0);
      setIsTimerActive(false);
      titleInputRef.current?.focus();
    }
  }, []);

  // Sync items to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (items.length === 1 && !items[0].content) {
      params.delete('content');
    } else {
      params.set('content', JSON.stringify(items));
    }
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [items]);

  // Update URL state for other parameters
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

      window.history.replaceState(null, '', `?${urlParams.toString()}`);
    } catch (error) {
      console.error('Error updating URL state:', error);
    }
  }, []);

  // Handle title changes
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateURL({ 
      title: newTitle.trim() || null,
      time,
      timerRunning: isTimerActive || null
    });
  }, [updateURL, time, isTimerActive]);

  // Handle title keyboard shortcuts
  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      outlinerRef.current?.focusFirstItem();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      outlinerRef.current?.focusFirstItem();
    }
  }, []);

  // Handle timer updates
  const handleTimeUpdate = useCallback((newTime) => {
    setTime(newTime);
    updateURL({ 
      time: newTime,
      timerRunning: isTimerActive || null
    });
  }, [isTimerActive, updateURL]);

  // Toggle timer state
  const toggleTimer = useCallback(() => {
    setIsTimerActive(prev => {
      const newState = !prev;
      updateURL({ timerRunning: newState || null });
      return newState;
    });
  }, [updateURL]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      try {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          toggleTimer();
        }
        
        if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          window.open(window.location.pathname, '_blank');
        }

        if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          titleInputRef.current?.focus();
        }

        if (e.key === ',' && (e.ctrlKey || e.metaKey) && zoomPath.length > 0) {
          e.preventDefault();
          setZoomPath(prev => prev.slice(0, -1));
        }
      } catch (error) {
        console.error('Error handling keyboard shortcut:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, zoomPath]);

  // Update document title
  useEffect(() => {
    try {
      let displayTitle;
      if (zoomPath.length > 0) {
        const zoomedItemId = zoomPath[zoomPath.length - 1];
        const zoomedItem = items.find(item => item.id === zoomedItemId);
        displayTitle = zoomedItem?.content || 'Untitled';
      } else {
        displayTitle = title || 'Untitled';
      }
      const timerPrefix = isTimerActive ? '⏱ ' : '';
      document.title = `${timerPrefix}${displayTitle}`;
    } catch (error) {
      console.error('Error updating document title:', error);
      document.title = 'Tabflowy';
    }
  }, [title, isTimerActive, zoomPath, items]);

  return (
    <div className="min-h-screen bg-[#333] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline gap-4 input-container">
          <input
            ref={titleInputRef}
            type="text"
            value={zoomPath.length > 0 ? items.find(item => item.id === zoomPath[zoomPath.length - 1])?.content || '' : title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled"
            className="bg-transparent text-3xl font-bold outline-none flex-grow font-mono"
            style={{ border: 'none' }}
            readOnly={zoomPath.length > 0}
          />
          <Timer 
            isActive={isTimerActive}
            initialTime={time}
            onTimeUpdate={handleTimeUpdate}
            className={`text-lg font-mono transition-colors ${
              isTimerActive ? 'text-timer-active' : 'text-timer-inactive'
            }`}
          />
        </div>
        <Outliner
          ref={outlinerRef}
          items={items}
          setItems={setItems}
          zoomPath={zoomPath}
          setZoomPath={setZoomPath}
        />
      </div>
    </div>
  );
};

export default App;