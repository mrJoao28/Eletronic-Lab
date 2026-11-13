import { installErrorReporting } from './errorReporting';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
installErrorReporting();
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
