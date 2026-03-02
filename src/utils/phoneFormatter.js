/**
 * Phone Number Formatter Utility
 * Standardizes Kenyan phone numbers to international format (+254)
 * Handles: +254713612141, 0713612141, 713612141, 254713612141
 */

/**
 * Format phone number to international format (+254)
 * Safely handles multiple input formats:
 * - +254713612141 -> +254713612141 ✓
 * - 0713612141 -> +254713612141 ✓
 * - 713612141 -> +254713612141 ✓
 * - 254713612141 -> +254713612141 ✓
 * 
 * @param {string} phone - Phone number in various formats
 * @returns {string} Formatted phone number (+254...) or empty string if invalid
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Trim whitespace
  let normalized = phone.trim();
  
  // Remove the + prefix if present (we'll add it back at the end)
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  // Remove all non-digit characters except we already handled +
  normalized = normalized.replace(/\D/g, '');
  
  if (!normalized) return '';
  
  let coreNumber = ''; // The 9-10 digit core number without country code
  
  // Case 1: Starts with 254 (Kenya country code without +)
  if (normalized.startsWith('254') && normalized.length === 12) {
    coreNumber = normalized.substring(3); // Remove '254'
  }
  // Case 2: Starts with 0 (domestic Kenya format)
  else if (normalized.startsWith('0') && normalized.length === 10) {
    coreNumber = normalized.substring(1); // Remove the '0'
  }
  // Case 3: 9 digits (no country code, no leading 0)
  else if (normalized.length === 9 && /^\d{9}$/.test(normalized)) {
    coreNumber = normalized;
  }
  // Case 4: Other 12-digit numbers starting with 254
  else if (normalized.length === 12 && normalized.startsWith('254')) {
    coreNumber = normalized.substring(3);
  }
  // Case 5: Starts with 0 but more than 10 digits (trim to 10)
  else if (normalized.startsWith('0') && normalized.length > 10) {
    coreNumber = normalized.substring(1, 10);
  }
  // Case 6: No country code, more than 9 digits (take last 9)
  else if (normalized.length > 9) {
    coreNumber = normalized.substring(normalized.length - 9);
  }
  // Case 7: Less than 9 digits - invalid
  else {
    return '';
  }
  
  // Validate the core number is 9 digits
  if (!/^\d{9}$/.test(coreNumber)) {
    return '';
  }
  
  // Validate it's a Kenyan number (starts with 0, 1, 6, or 7 after country code)
  const firstDigit = parseInt(coreNumber.charAt(0));
  if (![0, 1, 6, 7].includes(firstDigit)) {
    return ''; // Not a valid Kenya format
  }
  
  return `+254${coreNumber}`;
};

/**
 * Validate phone number format - checks if it can be formatted
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid and can be formatted
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  const formatted = formatPhoneNumber(phone);
  return formatted.length === 13; // +254xxxxxxxxx = 13 chars
};

/**
 * Get display format (for showing in UI with spaces)
 * @param {string} phone - Phone number (in any format)
 * @returns {string} Display format like "+254 712 345 678"
 */
export const getDisplayPhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) return '';
  
  // Format: +254 712 345 678
  if (formatted.length === 13) {
    return `${formatted.substring(0, 4)} ${formatted.substring(4, 7)} ${formatted.substring(7, 10)} ${formatted.substring(10)}`;
  }
  return formatted;
};

/**
 * Normalize multiple phone numbers from a parent object
 * Handles various property names from database
 * @param {object} parent - Parent/guardian object
 * @returns {string} Formatted phone number (or empty string)
 */
export const getParentPhoneNumber = (parent) => {
  if (!parent) return '';
  
  // Check multiple possible phone number properties
  const possiblePhones = [
    parent.phone,
    parent.phoneNumber,
    parent.mobilePhone,
    parent.guardianPhone,
    parent.parentPhone,
    parent.contactPhone,
    parent.primaryPhone
  ];
  
  for (const phone of possiblePhones) {
    if (phone && isValidPhoneNumber(phone)) {
      return formatPhoneNumber(phone);
    }
  }
  
  return '';
};
