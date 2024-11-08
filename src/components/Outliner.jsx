import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';

const OutlinerItem = ({ 
  item, 
  onUpdate, 
  onDelete, 
  path = [], 
  onIndent, 
  onOutdent,
  onMove 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const itemRef = useRef(null);

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

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ path }));
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
    const sourcePath = sourceData.path;
    onMove(sourcePath, path);
  };

  return (
    <div className={`pl-4 ${isDragging ? 'opacity-50' : ''}`}>
      <div 
        className="flex items-center group"
        ref={itemRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <button 
          className="p-1 hover:bg-gray-700 rounded"
          onClick={toggleExpand}
        >
          {item.children?.length > 0 && (
            isExpanded ? 
              <ChevronDown className="w-4 h-4 text-gray-400" /> : 
              <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab" />
        <input
          type="text"
          value={item.content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none p-1 focus:outline-none text-white"
          placeholder="New item..."
        />
      </div>
      {isExpanded && item.children?.length > 0 && (
        <div className="ml-4">
          {item.children.map((child, index) => (
            <OutlinerItem
              key={index}
              item={child}
              onUpdate={onUpdate}
              onDelete={onDelete}
              path={[...path, 'children', index]}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Outliner = () => {
  const [items, setItems] = useState([{ content: '', children: [] }]);

  useEffect(() => {
    // Load initial state from URL
    const params = new URLSearchParams(window.location.search);
    const content = params.get('content');
    if (content) {
      try {
        setItems(JSON.parse(decodeURIComponent(content)));
      } catch (e) {
        // If content isn't valid JSON, create a single item with the content
        setItems([{ content, children: [] }]);
      }
    }
  }, []);

  useEffect(() => {
    // Save to URL whenever items change
    const params = new URLSearchParams(window.location.search);
    params.set('content', encodeURIComponent(JSON.stringify(items)));
    window.history.replaceState(null, '', `?${params.toString()}`);
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

  const moveItem = (sourcePath, targetPath) => {
    const sourcePathArr = [...sourcePath];
    const targetPathArr = [...targetPath];
    const sourceIndex = sourcePathArr.pop();
    const targetIndex = targetPathArr.pop();
    
    if (sourcePathArr.join() === targetPathArr.join()) {
      updateItem(sourcePathArr, (items) => {
        const newItems = [...items];
        const [removed] = newItems.splice(sourceIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        return newItems;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {items.map((item, index) => (
        <OutlinerItem
          key={index}
          item={item}
          onUpdate={updateItem}
          onDelete={deleteItem}
          path={[index]}
          onIndent={indentItem}
          onOutdent={outdentItem}
          onMove={moveItem}
        />
      ))}
    </div>
  );
};

export default Outliner;