import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

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
