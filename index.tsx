import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("PopLingo: Initializing application...");

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
  console.log("PopLingo: Application mounted successfully.");
} else {
  console.error("PopLingo: Failed to find root element.");
}
