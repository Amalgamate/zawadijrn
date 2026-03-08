import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authAPI, schoolAPI } from '../../services/api';
import { setCurrentSchoolId, setBranchId } from '../../services/schoolContext';
import OTPVerificationForm from './OTPVerificationForm';

// Helper: Get default school when user context has no school yet
const getDefaultSchool = async () => {
  try {
    const response = await schoolAPI.getAll();
    const schools = response?.data || [];
    if (schools.length > 0) {
      return schools[0]; // Return first school as default
    }
  } catch (error) {
    console.error('Failed to fetch default school:', error);
  }
  return null;
};

export default function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess, brandingSettings }) {
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const credentialsData = await authAPI.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Trigger OTP flow

      try {
        const sid = credentialsData.user?.schoolId || credentialsData.user?.school?.id || '';
        await authAPI.sendOTP({ email: formData.email, schoolId: sid });
        setPendingUserData({
          email: formData.email,
          phone: credentialsData.user?.phone || credentialsData.user?.school?.phone || '+254XXXXXXXX',
          user: credentialsData.user,
          token: credentialsData.token,
          refreshToken: credentialsData.refreshToken
        });
        setShowOTPVerification(true);
      } catch (otpError) {
        setErrors({ form: otpError.message || 'Failed to send OTP' });
      }
    } catch (error) {
      setErrors({ form: error.message || 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerifySuccess = async (userData) => {
    if (pendingUserData?.token) {
      localStorage.setItem('token', pendingUserData.token);
      if (pendingUserData.refreshToken) localStorage.setItem('refreshToken', pendingUserData.refreshToken);
      if (formData.rememberMe) localStorage.setItem('authToken', pendingUserData.token);
    }

    // Get school ID - use user's school or default to first school
    let schoolId = pendingUserData.user.schoolId || pendingUserData.user.school?.id;
    let school = pendingUserData.user.school || null;

    if (!schoolId) {
      const defaultSchool = await getDefaultSchool();
      if (defaultSchool) {
        schoolId = defaultSchool.id;
        school = defaultSchool;
      }
    }

    const loginUserData = {
      email: pendingUserData.user.email,
      name: `${pendingUserData.user.firstName} ${pendingUserData.user.lastName}`,
      role: pendingUserData.user.role,
      id: pendingUserData.user.id,
      firstName: pendingUserData.user.firstName,
      lastName: pendingUserData.user.lastName,
      schoolId: schoolId || null,
      branchId: pendingUserData.user.branchId || pendingUserData.user.branch?.id || null,
      school: school,
      branch: pendingUserData.user.branch || null
    };

    if (schoolId) setCurrentSchoolId(schoolId);
    const bid = pendingUserData.user.branchId || pendingUserData.user.branch?.id || '';
    if (bid) setBranchId(bid);

    onLoginSuccess(loginUserData, pendingUserData.token, pendingUserData.refreshToken);
  };

  const handleBackToLogin = () => {
    setShowOTPVerification(false);
    setPendingUserData(null);
    setErrors({});
  };

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-4"
      style={{
        background: brandingSettings?.brandColor
          ? `linear-gradient(to bottom right, ${brandingSettings.brandColor}, ${brandingSettings.brandColor}E6)`
          : 'linear-gradient(to bottom right, #520050, #3D0038)'
      }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="px-10 py-10">

            {/* Header */}
            <div className="mb-6 text-center">
              {brandingSettings?.logoUrl && (
                <img
                  src={brandingSettings.logoUrl}
                  alt="Logo"
                  className="w-36 h-36 object-contain mx-auto drop-shadow-md"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>

            {/* Error Alert */}
            {errors.form && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-3 text-red-700">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm font-medium">{errors.form}</div>
              </div>
            )}

            {/* Form Content */}
            {showOTPVerification && pendingUserData ? (
              <OTPVerificationForm
                email={pendingUserData.email}
                phone={pendingUserData.phone}
                onVerifySuccess={handleOTPVerifySuccess}
                onBackToLogin={handleBackToLogin}
                brandingSettings={brandingSettings}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all outline-none text-gray-900 placeholder-gray-400 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#520050]'
                      }`}
                    placeholder="you@school.com"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={onSwitchToForgotPassword}
                      className="text-xs text-[#520050] hover:underline font-semibold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all outline-none text-gray-900 placeholder-gray-400 pr-10 ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#520050]'
                        }`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Checkboxes */}
                <div className="pt-1">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 accent-[#520050]" />
                    <span className="text-sm text-gray-600 font-medium">Remember me</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 bg-[#520050] text-white font-bold py-2.5 rounded-lg hover:bg-[#3D0038] transition-all disabled:opacity-60 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : ('Sign In')}
                </button>
              </form>
            )}

            {/* Sign Up */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                New?{' '}
                <button type="button" onClick={onSwitchToRegister} className="text-[#520050] font-bold hover:underline">
                  Create account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
