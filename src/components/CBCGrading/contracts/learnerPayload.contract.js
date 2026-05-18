export const LEARNER_PAYLOAD_KEYS = [
  'admissionNumber', 'firstName', 'lastName', 'middleName', 'dateOfBirth', 'gender', 'grade', 'stream',
  'upiNumber', 'dateOfAdmission', 'parentId',
  'guardianName', 'guardianPhone', 'guardianEmail', 'guardianRelation',
  'fatherName', 'fatherPhone', 'fatherEmail', 'fatherDeceased',
  'motherName', 'motherPhone', 'motherEmail', 'motherDeceased',
  'primaryContactType', 'primaryContactName', 'primaryContactPhone', 'primaryContactEmail',
  'bloodGroup', 'allergies', 'medicalConditions', 'specialNeeds',
  'emergencyContact', 'emergencyPhone',
  'address', 'county', 'subCounty', 'previousSchool', 'religion',
  'isTransportStudent', 'photo',
  'isScholarshipStudent', 'scholarshipType', 'scholarshipAmount',
  'generateInvoice', 'changeReason', 'status', 'exitDate', 'exitReason',
  'orphanFields',
];

export const sanitizeLearnerPayload = (payload = {}) => {
  const orphanFields = {};
  if (payload.nationality) orphanFields.nationality = String(payload.nationality).trim();
  if (payload.previousClass) orphanFields.previousClass = String(payload.previousClass).trim();
  if (payload.doctorName) orphanFields.doctorName = String(payload.doctorName).trim();
  if (payload.doctorPhone) orphanFields.doctorPhone = String(payload.doctorPhone).trim();

  const normalized = {
    ...payload,
    emergencyContact: payload.emergencyContact || payload.doctorName || '',
    emergencyPhone: payload.emergencyPhone || payload.doctorPhone || '',
    orphanFields,
  };

  return Object.fromEntries(
    Object.entries(normalized).filter(([key]) => LEARNER_PAYLOAD_KEYS.includes(key))
  );
};
