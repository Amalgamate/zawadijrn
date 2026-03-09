import { Request, Response } from 'express';
import prisma from '../config/database';
import { encrypt } from '../utils/encryption.util';
import { SmsService } from '../services/sms.service';
import { EmailService } from '../services/email-resend.service';
import { AuthRequest } from '../middleware/permissions.middleware';
import { whatsappService } from '../services/whatsapp.service';
import { ApiError } from '../utils/error.util';
import { COMMUNICATION_CONFIG, ERROR_MESSAGES, SMS_MESSAGES } from '../config/communication.messages';

/**
 * Get Communication Configuration for a School
 * GET /api/communication/config/:schoolId
 */
export const getCommunicationConfig = async (req: AuthRequest, res: Response) => {
    try {
        // Get schoolId from URL params or school context
        const { schoolId } = req.params;

        if (!schoolId) {
            throw new ApiError(400, 'School ID is required');
        }

        const config = await prisma.communicationConfig.findFirst();

        if (!config) {
            // Return defaults if not found
            return res.status(200).json({
                success: true,
                data: {
                    sms: {
                        enabled: false,
                        provider: COMMUNICATION_CONFIG.sms.provider,
                        hasApiKey: false,
                        senderId: ''
                    },
                    email: {
                        enabled: false,
                        provider: COMMUNICATION_CONFIG.email.provider,
                        hasApiKey: false
                    },
                    mpesa: {
                        enabled: false,
                        provider: 'intasend',
                        hasSecretKey: false
                    },
                    birthdays: {
                        enabled: false,
                        template: SMS_MESSAGES.birthdayStandard('{learnerName}', '{schoolName}', '{gradeName}')
                    }
                }
            });
        }

        // Return config with masked keys
        res.status(200).json({
            success: true,
            data: {
                id: config.id,
                sms: {
                    enabled: config.smsEnabled,
                    provider: config.smsProvider,
                    baseUrl: config.smsBaseUrl,
                    senderId: config.smsSenderId,
                    hasApiKey: !!config.smsApiKey, // Boolean flag
                    // custom provider fields
                    customName: config.smsCustomName,
                    customUrl: config.smsCustomBaseUrl,
                    customAuthHeader: config.smsCustomAuthHeader,
                    hasCustomToken: !!config.smsCustomToken,
                    username: (config as any).smsUsername
                },
                email: {
                    enabled: config.emailEnabled,
                    provider: config.emailProvider,
                    fromEmail: config.emailFrom,
                    fromName: config.emailFromName,
                    hasApiKey: !!config.emailApiKey,
                    emailTemplates: config.emailTemplates
                },
                mpesa: {
                    enabled: config.mpesaEnabled,
                    provider: config.mpesaProvider,
                    publicKey: config.mpesaPublicKey,
                    businessNumber: config.mpesaBusinessNo,
                    hasSecretKey: !!config.mpesaSecretKey
                },
                birthdays: {
                    enabled: config.birthdayEnabled,
                    template: config.birthdayMessageTemplate || SMS_MESSAGES.birthdayStandard('{learnerName}', '{schoolName}', '{gradeName}')
                },
                createdAt: config.createdAt,
                updatedAt: config.updatedAt
            }
        });

    } catch (error: any) {
        console.error('Get Communication Config Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to get configuration' });
    }
};

/**
 * Save Communication Configuration
 * POST /api/communication/config
 */
