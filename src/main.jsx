import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Outliner from './components/Outliner';
import './scripts.js';  // Import original scripts

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Outliner />
  </React.StrictMode>
);