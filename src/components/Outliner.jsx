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
      const newIndex = index + 1;
      onUpdate(newIndex, { content: '', level: level });
      // No need to call onFocusNext here as the new input will be focused automatically
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

const Outliner = forwardRef((props, ref) => {
  const [items, setItems] = useState([{ content: '', level: 0 }]);
  const itemRefs = useRef([]);

  // Load state from URL
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

  // Update URL when items change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (items.length === 1 && !items[0].content) {
      params.delete('content');
    } else {
      params.set('content', JSON.stringify(items));
    }
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [items]);

  // Update refs array when items change
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

    // Focus the new item after state update
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
    setItems(prevItems => {
      const newItems = [...prevItems];
      const prevLevel = newItems[index - 1].level;
      newItems[index] = {
        ...newItems[index],
        level: Math.min(prevLevel + 1, prevLevel + 1)
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
    <div className="mt-4">
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