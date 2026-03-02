import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

/**
 * PDFPreviewModal Component
 * 
 * A modal that shows a preview of the PDF content before generating/downloading
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onGenerate - Callback to generate PDF (receives onProgress callback)
 * @param {string} contentElementId - ID of the element to preview/convert to PDF
 * @param {string} title - Modal title
 */
const PDFPreviewModal = ({
  show,
  onClose,
  onGenerate,
  contentElementId,
  title = 'PDF Preview'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ message: '', percent: 0 });

  if (!show) return null;

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      setProgress({ message: 'Starting...', percent: 0 });

      // Call the parent's generate function with progress callback
      const result = await onGenerate((message, percent) => {
        setProgress({ message, percent });
      });

      if (result?.success) {
        setProgress({ message: 'Complete!', percent: 100 });
        
        // Auto-close after 1 second
        setTimeout(() => {
          setIsGenerating(false);
          setProgress({ message: '', percent: 0 });
          onClose();
        }, 1000);
      } else {
        throw new Error(result?.error || 'PDF generation failed');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      setIsGenerating(false);
      setProgress({ message: 'Failed', percent: 0 });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">Review before downloading</p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <PreviewContent contentElementId={contentElementId} />
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {isGenerating ? (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {/* Progress Text */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{progress.message}</span>
                <span className="text-blue-600 font-bold">{progress.percent}%</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * PreviewContent Component
 * Shows a preview of the PDF content by making it temporarily visible
 */
const PreviewContent = ({ contentElementId }) => {
  const previewRef = React.useRef(null);

  React.useEffect(() => {
    const source = document.getElementById(contentElementId);
    if (!source || !previewRef.current) {
      console.error('Preview: Source or preview container not found');
      return;
    }

    console.log('Preview: Setting up preview...');
    console.log('Preview: Source element HTML length:', source.innerHTML.length);

    // Clone the content
    const clone = source.cloneNode(true);

    // Make print-only visible with !important
    const printOnly = clone.querySelectorAll('.print-only');
    console.log('Preview: Found', printOnly.length, 'print-only elements in clone');
    
    printOnly.forEach(el => {
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
    });

    // Hide no-print elements
    const noPrint = clone.querySelectorAll('.no-print');
    console.log('Preview: Found', noPrint.length, 'no-print elements in clone');
    
    noPrint.forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    // Add scoped style override
    const style = document.createElement('style');
    style.textContent = `
      #pdf-preview-container .print-only {
        display: block !important;
        visibility: visible !important;
      }
      #pdf-preview-container .no-print {
        display: none !important;
      }
    `;

    // Render
    previewRef.current.innerHTML = '';
    previewRef.current.appendChild(style);
    previewRef.current.appendChild(clone);
    
    console.log('Preview: Content rendered successfully');

  }, [contentElementId]);

  return (
    <div 
      id="pdf-preview-container" 
      ref={previewRef}
      style={{
        fontSize: '10px',
        lineHeight: '1.4',
        width: '100%',
        overflow: 'auto'
      }}
    />
  );
};

export default PDFPreviewModal;