export const saveCommunicationConfig = async (req: AuthRequest, res: Response) => {
    try {
        const { sms, email, mpesa, birthdays } = req.body;
        // Get schoolId from school context (set by middleware) or fallback to body
        const schoolId = (req as any).schoolContext?.schoolId || req.body.schoolId;

        if (!schoolId) {
            throw new ApiError(403, 'School context required');
        }

        // Prepare data for upsert
        const data: any = {};

        // SMS Configuration
        if (sms) {
            console.log(`[CommunicationController] SMS Config Update:`, {
                provider: sms.provider,
                hasApiKey: !!sms.apiKey,
                hasUsername: !!sms.username,
                hasSenderId: !!sms.senderId
            });

            data.smsProvider = sms.provider || 'mobilesasa';
            data.smsBaseUrl = sms.baseUrl || 'https://api.mobilesasa.com';
            data.smsEnabled = sms.enabled !== undefined ? sms.enabled : true; // Default to enabled

            // Only update Sender ID if provided
            if (sms.senderId) {
                data.smsSenderId = sms.senderId;
            }

            // Encrypt API key if provided (should never be empty/undefined)
            if (sms.apiKey && sms.apiKey.trim()) {
                console.log(`[CommunicationController] Encrypting SMS API Key for provider: ${sms.provider}`);
                data.smsApiKey = encrypt(sms.apiKey);
            } else if (!sms.apiKey) {
                // If no API key provided, don't overwrite existing one
                console.log(`[CommunicationController] No API key provided - keeping existing key`);
            }

            // Africa's Talking specific field
            if (sms.username && sms.username.trim()) {
                console.log(`[CommunicationController] Setting Africa's Talking username`);
                data.smsUsername = sms.username;
            }

            // Custom provider fields (if applicable)
            if (sms.provider === 'custom') {
                data.smsCustomName = sms.customName || null;
                data.smsCustomBaseUrl = sms.customBaseUrl || null;
                data.smsCustomAuthHeader = sms.customAuthHeader || 'Authorization';
                if (sms.customToken) {
                    data.smsCustomToken = encrypt(sms.customToken);
                }
            }
        }

        // Email Configuration
        if (email) {
            data.emailProvider = email.provider || 'resend';
            data.emailFrom = email.fromEmail || null;
            data.emailFromName = email.fromName || null;
            data.emailEnabled = email.enabled !== undefined ? email.enabled : false;

            if (email.apiKey) {
                data.emailApiKey = encrypt(email.apiKey);
            }

            // Save templates if provided
            if (email.emailTemplates) {
                data.emailTemplates = email.emailTemplates;
            }
        }

        // M-Pesa Configuration
        if (mpesa) {
            data.mpesaProvider = mpesa.provider || 'intasend';
            data.mpesaPublicKey = mpesa.publicKey || null;
            data.mpesaBusinessNo = mpesa.businessNumber || null;
            data.mpesaEnabled = mpesa.enabled !== undefined ? mpesa.enabled : false;

            if (mpesa.secretKey) {
                data.mpesaSecretKey = encrypt(mpesa.secretKey);
            }
        }

        // Birthday Configuration
        if (birthdays) {
            data.birthdayEnabled = birthdays.enabled !== undefined ? birthdays.enabled : false;
            data.birthdayMessageTemplate = birthdays.template || null;
        }

        // Upsert configuration: Global config, so we look for the first one
        const existingConfig = await prisma.communicationConfig.findFirst();
        let config;

        if (existingConfig) {
            config = await prisma.communicationConfig.update({
                where: { id: existingConfig.id },
                data
            });
        } else {
            config = await prisma.communicationConfig.create({
                data
            });
        }

        // Clear SMS config cache so changes take effect immediately
        const { SmsService } = await import('../services/sms.service');
        (SmsService as any).clearConfigCache();
        console.log(`✅ Communication config saved and cache cleared for school: ${schoolId}`);

        res.status(200).json({
            success: true,
            message: 'Configuration saved successfully',
            data: {
                id: config.id,
                updatedAt: config.updatedAt
            }
        });

    } catch (error: any) {
        console.error('Save Communication Config Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to save configuration' });
    }
};

/**
 * Send Test SMS
 * POST /api/communication/test/sms
 */
