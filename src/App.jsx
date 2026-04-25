import React, { useState, useEffect, useCallback } from 'react';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

const Auth = lazy(() => import('./pages/Auth'));
const CBCGradingSystem = lazy(() => import('./components/CBCGrading/CBCGradingSystem'));
import SplashScreen from './components/mobile/SplashScreen';
import { Toaster } from 'react-hot-toast';
import { SchoolDataProvider } from './contexts/SchoolDataContext';
import { FeeActionsProvider } from './contexts/FeeActionsContext';
import { UserNotificationProvider } from './contexts/UserNotificationContext';
import { SpeedInsights } from '@vercel/speed-insights/react';
import axiosInstance from './services/api/axiosConfig';
import { useBootstrapStore } from './store/useBootstrapStore';

import useSubjectStore from './store/useSubjectStore';
import ErrorBoundary from './components/common/ErrorBoundary';

const DEFAULT_BRANDING = {
  logoUrl: '/logo-zawadi.png',
  faviconUrl: '/favicon.png',
  stampUrl: '/ZawadiStamp.svg',
  brandColor: '#520050',
  primaryColor: '#520050',
  secondaryColor: '#0D9488',
  accentColor1: '#3b82f6',
  accentColor2: '#e11d48',
  welcomeTitle: 'Welcome to Zawadi',
  welcomeMessage: 'Sign in to access your school portal.',
  schoolName: 'ZAWADI JUNIOR ACADEMY',
};

function AppContent() {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  const fetchSubjects = useSubjectStore(state => state.fetchSubjects);
  const clearBootstrap = useBootstrapStore(state => state.clear);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // splashDone: true once the splash screen calls onReady (data pre-loaded)
  const [splashDone, setSplashDone] = useState(false);
  const [brandingSettings, setBrandingSettings] = useState(DEFAULT_BRANDING);

  const handleSplashReady = useCallback(() => setSplashDone(true), []);

  // Fetch school branding (runs immediately, unauthenticated endpoint)
  useEffect(() => {
    let cancelled = false;
    const fetchBranding = async () => {
      try {
        const resp = await axiosInstance.get('/schools/public/branding');
        if (cancelled) return;
        const branding = resp?.data?.data || resp?.data || resp;
        if (branding) {
          setBrandingSettings(prev => ({
            ...prev,
            ...branding,
            schoolName: branding.name || branding.schoolName || 'Zawadi Junior Academy',
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch branding, using defaults:', err);
      }
    };
    fetchBranding();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Favicon
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

  // CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const color = brandingSettings?.primaryColor || brandingSettings?.brandColor || '#520050';
    root.style.setProperty('--brand-purple', color);
    if (brandingSettings?.secondaryColor)
      root.style.setProperty('--brand-teal', brandingSettings.secondaryColor);
    if (brandingSettings?.accentColor1)
      root.style.setProperty('--brand-accent-1', brandingSettings.accentColor1);
    if (brandingSettings?.accentColor2)
      root.style.setProperty('--brand-accent-2', brandingSettings.accentColor2);
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const darken = (v) => Math.max(0, Math.floor(v * 0.85)).toString(16).padStart(2, '0');
      root.style.setProperty('--brand-purple-dark', `#${darken(r)}${darken(g)}${darken(b)}`);
    }
  }, [brandingSettings]);

  // Page title
  useEffect(() => {
    document.title = isAuthenticated
      ? user?.role === 'SUPER_ADMIN'
        ? 'Admin Dashboard'
        : `${brandingSettings.schoolName || 'School'} — Dashboard`
      : brandingSettings.schoolName || 'School Management';
  }, [isAuthenticated, user, brandingSettings.schoolName]);

  // Navigation guards
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      if (!pathname.startsWith('/app')) navigate('/app', { replace: true });
    } else {
      if (pathname.startsWith('/app')) navigate('/auth/login', { replace: true });
    }
  }, [isAuthenticated, loading, pathname, navigate]);

  const handleAuthSuccess = (userData, token, refreshToken) => {
    localStorage.removeItem('cbc_current_page');
    localStorage.removeItem('cbc_page_params');
    localStorage.removeItem('cbc_expanded_sections');
    if (userData?.institutionType === 'SECONDARY') {
      localStorage.removeItem('cbc_ui_state');
    }
    login(userData, token, refreshToken);

    if (userData.mustChangePassword) {
      navigate('/auth/reset-password?token=INITIAL_SETUP_REQUIRED', { replace: true });
    } else {
      navigate('/app', { replace: true });
    }
  };

  const handleLogout = () => {
    clearBootstrap();       // wipe pre-loaded data from sessionStorage
    logout();
    navigate('/auth/login', { replace: true });
  };

  // ── Show splash while: auth is resolving OR data hasn't pre-loaded yet ──
  // Once the user is authenticated AND splashDone, show the real app.
  const showSplash = loading || !splashDone;

  return (
    <>
      {/* Splash always mounts until it calls onReady — it manages its own
          visibility internally so it can do a smooth fade-out */}
      {showSplash && (
        <SplashScreen
          isLoading={loading}
          user={isAuthenticated ? user : null}
          onReady={handleSplashReady}
        />
      )}

      {/* App shell — rendered underneath once auth is confirmed.
          It won't be visible while the splash is on top. */}
      {!loading && (
        <Suspense fallback={<SplashScreen isLoading={true} user={null} onReady={() => {}} />}>
          {isAuthenticated ? (
            <Routes>
              <Route
                path="/app/*"
                element={
                  <SchoolDataProvider>
                    <FeeActionsProvider>
                      <UserNotificationProvider>
                        <CBCGradingSystem
                          user={user}
                          onLogout={handleLogout}
                          brandingSettings={brandingSettings}
                          setBrandingSettings={setBrandingSettings}
                        />
                      </UserNotificationProvider>
                    </FeeActionsProvider>
                  </SchoolDataProvider>
                }
              />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/auth/login" replace />} />
              <Route path="/auth/login"
                element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} basePath="/auth" />} />
              <Route path="/auth/register"
                element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} basePath="/auth" />} />
              <Route path="/auth/forgot-password"
                element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} basePath="/auth" />} />
              <Route path="/auth/reset-password"
                element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} />} />
              <Route path="/auth/verify-email"
                element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} />} />
              <Route path="/auth/welcome"
                element={<Auth onAuthSuccess={handleAuthSuccess} brandingSettings={brandingSettings} />} />
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          )}
        </Suspense>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
        <Toaster position="top-right" reverseOrder={false} />
        <SpeedInsights />
      </HashRouter>
    </ErrorBoundary>
  );
}
