import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Lock, Shield } from 'lucide-react';

export default function ForgotPasswordForm({ onSwitchToLogin, brandingSettings }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  if (emailSent) {
    return (
      <div className="w-full h-screen overflow-hidden">
        {/* Two Column Layout - Success State */}
        <div className="bg-white h-full flex flex-col lg:flex-row">

          {/* Left Column - Branding Area */}
          <div
            className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between items-center text-white relative overflow-hidden"
            style={{ backgroundColor: brandingSettings?.brandColor || '#520050' }}
          >
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white rounded-full -translate-y-1/2"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center relative z-10">
              <div className="max-w-md text-center space-y-8">
                <div className="mb-12 text-center">
                  <div className="inline-flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500">
                    {brandingSettings?.logoUrl && (
                      <img
                        src={brandingSettings.logoUrl}
                        alt="Logo"
                        className="w-16 h-16 object-contain mb-4"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white whitespace-nowrap uppercase">
                      {brandingSettings?.schoolName || 'ELIMCROWN'}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-4xl font-bold drop-shadow-md">
                    Check Your Email
                  </h2>
                  <p className="text-white/80 text-lg leading-relaxed">
                    We've sent password reset instructions to your email. Follow the link to create a new password.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="relative z-10 text-center">
              <p className="text-white/60 text-sm">
                © {new Date().getFullYear()} {brandingSettings?.schoolName || 'ElimCrown'}. All rights reserved.
              </p>
            </div>
          </div>

          {/* Right Column - Success Message */}
          <div className="w-full lg:w-1/2 p-6 lg:p-16 flex flex-col justify-center overflow-y-auto bg-[#F9FAFB]">
            <div className="max-w-md mx-auto w-full text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
                <CheckCircle className="text-green-600" size={48} />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">Email Sent!</h2>
              <p className="text-gray-600 mb-8 text-lg">
                We've sent a password reset link to<br />
                <strong className="text-[#520050]">{email}</strong>
              </p>

              <div className="bg-[#520050]/5 border border-[#520050]/10 rounded-xl p-6 mb-8">
                <p className="text-sm text-gray-700">
                  💡 <strong>Tip:</strong> The link will expire in 1 hour. Check your spam folder if you don't see the email.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Try Another Email
                </button>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="w-full flex items-center justify-center gap-2 text-[#520050] hover:text-[#520050]/80 transition font-semibold py-3"
                >
                  <ArrowLeft size={18} />
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      {/* Two Column Layout - Full Screen */}
      <div className="bg-white h-full flex flex-col lg:flex-row">

        {/* Left Column - Branding Area */}
        <div
          className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between items-center text-white relative overflow-hidden"
          style={{ backgroundColor: brandingSettings?.brandColor || '#520050' }}
        >
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white rounded-full -translate-y-1/2"></div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="max-w-md text-center space-y-8">
              <div className="mb-12 text-center">
                <div className="inline-flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500">
                  {brandingSettings?.logoUrl && (
                    <img
                      src={brandingSettings.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 object-contain mb-4"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white whitespace-nowrap uppercase">
                    {brandingSettings?.schoolName || 'ELIMCROWN'}
                  </span>
                </div>
              </div>

              {/* Password Reset Message */}
              <div className="space-y-6">
                <h2 className="text-4xl font-bold drop-shadow-md">
                  Reset Your Password
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  No worries! Enter your email address and we'll send you instructions to reset your password.
                </p>

                {/* Security Features */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-start gap-3 text-left">
                    <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mt-0.5">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Secure Process</h4>
                      <p className="text-[#f4f0f2] text-sm">Your password reset is encrypted and secure</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-left">
                    <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mt-0.5">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Time-Limited Link</h4>
                      <p className="text-[#f4f0f2] text-sm">Reset link expires in 1 hour for security</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-left">
                    <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mt-0.5">
                      <CheckCircle size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Quick Recovery</h4>
                      <p className="text-[#f4f0f2] text-sm">Reset your password in just a few minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} {brandingSettings?.schoolName || 'Elimcrown Academy'}. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-16 flex flex-col justify-center overflow-y-auto bg-[#F9FAFB]">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
              <p className="text-gray-600">Enter your email to receive reset instructions</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#520050] focus:border-transparent transition ${error ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#520050] text-white py-3 rounded-lg font-semibold hover:bg-[#3D0038] focus:ring-4 focus:ring-[#520050]/20 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition font-semibold mx-auto"
              >
                <ArrowLeft size={18} />
                Back to Sign In
              </button>
            </div>

            <div className="mt-8 p-4 bg-[#520050]/5 border border-[#520050]/10 rounded-lg">
              <p className="text-sm text-gray-700 text-center">
                💡 <strong>Remember your password?</strong> Sign in instead to access your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