export const sendTestSms = async (req: AuthRequest, res: Response) => {
    try {
        const { phoneNumber, message, schoolId: bodySchoolId } = req.body;

        // Get schoolId from school middleware (preferred) or request body (fallback)
        let schoolId = (req as any).schoolContext?.schoolId || bodySchoolId;

        if (!schoolId) {
            console.error('❌ School ID not found in school context or request body');
            return res.status(400).json({
                success: false,
                error: 'School context required. Please ensure you are authenticated.'
            });
        }

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'phoneNumber and message are required'
            });
        }

        console.log('📞 Test SMS Request:', {
            schoolId,
            phoneNumber,
            messageLength: message.length
        });

        // Send SMS
        const result = await SmsService.sendSms(phoneNumber, message);

        if (!result.success) {
            console.error('❌ SMS send failed:', result.error);
            return res.status(400).json({
                success: false,
                error: result.error || 'Failed to send SMS'
            });
        }

        console.log('✅ SMS sent successfully:', result);
        res.status(200).json({
            success: true,
            message: 'SMS sent successfully',
            data: {
                messageId: result.messageId,
                provider: result.provider
            }
        });
    } catch (error: any) {
        console.error('❌ Send Test SMS Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send test SMS'
        });
    }
};

/**
 * Send Test Email
 * POST /api/communication/test/email
 */
export const sendTestEmail = async (req: AuthRequest, res: Response) => {
    try {
        const { email, template = 'welcome', schoolId: bodySchoolId } = req.body;
        let schoolId = (req as any).schoolContext?.schoolId || bodySchoolId;

        if (!schoolId) {
            console.error('❌ School ID not found in school context or request body');
            return res.status(400).json({
                success: false,
                error: 'School context required. Please ensure you are authenticated.'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        console.log('📧 Test Email Request:', {
            schoolId,
            email,
            template
        });

        // Fetch School Name for context
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { name: true }
        });
        const schoolName = school?.name || 'Your School';
        const adminName = req.user?.userId ? (await prisma.user.findUnique({ where: { id: req.user.userId } }))?.firstName || 'Admin' : 'Admin';

        const frontendUrl = process.env.FRONTEND_URL || 'https://zawadi-sms.up.railway.app';
        const loginUrl = `${frontendUrl}/t/${schoolId}/login`;

        // Send Email based on template selection
        if (template === 'onboarding') {
            await EmailService.sendOnboardingEmail({
                to: email,
                schoolName,
                adminName,
                loginUrl
            });
        } else {
            // Default to Welcome
            await EmailService.sendWelcomeEmail({
                to: email,
                schoolName,
                adminName,
                loginUrl
            });
        }

        console.log('✅ Test email sent successfully to:', email);
        res.status(200).json({
            success: true,
            message: `Test email (${template}) sent successfully to ${email}`,
            data: {
                provider: 'resend' // We know it's resend
            }
        });

    } catch (error: any) {
        console.error('❌ Send Test Email Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to send test email' });
    }
};

/**
 * Get Learners with Birthdays Today
 * GET /api/communication/birthdays/today/:schoolId
 */
export const getBirthdaysToday = async (req: AuthRequest, res: Response) => {
    try {
        const schoolId = (req as any).schoolContext?.schoolId;

        if (!schoolId) {
            throw new ApiError(403, 'School context required');
        }

        // Get current date MM-DD
        const now = new Date();
        const monthDay = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        // Fetch all learners for the school
        // Note: Prisma doesn't have a direct "month-day" comparison for DateTime easily without raw query
        // so we fetch and filter or use a raw query. For reliability across diff DBs, filtering is safer if count is manageable.
        const learners = await prisma.learner.findMany({
            where: { schoolId, status: 'ACTIVE' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                guardianPhone: true,
                emergencyPhone: true,
                grade: true,
                stream: true,
                admissionNumber: true
            }
        });

        const birthdaysToday = learners.filter(l => {
            if (!l.dateOfBirth) return false;
            const dob = new Date(l.dateOfBirth);
            const dobMonthDay = `${(dob.getMonth() + 1).toString().padStart(2, '0')}-${dob.getDate().toString().padStart(2, '0')}`;
            return dobMonthDay === monthDay;
        }).map(l => ({
            ...l,
            name: `${l.firstName} ${l.lastName}`,
            guardianPhone: l.guardianPhone || l.emergencyPhone
        }));

        res.status(200).json({ success: true, data: birthdaysToday });

    } catch (error: any) {
        console.error('Get Birthdays Today Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch birthdays' });
    }
};

