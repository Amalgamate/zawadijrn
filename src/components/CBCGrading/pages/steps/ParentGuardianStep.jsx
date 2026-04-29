import React from 'react';
import { AlertCircle } from 'lucide-react';

const CONTACTS = [
  {
    key: 'FATHER',
    label: 'Father',
    nameField: 'fatherName',
    phoneField: 'fatherPhone',
    emailField: 'fatherEmail',
    deceasedField: 'fatherDeceased'
  },
  {
    key: 'MOTHER',
    label: 'Mother',
    nameField: 'motherName',
    phoneField: 'motherPhone',
    emailField: 'motherEmail',
    deceasedField: 'motherDeceased'
  },
  {
    key: 'GUARDIAN',
    label: 'Guardian',
    nameField: 'guardianName',
    phoneField: 'guardianPhone',
    emailField: 'guardianEmail',
    relationField: 'guardianRelation'
  }
];

const ParentGuardianStep = ({ formData = {}, onChange }) => {
  const update = (patch) => onChange({ ...formData, ...patch });

  const splitNameParts = (fullName = '') => {
    const tokens = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return { first: '', middle: '', last: '' };
    if (tokens.length === 1) return { first: tokens[0], middle: '', last: '' };
    if (tokens.length === 2) return { first: tokens[0], middle: '', last: tokens[1] };
    return {
      first: tokens[0],
      middle: tokens.slice(1, -1).join(' '),
      last: tokens[tokens.length - 1]
    };
  };

  const composeName = (first = '', middle = '', last = '') => [first, middle, last].filter(Boolean).join(' ').trim();

  const setPrimaryContact = (contact) => {
    const name = formData[contact.nameField] || '';
    const phone = formData[contact.phoneField] || '';
    const email = formData[contact.emailField] || '';
    update({
      primaryContactType: contact.key,
      primaryContactName: name,
      primaryContactPhone: phone,
      primaryContactEmail: email
    });
  };

  const clearPrimaryContact = () => {
    update({
      primaryContactType: '',
      primaryContactName: '',
      primaryContactPhone: '',
      primaryContactEmail: ''
    });
  };

  const handleFieldChange = (field, value) => {
    const next = { ...formData, [field]: value };
    const selected = CONTACTS.find((c) => c.key === formData.primaryContactType);
    if (selected && (field === selected.nameField || field === selected.phoneField || field === selected.emailField)) {
      onChange({
        ...next,
        primaryContactName: next[selected.nameField] || '',
        primaryContactPhone: next[selected.phoneField] || '',
        primaryContactEmail: next[selected.emailField] || ''
      });
      return;
    }
    onChange(next);
  };

  const handlePrimaryToggle = (contact, checked) => {
    if (!checked) {
      clearPrimaryContact();
      return;
    }
    setPrimaryContact(contact);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Parent/Guardian Information</h3>
        <p className="text-xs text-gray-600 mt-0.5">Capture father, mother, and guardian details in one form.</p>
      </div>

      <div className="space-y-5">
        {CONTACTS.map((contact) => {
          const isPrimary = formData.primaryContactType === contact.key;
          const nameParts = splitNameParts(formData[contact.nameField]);
          const updateNamePart = (part, value) => {
            const next = {
              first: nameParts.first,
              middle: nameParts.middle,
              last: nameParts.last,
              [part]: value
            };
            handleFieldChange(contact.nameField, composeName(next.first, next.middle, next.last));
          };
          return (
            <div key={contact.key} className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">{contact.label}</h4>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => handlePrimaryToggle(contact, e.target.checked)}
                    className="w-4 h-4 text-brand-purple border-gray-300 rounded focus:ring-brand-purple"
                  />
                  Primary Contact
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">First Name</label>
                  <input
                    type="text"
                    value={nameParts.first}
                    onChange={(e) => updateNamePart('first', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-purple focus:border-brand-purple"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={nameParts.middle}
                    onChange={(e) => updateNamePart('middle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-purple focus:border-brand-purple"
                    placeholder="Middle name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">Last Name</label>
                  <input
                    type="text"
                    value={nameParts.last}
                    onChange={(e) => updateNamePart('last', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-purple focus:border-brand-purple"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData[contact.phoneField] || ''}
                  onChange={(e) => handleFieldChange(contact.phoneField, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-purple focus:border-brand-purple"
                  placeholder="0712345678 or +254712345678"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">Email</label>
                <input
                  type="email"
                  value={formData[contact.emailField] || ''}
                  onChange={(e) => handleFieldChange(contact.emailField, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-purple focus:border-brand-purple"
                  placeholder="optional@email.com"
                />
              </div>

              {contact.relationField && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-tight mb-1">Relationship</label>
                  <input
                    type="text"
                    value={formData[contact.relationField] || ''}
                    onChange={(e) => handleFieldChange(contact.relationField, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-purple focus:border-brand-purple"
                    placeholder="e.g. Aunt, Uncle, Grandmother"
                  />
                </div>
              )}

              {contact.deceasedField && (
                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!formData[contact.deceasedField]}
                    onChange={(e) => handleFieldChange(contact.deceasedField, e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-400"
                  />
                  Mark as deceased
                </label>
              )}
            </div>
          );
        })}
      </div>

      {!formData.primaryContactType && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 font-medium">Please tick one Primary Contact checkbox.</p>
        </div>
      )}
    </div>
  );
};

export default ParentGuardianStep;
