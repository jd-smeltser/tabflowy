import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';

const OutlinerItem = ({ 
  item, 
  onUpdate, 
  onDelete, 
  path = [], 
  onIndent, 
  onOutdent,
  inputRef,
  onFocusPrevious,
  onFocusNext,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newItem = { content: '', children: [] };
      const newPath = [...path];
      const index = newPath.pop();
      onUpdate(newPath, (items) => {
        const newItems = [...items];
        newItems.splice(index + 1, 0, newItem);
        return newItems;
      }, index + 1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(path);
      } else {
        onIndent(path);
      }
      // Keep focus on the current input after indenting/outdenting
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } else if (e.key === 'Backspace' && !item.content) {
      e.preventDefault();
      const newPath = [...path];
      const index = newPath.pop();
      if (index > 0) {
        onDelete(path);
        onFocusPrevious(path);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onFocusPrevious(path);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onFocusNext(path);
    }
  };

  const handleContentChange = (e) => {
    const newPath = [...path];
    const index = newPath.pop();
    onUpdate(newPath, (items) => {
      const newItems = [...items];
      newItems[index] = { ...item, content: e.target.value };
      return newItems;
    });
  };

  const indent = path.filter(p => p === 'children').length;
  
  return (
    <div className="flex items-start" style={{ marginLeft: indent * 20 + 'px' }}>
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
  const [items, setItems] = useState([{ content: '', children: [] }]);
  const itemRefs = useRef({});
  const flatItemPaths = useRef([]);

  // Helper function to flatten the item structure into paths
  const flattenPaths = (items, parentPath = []) => {
    const paths = [];
    items.forEach((item, index) => {
      const currentPath = [...parentPath, index];
      paths.push(currentPath);
      if (item.children && item.children.length > 0) {
        paths.push(...flattenPaths(item.children, [...parentPath, 'children', index]));
      }
    });
    return paths;
  };

  // Update flat paths whenever items change
  useEffect(() => {
    flatItemPaths.current = flattenPaths(items);
  }, [items]);

  const getItemRefKey = (path) => path.join('-');

  useImperativeHandle(ref, () => ({
    focusFirstItem: () => {
      const firstItemRef = itemRefs.current['0'];
      if (firstItemRef) {
        firstItemRef.focus();
      }
    }
  }));

  const focusPrevious = (currentPath) => {
    const currentIndex = flatItemPaths.current.findIndex(
      path => path.join('-') === currentPath.join('-')
    );
    if (currentIndex > 0) {
      const previousPath = flatItemPaths.current[currentIndex - 1];
      const previousRef = itemRefs.current[getItemRefKey(previousPath)];
      if (previousRef) {
        previousRef.focus();
      }
    }
  };

  const focusNext = (currentPath) => {
    const currentIndex = flatItemPaths.current.findIndex(
      path => path.join('-') === currentPath.join('-')
    );
    if (currentIndex < flatItemPaths.current.length - 1) {
      const nextPath = flatItemPaths.current[currentIndex + 1];
      const nextRef = itemRefs.current[getItemRefKey(nextPath)];
      if (nextRef) {
        nextRef.focus();
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const content = params.get('content');
    if (content) {
      try {
        const parsed = JSON.parse(decodeURIComponent(content));
        setItems(parsed);
      } catch (e) {
        setItems([{ content, children: [] }]);
      }
    }
  }, []);

  useEffect(() => {
    if (items.some(item => item.content || item.children.length > 0)) {
      const params = new URLSearchParams(window.location.search);
      params.set('content', encodeURIComponent(JSON.stringify(items)));
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [items]);

  const updateItem = (path, updater, focusIndex = null) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      let current = newItems;
      
      for (let i = 0; i < path.length - 1; i += 2) {
        const index = path[i + 1];
        current = current[index][path[i]];
      }
      
      const result = updater(current);
      
      if (focusIndex !== null) {
        setTimeout(() => {
          const newItemRef = itemRefs.current[focusIndex];
          if (newItemRef) {
            newItemRef.focus();
          }
        }, 0);
      }
      
      if (path.length === 0) {
        return result;
      }
      
      return newItems;
    });
  };

  const deleteItem = (path) => {
    const newPath = [...path];
    const index = newPath.pop();
    const parentPath = newPath.slice(0, -1);
    
    updateItem(parentPath, (items) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const indentItem = (path) => {
    const newPath = [...path];
    const index = newPath.pop();
    if (index === 0) return;
    
    updateItem(newPath, (items) => {
      const newItems = [...items];
      const item = newItems.splice(index, 1)[0];
      if (!newItems[index - 1].children) {
        newItems[index - 1].children = [];
      }
      newItems[index - 1].children.push(item);
      return newItems;
    });
  };

  const outdentItem = (path) => {
    if (path.length < 4) return;
    
    const newPath = [...path];
    const index = newPath.pop();
    const parentList = newPath.slice(0, -2);
    const parentIndex = newPath[newPath.length - 3];
    
    updateItem(parentList, (items) => {
      const newItems = [...items];
      const parent = newItems[parentIndex];
      const item = parent.children.splice(index, 1)[0];
      newItems.splice(parentIndex + 1, 0, item);
      return newItems;
    });
  };

  const renderItems = (items, parentPath = []) => {
    return items.map((item, index) => (
      <React.Fragment key={index}>
        <OutlinerItem
          item={item}
          onUpdate={updateItem}
          onDelete={deleteItem}
          path={[...parentPath, index]}
          onIndent={indentItem}
          onOutdent={outdentItem}
          inputRef={el => {
            if (el) {
              itemRefs.current[getItemRefKey([...parentPath, index])] = el;
            }
          }}
          onFocusPrevious={focusPrevious}
          onFocusNext={focusNext}
        />
        {item.children && renderItems(item.children, [...parentPath, 'children', index])}
      </React.Fragment>
    ));
  };

  return (
    <div className="mt-4">
      {renderItems(items)}
    </div>
  );
});

Outliner.displayName = 'Outliner';

export default Outliner;