
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Pendaftaran Service Worker yang dinamik untuk mengelakkan ralat origin mismatch
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Kita gunakan nama fail sahaja tanpa prefix path yang keras
    // Ini memastikan browser mencari sw.js di domain yang sama dengan index.html
    const swUrl = '/sw.js'; 
    
    navigator.serviceWorker.register(swUrl)
      .then(reg => {
        console.log('SERQI Engine: Offline mode ready at', reg.scope);
      })
      .catch(err => {
        // Kita gunakan warn supaya tidak menghalang aplikasi utama jika SW gagal (cth: dalam persekitaran dev)
        console.warn('SERQI Engine: PWA feature limited', err.message);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
