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
        const newIndex = index + 1;
        onUpdate(newIndex, { content: '', level: level });
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
        onFocusPrevious(index);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        onFocusNext(index);
        break;
    }
  };

  const handleContentChange = (e) => {
    onUpdate(index, { ...item, content: e.target.value });
  };

  return (
    <div 
      className="flex min-w-0 relative" 
    >
      {/* Container that handles both bullet and content positioning */}
      <div 
        className="flex min-w-0 w-full"
        style={{ paddingLeft: level * 20 + 'px' }}
      >
        {/* Bullet point that moves with indentation */}
        <div className="flex-shrink-0 w-6 text-gray-500 select-none">
          *
        </div>
        
        {/* Content area */}
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

  const deleteItem = (index) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const indentItem = (index) => {
    if (index === 0) return;
    
    console.log('Indenting item at index:', index);
    
    setItems(prevItems => {
      const newItems = [...prevItems];
      const prevLevel = newItems[index - 1].level;
      const newLevel = Math.min(prevLevel + 1, prevLevel + 1);
      
      console.log('Previous level:', prevLevel);
      console.log('New level:', newLevel);
      
      newItems[index] = {
        ...newItems[index],
        level: newLevel
      };
      return newItems;
    });
  };

  const outdentItem = (index) => {
    console.log('Outdenting item at index:', index);
    
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (newItems[index].level > 0) {
        console.log('Current level:', newItems[index].level);
        console.log('New level:', newItems[index].level - 1);
        
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
      itemRefs.current[index]?.focus();
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