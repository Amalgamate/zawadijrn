/**
 * Splash Screen with Animated Loading Bar
 * Displays a teal background with a smooth animated loading bar
 */

import React, { useState, useEffect } from 'react';
import '../../styles/splashscreen.css';

const SplashScreen = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);

  // Animate progress bar
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 30;
        return Math.min(prev + increment, 95);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto hide after loading completes
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!isLoading && progress === 100) {
      const timer = setTimeout(() => setShowSplash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  if (!showSplash) return null;

  return (
    <div className={`splash-screen ${!isLoading && progress === 100 ? 'fade-out' : ''}`}>
      <div className="splash-content">
        {/* Logo Section */}
        <div className="splash-logo">
          <div className="logo-circle">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="35" stroke="white" strokeWidth="2"/>
              <path d="M30 40L38 48L50 32" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* App Name */}
        <h1 className="splash-title">Zawadi SMS</h1>
        <p className="splash-subtitle">Education Management System</p>

        {/* Loading Bar Section */}
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div
              className="loading-bar-fill"
              style={{
                width: `${progress}%`,
                transition: progress === 100 ? 'width 0.3s ease-out' : 'width 0.5s ease-out'
              }}
            >
              <div className="loading-bar-shimmer"></div>
            </div>
          </div>
          <p className="loading-text">{Math.round(progress)}%</p>
        </div>

        {/* Bottom Text */}
        <p className="splash-footer">Loading your learning environment...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
