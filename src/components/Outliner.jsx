import React, { useState, useEffect } from 'react';

const OutlinerItem = ({ 
  item, 
  onUpdate, 
  onDelete, 
  path = [], 
  onIndent, 
  onOutdent
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
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(path);
      } else {
        onIndent(path);
      }
    } else if (e.key === 'Backspace' && !item.content) {
      e.preventDefault();
      onDelete(path);
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
        type="text"
        value={item.content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent border-none outline-none text-white font-mono"
        placeholder="New item..."
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

const Outliner = () => {
  const [items, setItems] = useState([{ content: '', children: [] }]);

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

  const updateItem = (path, updater) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      let current = newItems;
      
      for (let i = 0; i < path.length - 1; i += 2) {
        const index = path[i + 1];
        current = current[index][path[i]];
      }
      
      const result = updater(current);
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
};

export default Outliner;