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
  const [selection, setSelection] = useState(null);

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

  // Maintain textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [item.content]);

  // Handle selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      if (!textareaRef.current?.contains(range.commonAncestorContainer)) {
        setSelection(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Focus management
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    const selection = window.getSelection();
    const hasSelection = selection.toString().length > 0;

    // Handle navigation keys
    if (['ArrowUp', 'ArrowDown'].includes(e.key) && !hasSelection) {
      e.preventDefault();
      if (e.key === 'ArrowUp' && index > 0) {
        onFocusPrevious(index - 1);
      } else if (e.key === 'ArrowDown') {
        onFocusNext(index + 1);
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(index);
      } else {
        onIndent(index);
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
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
        break;
        
      case 'Backspace':
        if (!item.content && index > 0) {
          e.preventDefault();
          onDelete(index);
          onFocusPrevious(index - 1, true);
        }
        break;
    }
  };

  const handleClick = (e) => {
    // Don't reset selection if we're extending a multi-select
    if (e.shiftKey && window.getSelection().toString()) {
      e.preventDefault();
      return;
    }

    setIsEditing(true);
    
    // Position cursor at click location for single clicks
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      const clickOffset = e.clientX - rect.left;
      const approxChar = Math.round(clickOffset / 8); // Assuming monospace font
      
      // Use setTimeout to ensure the focus happens after React's state updates
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(approxChar, approxChar);
      }, 0);
    }
  };

  const handleBlur = (e) => {
    // Only blur if we're not selecting text
    if (!window.getSelection().toString()) {
      setIsEditing(false);
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
    <div className="outliner-item group relative select-text">
      <div 
        className="flex min-w-0 w-full items-center"
        style={{ paddingLeft: `${level * 20}px` }}
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
        
        <div 
          className="flex-grow min-w-0 relative"
          onClick={handleClick}
        >
          {/* Text display layer */}
          <div 
            className={`py-1 whitespace-pre-wrap font-mono text-base leading-relaxed select-text ${
              isEditing ? 'invisible' : 'visible'
            }`}
          >
            {item.content || ' '}
          </div>
          
          {/* Edit layer */}
          <textarea
            ref={setRefs}
            value={item.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => setIsEditing(true)}
            className={`absolute top-0 left-0 w-full bg-transparent border-none outline-none 
              text-white font-mono text-base leading-relaxed resize-none py-1 select-text ${
              isEditing ? 'visible' : 'invisible'
            }`}
            spellCheck={false}
            style={{
              minHeight: '32px',
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
      const prevItem = newItems[index - 1];
      
      // Calculate the maximum allowable indent level
      // Can only indent one level deeper than the previous item
      const maxAllowedLevel = prevItem.level + 1;
      
      // Calculate the new level with constraints
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