import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Service workers cache same-origin GETs; in dev that breaks Vite HMR / module loading. Only enable in production.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
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
