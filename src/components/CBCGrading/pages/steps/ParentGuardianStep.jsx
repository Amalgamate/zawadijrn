/**
 * Parent/Guardian Selection Step
 * Intelligent hierarchical parent selection: Father → Mother → Guardian
 * Minimalist UI with color-coded sections
 */

import React, { useState, useMemo } from 'react';
import { AlertCircle, Phone, Mail, Users } from 'lucide-react';

// Guardian type configuration
const GUARDIAN_CONFIG = {
  FATHER: {
    label: "👨 Father",
    title: "Father's Information",
    description: "Father is the primary guardian",
    warning: null,
    nameField: 'fatherName',
    phoneField: 'fatherPhone',
    emailField: 'fatherEmail',
    deceasedField: 'fatherDeceased',
    showEmail: true,
    showRelation: false,
    color: 'blue',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  MOTHER: {
    label: "👩 Mother",
    title: "Mother's Information",
    description: "Mother is the primary guardian",
    warning: "⚠️ Father is marked as deceased",
    nameField: 'motherName',
    phoneField: 'motherPhone',
    emailField: 'motherEmail',
    deceasedField: 'motherDeceased',
    showEmail: true,
    showRelation: false,
    color: 'amber',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-800'
  },
  GUARDIAN: {
    label: "👤 Parent/Guardian",
    title: "Parent/Guardian Information",
    description: "Parent/Guardian is the primary caretaker",
    warning: "⚠️ Both parents are marked as deceased",
    nameField: 'guardianName',
    phoneField: 'guardianPhone',
    emailField: 'guardianEmail',
    deceasedField: null,
    showEmail: false,
    showRelation: true,
    relationshipOptions: ['Aunt', 'Uncle', 'Grandfather', 'Grandmother', 'Sibling', 'Cousin', 'Other'],
    color: 'rose',
    borderColor: 'border-rose-300',
    bgColor: 'bg-rose-50',
    badgeColor: 'bg-rose-100 text-rose-800'
  }
};

const ParentGuardianStep = ({ formData = {}, onChange }) => {
  // Determine which guardian should be selected by default
  const defaultGuardianType = useMemo(() => {
    // Default to Father unless marked deceased
    if (!formData.fatherDeceased) {
      return 'FATHER';
    } else if (!formData.motherDeceased) {
      return 'MOTHER';
    } else {
      return 'GUARDIAN';
    }
  }, [formData.fatherDeceased, formData.motherDeceased]);

  const [selectedGuardian, setSelectedGuardian] = useState(defaultGuardianType);
  const config = GUARDIAN_CONFIG[selectedGuardian] || GUARDIAN_CONFIG.FATHER;

  // Check if either parent is marked as deceased
  const isEitherParentDeceased = !!formData.fatherDeceased || !!formData.motherDeceased;

  // Sync primary contact details when selected guardian changes or fields update
  const updatePrimaryContact = (type, currentFormData) => {
    const config = GUARDIAN_CONFIG[type];
    if (!config) return currentFormData;

    return {
      ...currentFormData,
      primaryContactType: type,
      primaryContactName: currentFormData[config.nameField],
      primaryContactPhone: currentFormData[config.phoneField],
      primaryContactEmail: currentFormData[config.emailField]
    };
  };

  // Handle guardian type change (Tab Switching)
  const handleGuardianChange = (guardianType) => {
    setSelectedGuardian(guardianType);
    // REMOVED: Do not auto-set primary contact just by switching tabs. 
    // User must explicitly check the box.
  };

  // Handle form field changes
  const handleFieldChange = (fieldName, value) => {
    const updatedFormData = {
      ...formData,
      [fieldName]: value
    };

    // If we're editing the currently selected guardian's fields,
    // AND they are the designated primary contact, sync the changes to primaryContact* fields.
    const config = GUARDIAN_CONFIG[selectedGuardian];

    // Check if the current tab matches the designated primary contact
    const isEditingPrimary = formData.primaryContactType === selectedGuardian;

    if (
      isEditingPrimary &&
      (fieldName === config.nameField ||
        fieldName === config.phoneField ||
        fieldName === config.emailField)
    ) {
      // Sync keeping the SAME primary type
      const syncedData = updatePrimaryContact(selectedGuardian, updatedFormData);
      onChange(syncedData);
    } else {
      // Just update the field directly without syncing to primary
      onChange(updatedFormData);
    }
  };

  // Handle deceased checkbox
  const handleDeceasedChange = (deceasedField, isDeceased) => {

    // First, update the dead status
    const updatedFormData = {
      ...formData,
      [deceasedField]: isDeceased
    };

    // Now check if we need to switch PRIMARY CONTACT
    // Only switch if the person being marked deceased IS currently the primary contact
    // Determine who is being marked deceased based on field name
    const personBeingMarked = deceasedField === 'fatherDeceased' ? 'FATHER' : 'MOTHER';

    // If the person being marked deceased is the current primary contact, we must switch
    let newPrimaryType = formData.primaryContactType;

    if (isDeceased && formData.primaryContactType === personBeingMarked) {
      if (personBeingMarked === 'FATHER') {
        // Father died, switch to Mother if alive, else Guardian
        newPrimaryType = !formData.motherDeceased ? 'MOTHER' : 'GUARDIAN';
      } else if (personBeingMarked === 'MOTHER') {
        // Mother died, switch to Father (if alive) else Guardian
        // But wait, if Mother was Primary, Father might already be deceased or not selected.
        // Hierarchy: Father -> Mother -> Guardian.
        // If Mother was Primary, implies Father wasn't available.
        // So default to Guardian.
        newPrimaryType = !formData.fatherDeceased ? 'FATHER' : 'GUARDIAN';
      }
    }

    // Determine if we should also switch the VIEW (tab)
    // If I am looking at Father and mark him deceased, it makes sense to switch view to Mother who is now Primary.
    if (selectedGuardian === personBeingMarked && isDeceased) {
      setSelectedGuardian(newPrimaryType);
    }

    // Update state
    if (newPrimaryType !== formData.primaryContactType) {
      const finalData = updatePrimaryContact(newPrimaryType, updatedFormData);
      onChange(finalData);
    } else {
      onChange(updatedFormData);
    }
  };

  // Initialize selected guardian based on existing primaryContactType if available
  React.useEffect(() => {
    if (formData.primaryContactType && GUARDIAN_CONFIG[formData.primaryContactType]) {
      setSelectedGuardian(formData.primaryContactType);
    }
  }, [formData.primaryContactType]);

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pb-2">
        <h3 className="text-lg font-medium text-gray-900">Parent/Guardian Information</h3>
        <p className="text-xs text-gray-600 mt-0.5">Select primary guardian and provide contact</p>
      </div>

      {/* Guardian Type Selection - Radio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {Object.entries(GUARDIAN_CONFIG).map(([type, cfg]) => {
          const isGuardianDisabled = type === 'GUARDIAN' && !isEitherParentDeceased;

          return (
            <label
              key={type}
              className={`flex items-start gap-2 p-3 border-2 rounded-lg transition-all ${isGuardianDisabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : selectedGuardian === type
                  ? `border-${cfg.color}-500 ${cfg.bgColor} cursor-pointer`
                  : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                }`}
            >
              <input
                type="radio"
                value={type}
                checked={selectedGuardian === type}
                onChange={() => !isGuardianDisabled && handleGuardianChange(type)}
                disabled={isGuardianDisabled}
                className="w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{cfg.label}</p>
                <p className={`text-xs ${isGuardianDisabled ? 'text-gray-500' : 'text-gray-600'}`}>
                  {type === 'GUARDIAN' && !isEitherParentDeceased ? 'Enabled when a parent is marked deceased' : cfg.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Conditional Warning Banner */}
      {config.warning && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 font-medium">{config.warning}</p>
        </div>
      )}

      {/* Guardian Information Form Section */}
      <div className={`border-l-4 p-4 rounded-lg space-y-3 ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
            {config.label}
          </div>
          <h4 className="text-base font-medium text-gray-900">{config.title}</h4>
        </div>

        {/* Full Name Field */}
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData[config.nameField] || ''}
            onChange={(e) => handleFieldChange(config.nameField, e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder={`Enter ${config.label.replace(/📱|👨|👩|👤/g, '').trim().toLowerCase()}'s full name`}
            required
          />
        </div>

        {/* Phone Number Field */}
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">
            <Phone size={13} className="inline mr-0.5" /> Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData[config.phoneField] || ''}
            onChange={(e) => handleFieldChange(config.phoneField, e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="0712345678 or +254712345678"
          />
          <p className="text-xs text-gray-500 mt-0.5">Used for SMS & broadcasts</p>
        </div>

        {/* Primary Contact Checkbox */}
        <div className="pt-2">
          <label className={`flex items-center gap-2 p-2 rounded-lg border border-transparent transition-colors ${formData.primaryContactType && formData.primaryContactType !== selectedGuardian
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:bg-white/50 hover:border-gray-200'
            }`}>
            <input
              type="checkbox"
              checked={formData.primaryContactType === selectedGuardian}
              disabled={formData.primaryContactType && formData.primaryContactType !== selectedGuardian}
              onChange={() => {
                let newPrimaryType = null;

                // If currently checked, we are unchecking it (setting to null)
                if (formData.primaryContactType === selectedGuardian) {
                  newPrimaryType = null;
                } else {
                  // If unchecked, we are checking it (setting to current guardian)
                  newPrimaryType = selectedGuardian;
                }

                // Update formData with new primary type (or null)
                // We use updatePrimaryContact which handles syncing fields
                // If type is null, we just clear primary fields manually or handle in updatePrimaryContact?
                // updatePrimaryContact expects a valid type string for config lookup.

                if (newPrimaryType) {
                  const updated = updatePrimaryContact(newPrimaryType, formData);
                  onChange(updated);
                } else {
                  // Clearing primary contact
                  onChange({
                    ...formData,
                    primaryContactType: null,
                    primaryContactName: '',
                    primaryContactPhone: '',
                    primaryContactEmail: ''
                  });
                }
              }}
              className={`w-4 h-4 text-${config.color}-600 border-gray-300 rounded focus:ring-2 focus:ring-${config.color}-500 disabled:opacity-50`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${formData.primaryContactType && formData.primaryContactType !== selectedGuardian ? 'text-gray-400' : 'text-gray-800'}`}>Primary Contact</p>
                {formData.primaryContactType && formData.primaryContactType !== selectedGuardian && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {GUARDIAN_CONFIG[formData.primaryContactType]?.label} is selected
                  </span>
                )}
              </div>
              <p className={`text-xs ${formData.primaryContactType && formData.primaryContactType !== selectedGuardian ? 'text-gray-400' : 'text-gray-600'}`}>
                Receive all SMS & Broadcasts
              </p>
            </div>
          </label>
        </div>

        {/* Email Field (if applicable) */}
        {config.showEmail && (
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">
              <Mail size={13} className="inline mr-0.5" /> Email (Optional)
            </label>
            <input
              type="email"
              value={formData[config.emailField] || ''}
              onChange={(e) => handleFieldChange(config.emailField, e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="parent@example.com"
            />
          </div>
        )}

        {/* Relationship Field (for Guardian only) */}
        {config.showRelation && (
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">
              <Users size={13} className="inline mr-0.5" /> Relationship <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.guardianRelation || ''}
              onChange={(e) => handleFieldChange('guardianRelation', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            >
              <option value="">Select relationship</option>
              {config.relationshipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Deceased Checkbox (if applicable) */}
        {config.deceasedField && (
          <div className="border-t pt-2 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[config.deceasedField] || false}
                onChange={(e) => handleDeceasedChange(config.deceasedField, e.target.checked)}
                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Mark as deceased
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Helpful Note - Compact */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
        <p className="text-xs text-blue-800">
          <strong>ℹ️</strong> Phone is used for SMS & broadcasts. System auto-switches to next contact if parent is deceased.
        </p>
      </div>

      {/* Primary Contact Validation Message */}
      {!formData.primaryContactPhone && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800 font-medium">
            A primary contact phone number is mandatory. Please provide a phone number for the selected primary contact.
          </p>
        </div>
      )}
    </div>
  );
};

export default ParentGuardianStep;
