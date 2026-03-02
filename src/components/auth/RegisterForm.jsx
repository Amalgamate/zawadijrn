import React, { useState, useCallback } from 'react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Loader2, XCircle, Globe, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { onboardingAPI, authAPI } from '../../services/api';
import { useSubdomainCheck } from '../../hooks/useSubdomain';
import debounce from 'lodash/debounce';

export default function RegisterForm({ onSwitchToLogin, onRegisterSuccess, brandingSettings }) {
  const [countryCode, setCountryCode] = useState('+254'); // Default to Kenya
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    schoolType: '', // Default empty
    address: '',
    county: '',
    subCounty: '',
    ward: '',
    subdomain: '',
    termsAccepted: false
  });
  const [suggestedSubdomain, setSuggestedSubdomain] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Subdomain hook
  const { checkAvailability: checkSubdomainAvailability, suggestSubdomain } = useSubdomainCheck();

  // validationStatus: { [field]: 'valid' | 'invalid' | 'loading' | null }
  const [fieldStatus, setFieldStatus] = useState({});
  const [checkingField, setCheckingField] = useState(null);

  // Debounced check function
  const checkAvailability = useCallback(
    debounce(async (field, value) => {
      if (!value) return;

      // Regex pre-check
      if (field === 'email' && !/\S+@\S+\.\S+/.test(value)) return;
      if (field === 'phone' && !/^\+?[0-9]{10,15}$/.test(value)) return;

      setCheckingField(field);
      setFieldStatus(prev => ({ ...prev, [field]: 'loading' }));

      try {
        await authAPI.checkAvailability({ [field]: value });
        setFieldStatus(prev => ({ ...prev, [field]: 'valid' }));
        setErrors(prev => ({ ...prev, [field]: '' }));
      } catch (error) {
        const msg = error.response?.data?.message || `${field === 'email' ? 'Email' : 'Phone'} already exists`;
        setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
        setErrors(prev => ({ ...prev, [field]: msg }));
      } finally {
        setCheckingField(null);
      }
    }, 500),
    []
  );

  // Update field status immediately for synchronous validations
  const updateFieldStatus = (name, value) => {
    if (name === 'fullName') {
      setFieldStatus(prev => ({ ...prev, [name]: value.length > 3 ? 'valid' : null }));
    }
    if (name === 'schoolName') {
      setFieldStatus(prev => ({ ...prev, [name]: value.length > 3 ? 'valid' : null }));
    }
    if (name === 'password') {
      const isStrong = value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
      setFieldStatus(prev => ({ ...prev, [name]: isStrong ? 'valid' : null }));
    }
    if (name === 'confirmPassword') {
      setFieldStatus(prev => ({ ...prev, [name]: value === formData.password && value ? 'valid' : null }));
    }

    // Trigger async check for email/phone
    if (name === 'email' || name === 'phone') {
      if (name === 'email' && !/\S+@\S+\.\S+/.test(value)) {
        setFieldStatus(prev => ({ ...prev, [name]: 'invalid' }));
        return;
      }
      if (name === 'phone' && !/^\d{9,12}$/.test(value) && value.length > 0) {
        // wait for full length
      } else {
        checkAvailability(name, value);
      }
    }
  };

  // African country codes
  const africanCountries = [
    { code: '+254', country: 'Kenya', flag: '🇰🇪', length: 9 },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿', length: 9 },
    { code: '+256', country: 'Uganda', flag: '🇺🇬', length: 9 },
    { code: '+250', country: 'Rwanda', flag: '🇷🇼', length: 9 },
    { code: '+257', country: 'Burundi', flag: '🇧🇮', length: 8 },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹', length: 9 },
    { code: '+252', country: 'Somalia', flag: '🇸🇴', length: 8 },
    { code: '+211', country: 'South Sudan', flag: '🇸🇸', length: 9 },
    { code: '+27', country: 'South Africa', flag: '🇿🇦', length: 9 },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬', length: 10 },
    { code: '+233', country: 'Ghana', flag: '🇬🇭', length: 9 },
    { code: '+20', country: 'Egypt', flag: '🇪🇬', length: 10 },
    { code: '+212', country: 'Morocco', flag: '🇲🇦', length: 9 },
    { code: '+213', country: 'Algeria', flag: '🇩🇿', length: 9 },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳', length: 8 },
    { code: '+218', country: 'Libya', flag: '🇱🇾', length: 9 },
    { code: '+221', country: 'Senegal', flag: '🇸🇳', length: 9 },
    { code: '+225', country: 'Ivory Coast', flag: '🇨🇮', length: 10 },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫', length: 8 },
    { code: '+227', country: 'Niger', flag: '🇳🇪', length: 8 },
    { code: '+228', country: 'Togo', flag: '🇹🇬', length: 8 },
    { code: '+229', country: 'Benin', flag: '🇧🇯', length: 8 },
    { code: '+230', country: 'Mauritius', flag: '🇲🇺', length: 8 },
    { code: '+231', country: 'Liberia', flag: '🇱🇷', length: 9 },
    { code: '+232', country: 'Sierra Leone', flag: '🇸🇱', length: 8 },
    { code: '+235', country: 'Chad', flag: '🇹🇩', length: 8 },
    { code: '+236', country: 'CAR', flag: '🇨🇫', length: 8 },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲', length: 9 },
    { code: '+238', country: 'Cape Verde', flag: '🇨🇻', length: 7 },
    { code: '+240', country: 'Eq. Guinea', flag: '🇬🇶', length: 9 },
    { code: '+241', country: 'Gabon', flag: '🇬🇦', length: 7 },
    { code: '+242', country: 'Congo', flag: '🇨🇬', length: 9 },
    { code: '+243', country: 'DR Congo', flag: '🇨🇩', length: 9 },
    { code: '+244', country: 'Angola', flag: '🇦🇴', length: 9 },
    { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼', length: 7 },
    { code: '+248', country: 'Seychelles', flag: '🇸🇨', length: 7 },
    { code: '+249', country: 'Sudan', flag: '🇸🇩', length: 9 },
    { code: '+260', country: 'Zambia', flag: '🇿🇲', length: 9 },
    { code: '+261', country: 'Madagascar', flag: '🇲🇬', length: 9 },
    { code: '+262', country: 'Réunion', flag: '🇷🇪', length: 9 },
    { code: '+263', country: 'Zimbabwe', flag: '🇿🇼', length: 9 },
    { code: '+264', country: 'Namibia', flag: '🇳🇦', length: 9 },
    { code: '+265', country: 'Malawi', flag: '🇲🇼', length: 9 },
    { code: '+266', country: 'Lesotho', flag: '🇱🇸', length: 8 },
    { code: '+267', country: 'Botswana', flag: '🇧🇼', length: 8 },
    { code: '+268', country: 'Eswatini', flag: '🇸🇿', length: 8 },
    { code: '+269', country: 'Comoros', flag: '🇰🇲', length: 7 },
  ];

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 1, label: 'Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 3, label: 'Good', color: 'bg-brand-teal' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' }
    ];

    return levels.find(l => l.strength === strength) || levels[0];
  };

  const validateForm = () => {
    const newErrors = {};

    // Personal
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone
    const selectedCountry = africanCountries.find(c => c.code === countryCode);
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d+$/.test(phoneNumber)) {
      newErrors.phone = 'Please enter only numbers';
    } else if (selectedCountry && phoneNumber.length !== selectedCountry.length) {
      newErrors.phone = `Phone number should be ${selectedCountry.length} digits for ${selectedCountry.country}`;
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must include an uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must include a lowercase letter';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must include a number';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // School
    if (!formData.schoolName.trim()) newErrors.schoolName = 'School name is required';
    if (!formData.schoolType) newErrors.schoolType = 'School type is required';
    if (!formData.county) newErrors.county = 'County is required';
    if (!formData.address.trim()) newErrors.address = 'Physical address is required';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle subdomain suggestion
  const handleSchoolNameBlur = async () => {
    if (!formData.schoolName.trim()) return;

    // Show loading indicator on subdomain field
    setFieldStatus(prev => ({ ...prev, subdomain: 'loading' }));

    try {
      const result = await suggestSubdomain(formData.schoolName);
      setSuggestedSubdomain(result.suggested);

      // Auto-fill if empty OR if existing value matches previous suggestion (meaning user hasn't customized it)
      if (!formData.subdomain || formData.subdomain === suggestedSubdomain) {
        setFormData(prev => ({ ...prev, subdomain: result.suggested }));

        // Check availability of the new suggestion
        const availability = await checkSubdomainAvailability(result.suggested);
        if (availability.available) {
          setFieldStatus(prev => ({ ...prev, subdomain: 'valid' }));
          setErrors(prev => ({ ...prev, subdomain: '' }));
        } else {
          setFieldStatus(prev => ({ ...prev, subdomain: 'invalid' }));
          setErrors(prev => ({ ...prev, subdomain: availability.message }));
        }
      } else {
        // If user has customized it, just turn off loading
        setFieldStatus(prev => ({ ...prev, subdomain: fieldStatus.subdomain === 'valid' ? 'valid' : fieldStatus.subdomain === 'invalid' ? 'invalid' : null }));
      }
    } catch (error) {
      console.error('Error suggesting subdomain:', error);
      setFieldStatus(prev => ({ ...prev, subdomain: null }));
    }
  };

  const handleSubdomainChange = async (e) => {
    const value = e.target.value.toLowerCase();
    setFormData(prev => ({ ...prev, subdomain: value }));

    if (!value.trim()) {
      setFieldStatus(prev => ({ ...prev, subdomain: null }));
      setErrors(prev => ({ ...prev, subdomain: '' }));
      return;
    }

    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) {
      setFieldStatus(prev => ({ ...prev, subdomain: 'invalid' }));
      setErrors(prev => ({ ...prev, subdomain: 'Only lowercase letters, numbers, and hyphens allowed' }));
      return;
    }

    setFieldStatus(prev => ({ ...prev, subdomain: 'loading' }));
    try {
      const result = await checkSubdomainAvailability(value);
      if (result.available) {
        setFieldStatus(prev => ({ ...prev, subdomain: 'valid' }));
        setErrors(prev => ({ ...prev, subdomain: '' }));
      } else {
        setFieldStatus(prev => ({ ...prev, subdomain: 'invalid' }));
        setErrors(prev => ({ ...prev, subdomain: result.message }));
      }
    } catch (error) {
      setFieldStatus(prev => ({ ...prev, subdomain: 'invalid' }));
      setErrors(prev => ({ ...prev, subdomain: 'Error checking subdomain availability' }));
    }
  };

  // Kenya county coordinates
  const kenyaCounties = {
    'Baringo': { bounds: [[0.05, 35.26], [1.27, 36.47]] },
    'Bomet': { bounds: [[-0.68, 34.7], [0.42, 35.33]] },
    'Bungoma': { bounds: [[0.25, 34.33], [1.38, 35.45]] },
    'Busia': { bounds: [[0.18, 33.89], [0.63, 34.38]] },
    'Elgeyo-Marakwet': { bounds: [[0.52, 35.15], [1.45, 35.98]] },
    'Garissa': { bounds: [[-0.47, 39.18], [2.1, 41.58]] },
    'Homa Bay': { bounds: [[-0.7, 33.94], [0.18, 34.88]] },
    'Isiolo': { bounds: [[0.35, 36.66], [2.27, 37.99]] },
    'Kajiado': { bounds: [[-2.77, 36.53], [-1.05, 37.29]] },
    'Kakamega': { bounds: [[0.22, 34.83], [0.93, 35.45]] },
    'Kericho': { bounds: [[-0.37, 35.27], [0.39, 35.83]] },
    'Kiambu': { bounds: [[-1.04, 36.65], [-0.59, 37.25]] },
    'Kilifi': { bounds: [[-3.64, 39.35], [-2.62, 40.32]] },
    'Kirinyaga': { bounds: [[-0.67, 37.32], [-0.07, 37.95]] },
    'Kisii': { bounds: [[-0.98, 34.78], [-0.56, 35.31]] },
    'Kitui': { bounds: [[-1.24, 37.86], [0.19, 39.03]] },
    'Kwale': { bounds: [[-4.68, 39.35], [-3.6, 40.55]] },
    'Laikipia': { bounds: [[-0.68, 36.63], [0.84, 37.37]] },
    'Lamu': { bounds: [[-2.62, 40.89], [-1.67, 41.94]] },
    'Machakos': { bounds: [[-2.22, 37.27], [-1.27, 38.32]] },
    'Makueni': { bounds: [[-3.29, 37.36], [-2.28, 38.48]] },
    'Mandera': { bounds: [[2.27, 40.31], [4.7, 41.58]] },
    'Marsabit': { bounds: [[2.18, 37.09], [4.43, 38.33]] },
    'Meru': { bounds: [[-1.32, 37.4], [0.68, 38.42]] },
    'Migori': { bounds: [[-1.73, 33.95], [-0.9, 34.65]] },
    'Murang\'a': { bounds: [[-1.08, 36.98], [-0.36, 37.46]] },
    'Nandi': { bounds: [[0.14, 34.89], [0.82, 35.45]] },
    'Narok': { bounds: [[-1.99, 35.3], [-0.74, 36.13]] },
    'Nyamira': { bounds: [[-0.81, 34.43], [-0.56, 34.98]] },
    'Nyandarua': { bounds: [[-0.73, 36.71], [-0.15, 37.09]] },
    'Nyeri': { bounds: [[-0.73, 36.98], [-0.21, 37.41]] },
    'Samburu': { bounds: [[0.73, 36.52], [2.27, 37.99]] },
    'Siaya': { bounds: [[-0.15, 33.94], [0.6, 34.57]] },
    'Taita-Taveta': { bounds: [[-3.99, 37.69], [-3.1, 38.9]] },
    'Tana River': { bounds: [[-2.62, 39.35], [-1.67, 40.89]] },
    'Tharaka-Nithi': { bounds: [[-0.35, 37.82], [0.43, 38.52]] },
    'Trans Nzoia': { bounds: [[0.82, 34.72], [1.52, 35.32]] },
    'Turkana': { bounds: [[1.27, 34.49], [3.91, 36.47]] },
    'Uasin Gishu': { bounds: [[0.21, 34.71], [1.14, 35.45]] },
    'Vihiga': { bounds: [[0.47, 34.72], [0.76, 35.05]] },
    'Wajir': { bounds: [[1.58, 40.05], [3.91, 41.58]] },
    'West Pokot': { bounds: [[1.14, 34.8], [2.33, 35.96]] }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Must combine phone before sending if not already done
      const fullPhone = countryCode + phoneNumber;

      const requestBody = {
        fullName: formData.fullName,
        email: formData.email,
        phone: fullPhone,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        schoolName: formData.schoolName,
        schoolType: formData.schoolType,
        address: formData.address,
        county: formData.county,
        subCounty: formData.subCounty,
        ward: formData.ward,
        subdomain: formData.subdomain || suggestedSubdomain
      };

      const data = await onboardingAPI.registerFull(requestBody);
      if (data) {
        toast.success('Registration successful! Redirecting...');
        setTimeout(() => {
          onRegisterSuccess({
            email: data.data.user.email,
            phone: data.data.user.phone,
            name: `${data.data.user.firstName} ${data.data.user.lastName}`,
            role: data.data.user.role
          });
        }, 1000);
      } else {
        const errorMessage = data.error || data.message || 'Registration failed';
        toast.error(errorMessage);
        if (errorMessage.toLowerCase().includes('phone')) setErrors({ phone: errorMessage });
        else if (errorMessage.toLowerCase().includes('email')) setErrors({ email: errorMessage });
      }
    } catch (error) {
      let errorMsg = 'Unable to connect to server.';
      if (error.response?.data?.error) errorMsg = error.response.data.error;
      toast.error(errorMsg);
      setErrors({ email: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
    if (value.length >= 9) updateFieldStatus('phone', countryCode + value);
  };

  const handleCountryCodeChange = (e) => {
    setCountryCode(e.target.value);
    if (phoneNumber.length >= 9) updateFieldStatus('phone', e.target.value + phoneNumber);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    updateFieldStatus(name, value);
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Single Page Layout
  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-6 px-4">
      {/* Container - Constrained Width but Flat */}
      <div className="w-full max-w-5xl">

        {/* Header Section */}
        <div className="pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center transform scale-90 mb-2">
            <span className="text-3xl font-black tracking-tighter flex items-center gap-1">
              <span className="text-[#520050]">Elim</span>
              <span className="text-teal-500 font-light">crown</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 text-sm mt-1">Join the community to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Column: Personal & Security */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                  Personal Details
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-9 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${fieldStatus.fullName === 'invalid' || (showErrors && errors.fullName) ? 'border-red-500' :
                          fieldStatus.fullName === 'valid' ? 'border-green-500' : 'border-gray-300'
                          }`}
                        placeholder="John Doe"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {fieldStatus.fullName === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                    {showErrors && errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-9 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${fieldStatus.email === 'invalid' || (showErrors && errors.email) ? 'border-red-500' :
                          fieldStatus.email === 'valid' ? 'border-green-500' : 'border-gray-300'
                          }`}
                        placeholder="you@school.com"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {fieldStatus.email === 'loading' && <Loader2 className="animate-spin h-4 w-4 text-gray-400" />}
                        {fieldStatus.email === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {fieldStatus.email === 'invalid' && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    {showErrors && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={handleCountryCodeChange}
                        className="w-24 px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent bg-gray-50"
                      >
                        {africanCountries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="712345678"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {fieldStatus.phone === 'loading' && <Loader2 className="animate-spin h-4 w-4 text-gray-400" />}
                          {fieldStatus.phone === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </div>
                    {showErrors && errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                  Security
                </h3>
                <div className="space-y-4">
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-9 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${errors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Min. 8 chars"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Strength meter - Fixed height to prevent layout shift & align with right column */}
                    <div className="mt-1 min-h-[18px]">
                      {formData.password && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">{passwordStrength.label}</span>
                        </div>
                      )}
                    </div>
                    {showErrors && errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>

                    <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-9 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {showErrors && errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: School & Location */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                  School Details
                </h3>
                <div className="space-y-4">
                  {/* School Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">School Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        onBlur={handleSchoolNameBlur}
                        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${fieldStatus.schoolName === 'invalid' || (showErrors && errors.schoolName) ? 'border-red-500' :
                          fieldStatus.schoolName === 'valid' ? 'border-green-500' : 'border-gray-300'
                          }`}
                        placeholder="School Name"
                      />
                    </div>
                    {showErrors && errors.schoolName && <p className="text-xs text-red-500 mt-1">{errors.schoolName}</p>}
                  </div>

                  {/* School Type - Stacked below Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">School Type</label>
                    <select
                      name="schoolType"
                      value={formData.schoolType}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${showErrors && errors.schoolType ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select Type</option>
                      <option>Public Primary</option>
                      <option>Public Secondary</option>
                      <option>Private Primary</option>
                      <option>Private Secondary</option>
                    </select>
                    {showErrors && errors.schoolType && <p className="text-xs text-red-500 mt-1">{errors.schoolType}</p>}
                  </div>

                  {/* Domain */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">School Domain (Optional)</label>
                    <div className={`relative flex items-center border rounded-md overflow-hidden text-sm transition ${fieldStatus.subdomain === 'invalid' ? 'border-red-500' :
                      fieldStatus.subdomain === 'valid' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                      <div className="bg-gray-50 px-3 py-2 border-r text-gray-500">
                        <Globe size={16} />
                      </div>
                      <input
                        type="text"
                        value={formData.subdomain || suggestedSubdomain}
                        onChange={handleSubdomainChange}
                        className="flex-1 px-3 py-2 outline-none text-gray-600 placeholder-gray-400"
                        placeholder="your-school"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center bg-white">
                        {fieldStatus.subdomain === 'loading' && <Loader2 className="animate-spin h-4 w-4 text-brand-teal" />}
                        {fieldStatus.subdomain === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {fieldStatus.subdomain === 'invalid' && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="bg-gray-50 px-3 py-2 border-l text-gray-500 text-xs">
                        .elimcrown.co.ke
                      </div>
                    </div>
                    {showErrors && errors.subdomain && <p className="text-xs text-red-500 mt-1">{errors.subdomain}</p>}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                  Location
                </h3>
                <div className="space-y-4">
                  {/* Location Manual Entry Only */}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">County</label>
                      <select
                        name="county"
                        value={formData.county}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${showErrors && errors.county ? 'border-red-500' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Select County</option>
                        {Object.keys(kenyaCounties).sort().map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-County</label>
                      <input
                        type="text"
                        name="subCounty"
                        value={formData.subCounty}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent"
                        placeholder="e.g. Westlands"
                      />
                    </div>
                  </div>

                  {/* Spacer to align with password strength meter on the left */}
                  <div className="mt-1 min-h-[18px] hidden lg:block"></div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Physical Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-[#520050] focus:border-transparent transition ${showErrors && errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Street, Road, or Landmark"
                    />
                    {showErrors && errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="mt-8 pt-6 border-t">

            <div className="flex items-center justify-center mb-6">
              <input
                type="checkbox"
                id="terms"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="h-4 w-4 text-[#520050] focus:ring-[#520050] border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the <a href="#" className="text-[#520050] hover:text-[#3D0038] underline">Terms of Service</a> & <a href="#" className="text-[#520050] hover:text-[#3D0038] underline">Privacy Policy</a>
              </label>
            </div>
            {showErrors && errors.termsAccepted && <p className="text-xs text-red-500 text-center -mt-4 mb-4">{errors.termsAccepted}</p>}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="w-64 bg-[#520050] text-white py-3 rounded-lg font-bold hover:bg-[#3D0038] focus:ring-4 focus:ring-[#520050]/20 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-semibold text-[#520050] hover:text-[#3D0038] transition"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </form>
      </div >
    </div >
  );
}
