import React, { useState, useEffect } from 'react';
import Outliner from './components/Outliner';
import Timer from './components/Timer';
import { Play, Square, Plus } from 'lucide-react';

const App = () => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [title, setTitle] = useState('New task');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTitle = params.get('title');
    if (urlTitle) {
      setTitle(urlTitle);
    }
  }, []);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    updateURL({ title: e.target.value });
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

  const createNewTask = () => {
    const newWindow = window.open(window.location.pathname, '_blank');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        toggleTimer();
      } else if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        createNewTask();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTimerActive]);

  return (
    <div className="min-h-screen bg-[#333] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={createNewTask}
            className="text-gray-400 hover:text-white transition-colors"
            title="New task"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={toggleTimer}
            className="text-gray-400 hover:text-white transition-colors"
            title={isTimerActive ? "Stop timer" : "Start timer"}
          >
            {isTimerActive ? <Square size={20} /> : <Play size={20} />}
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="bg-transparent text-3xl font-bold outline-none w-full mb-4 font-mono"
          style={{ border: 'none' }}
        />

        <Timer isActive={isTimerActive} />
        <Outliner />
      </div>
    </div>
  );
};

export default App;