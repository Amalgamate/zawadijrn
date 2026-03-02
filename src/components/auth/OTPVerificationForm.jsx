import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../services/api';

export default function OTPVerificationForm({
  email,
  phone,
  onVerifySuccess,
  onBackToLogin,
  brandingSettings
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-submit effect
  useEffect(() => {
    if (otp.every(digit => digit !== '') && !success && !isLoading) {
      verifyOtpCode(otp.join(''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      // Optional: delete previous value on backspace
    }
  };

  const verifyOtpCode = async (otpCode) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP({
        email,
        otp: otpCode
      });

      setSuccess(true);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      }

      setTimeout(() => {
        onVerifySuccess(response.user || { email }, response.token, response.refreshToken);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Verification failed');
      // Clear OTP on error after a small delay to let user see error? 
      // Or keep it so they can edit. Let's keep it but focus first.
      // Actually, clearing is better for UX if it's likely wrong.
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      await authAPI.sendOTP({ email });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBackToLogin} className="text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Verification</h2>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Enter the 6-digit code sent to <span className="font-semibold">{phone}</span>
          </p>
        </div>
      </div>

      {/* OTP Input */}
      <div className="space-y-6">
        <div>
          <div className="flex gap-2 sm:gap-3 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading || success}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-3xl font-bold text-center border-2 rounded-xl transition-all ${success
                  ? 'border-green-500 bg-green-50 text-green-600'
                  : error
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  } shadow-sm`}
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-[24px] text-center">
          {isLoading && (
            <p className="text-sm text-blue-600 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              Verifying...
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 flex items-center justify-center gap-1">
              <AlertCircle size={16} /> {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 flex items-center justify-center gap-1">
              <CheckCircle size={16} /> Verified! Redirecting...
            </p>
          )}
        </div>

        {/* Resend Timer */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={isLoading || resendTimer > 0 || success}
            className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {resendTimer > 0
              ? `Resend in 00:${resendTimer.toString().padStart(2, '0')}`
              : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
