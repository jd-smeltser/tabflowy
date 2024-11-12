import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { ChevronRight, Asterisk } from 'lucide-react';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const OutlinerItem = ({ 
  item, 
  items,
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
  collapsedNodes,
  onToggleCollapse,
}) => {
  const textareaRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const setRefs = (element) => {
    textareaRef.current = element;
    if (typeof inputRef === 'function') {
      inputRef(element);
    }
  };

  const hasChildren = () => {
    for (let i = index + 1; i < items.length; i++) {
      if (items[i].level <= item.level) break;
      if (items[i].level === item.level + 1) return true;
    }
    return false;
  };

  const isCollapsed = collapsedNodes.includes(item.id);
  const hasChildItems = hasChildren();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [item.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(index);
      } else {
        onIndent(index);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        onFocusPrevious(index - 1);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      onFocusNext(index + 1);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!textareaRef.current) return;

      const cursorPosition = textareaRef.current.selectionStart;
      const beforeCursor = item.content.substring(0, cursorPosition);
      const afterCursor = item.content.substring(cursorPosition);
      
      let splitIndex = index + 1;
      if (isCollapsed) {
        for (let i = index + 1; i < items.length; i++) {
          if (items[i].level <= item.level) break;
          splitIndex = i + 1;
        }
      }
      
      onUpdate(index, { ...item, content: beforeCursor });
      onSplitLine(splitIndex, {
        id: generateId(),
        content: afterCursor,
        level: level
      });
      return;
    }

    if (e.key === 'Backspace' && !item.content && index > 0) {
      e.preventDefault();
      onDelete(index);
      onFocusPrevious(index - 1, true);
    }
  };

  const handleClick = (e) => {
    setIsEditing(true);
    
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      const clickOffset = e.clientX - rect.left;
      const approxChar = Math.round(clickOffset / 8);
      
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(approxChar, approxChar);
    }
  };

  const handleContentChange = (e) => {
    onUpdate(index, { ...item, content: e.target.value });
  };

  const handleBulletClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasChildItems) {
      onToggleCollapse(item.id);
    }
  };

  return (
    <div className="outliner-item group relative select-text" style={{ minHeight: '24px' }}>
      <div 
        className="flex min-w-0 w-full items-stretch absolute inset-0"
        style={{ paddingLeft: `${level * 20}px` }}
      >
        <div 
          className={`flex-shrink-0 w-6 flex items-center justify-center select-none transition-colors ${
            hasChildItems ? 'cursor-pointer text-gray-500 hover:text-gray-400' : 'text-gray-600'
          }`}
          onClick={handleBulletClick}
          style={{ marginTop: '1px' }}
        >
          {hasChildItems ? (
            isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <Asterisk className="w-4 h-4" />
            )
          ) : (
            <Asterisk className="w-4 h-4" />
          )}
        </div>
        
        <div 
          className="flex-grow min-w-0 relative flex items-start h-full"
          onClick={handleClick}
        >
          <textarea
            ref={setRefs}
            value={item.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            className="w-full bg-transparent border-none outline-none 
                     text-white font-mono text-base resize-none pt-0.5 px-0 select-text overflow-hidden"
            spellCheck={false}
            style={{
              lineHeight: '22px',
              minHeight: '24px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

const Outliner = forwardRef((props, ref) => {
  const [items, setItems] = useState([{ id: generateId(), content: '', level: 0 }]);
  const [collapsedNodes, setCollapsedNodes] = useState([]);
  const itemRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const content = params.get('content');
    const collapsed = params.get('collapsed');
    
    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        const contentWithIds = parsedContent.map(item => ({
          ...item,
          id: item.id || generateId()
        }));
        setItems(contentWithIds);
      } catch (e) {
        console.error('Failed to parse content from URL');
      }
    }

    if (collapsed) {
      try {
        const parsedCollapsed = JSON.parse(collapsed);
        setCollapsedNodes(parsedCollapsed);
      } catch (e) {
        console.error('Failed to parse collapsed nodes from URL');
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
    
    if (collapsedNodes.length > 0) {
      params.set('collapsed', JSON.stringify(collapsedNodes));
    } else {
      params.delete('collapsed');
    }
    
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [items, collapsedNodes]);

  const getVisibleItems = () => {
    const visibleItems = [];
    let prevItem = null;

    for (let item of items) {
      if (prevItem && collapsedNodes.includes(prevItem.id) && item.level > prevItem.level) {
        continue;
      }
      visibleItems.push(item);
      prevItem = item;
    }

    return visibleItems;
  };

  const updateItem = (index, newItem) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (index === prevItems.length) {
        newItems.push({ ...newItem, id: newItem.id || generateId() });
      } else {
        newItems[index] = { ...newItem, id: newItem.id || prevItems[index].id };
      }
      return newItems;
    });
  };

  const splitLine = (index, newItem) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems.splice(index, 0, { ...newItem, id: generateId() });
      return newItems;
    });

    // Focus new line after React state update
    requestAnimationFrame(() => {
      if (itemRefs.current[index]) {
        itemRefs.current[index].focus();
        itemRefs.current[index].setSelectionRange(0, 0);
      }
    });
  };

  const deleteItem = (index) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const indentItem = (index) => {
    if (index === 0) return;
    
    setItems(prevItems => {
      const newItems = [...prevItems];
      const prevItem = newItems[index - 1];
      const maxAllowedLevel = prevItem.level + 1;
      const currentLevel = newItems[index].level;
      const newLevel = Math.min(maxAllowedLevel, currentLevel + 1);
      
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

  const focusItem = (index, moveCursorToEnd = false) => {
    const targetIndex = Math.max(0, Math.min(index, items.length - 1));
    
    requestAnimationFrame(() => {
      const textarea = itemRefs.current[targetIndex];
      if (textarea) {
        textarea.focus();
        if (moveCursorToEnd) {
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }
    });
  };

  const toggleCollapse = (id) => {
    setCollapsedNodes(prev => {
      if (prev.includes(id)) {
        return prev.filter(nodeId => nodeId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  useImperativeHandle(ref, () => ({
    focusFirstItem: () => {
      if (itemRefs.current[0]) {
        itemRefs.current[0].focus();
      }
    }
  }));

  const visibleItems = getVisibleItems();

  return (
    <div className="mt-4 max-w-full">
      {visibleItems.map((item, visibleIndex) => {
        const originalIndex = items.findIndex(originalItem => originalItem === item);
        
        return (
          <OutlinerItem
            key={item.id}
            item={item}
            items={items}
            index={originalIndex}
            level={item.level}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onIndent={indentItem}
            onOutdent={outdentItem}
            onSplitLine={splitLine}
            inputRef={el => itemRefs.current[originalIndex] = el}
            onFocusPrevious={focusItem}
            onFocusNext={focusItem}
            collapsedNodes={collapsedNodes}
            onToggleCollapse={toggleCollapse}
          />
        );
      })}
    </div>
  );
});

Outliner.displayName = 'Outliner';

export default Outliner;