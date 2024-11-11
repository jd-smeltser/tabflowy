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

  const setRefs = (element) => {
    textareaRef.current = element;
    if (typeof inputRef === 'function') {
      inputRef(element);
    }
  };

  // Check if this item has any children (one level deeper)
  const hasChildren = () => {
    for (let i = index + 1; i < items.length; i++) {
      if (items[i].level <= item.level) {
        break;
      }
      if (items[i].level === item.level + 1) {
        return true;
      }
    }
    return false;
  };

  const isCollapsed = collapsedNodes.includes(item.id);
  const hasChildItems = hasChildren();

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
        
        const beforeCursor = currentContent.substring(0, cursorPosition);
        const afterCursor = currentContent.substring(cursorPosition);
        
        onUpdate(index, { ...item, content: beforeCursor });
        
        onSplitLine(index + 1, {
          id: generateId(),
          content: afterCursor,
          level: level
        }, 0);
        break;
        
      case 'Backspace':
        if (!item.content && index > 0) {
          e.preventDefault();
          onDelete(index);
          onFocusPrevious(index - 1, true);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          onFocusPrevious(prevIndex);
        } else {
          document.querySelector('input[type="text"]')?.focus();
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

  const handleBulletClick = (e) => {
    e.preventDefault();
    if (hasChildItems) {
      onToggleCollapse(item.id);
    }
  };

  return (
    <div className="flex min-w-0 relative">
      <div 
        className="flex min-w-0 w-full"
        style={{ paddingLeft: level * 20 + 'px' }}
      >
        <div 
          className={`flex-shrink-0 w-6 select-none transition-colors ${
            hasChildItems ? 'cursor-pointer text-gray-500 hover:text-gray-400' : 'text-gray-600'
          }`}
          onClick={handleBulletClick}
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
        // Ensure all items have IDs
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

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  const getVisibleItems = () => {
    return items.filter((item, index) => {
      for (let i = 0; i < index; i++) {
        if (collapsedNodes.includes(items[i].id) && items[i].level < item.level) {
          return false;
        }
      }
      return true;
    });
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

    if (index === items.length) {
      setTimeout(() => {
        itemRefs.current[index]?.focus();
      }, 0);
    }
  };

  const splitLine = (index, newItem, cursorPosition = 0) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems.splice(index, 0, { ...newItem, id: generateId() });
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

  const focusItem = (index, moveCursorToEnd = false) => {
    const targetIndex = Math.max(0, Math.min(index, itemRefs.current.length - 1));
    
    setTimeout(() => {
      const textarea = itemRefs.current[targetIndex];
      if (textarea) {
        textarea.focus();
        if (moveCursorToEnd) {
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        }
      }
    }, 0);
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
        const originalIndex = items.findIndex((originalItem) => 
          originalItem === item
        );
        
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