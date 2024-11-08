import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';

const OutlinerItem = ({ 
  item, 
  onUpdate, 
  onDelete, 
  index,
  level,
  onIndent,
  onOutdent,
  inputRef,
  onFocusPrevious,
  onFocusNext,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onUpdate(index + 1, { content: '', level: level });
      // Automatically focus next item
      setTimeout(() => onFocusNext(index), 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(index);
      } else {
        onIndent(index);
      }
    } else if (e.key === 'Backspace' && !item.content) {
      e.preventDefault();
      if (index > 0) {
        onDelete(index);
        onFocusPrevious(index);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onFocusPrevious(index);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onFocusNext(index);
    }
  };

  const handleContentChange = (e) => {
    onUpdate(index, { ...item, content: e.target.value });
  };

  return (
    <div className="flex items-start" style={{ marginLeft: level * 20 + 'px' }}>
      <span className="text-gray-500 mt-1.5 mr-2">*</span>
      <input
        ref={inputRef}
        type="text"
        value={item.content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent border-none outline-none text-white font-mono"
        style={{
          fontSize: '16px',
          lineHeight: '2',
          padding: '0',
          margin: '0'
        }}
      />
    </div>
  );
};

// Rest of the Outliner component remains the same...