/**
 * Send Birthday Wishes
 * POST /api/communication/birthdays/send
 */
export const sendBirthdayWishes = async (req: AuthRequest, res: Response) => {
    try {
        const { learnerIds, template, channel = 'sms' } = req.body;
        const schoolId = (req as any).schoolContext?.schoolId;

        if (!schoolId || !learnerIds || !Array.isArray(learnerIds)) {
            throw new ApiError(400, 'learnerIds array is required in a valid school context');
        }

        // Fetch school name for template
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { name: true }
        });

        const schoolName = school?.name || 'Your School';

        // Fetch learners
        const learners = await prisma.learner.findMany({
            where: {
                id: { in: learnerIds },
                schoolId
            }
        });

        const results = [];

        const calculateAge = (dob: Date) => {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            return age;
        };

        for (const learner of learners) {
            const phoneNumber = learner.guardianPhone || learner.emergencyPhone;
            if (!phoneNumber) {
                results.push({ learnerId: learner.id, success: false, error: 'No phone number' });
                continue;
            }

            const formatTitleCase = (str: string) => {
                if (!str) return '';
                return str.toLowerCase().split(/[_\s]+/).map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
            };

            const getOrdinal = (n: number) => {
                const s = ["th", "st", "nd", "rd"];
                const v = n % 100;
                return n + (s[(v - 20) % 10] || s[v] || s[0]);
            };

            const formatDate = (date: Date) => {
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
            };

            const age = calculateAge(new Date(learner.dateOfBirth));
            const ageOrdinal = getOrdinal(age);
            const bdayDate = formatDate(new Date(learner.dateOfBirth));
            const gradeName = formatTitleCase(learner.grade);
            const firstName = formatTitleCase(learner.firstName);
            const lastName = formatTitleCase(learner.lastName);
            const fullName = `${firstName} ${lastName}`;

            try {
                let result;
                if (channel === 'whatsapp') {
                    // Use premium WhatsApp birthday message if no custom template is provided
                    const finalMessage = !template
                        ? SMS_MESSAGES.birthdayPremium({
                            learnerName: firstName,
                            schoolName,
                            gradeName,
                            ageOrdinal,
                            bdayDate
                        })
                        : template
                            .replace(/{learnerName}/g, fullName)
                            .replace(/{firstName}/g, firstName)
                            .replace(/{lastName}/g, lastName)
                            .replace(/{schoolName}/g, schoolName)
                            .replace(/{grade}/g, gradeName)
                            .replace(/{age}/g, age.toString())
                            .replace(/{ageOrdinal}/g, ageOrdinal)
                            .replace(/{birthdayDate}/g, bdayDate);

                    result = await whatsappService.sendMessage({
                        to: phoneNumber,
                        message: finalMessage,
                        schoolId
                    } as any);
                } else {
                    // Use standard SMS birthday message
                    const smsMessage = template
                        ? template
                            .replace(/{learnerName}/g, fullName)
                            .replace(/{firstName}/g, firstName)
                            .replace(/{lastName}/g, lastName)
                            .replace(/{schoolName}/g, schoolName)
                            .replace(/{grade}/g, gradeName)
                            .replace(/{age}/g, age.toString())
                            .replace(/{ageOrdinal}/g, ageOrdinal)
                            .replace(/{birthdayDate}/g, bdayDate)
                        : SMS_MESSAGES.birthdayStandard(firstName, schoolName, gradeName);

                    result = await SmsService.sendSms(phoneNumber, smsMessage);
                }

                results.push({
                    learnerId: learner.id,
                    success: result.success,
                    messageId: result.messageId,
                    error: result.error
                });
            } catch (err: any) {
                results.push({ learnerId: learner.id, success: false, error: err.message });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        res.status(200).json({
            success: true,
            message: `Processed ${results.length} birthday messages. ${successCount} sent, ${failCount} failed.`,
            data: { results }
        });

    } catch (error: any) {
        console.error('Send Birthday Wishes Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to send messages' });
    }
};

