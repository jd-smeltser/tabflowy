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
  onSplitLine,
}) => {
  const textareaRef = useRef(null);

  const setRefs = (element) => {
    textareaRef.current = element;
    if (typeof inputRef === 'function') {
      inputRef(element);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      const resizeTextarea = () => {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      };
      resizeTextarea();
    }
  }, [item.content]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (e.shiftKey) {
        onOutdent(index);
      } else {
        onIndent(index);
      }
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
      
      return false;
    }
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const currentContent = item.content;
        
        // Split content at cursor position
        const beforeCursor = currentContent.substring(0, cursorPosition);
        const afterCursor = currentContent.substring(cursorPosition);
        
        // Update current line with content before cursor
        onUpdate(index, { ...item, content: beforeCursor });
        
        // Insert new line with remaining content and set cursor to start
        onSplitLine(index + 1, {
          content: afterCursor,
          level: level
        }, 0);
        break;
        
      case 'Backspace':
        if (!item.content) {
          e.preventDefault();
          if (index > 0) {
            onDelete(index);
            onFocusPrevious(index);
          }
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          onFocusPrevious(prevIndex);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = index + 1;
        onFocusNext(nextIndex);
        break;
    }
  };

  const handleContentChange = (e) => {
    onUpdate(index, { ...item, content: e.target.value });
  };

  return (
    <div className="flex min-w-0 relative">
      <div 
        className="flex min-w-0 w-full"
        style={{ paddingLeft: level * 20 + 'px' }}
      >
        <div className="flex-shrink-0 w-6 text-gray-500 select-none">
          *
        </div>
        
        <div className="flex-grow min-w-0">
          <textarea
            ref={setRefs}
            value={item.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-white font-mono resize-none overflow-hidden"
            style={{
              fontSize: '16px',
              lineHeight: '2',
              padding: '0',
              margin: '0',
              minHeight: '32px',
            }}
            rows={1}
            spellCheck={false}
            tabIndex={0}
          />
        </div>
      </div>
    </div>
  );
};

const Outliner = forwardRef((props, ref) => {
  const [items, setItems] = useState([{ content: '', level: 0 }]);
  const itemRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const content = params.get('content');
    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        setItems(parsedContent);
      } catch (e) {
        console.error('Failed to parse content from URL');
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (items.length === 1 && !items[0].content) {
      params.delete('content');
    } else {
      params.set('content', JSON.stringify(items));
    }
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [items]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  const updateItem = (index, newItem) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (index === prevItems.length) {
        newItems.push(newItem);
      } else {
        newItems[index] = newItem;
      }
      return newItems;
    });

    if (index === items.length) {
      setTimeout(() => {
        itemRefs.current[index]?.focus();
      }, 0);
    }
  };

  const splitLine = (index, newItem, cursorPosition = 0) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems.splice(index, 0, newItem);
      return newItems;
    });

    setTimeout(() => {
      const textArea = itemRefs.current[index];
      if (textArea) {
        textArea.focus();
        textArea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const deleteItem = (index) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const indentItem = (index) => {
    if (index === 0) return;
    
    setItems(prevItems => {
      const newItems = [...prevItems];
      const prevLevel = newItems[index - 1].level;
      const newLevel = Math.min(prevLevel + 1, prevLevel + 1);
      
      newItems[index] = {
        ...newItems[index],
        level: newLevel
      };
      return newItems;
    });
  };

  const outdentItem = (index) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (newItems[index].level > 0) {
        newItems[index] = {
          ...newItems[index],
          level: newItems[index].level - 1
        };
      }
      return newItems;
    });
  };

  const focusItem = (index) => {
    if (index >= 0 && index < itemRefs.current.length) {
      const textarea = itemRefs.current[index];
      if (textarea) {
        textarea.focus();
        // Always move cursor to end of line
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    focusFirstItem: () => {
      if (itemRefs.current[0]) {
        itemRefs.current[0].focus();
      }
    }
  }));

  return (
    <div className="mt-4 max-w-full">
      {items.map((item, index) => (
        <OutlinerItem
          key={index}
          item={item}
          index={index}
          level={item.level}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onIndent={indentItem}
          onOutdent={outdentItem}
          onSplitLine={splitLine}
          inputRef={el => itemRefs.current[index] = el}
          onFocusPrevious={focusItem}
          onFocusNext={focusItem}
        />
      ))}
    </div>
  );
});

Outliner.displayName = 'Outliner';

export default Outliner;