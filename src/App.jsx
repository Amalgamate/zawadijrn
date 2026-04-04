import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Auth from './pages/Auth';
import CBCGradingSystem from './components/CBCGrading/CBCGradingSystem';
import SplashScreen from './components/mobile/SplashScreen';
import { SchoolDataProvider } from './contexts/SchoolDataContext';
import { SpeedInsights } from '@vercel/speed-insights/react';
import api from './services/api';
import axiosInstance from './services/api/axiosConfig';

import useSubjectStore from './store/useSubjectStore';

const DEFAULT_BRANDING = {
  logoUrl: '/logo-new.png',
  faviconUrl: '/favicon.png',
  stampUrl: '/ZawadiStamp.svg',
  brandColor: '#520050',
  welcomeTitle: 'Welcome to Zawadi',
  welcomeMessage: 'Sign in to access your school portal.',
  schoolName: 'ZAWADI JUNIOR ACADEMY',
};

function AppContent() {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  const fetchSubjects = useSubjectStore(state => state.fetchSubjects);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [appReady, setAppReady] = useState(false);
  const [brandingSettings, setBrandingSettings] = useState(DEFAULT_BRANDING);

  // Mark app as ready
  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Fetch school subjects
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubjects();
    }
  }, [isAuthenticated, fetchSubjects]);

  // Fetch school branding
  useEffect(() => {
    let cancelled = false;

    const fetchBranding = async () => {
      try {
        // Fetch public branding - works for unauthenticated users too
        const resp = await axiosInstance.get('/schools/public/branding');
        if (cancelled) return;

        const branding = resp?.data?.data || resp?.data || resp;
        if (branding) {
          // Map `name` to `schoolName` to match frontend expectations
          const mappedBranding = {
            ...branding,
            schoolName: branding.name || branding.schoolName || 'Zawadi Junior Academy'
          };
          setBrandingSettings(prev => ({ ...prev, ...mappedBranding }));

          // School ID storage removed for single-tenant mode
        }
      } catch (err) {
        console.warn('Failed to fetch branding, using defaults:', err);
      }
    };

    fetchBranding();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Update favicon
  useEffect(() => {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const url = brandingSettings.faviconUrl;
    if (!url) { link.href = '/favicon.png'; return; }
    link.href = url.startsWith('data:') ? url : `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
  }, [brandingSettings.faviconUrl]);

  // Update CSS variables for branding
  useEffect(() => {
    const root = document.documentElement;
    const color = brandingSettings?.brandColor || 'var(--brand-purple)';
    root.style.setProperty('--brand-purple', color);
    
    // Generate a darker version for logo/sidebar accents (roughly 15-20% darker)
    // Simple hex darken if it's hex
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const darken = (val) => Math.max(0, Math.floor(val * 0.85)).toString(16).padStart(2, '0');
      const darkColor = `#${darken(r)}${darken(g)}${darken(b)}`;
      root.style.setProperty('--brand-purple-dark', darkColor);
    } else {
      root.style.setProperty('--brand-purple-dark', color);
    }
  }, [brandingSettings.brandColor]);

  // Update page title
  useEffect(() => {
    if (isAuthenticated) {
      document.title = user?.role === 'SUPER_ADMIN'
        ? 'Admin Dashboard'
        : `${brandingSettings.schoolName || 'School'} — Dashboard`;
    } else {
      document.title = brandingSettings.schoolName || 'School Management';
    }
  }, [isAuthenticated, user, brandingSettings.schoolName]);
  // Navigation guards
  useEffect(() => {
    if (loading) return; // Wait for initial auth check

    if (isAuthenticated) {
      if (!pathname.startsWith('/app')) {
        navigate('/app', { replace: true });
      }
    } else {
      if (pathname.startsWith('/app')) {
        navigate('/auth/login', { replace: true });
      }
    }
  }, [isAuthenticated, loading, pathname, navigate]);

  const handleAuthSuccess = (userData, token, refreshToken) => {
    localStorage.removeItem('cbc_current_page');
    localStorage.removeItem('cbc_page_params');
    localStorage.removeItem('cbc_expanded_sections');
    // Unified single-tenant mode cleanup
    login(userData, token, refreshToken);
    navigate('/app', { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  // Show splash while auth is initializing or app is warming up
  if (loading || !appReady) {
    return <SplashScreen isLoading={true} />;
  }

  if (isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/app/*"
          element={
            <SchoolDataProvider>
              <CBCGradingSystem
                user={user}
                onLogout={handleLogout}
                brandingSettings={brandingSettings}
                setBrandingSettings={setBrandingSettings}
              />
            </SchoolDataProvider>
          }
        />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/login" element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} basePath="/auth" />} />
      <Route path="/auth/register" element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} basePath="/auth" />} />
      <Route path="/auth/forgot-password" element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} basePath="/auth" />} />
      <Route path="/auth/reset-password" element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} />} />
      <Route path="/auth/verify-email" element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} />} />
      <Route path="/auth/welcome" element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
      <SpeedInsights />
    </HashRouter>
  );
}
