import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authAPI, schoolAPI } from '../../services/api';
import { setCurrentSchoolId, setBranchId } from '../../services/schoolContext';
import OTPVerificationForm from './OTPVerificationForm';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader } from "../ui/card";
import { cn } from "../../utils/cn";

// Helper: School fetching removed for single-tenant mode

const DEMO_ACCOUNTS = [
  { id: 'admin',      label: 'Admin',       email: 'admin@local.test',                password: 'Admin123!',  color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600' },
  { id: 'teacher',    label: 'Teacher',     email: 'teacher@local.test',              password: 'Teacher123!', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' },
  { id: 'admin_ss',   label: 'SS Admin',    email: 'admin.ss@local.test',             password: 'Admin123!',  color: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' },
  { id: 'teacher_ss', label: 'SS Teacher',  email: 'teacher.ss@local.test',           password: 'Teacher123!', color: 'bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-600' },
];

// Senior School (SS) one-click accounts (seeded by `server/prisma/seed.ts`)
const SS_DEMO_ACCOUNTS = [
  { id: 'ss-admin',   label: 'SS Admin',   email: 'admin.ss@local.test',   password: 'Admin123!',   color: 'bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-600 hover:text-white hover:border-sky-600' },
  { id: 'ss-teacher', label: 'SS Teacher', email: 'teacher.ss@local.test', password: 'Teacher123!', color: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' },
];

export default function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess, brandingSettings }) {
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const skipOtp = import.meta.env.VITE_SKIP_OTP === 'true';

  const resolveInstitutionType = (email, apiUser) => {
    // Junior remains default. Only force SECONDARY for SS demo accounts.
    const normalized = String(email || apiUser?.email || '').toLowerCase();
    const isSsDemo = normalized === 'admin.ss@local.test' || normalized === 'teacher.ss@local.test';
    return apiUser?.institutionType || (isSsDemo ? 'SECONDARY' : 'PRIMARY_CBC');
  };

  // Show a banner if the user was redirected here because their session expired.
  const [sessionExpired] = useState(() => {
    const flag = sessionStorage.getItem('session_expired');
    if (flag) sessionStorage.removeItem('session_expired');
    return !!flag;
  });

  const handleDemoClick = (account) => {
    setFormData(prev => ({
      ...prev,
      email: account.email,
      password: account.password,
    }));
    setErrors({});
  };

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

      if (skipOtp) {
        const { token, refreshToken, user } = credentialsData;
        if (token) localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (formData.rememberMe) localStorage.setItem('authToken', token);

        const loginUserData = {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          institutionType: resolveInstitutionType(formData.email, user),
          schoolId: null,
          branchId: user.branchId || user.branch?.id || null,
          school: user.school || null,
          branch: user.branch || null
        };

        const bid = user.branchId || user.branch?.id || '';
        if (bid) setBranchId(bid);

        onLoginSuccess(loginUserData, token, refreshToken);
        return;
      }

      // Trigger OTP flow

      try {
        await authAPI.sendOTP({ email: formData.email });
        setPendingUserData({
          email: formData.email,
          phone: credentialsData.user?.phone || credentialsData.user?.school?.phone || '+254XXXXXXXX',
          user: credentialsData.user,
          token: credentialsData.token,
          refreshToken: credentialsData.refreshToken,
          institutionType: resolveInstitutionType(formData.email, credentialsData.user),
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

    // Unified single-tenant mode
    let schoolId = null;
    let school = pendingUserData.user.school || null;

    const loginUserData = {
      email: pendingUserData.user.email,
      name: `${pendingUserData.user.firstName} ${pendingUserData.user.lastName}`,
      role: pendingUserData.user.role,
      id: pendingUserData.user.id,
      firstName: pendingUserData.user.firstName,
      lastName: pendingUserData.user.lastName,
      institutionType: pendingUserData.institutionType || resolveInstitutionType(pendingUserData.email, pendingUserData.user),
      schoolId: null,
      branchId: pendingUserData.user.branchId || pendingUserData.user.branch?.id || null,
      school: school,
      branch: pendingUserData.user.branch || null
    };

    // setCurrentSchoolId removed for single-tenant mode
    const bid = pendingUserData.user.branchId || pendingUserData.user.branch?.id || '';
    if (bid) setBranchId(bid);

    onLoginSuccess(loginUserData, pendingUserData.token, pendingUserData.refreshToken);
  };

  const handleBackToLogin = () => {
    setShowOTPVerification(false);
    setPendingUserData(null);
    setErrors({});
  };

  const brandColor = brandingSettings?.brandColor || 'var(--brand-purple)';

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: brandColor
      }}
    >

      {sessionExpired && (
        <div className="w-full max-w-sm mb-3 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm font-medium relative z-10">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          Your session has expired. Please sign in again.
        </div>
      )}

      <Card className="w-full max-w-sm border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl relative z-10 animate-fade-up">
        <CardHeader className="pt-6 pb-2">
          <div className="text-center group">
            {brandingSettings?.logoUrl && (
              <img
                src={brandingSettings.logoUrl}
                alt="Logo"
                className="w-24 h-24 object-contain mx-auto transition-transform duration-500 group-hover:scale-110 drop-shadow-xl"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* Error Alert */}
          {errors.form && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 text-red-700 animate-shake">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm font-semibold">{errors.form}</div>
            </div>
          )}

          {showOTPVerification && pendingUserData ? (
            <OTPVerificationForm
              email={pendingUserData.email}
              phone={pendingUserData.phone}
              onVerifySuccess={handleOTPVerifySuccess}
              onBackToLogin={handleBackToLogin}
              brandingSettings={brandingSettings}
            />
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black text-gray-900 leading-tight">
                  {brandingSettings?.welcomeTitle || 'Welcome Back!'}
                </h1>
                {brandingSettings?.welcomeMessage && (
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 px-4">
                    {brandingSettings.welcomeMessage}
                  </p>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
              {/* Demo pills commented out as requested 
              <div className="flex flex-wrap gap-2 justify-center mb-2 pb-4 border-b border-gray-100">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleDemoClick(acc)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all duration-150 transform active:scale-95 ${acc.color}`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-2 pb-4 border-b border-gray-100">
                {SS_DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleDemoClick(acc)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all duration-150 transform active:scale-95 ${acc.color}`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
              */}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-bold ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={cn(
                    "h-12 border-gray-200 focus:border-brand-purple focus:ring-brand-purple/20",
                    errors.email && "border-red-500 bg-red-50"
                  )}
                  placeholder="you@school.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-600 text-[10px] font-bold uppercase ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-gray-700 font-bold">Password</Label>
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-[10px] text-brand-purple hover:underline font-bold"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={cn(
                      "h-12 pr-12 border-gray-200 focus:border-brand-purple focus:ring-brand-purple/20",
                      errors.password && "border-red-500 bg-red-50"
                    )}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-purple transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-600 text-[10px] font-bold uppercase ml-1">{errors.password}</p>}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 group cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple accent-brand-purple cursor-pointer transition-transform group-active:scale-90"
                  />
                  <span className="text-sm text-gray-600 font-bold transition-colors group-hover:text-gray-950">Remember me</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-sm font-bold shadow-xl transition-all duration-300 transform active:scale-95 bg-brand-purple hover:bg-brand-purple/90"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  New?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-brand-purple hover:underline font-bold ml-1"
                  >
                    Create account
                  </button>
                </p>
              </div>
            </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
