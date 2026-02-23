
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Entry point for the React application.
 * Retrieves the 'root' element from index.html and initializes the React 19 root.
 * Wraps the App component in StrictMode for development-time safety checks.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