/**
 * Get Broadcast Recipients
 * GET /api/communication/recipients
 */
export const getBroadcastRecipients = async (req: AuthRequest, res: Response) => {
    try {
        const { grade } = req.query;
        // Check req.user.schoolId first (standard), fallback to school context if available
        const schoolId = req.user?.schoolId || (req as any).schoolContext?.schoolId;

        if (!schoolId) {
            console.error('getBroadcastRecipients: No schoolId found in request context', { user: req.user, schoolContext: (req as any).schoolContext });
            throw new ApiError(403, 'School context required');
        }

        let whereClause: any = {
            schoolId,
            status: 'ACTIVE'
        };

        // Handle Grade Filtering
        if (grade && grade !== 'All Grades') {
            // Normalize grade input (e.g. "Grade 5" -> "GRADE_5")
            // This handles both enum values and display names if possible
            // But for safety, we'll try to match strictly or use a contains if it was a string field.
            // Since it's an enum, we need to be careful. Ideally frontend sends correct ENUM.
            // If frontend sends "Grade 5", we need to map or rely on frontend sending "GRADE_5".
            // However, the previous issue showed a mismatch.
            // Let's rely on the frontend sending the "correct" value, OR we fetch all and filter if we are unsure.
            // BUT, for "Grade 5" specifically, let's try to map it if it matches the pattern "Grade X" -> "GRADE_X"

            let targetGrade = String(grade);
            if (targetGrade.match(/^Grade \d+$/i)) {
                targetGrade = targetGrade.toUpperCase().replace(' ', '_');
            } else if (targetGrade.match(/^PP\d+$/i)) {
                targetGrade = targetGrade.toUpperCase();
            }

            // We can try to use it directly. If it fails validation, Prisma might throw.
            // To be safe against "Grade 5" vs "GRADE_5" issues, we could just fetch all active and filter in memory 
            // if the dataset isn't huge (which it isn't, ~300 students).
            // But let's try the direct query first with the normalized value.
            whereClause.grade = targetGrade;
        }

        // Fetch learners
        let learners = await prisma.learner.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                grade: true,
                guardianName: true,
                guardianPhone: true,
                fatherName: true,
                fatherPhone: true,
                fatherDeceased: true,
                motherName: true,
                motherPhone: true,
                motherDeceased: true,
                primaryContactName: true,
                primaryContactPhone: true,
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true
                    }
                }
            }
        });

        // Fallback: If 0 results and we had a specific grade, maybe the normalization failed or wasn't needed.
        // Let's try fetching ALL active students and filtering in JS if the specific query returned nothing but a grade was requested.
        // This makes it robust against Enum mismatches.
        if (learners.length === 0 && grade && grade !== 'All Grades') {
            const allLearners = await prisma.learner.findMany({
                where: { schoolId, status: 'ACTIVE' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    grade: true,
                    guardianName: true,
                    guardianPhone: true,
                    fatherName: true,
                    fatherPhone: true,
                    fatherDeceased: true,
                    motherName: true,
                    motherPhone: true,
                    motherDeceased: true,
                    primaryContactName: true,
                    primaryContactPhone: true,
                    parent: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    }
                }
            });

            const normalize = (g: string) => String(g).toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
            const target = normalize(String(grade));

            learners = allLearners.filter(l => normalize(l.grade) === target);
        }

        // Process Recipients
        const uniqueContacts = new Map();

        learners.forEach(learner => {
            // Priority: Primary -> Father -> Mother -> Guardian -> Parent Account
            let phone = learner.primaryContactPhone;
            let name = learner.primaryContactName;

            // If no explicit primary contact, check hierarchy
            if (!phone) {
                // 1. Father (if not deceased and has phone)
                if (learner.fatherPhone && !learner.fatherDeceased) {
                    phone = learner.fatherPhone;
                    name = learner.fatherName || 'Father';
                }
                // 2. Mother (if father deceased/no-phone and mother not deceased)
                else if (learner.motherPhone && !learner.motherDeceased) {
                    phone = learner.motherPhone;
                    name = learner.motherName || 'Mother';
                }
                // 3. Guardian (fallback)
                else if (learner.guardianPhone) {
                    phone = learner.guardianPhone;
                    name = learner.guardianName || 'Guardian';
                }
                // 4. Linked Parent Account (Last resort)
                else if (learner.parent?.phone) {
                    phone = learner.parent.phone;
                    name = `${learner.parent.firstName} ${learner.parent.lastName}`;
                }
            }

            if (phone) {
                // Normalize phone
                let cleanPhone = phone.replace(/\D/g, '');
                // Basic Kenya validation
                if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);
                if (cleanPhone.length === 9) cleanPhone = '254' + cleanPhone;

                if (!uniqueContacts.has(cleanPhone)) {
                    uniqueContacts.set(cleanPhone, {
                        id: learner.id, // linked learner ID (just one of them if siblings)
                        name: name || 'Parent',
                        phone: cleanPhone,
                        studentName: `${learner.firstName} ${learner.lastName}`,
                        grade: learner.grade,
                        // If multiple kids, we could list them, but simpler to just show one for now
                        // or maybe "John & Jane"
                    });
                } else {
                    // Update student name to indicate multiple?
                    const existing = uniqueContacts.get(cleanPhone);
                    if (!existing.studentName.includes(learner.firstName)) {
                        existing.studentName += `, ${learner.firstName}`;
                    }
                }
            }
        });

        const recipients = Array.from(uniqueContacts.values());

        res.status(200).json({
            success: true,
            count: recipients.length,
            data: recipients
        });

    } catch (error: any) {
        console.error('Get Broadcast Recipients Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch recipients' });
    }
};

