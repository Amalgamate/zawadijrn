import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Register the service worker in both dev (https://localhost) and production.
// Push notification subscriptions require:
//   (a) a registered service worker, and
//   (b) a secure context (HTTPS) — localhost over HTTPS satisfies this in dev.
// In plain http://localhost the browser will refuse to create a PushSubscription.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('[SW] Registered:', registration.scope);
      })
      .catch(err => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}


const enforceLightTheme = () => {
  document.documentElement.classList.remove('dark');
  if (document.body) {
    document.body.classList.remove('dark');
  }
  localStorage.setItem('theme', 'light');
};

enforceLightTheme();

const htmlClassObserver = new MutationObserver(() => {
  if (document.documentElement.classList.contains('dark') || document.body?.classList.contains('dark')) {
    enforceLightTheme();
  }
});

htmlClassObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
if (document.body) {
  htmlClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
