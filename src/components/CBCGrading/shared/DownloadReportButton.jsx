import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Professional Download Button with Animation States
 * 
 * @param {Function} onDownload - Async function that returns { success: boolean, error?: string }
 * @param {string} label - Button label
 * @param {string} processingLabel - Label when processing
 * @param {string} successLabel - Label when successful
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional classes
 */
const DownloadReportButton = ({
  onDownload,
  label = "Download Report",
  processingLabel = "Generating PDF...",
  successLabel = "Downloaded!",
  disabled = false,
  className = ""
}) => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleClick = async () => {
    if (status === 'loading' || disabled) return;

    setStatus('loading');
    setProgress(0);
    setProgressMessage('Initializing...');

    try {
      // Pass a progress callback to the download function if it accepts it
      const result = await onDownload((message, percentage) => {
        if (message) setProgressMessage(message);
        if (percentage) setProgress(percentage);
      });

      if (result && result.success === false) {
        throw new Error(result.error || 'Download failed');
      }

      setStatus('success');
      setProgress(100);
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setProgressMessage('');
      }, 3000);

    } catch (error) {
      console.error('Download error:', error);
      setStatus('error');
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <button
        onClick={handleClick}
        disabled={disabled || status === 'loading'}
        className={`
          relative overflow-hidden
          flex items-center justify-center gap-2 
          w-full sm:w-auto
          px-6 py-3 
          rounded-xl font-medium text-sm transition-all duration-300
          ${status === 'idle' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' : ''}
          ${status === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-100 cursor-wait' : ''}
          ${status === 'success' ? 'bg-green-600 text-white shadow-md' : ''}
          ${status === 'error' ? 'bg-red-600 text-white shadow-md' : ''}
          ${disabled ? 'opacity-60 cursor-not-allowed transform-none shadow-none hover:bg-blue-600' : ''}
          ${className}
        `}
      >
        {/* Idle State */}
        {status === 'idle' && (
          <>
            <Download size={18} />
            <span>{label}</span>
          </>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <>
            <Loader2 size={18} className="animate-spin" />
            <div className="flex flex-col items-start text-xs text-left">
              <span className="font-semibold">{progressMessage || processingLabel}</span>
              {progress > 0 && (
                <div className="w-24 h-1 bg-blue-200 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="animate-in fade-in zoom-in duration-300 flex items-center gap-2">
            <CheckCircle size={18} />
            <span>{successLabel}</span>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="animate-in fade-in shake duration-300 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>Failed</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default DownloadReportButton;
