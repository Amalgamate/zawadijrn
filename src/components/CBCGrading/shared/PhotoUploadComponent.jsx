/**
 * Photo Upload Component with Camera Preview
 * Handles camera capture and file upload for student photos
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RotateCw, Trash2 } from 'lucide-react';

const PhotoUploadComponent = ({ currentPhoto, onPhotoChange, learnerName }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(currentPhoto || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadMethod, setUploadMethod] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Update local state when currentPhoto changes
  useEffect(() => {
    setCapturedPhoto(currentPhoto);
  }, [currentPhoto]);

  const startCamera = async () => {
    setShowCamera(true);
    setUploadMethod('camera');
  };

  // Effect to initialize camera stream when showCamera becomes true
  useEffect(() => {
    let activeStream = null;

    const initializeCamera = async () => {
      if (showCamera && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            activeStream = stream;
            setIsCameraActive(true);
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          alert('Unable to access camera. Please check permissions or use file upload instead.');
          setShowCamera(false);
          setIsCameraActive(false);
        }
      }
    };

    if (showCamera) {
      // Give DOM time to render the video element
      const timer = setTimeout(initializeCamera, 100);
      return () => {
        clearTimeout(timer);
        if (activeStream) {
          activeStream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [showCamera]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoData);
    onPhotoChange(photoData);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoData = e.target.result;
      setCapturedPhoto(photoData);
      onPhotoChange(photoData);
      setUploadMethod('upload');
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setCapturedPhoto(null);
    onPhotoChange(null);
    setUploadMethod(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retakePhoto = () => {
    if (uploadMethod === 'camera') {
      startCamera();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative">
          {capturedPhoto ? (
            <div className="relative group">
              <img
                src={capturedPhoto}
                alt={learnerName || 'Student'}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition"
                    title="Retake/Replace photo"
                  >
                    <RotateCw size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition"
                    title="Remove photo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-dashed border-gray-400 flex items-center justify-center">
              <Camera size={40} className="text-gray-400" />
            </div>
          )}
        </div>

        {!capturedPhoto && !showCamera && (
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition shadow text-sm"
            >
              <Camera size={16} />
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition shadow text-sm"
            >
              <Upload size={16} />
              Upload
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {showCamera && isCameraActive && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Take Student Photo</h3>
              <button
                onClick={stopCamera}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-gray-900">
              {/* Camera Preview with Guide Circle */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Circular guide */}
                    <div className="w-64 h-64 border-4 border-white border-dashed rounded-full opacity-40 animate-pulse"></div>
                    {/* Corner guides */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-400 rounded-tl-full"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-400 rounded-tr-full"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-400 rounded-bl-full"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-400 rounded-br-full"></div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-900 rounded-lg p-4">
                <p className="text-center text-sm text-blue-100">
                  📸 Position the student's face within the circle guide
                </p>
                <p className="text-center text-xs text-blue-300 mt-1">
                  Ensure good lighting and the face is clearly visible
                </p>
              </div>

              {/* Capture Button */}
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full transition shadow-lg text-lg font-semibold transform hover:scale-105"
                >
                  <Camera size={28} />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {!capturedPhoto && !showCamera && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Photos should be clear and show the student's face. Use good lighting for best results.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadComponent;
