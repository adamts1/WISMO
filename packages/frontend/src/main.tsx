import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        className: '!bg-white !text-gray-900 !shadow-lg !rounded-xl !text-sm',
        duration: 3000,
      }}
    />
  </React.StrictMode>,
);