/**
 * Get Staff Contacts
 * GET /api/communication/staff
 */
export const getStaffContacts = async (req: AuthRequest, res: Response) => {
    try {
        const schoolId = req.user?.schoolId || (req as any).schoolContext?.schoolId;

        if (!schoolId) {
            throw new ApiError(403, 'School context required');
        }

        // Fetch all staff/teachers with phone numbers
        const staff = await prisma.user.findMany({
            where: {
                schoolId,
                status: 'ACTIVE',
                phone: { not: null },
                role: {
                    in: ['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN', 'NURSE']
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                email: true
            }
        });

        // Format staff contacts
        const contacts = staff.map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            phone: s.phone,
            role: s.role,
            email: s.email,
            type: 'staff' as const
        }));

        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });

    } catch (error: any) {
        console.error('Get Staff Contacts Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch staff contacts' });
    }
};

/**
 * Create Contact Group
 * POST /api/communication/groups
 */
export const createContactGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, recipients } = req.body;
        const schoolId = req.user?.schoolId || (req as any).schoolContext?.schoolId;
        const createdById = req.user?.userId;

        if (!schoolId || !createdById) {
            throw new ApiError(403, 'School context and user authentication required');
        }

        if (!name || !recipients || !Array.isArray(recipients)) {
            throw new ApiError(400, 'Name and recipients array are required');
        }

        const group = await prisma.contactGroup.create({
            data: {
                name,
                description: description || null,
                schoolId,
                createdById,
                recipients: recipients // JSON array
            }
        });

        res.status(201).json({
            success: true,
            message: 'Contact group created successfully',
            data: group
        });

    } catch (error: any) {
        console.error('Create Contact Group Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create contact group' });
    }
};

/**
 * Get All Contact Groups
 * GET /api/communication/groups
 */
