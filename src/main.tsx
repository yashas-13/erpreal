import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import { registerSW } from 'virtual:pwa-register';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({ immediate: true });
}