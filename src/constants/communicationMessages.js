/**
 * Communication Messages Configuration
 * Centralized management of all messages, templates, and default values
 * used across the communication module
 */

export const COMMUNICATION_DEFAULTS = {
  // Email Defaults
  email: {
    provider: 'resend',
    fromEmail: process.env.REACT_APP_EMAIL_FROM || 'noreply@elimcrown.ac.ke',
    fromName: process.env.REACT_APP_EMAIL_FROM_NAME || 'Elimcrown Academy',
    enabled: false
  },

  // SMS Defaults
  sms: {
    provider: 'mobilesasa',
    baseUrl: 'https://api.mobilesasa.com',
    senderId: process.env.REACT_APP_SMS_SENDER_ID || 'MOBILESASA',
    enabled: false
  },

  // M-Pesa Defaults
  mpesa: {
    provider: 'интасенд',
    enabled: false
  }
};

export const TEST_MESSAGES = {
  sms: process.env.REACT_APP_TEST_SMS_MESSAGE || 'This is a test message from Elimcrown.',
  email: {
    welcome: {
      subject: 'Welcome to Elimcrown',
      preview: 'Welcome email template'
    },
    onboarding: {
      subject: 'Onboarding Guide',
      preview: 'Onboarding email template'
    }
  }
};

export const SMS_TEMPLATES = {
  welcome: (schoolName) =>
    `Welcome to Elimcrown! Your school ${schoolName} is set up. Log in to your dashboard to get started.`,

  assessmentReport: {
    header: (schoolName) => `FROM ${schoolName}`,
    greeting: (parentName) => parentName ? `Dear ${parentName}` : 'Dear Parent',
    structure: (schoolName, parentName, learnerName, learnerGrade, term, overallGrade, averageScore, totalMarks, maxPossibleMarks) => (`
${`FROM ${schoolName}`}

${parentName ? `Dear ${parentName}` : 'Dear Parent'},

Midterm Assessment, ${term}, ${new Date().getFullYear()}

NAME: ${learnerName}
GRADE: ${learnerGrade}

GRADE: ${overallGrade || 'N/A'}
MEAN MARKS: ${averageScore || '0'}%
TOTAL MARKS: ${totalMarks || 0} / ${maxPossibleMarks || 0}`)
  },

  otp: (otpCode, expiryMinutes = 10) =>
    `Your Elimcrown login OTP is: ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code.`,

  birthday: {
    standard: (learnerName, schoolName, gradeName, ageOrdinal, bdayDate) =>
      `Happy Birthday ${learnerName}! Best wishes from ${schoolName}. We are proud of your progress in ${gradeName}. Have a wonderful day!`,
    premium: (learnerName, schoolName, gradeName, ageOrdinal, bdayDate) =>
      `*Happy Birthday ${learnerName}!* 🎉🎈\n\n${schoolName} is thrilled to celebrate you on your *${ageOrdinal} birthday* today, ${bdayDate}! 🎊\n\nWe are so proud of your progress in *${gradeName}*. May your day be filled with joy, laughter, and wonderful memories. Keep shining bright! ✨\n\nBest wishes,\n*The ${schoolName} Family*`
  }
};

export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to Elimcrown!',
    preheader: 'Your school is set up and ready to go'
  },
  onboarding: {
    subject: 'Get Started with Elimcrown',
    preheader: 'Your onboarding guide is here'
  },
  assessmentReport: {
    subject: (schoolName) => `${schoolName} - Assessment Report`,
    preheader: 'Your child\'s assessment results'
  }
};

export const LEARNING_AREA_ABBREVIATIONS = {
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

export const ERROR_MESSAGES = {
  sms: {
    notConfigured: 'SMS is not configured for this school',
    disabled: 'SMS is disabled for this school',
    invalidPhone: 'Enter valid phone number (format: 254...)',
    failedToSend: 'Failed to send SMS'
  },
  email: {
    notConfigured: 'Email is not configured for this school',
    disabled: 'Email is disabled for this school',
    invalidEmail: 'Enter valid email address',
    failedToSend: 'Failed to send email'
  },
  general: {
    missingContext: 'School context missing',
    requiredFields: 'Missing required fields'
  }
};

export const SUCCESS_MESSAGES = {
  sms: {
    sent: 'SMS sent successfully!',
    testSent: 'Test SMS sent successfully!'
  },
  email: {
    sent: 'Email sent successfully!',
    testSent: 'Test email sent successfully!'
  }
};

// Brand/Organization Info
export const BRAND = {
  name: 'Elimcrown',
  email: process.env.REACT_APP_BRAND_EMAIL || 'hello@elimcrown.com',
  phone: process.env.REACT_APP_BRAND_PHONE || '+254 700 000 000',
  website: process.env.REACT_APP_BRAND_WEBSITE || 'elimcrown.com',
  logo: process.env.REACT_APP_BRAND_LOGO || 'https://elimcrown.com/logo.png',
  displayName: 'Elimcrown Academy',
  tagline: 'CBC-Native Education Platform'
};