export const getContactGroups = async (req: AuthRequest, res: Response) => {
    try {
        const schoolId = req.user?.schoolId || (req as any).schoolContext?.schoolId;

        if (!schoolId) {
            throw new ApiError(403, 'School context required');
        }

        const groups = await prisma.contactGroup.findMany({
            where: { schoolId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Add recipient count to each group
        const groupsWithCount = groups.map(g => ({
            ...g,
            recipientCount: Array.isArray(g.recipients) ? (g.recipients as any[]).length : 0
        }));

        res.status(200).json({
            success: true,
            count: groups.length,
            data: groupsWithCount
        });

    } catch (error: any) {
        console.error('Get Contact Groups Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch contact groups' });
    }
};

/**
 * Get Contact Group by ID
 * GET /api/communication/groups/:id
 */
export const getContactGroupById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = req.user?.schoolId || (req as any).schoolContext?.schoolId;

        if (!schoolId) {
            throw new ApiError(403, 'School context required');
        }

        // Fallback for older frontend that might send a Grade string instead of a UUID
        if (id.startsWith('GRADE_') || id.startsWith('PP') || id === 'PLAYGROUP') {
            console.log(`[CommunicationController] Legacy frontend requested grade recipients via getContactGroupById: ${id}`);

            // Normalize grade (reusing logic from getBroadcastRecipients)
            let targetGrade = String(id);
            if (targetGrade.match(/^Grade \d+$/i)) {
                targetGrade = targetGrade.toUpperCase().replace(' ', '_');
            }

            // Fetch learners for this grade
            const learners = await prisma.learner.findMany({
                where: { schoolId, grade: targetGrade as any, status: 'ACTIVE' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    grade: true,
                    guardianPhone: true,
                    guardianName: true,
                    fatherPhone: true,
                    fatherName: true,
                    motherPhone: true,
                    motherName: true,
                    primaryContactPhone: true,
                    primaryContactName: true,
                }
            });

            // Format into the 'members' format expected by the old frontend
            const members = learners.map(l => {
                const phone = l.primaryContactPhone || l.fatherPhone || l.motherPhone || l.guardianPhone;
                const name = l.primaryContactName || l.fatherName || l.motherName || l.guardianName || 'Parent';

                let cleanPhone = phone ? phone.replace(/\D/g, '') : '';
                if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);
                if (cleanPhone.length === 9) cleanPhone = '254' + cleanPhone;

                return {
                    id: l.id,
                    name: name,
                    phone: cleanPhone,
                    studentName: `${l.firstName} ${l.lastName}`,
                    grade: l.grade
                };
            }).filter(m => m.phone);

            return res.status(200).json({
                success: true,
                data: {
                    id,
                    name: id.replace(/_/g, ' '),
                    members: members // Old frontend expects 'members'
                }
            });
        }

        const group = await prisma.contactGroup.findFirst({
            where: {
                id,
                schoolId // Ensure user can only access groups from their school
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!group) {
            throw new ApiError(404, 'Contact group not found');
        }

        res.status(200).json({
            success: true,
            data: group
        });

    } catch (error: any) {
        console.error('Get Contact Group By ID Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({ success: false, error: error.message || 'Failed to fetch contact group' });
    }
};

/**
 * Update Contact Group
 * PUT /api/communication/groups/:id
 */
export const updateContactGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, recipients } = req.body;
        const schoolId = req.user?.schoolId || (req as any).schoolContext?.schoolId;

        if (!schoolId) {
            throw new ApiError(403, 'School context required');
        }

        // Verify group exists and belongs to school
        const existing = await prisma.contactGroup.findFirst({
            where: { id, schoolId }
        });

        if (!existing) {
            throw new ApiError(404, 'Contact group not found');
        }

        // Update group
        const updated = await prisma.contactGroup.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(recipients && { recipients })
            }
        });

        res.status(200).json({
            success: true,
            message: 'Contact group updated successfully',
            data: updated
        });

    } catch (error: any) {
        console.error('Update Contact Group Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({ success: false, error: error.message || 'Failed to update contact group' });
    }
};

/**
 * Delete Contact Group
 * DELETE /api/communication/groups/:id
 */
export const deleteContactGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = req.user?.schoolId || (req as any).schoolContext?.schoolId;

        if (!schoolId) {
            throw new ApiError(403, 'School context required');
        }

        // Verify group exists and belongs to school
        const existing = await prisma.contactGroup.findFirst({
            where: { id, schoolId }
        });

        if (!existing) {
            throw new ApiError(404, 'Contact group not found');
        }

        await prisma.contactGroup.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'Contact group deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete Contact Group Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({ success: false, error: error.message || 'Failed to delete contact group' });
    }
};

