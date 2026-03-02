import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        // Log diagnostic info
        const debugData = {
          API_BASE_URL: API_BASE_URL,
          origin: window.location.origin,
          hostname: window.location.hostname,
          pathname: window.location.pathname,
          href: window.location.href,
          isMobile: /mobile|android|iphone/i.test(navigator.userAgent),
          hasCapacitor: !!window.Capacitor,
          userAgent: navigator.userAgent.substring(0, 50),
        };
        setDebugInfo(debugData);
        
        console.log('🔍 DEBUG INFO:', JSON.stringify(debugData, null, 2));
        
        // First, try the diagnostics endpoint to see what the server receives
        const diagnosticsUrl = `${API_BASE_URL}/diagnostics`;
        console.log('🔍 Calling diagnostics endpoint:', diagnosticsUrl);
        
        try {
          const diagResponse = await fetch(diagnosticsUrl, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          
          if (diagResponse.ok) {
            const diagData = await diagResponse.json();
            console.log('📊 SERVER DIAGNOSTICS:', JSON.stringify(diagData, null, 2));
          }
        } catch (diagError) {
          console.warn('⚠️ Diagnostics call failed:', diagError.message);
        }
        
        // Then check health
        const healthUrl = `${API_BASE_URL}/health`;
        console.log('🔍 Checking health at:', healthUrl);
        
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        console.log('📡 Health check response:', response.status, response.statusText);
        console.log('📡 Response headers:', Array.from(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend is connected!', data);
          setIsConnected(true);
          setError(null);
        } else {
          console.warn('⚠️ Unexpected response status:', response.status);
          setIsConnected(false);
          setError(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Connection check error:', error.message);
        console.error('❌ Full error:', error);
        setIsConnected(false);
        setError(error.message);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  const statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';
  const statusText = isConnected ? 'Connected' : 'Disconnected';
  const statusBgColor = isConnected ? 'bg-green-50' : 'bg-red-50';
  const statusBorder = isConnected ? 'border-green-200' : 'border-red-200';

  return (
    <div className={`flex flex-col gap-2 px-3 py-2 rounded-lg ${statusBgColor} border ${statusBorder}`}>
      <div className="flex items-center gap-2">
        <div className={`${statusColor} w-2.5 h-2.5 rounded-full ${isChecking ? 'animate-pulse' : ''}`}></div>
        <span className={`font-medium text-sm ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
          {statusText}
        </span>
        {isChecking && <span className="text-xs text-gray-500 ml-auto">Checking...</span>}
        {!isChecking && !isConnected && error && (
          <span className="text-xs text-red-600 ml-auto">{error}</span>
        )}
      </div>
      
      {/* Debug info in development */}
      {!isConnected && debugInfo && (
        <div className="text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded mt-1 max-h-32 overflow-y-auto font-mono space-y-1">
          <div><span className="font-semibold">URL:</span> {debugInfo.API_BASE_URL}</div>
          <div><span className="font-semibold">Origin:</span> {debugInfo.origin}</div>
          <div><span className="font-semibold">Capacitor:</span> {debugInfo.hasCapacitor ? '✓' : '✗'}</div>
          <div><span className="font-semibold">Mobile:</span> {debugInfo.isMobile ? '✓' : '✗'}</div>
        </div>
      )}
    </div>
  );
}
