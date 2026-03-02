/**
 * Communication Messages Configuration (Backend)
 * Centralized management of all SMS, Email, and notification templates
 * used across the backend services
 */

export const COMMUNICATION_CONFIG = {
  // Email Provider Defaults
  email: {
    fromEmail: process.env.EMAIL_FROM || 'noreply@elimcrown.ac.ke',
    fromName: process.env.EMAIL_FROM_NAME || 'Elimcrown Academy',
    provider: process.env.EMAIL_PROVIDER || 'resend'
  },

  // SMS Provider Defaults
  sms: {
    provider: process.env.SMS_PROVIDER || 'mobilesasa',
    baseUrl: process.env.SMS_BASE_URL || 'https://api.mobilesasa.com',
    defaultSenderId: process.env.SMS_SENDER_ID || 'MOBILESASA'
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'https://elimcrown-v1.up.railway.app'
  }
};

// SMS Message Templates
export const SMS_MESSAGES = {
  welcome: (schoolName: string): string =>
    `Welcome to Elimcrown! Your school ${schoolName} is set up. Log in to your dashboard to get started.`,

  assessmentReportHeader: (schoolName: string): string =>
    `FROM ${schoolName}`,

  assessmentReportGreeting: (parentName?: string): string =>
    parentName ? `Dear ${parentName}` : 'Dear Parent',

  assessmentReport: (data: {
    schoolName: string;
    parentName?: string;
    learnerName: string;
    learnerGrade: string;
    term: string;
    overallGrade?: string;
    averageScore?: string;
    totalMarks?: number;
    maxPossibleMarks?: number;
  }): string => {
    const {
      schoolName,
      parentName,
      learnerName,
      learnerGrade,
      term,
      overallGrade = 'N/A',
      averageScore = '0',
      totalMarks = 0,
      maxPossibleMarks = 0
    } = data;

    const greeting = parentName ? `Dear ${parentName}` : 'Dear Parent';

    return (
      `FROM ${schoolName}\n\n` +
      `${greeting},\n\n` +
      `Midterm Assessment, ${term}, ${new Date().getFullYear()}\n\n` +
      `NAME: ${learnerName}\n` +
      `GRADE: ${learnerGrade}\n\n` +
      `GRADE: ${overallGrade}\n` +
      `MEAN MARKS: ${averageScore}%\n` +
      `TOTAL MARKS: ${totalMarks} / ${maxPossibleMarks}`
    );
  },

  otp: (otpCode: string, expiryMinutes: number = 10): string =>
    `Your Elimcrown login OTP is: ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code.`,

  birthdayStandard: (learnerName: string, schoolName: string, gradeName: string): string =>
    `Happy Birthday ${learnerName}! Best wishes from ${schoolName}. We are proud of your progress in ${gradeName}. Have a wonderful day!`,

  birthdayPremium: (data: {
    learnerName: string;
    schoolName: string;
    gradeName: string;
    ageOrdinal: string;
    bdayDate: string;
  }): string => {
    const { learnerName, schoolName, gradeName, ageOrdinal, bdayDate } = data;
    return (
      `*Happy Birthday ${learnerName}!* 🎉🎈\n\n` +
      `${schoolName} is thrilled to celebrate you on your *${ageOrdinal} birthday* today, ${bdayDate}! 🎊\n\n` +
      `We are so proud of your progress in *${gradeName}*. May your day be filled with joy, laughter, and wonderful memories. Keep shining bright! ✨\n\n` +
      `Best wishes,\n*The ${schoolName} Family*`
    );
  },

  enrollment: (data: {
    schoolName: string;
    parentName?: string;
    learnerName: string;
    learnerGrade: string;
    admissionNumber: string;
  }): string => {
    const { schoolName, parentName, learnerName, learnerGrade, admissionNumber } = data;
    const greeting = parentName ? `Hello ${parentName.split(' ')[0]}` : 'Hello';

    return (
      `${greeting},\n\n` +
      `Welcome to ${schoolName}!\n\n` +
      `Student: ${learnerName}\n` +
      `Grade: ${learnerGrade}\n` +
      `Admission No: ${admissionNumber}\n\n` +
      `We are excited to have ${learnerName} join our learning community. ` +
      `Your parent portal is ready. Please log in to track progress and school updates.\n\n` +
      `Best regards,\n${schoolName}`
    );
  },

  passwordReset: (password: string, schoolName: string): string =>
    `Your password for ${schoolName} has been reset by the administrator. Your new password is: ${password}. For security, please log in and change it immediately.`
};

