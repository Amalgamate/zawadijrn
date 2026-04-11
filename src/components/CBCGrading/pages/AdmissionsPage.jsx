/**
 * Learner Admissions Page
 * Handle new learner admissions with multi-step form
 */

import React, { useState, useEffect } from 'react';
import { Save, X, ArrowRight, ArrowLeft, CheckCircle, User, Users as UsersIcon, Heart, Trash2, Loader } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import { configAPI, learnerAPI } from '../../../services/api';
import { toInputDate } from '../utils/dateHelpers';
import ParentGuardianStep from './steps/ParentGuardianStep';
import { useMediaQuery } from '../hooks/useMediaQuery';

const AdmissionsPage = ({ onSave, onCancel, onDelete, learner = null }) => {
  const { showSuccess, showError } = useNotifications();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isEdit = !!learner;
  const [currentStep, setCurrentStep] = useState(1);
  const [availableStreams, setAvailableStreams] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [stepErrors, setStepErrors] = useState({}); // Track validation errors per step
  const [generateInvoice, setGenerateInvoice] = useState(true); // Default to true

  // Fetch streams — single-tenant, no schoolId needed
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const resp = await configAPI.getStreamConfigs();
        const arr = resp?.data || [];
        setAvailableStreams(arr.filter(s => s.active !== false));
      } catch (error) {
        console.error('Failed to fetch streams:', error);
      }
    };
    fetchStreams();
  }, []);

  // Fetch grades
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const resp = await configAPI.getGrades();
        const grades = resp?.data || [];
        setAvailableGrades(grades);
      } catch (error) {
        console.error('Failed to fetch grades:', error);
        showError('Failed to load grades. Please ensure you are logged in and your session is active.');
      }
    };
    fetchGrades();
  }, [showError]);

  const initialFormData = React.useMemo(() => {
    const now = new Date();
    const iso = now.toISOString().split('T')[0];
    return {
      firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '',
      nationality: 'Kenya', religion: 'Islam', admissionNumber: '', upiNumber: '', grade: '', stream: '',
      dateOfAdmission: iso, previousSchool: '', previousClass: '',
      address: '', county: '',
      // Parent/Guardian Information (New Hierarchical System)
      fatherName: '', fatherPhone: '', fatherEmail: '', fatherDeceased: false,
      motherName: '', motherPhone: '', motherEmail: '', motherDeceased: false,
      guardianName: '', guardianPhone: '', guardianEmail: '', guardianRelation: '',
      primaryContactType: '', primaryContactName: '', primaryContactPhone: '', primaryContactEmail: '',
      // Medical & Emergency
      bloodGroup: '', allergies: '', medicalConditions: '',
      doctorName: '', doctorPhone: '', specialNeeds: '', photo: null,
      emergencyContact: '', emergencyPhone: '',
      isTransportStudent: false
    };
  }, []);

  const [formData, setFormData] = useState(initialFormData);

  // Initialize form with learner data if editing
  useEffect(() => {
    if (learner) {
      // Prevent React warnings by replacing null values from the backend with empty strings
      const sanitizedLearner = Object.fromEntries(
        Object.entries(learner).map(([key, value]) => [key, value === null ? '' : value])
      );

      setFormData({
        ...initialFormData,
        ...sanitizedLearner,
        id: learner.id,          // always carry the real DB id for edit detection
        dateOfBirth: toInputDate(learner.dateOfBirth),
        dateOfAdmission: toInputDate(learner.admissionDate) || initialFormData.dateOfAdmission,
      });
      // Set photo preview if exists
      if (learner.photo) {
        setPhotoPreview(learner.photo);
      }
    } else {
      const savedDraft = localStorage.getItem('admission-form-draft');
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setFormData(parsedDraft);
          setIsDraft(true);
          setLastSaved(new Date());
          showSuccess('Restored unsaved admission progress');
        } catch (error) {
          console.error('Failed to parse admission draft:', error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learner]);

  // Fetch Next Admission Number Preview (only for new admissions)
  useEffect(() => {
    if (isEdit) return;
    const fetchAdmPreview = async () => {
      try {
        const resp = await learnerAPI.getNextAdmissionNumber();
        const next = resp?.data?.nextAdmissionNumber;
        if (next) {
          setFormData(prev => ({ ...prev, admissionNumber: next }));
        }
      } catch (error) {
        console.error('Failed to fetch admission preview:', error);
      }
    };
    fetchAdmPreview();
  }, [isEdit]);

  // Debounced auto-save to localStorage (new admissions only — never save edit state)
  useEffect(() => {
    // Never persist draft state when editing an existing learner: the `id` field
    // would be written to localStorage and get picked up on the next *new* admission,
    // silently turning a create into an update.
    if (isEdit) return;
    // Check if the form has been interacted with (not initial state)
    const isInitial = JSON.stringify(formData) === JSON.stringify(initialFormData);
    if (isInitial) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem('admission-form-draft', JSON.stringify(formData));
      setIsDraft(true);
      setLastSaved(new Date());
      console.log('Admission draft saved.');
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field if it becomes valid
    if (stepErrors[name]) {
      const newErrors = { ...stepErrors };

      // Check if field is now valid based on current step
      if (currentStep === 1) {
        if (name === 'firstName' && value.trim()) {
          delete newErrors.firstName;
        } else if (name === 'lastName' && value.trim()) {
          delete newErrors.lastName;
        } else if (name === 'gender' && value) {
          delete newErrors.gender;
        } else if (name === 'dateOfBirth' && value) {
          delete newErrors.dateOfBirth;
        } else if (name === 'grade' && value) {
          delete newErrors.grade;
        }
      }

      setStepErrors(newErrors);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, photo: base64String }));
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  // Camera capture functions
  // Age validation function
  const validateAge = (dateOfBirth, grade) => {
    if (!dateOfBirth || !grade) return { valid: true };

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const ageInYears = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Adjust age if birthday hasn't occurred this year
    let actualAge = ageInYears;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }

    // Minimum age requirements (Kenya CBC system)
    const minAges = {
      'PP1': 4,
      'PP2': 5,
      'GRADE_1': 6,
      'GRADE_2': 7,
      'GRADE_3': 8,
      'GRADE_4': 9,
      'GRADE_5': 10,
      'GRADE_6': 11,
      'GRADE_7': 12
    };

    const requiredAge = minAges[grade];
    if (requiredAge && actualAge < requiredAge) {
      return {
        valid: false,
        message: `Student is ${actualAge} years old. Minimum age for ${grade.replace('_', ' ').replace('GRADE', 'Grade')} is ${requiredAge} years.`,
        actualAge,
        requiredAge
      };
    }

    return { valid: true, actualAge };
  };

  // Validation function for each step
  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      // Step 1: Student Information validation
      if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
      if (!formData.gender) errors.gender = 'Gender is required';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.grade) errors.grade = 'Grade is required';

      // Validate age requirements on step 1
      if (formData.dateOfBirth && formData.grade) {
        const ageValidation = validateAge(formData.dateOfBirth, formData.grade);
        if (!ageValidation.valid) {
          errors.dateOfBirth = `⚠️ ${ageValidation.message}`;
        }
      }
      // Stream is now optional
    } else if (step === 2) {
      // Step 2: Parent/Guardian validation - at least one parent with phone
      const hasFatherPhone = formData.fatherPhone?.trim();
      const hasMotherPhone = formData.motherPhone?.trim();
      const hasGuardianPhone = formData.guardianPhone?.trim();

      if (!hasFatherPhone && !hasMotherPhone && !hasGuardianPhone) {
        errors.parentPhone = 'Please provide at least one parent/guardian with a phone number';
      }
    }
    // Step 3 (Medical) has no required fields
    // Step 4 (Review) has no required fields

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear parentPhone error when any parent/guardian phone is filled
  React.useEffect(() => {
    if (stepErrors.parentPhone) {
      const hasFatherPhone = formData.fatherPhone?.trim();
      const hasMotherPhone = formData.motherPhone?.trim();
      const hasGuardianPhone = formData.guardianPhone?.trim();

      if (hasFatherPhone || hasMotherPhone || hasGuardianPhone) {
        setStepErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.parentPhone;
          return newErrors;
        });
      }
    }
  }, [formData.fatherPhone, formData.motherPhone, formData.guardianPhone, stepErrors.parentPhone]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setStepErrors({}); // Clear errors when moving to next step
        setCurrentStep(currentStep + 1);
      }
    } else {
      showError('Please fill in all required fields');
    }
  };
  const handlePrevious = () => {
    if (currentStep > 1) {
      setStepErrors({}); // Clear errors when moving to previous step
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper: Compute primary contact based on parent hierarchy
  const computePrimaryContact = (data) => {
    if (!data.fatherDeceased && data.fatherName && data.fatherPhone) {
      return {
        primaryContactType: 'FATHER',
        primaryContactName: data.fatherName,
        primaryContactPhone: data.fatherPhone,
        primaryContactEmail: data.fatherEmail || ''
      };
    } else if (!data.motherDeceased && data.motherName && data.motherPhone) {
      return {
        primaryContactType: 'MOTHER',
        primaryContactName: data.motherName,
        primaryContactPhone: data.motherPhone,
        primaryContactEmail: data.motherEmail || ''
      };
    } else if (data.guardianName && data.guardianPhone) {
      return {
        primaryContactType: 'GUARDIAN',
        primaryContactName: data.guardianName,
        primaryContactPhone: data.guardianPhone,
        primaryContactEmail: data.guardianEmail || ''
      };
    }
    return {
      primaryContactType: null,
      primaryContactName: '',
      primaryContactPhone: '',
      primaryContactEmail: ''
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 Form submission started...');

    if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dateOfBirth) {
      showError('Please fill in all required fields'); setCurrentStep(1); return;
    }

    // Validate that at least one parent/guardian is provided with phone
    const primaryContact = computePrimaryContact(formData);
    if (!primaryContact.primaryContactPhone) {
      showError('Please provide at least one parent/guardian with a phone number'); setCurrentStep(2); return;
    }

    const finalFormData = {
      ...formData,
      ...primaryContact,
      generateInvoice // Include the toggle state
    };

    console.log('📤 Submitting form data:', finalFormData);

    // Success logic managed by onSave handler
    if (onSave) {
      setIsSaving(true);
      const result = await onSave(finalFormData);
      console.log('📥 Save result:', result);

      if (result?.success) {
        console.log('✅ Save successful, showing success message...');
        showSuccess('Student admission successful!');

        localStorage.removeItem('admission-form-draft');
        if (!isEdit) {
          // Clear form with fresh date
          const now = new Date();
          const iso = now.toISOString().split('T')[0];
          const clearedForm = { ...initialFormData, dateOfAdmission: iso };
          setFormData(clearedForm);
          setIsDraft(false);
          setLastSaved(null);
          setCurrentStep(1);
        }
        if (onCancel) onCancel(); // Go back to list
      } else {
        console.log('❌ Save failed:', result?.error);
        showError('Failed to create student: ' + (result?.error || 'Unknown error'));
      }
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: 'Students Info', icon: User },
    { number: 2, title: 'Guardian Info', icon: UsersIcon },
    { number: 3, title: 'Medical Info', icon: Heart },
    { number: 4, title: 'Review', icon: CheckCircle }
  ];

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Student Details' : 'Student Admission'}</h2>
            <p className="text-sm text-gray-500">{isEdit ? 'Update student records below.' : 'Fill in the details below to admit a new student.'}</p>
          </div>
          {isDraft && !isEdit && (
            <div className="flex items-center gap-2 mb-1 px-3 py-1 bg-green-50 rounded-full border border-green-100 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                Draft Saved {lastSaved && lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all text-sm font-medium border border-red-200 shadow-sm"
                title="Delete this student record"
              >
                <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all text-sm font-medium border border-gray-200"
            >
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to List</span>
            </button>
          </div>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Progress Steps - More Compact */}
          <div className="flex items-center justify-between bg-gray-50/50 rounded-lg p-3 border border-gray-100">
            {isMobile ? (
              <div className="flex w-full items-center justify-between px-2">
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-gray-800">Step {currentStep} of {steps.length}</h4>
                  <p className="text-xs text-brand-purple font-semibold">{steps[currentStep - 1].title}</p>
                </div>
                <div className="flex gap-1.5">
                  {steps.map(step => (
                    <div key={step.number} className={`h-2 rounded-full transition-all ${currentStep === step.number ? 'w-6 bg-brand-purple' : 'w-2 bg-gray-300'}`} />
                  ))}
                </div>
              </div>
            ) : (
              steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep >= step.number;
                return (
                  <React.Fragment key={step.number}>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${isActive ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20' : 'bg-gray-200 text-gray-500'}`}>
                        {isActive ? <StepIcon size={14} /> : step.number}
                      </div>
                      <div className="hidden sm:block">
                        <p className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-brand-purple' : 'text-gray-400'}`}>{step.title}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${currentStep > step.number ? 'bg-brand-purple' : 'bg-gray-200'}`} />}
                  </React.Fragment>
                );
              })
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Students Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Students Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[{ name: 'firstName', label: 'First Name', required: true },
                  { name: 'middleName', label: 'Middle Name', required: false },
                  { name: 'lastName', label: 'Last Name', required: true }].map(field => (
                    <div key={field.name}>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input type="text" name={field.name} value={formData[field.name]} onChange={handleInputChange}
                        className={`w-full px-3 py-2 bg-white border rounded-md text-sm transition-all focus:ring-1 focus:ring-brand-purple ${stepErrors[field.name]
                          ? 'border-red-500 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 focus:border-brand-purple'
                          }`}
                        placeholder={`Enter ${field.label.toLowerCase()}`} required={field.required} />
                      {stepErrors[field.name] && <p className="text-xs text-red-500 font-semibold mt-1">{stepErrors[field.name]}</p>}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Gender <span className="text-red-500">*</span></label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className={`w-full px-3 py-2 bg-white border rounded-md text-sm transition-all focus:ring-1 focus:ring-brand-purple ${stepErrors.gender
                      ? 'border-red-500 bg-red-50 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-purple'
                      }`} required>
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                    {stepErrors.gender && <p className="text-xs text-red-500 font-semibold mt-1">{stepErrors.gender}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={`w-full px-3 py-2 bg-white border rounded-md text-sm transition-all focus:ring-1 focus:ring-brand-purple ${stepErrors.dateOfBirth
                      ? 'border-red-500 bg-red-50 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-purple'
                      }`} required />
                    {stepErrors.dateOfBirth && <p className="text-xs text-red-500 font-semibold mt-1">{stepErrors.dateOfBirth}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                    <select name="nationality" value={formData.nationality} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white">
                      <option value="">Select Nationality</option>
                      {[
                        'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 
                        'Cameroon', 'Central African Republic', 'Chad', 'Comoros', 'Democratic Republic of the Congo', 
                        'Republic of the Congo', "Cote d'Ivoire", 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 
                        'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 
                        'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 
                        'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 
                        'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 
                        'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
                      ].map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Religion</label>
                    <select name="religion" value={formData.religion} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white">
                      <option value="">Select Religion</option>
                      <option value="Christianity">Christianity</option>
                      <option value="Islam">Islam</option>
                      <option value="Hinduism">Hinduism</option>
                      <option value="Buddhism">Buddhism</option>
                      <option value="Judaism">Judaism</option>
                      <option value="Other">Other</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="border-t pt-6 mt-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Student Photo</h4>
                  <div className="flex items-start gap-6">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Student preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <User size={48} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-purple"
                      />
                      <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG. Max size: 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Academic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Admission Number</label>
                      <input
                        type="text"
                        name="admissionNumber"
                        value={formData.admissionNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm shadow-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-mono font-bold text-brand-purple"
                        placeholder="Auto-generating..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">UPI Number (NEMIS)</label>
                      <input
                        type="text"
                        name="upiNumber"
                        value={formData.upiNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-md text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
                        placeholder="e.g. ABC1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Grade <span className="text-red-500">*</span></label>
                      <select name="grade" value={formData.grade} onChange={handleInputChange} className={`w-full px-3 py-2 bg-white border rounded-md text-sm shadow-sm transition-all focus:ring-1 focus:ring-brand-purple ${stepErrors.grade
                        ? 'border-red-500 bg-red-50 focus:border-red-500'
                        : 'border-gray-200 focus:border-brand-purple'
                        }`} required>
                        <option value="">Select Grade</option>
                        {availableGrades.map(grade => (
                          <option key={grade} value={grade}>
                            {grade.replace('_', ' ').replace('GRADE', 'Grade')}
                          </option>
                        ))}
                      </select>
                      {stepErrors.grade && <p className="text-xs text-red-500 font-semibold mt-1">{stepErrors.grade}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Stream</label>
                      <select name="stream" value={formData.stream} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm shadow-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple">
                        <option value="">Select Stream (Optional)</option>
                        {availableStreams.length > 0 ? (
                          availableStreams.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))
                        ) : (
                          <option disabled>No streams configured</option>
                        )}
                      </select>
                    </div>
                    {/* [NEW] Transport Service Toggle */}
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-3 p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-md transition-all hover:bg-brand-purple/10">
                        <input
                          type="checkbox"
                          id="isTransportStudent"
                          name="isTransportStudent"
                          checked={formData.isTransportStudent}
                          onChange={(e) => setFormData({ ...formData, isTransportStudent: e.target.checked })}
                          className="w-4 h-4 text-brand-purple border-gray-300 rounded focus:ring-brand-purple cursor-pointer"
                        />
                        <label htmlFor="isTransportStudent" className="flex flex-col cursor-pointer">
                          <span className="text-sm font-bold text-brand-purple">Transport Service</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold font-mono">Check this if the learner will be using school transport</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t pt-6">
                    <h4 className="md:col-span-2 text-lg font-bold text-gray-800 mb-2">Location & Contact</h4>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">County</label>
                      <input type="text" name="county" value={formData.county} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm shadow-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="e.g., Nairobi" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Residential Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm shadow-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="e.g., Westlands, Estate name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Date of Admission</label>
                      <input type="date" name="dateOfAdmission" value={toInputDate(formData.dateOfAdmission)} disabled={true} className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm shadow-sm cursor-not-allowed font-mono text-gray-600" />
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">✨ Automatically set to today</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Previous School</label>
                      <input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm shadow-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Previous Class</label>
                      <input type="text" name="previousClass" value={formData.previousClass} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm shadow-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="e.g., Grade 2" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Step 2: Parent/Guardian Information */}
            {currentStep === 2 && (
              <>
                <ParentGuardianStep
                  formData={formData}
                  onChange={setFormData}
                />
                {stepErrors.parentPhone && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-sm font-semibold text-red-700">⚠️ {stepErrors.parentPhone}</p>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Medical Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple">
                      <option value="">Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Known Allergies</label>
                  <textarea name="allergies" value={formData.allergies} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="List any allergies" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Medical Conditions</label>
                  <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="List any medical conditions" />
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Doctor Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Doctor Name</label>
                      <input type="text" name="doctorName" value={formData.doctorName} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Doctor Phone</label>
                      <input type="tel" name="doctorPhone" value={formData.doctorPhone} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Special Needs</label>
                  <textarea name="specialNeeds" value={formData.specialNeeds} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="Any special needs" />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Review Admission Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-100 rounded-md p-3 bg-gray-50/30">
                    <h4 className="text-xs font-black text-brand-purple uppercase tracking-widest mb-2 border-b border-brand-purple/10 pb-1">Personal Info</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-800">{formData.firstName} {formData.middleName} {formData.lastName}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">Gender:</span> <span className="font-semibold text-gray-800">{formData.gender === 'MALE' ? 'Male' : 'Female'}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">DOB:</span> <span className="font-semibold text-gray-800">{formData.dateOfBirth}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">Grade:</span> <span className="font-semibold text-gray-800">{formData.grade?.replace('GRADE_', 'Grade ')} - {formData.stream}</span></p>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-md p-3 bg-gray-50/30">
                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2 border-b border-green-50 pb-1">
                      {(() => {
                        const pc = computePrimaryContact(formData);
                        const typeLabel = { 'FATHER': '👨 Father', 'MOTHER': '👩 Mother', 'GUARDIAN': '👤 Guardian' }[pc.primaryContactType] || 'Contact';
                        return `Primary Guardian (${typeLabel})`;
                      })()}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="text-gray-500">Contact:</span>
                        <span className="font-semibold text-gray-800">{computePrimaryContact(formData).primaryContactName || 'Not specified'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-semibold text-gray-800">{computePrimaryContact(formData).primaryContactPhone || 'N/A'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-semibold text-gray-800">{computePrimaryContact(formData).primaryContactEmail || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-md p-3 bg-gray-50/30">
                    <h4 className="text-xs font-bold text-brand-purple uppercase tracking-widest mb-2 border-b border-brand-purple/10 pb-1">Medical & Extras</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-gray-500">Blood Group:</span> <span className="font-semibold text-gray-800">{formData.bloodGroup || 'N/A'}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">Allergies:</span> <span className="font-semibold text-gray-800 truncate max-w-[150px]">{formData.allergies || 'None'}</span></p>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-md p-3 bg-gray-50/30">
                    <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2 border-b border-orange-50 pb-1">Admin Info</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-gray-500">Adm No:</span> <span className="font-semibold text-gray-800">{formData.admissionNumber || 'Auto-generated'}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">UPI (NEMIS):</span> <span className="font-semibold text-emerald-600 font-mono">{formData.upiNumber || 'N/A'}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">Adm Date:</span> <span className="font-semibold text-gray-800">{formData.dateOfAdmission}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">Prev School:</span> <span className="font-semibold text-gray-800 truncate max-w-[150px]">{formData.previousSchool || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-md flex items-start gap-3 mt-4">
                  <CheckCircle className="text-brand-purple shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-brand-purple leading-relaxed font-bold">Please verify all information above before completing the admission. You can edit these details later in student management.</p>

                </div>

                <div className="mt-6 flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <input
                    id="generateInvoice"
                    type="checkbox"
                    checked={generateInvoice}
                    onChange={(e) => setGenerateInvoice(e.target.checked)}
                    className="w-5 h-5 text-brand-purple rounded focus:ring-brand-purple border-gray-300"
                  />
                  <div>
                    <label htmlFor="generateInvoice" className="block text-sm font-bold text-gray-800 cursor-pointer">
                      Generate Automatic Invoice
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Create an invoice for the current term immediately upon admission.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button type="button" onClick={handlePrevious} disabled={currentStep === 1} className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-md transition-all text-sm font-bold ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Previous</span>
              </button>
              <div className="flex items-center gap-2 md:gap-3">
                <button type="button" onClick={() => { setFormData(initialFormData); setCurrentStep(1); }} className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-all text-sm font-bold border border-gray-200">
                  <X size={16} /> <span className="hidden sm:inline">Clear</span>
                </button>
                {currentStep < 4 ? (
                  <button type="button" onClick={handleNext} disabled={Object.keys(stepErrors).length > 0} className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-md transition-all shadow-sm text-sm font-bold ${Object.keys(stepErrors).length > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-teal text-white hover:bg-brand-teal/90'
                    }`}>
                    <span className="hidden sm:inline">Next Step</span><span className="inline sm:hidden">Next</span> <ArrowRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 transition-all shadow-md text-sm font-bold disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isSaving ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} /> 
                        {isEdit ? 'Save Changes' : 'Complete Admission'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionsPage;