// Email Message Templates
export const EMAIL_MESSAGES = {
  welcome: {
    subject: (schoolName: string): string => `Welcome to ${schoolName} on Elimcrown!`,
    preheader: 'Your school is set up and ready to go',
    headingText: 'Welcome to Elimcrown!',
    mainText: (schoolName: string): string =>
      `Congratulations! Your school, <strong>${schoolName}</strong>, has been successfully registered on Elimcrown.`
  },

  onboarding: {
    subject: 'Get Started with Elimcrown',
    preheader: 'Your onboarding guide is here',
    headingText: 'Welcome Aboard!',
    mainText: (schoolName: string): string =>
      `Here's everything you need to know to get started with Elimcrown at ${schoolName}.`
  },

  footer: (schoolName: string, year: number): string =>
    `&copy; ${year} ${schoolName} via Elimcrown. All rights reserved.<br/>You received this email because you signed up for an Elimcrown account.`
};

// Learning Area Abbreviations for SMS
export const LEARNING_AREA_ABBREVIATIONS: Record<string, string> = {
  'MATHEMATICS': 'MAT',
  'ENGLISH': 'ENG',
  'KISWAHILI': 'KIS',
  'SCIENCE AND TECHNOLOGY': 'SCITECH',
  'SOCIAL STUDIES': 'SST',
  'CHRISTIAN RELIGIOUS EDUCATION': 'CRE',
  'ISLAMIC RELIGIOUS EDUCATION': 'IRE',
  'CREATIVE ARTS AND SPORTS': 'CREATIVE',
  'AGRICULTURE AND NUTRITION': 'AGRNT',
  'ENVIRONMENTAL ACTIVITIES': 'ENV',
  'MATHEMATICAL ACTIVITIES': 'MAT',
  'ENGLISH LANGUAGE ACTIVITIES': 'ENG',
  'KISWAHILI LANGUAGE ACTIVITIES': 'KIS'
};

// Error Messages
export const ERROR_MESSAGES = {
  sms: {
    notConfigured: 'SMS not configured for this school',
    disabled: 'SMS is disabled for this school',
    invalidPhone: 'Invalid phone number',
    failedToSend: 'Failed to send SMS',
    missingParameters: 'Missing required parameters'
  },

  email: {
    notConfigured: 'Email not configured for this school',
    disabled: 'Email is disabled for this school',
    invalidEmail: 'Invalid email address',
    failedToSend: 'Failed to send email',
    missingParameters: 'Missing required parameters'
  },

  communication: {
    schoolContextRequired: 'School context required',
    missingRequiredFields: 'Missing required fields',
    configurationError: 'Configuration error'
  }
};

// Success Messages
export const SUCCESS_MESSAGES = {
  sms: {
    sent: 'SMS sent successfully',
    testSent: 'Test SMS sent successfully'
  },

  email: {
    sent: 'Email sent successfully',
    testSent: 'Test email sent successfully'
  },

  communication: {
    configSaved: 'Communication configuration saved successfully',
    testComplete: 'Test completed successfully'
  }
};

// Brand Information
export const BRAND = {
  name: 'Elimcrown',
  email: process.env.BRAND_EMAIL || 'hello@elimcrown.com',
  phone: process.env.BRAND_PHONE || '+254 700 000 000',
  website: process.env.BRAND_WEBSITE || 'elimcrown.com',
  logo: process.env.BRAND_LOGO_URL || 'https://elimcrown.com/logo.png',
  displayName: 'Elimcrown Academy',
  tagline: 'CBC-Native Education Platform'
};

// OTP Configuration
export const OTP_CONFIG = {
  expiryMinutes: 10,
  maxAttempts: 5,
  cooldownMinutes: 15
};

// Message Channel Configuration
export const MESSAGE_CHANNELS = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  IN_APP: 'IN_APP'
} as const;

// Assessment Template Types
export const ASSESSMENT_TEMPLATE_TYPES = {
  FORMATIVE_EXCEEDING: 'FORMATIVE_EXCEEDING',
  FORMATIVE_ACHIEVING: 'FORMATIVE_ACHIEVING',
  FORMATIVE_DEVELOPING: 'FORMATIVE_DEVELOPING',
  SUMMATIVE_TERM: 'SUMMATIVE_TERM',
  ALERT_CRITICAL: 'ALERT_CRITICAL',
  ALERT_IMPROVEMENT: 'ALERT_IMPROVEMENT'
} as const;
