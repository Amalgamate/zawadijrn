/**
 * WhatsApp Service using WhatsApp Web (whatsapp-web.js)
 * Handles sending WhatsApp messages through WhatsApp Web automation
 * 
 * @module services/whatsapp.service
 */

import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const SINGLE_TENANT_ID = 'default';

interface WhatsAppMessage {
  to: string; // Phone number in international format (+254...)
  message: string;
}

class WhatsAppService {
  private client: Client | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'qr_needed' | 'authenticated' | 'initializing' = 'disconnected';

  constructor() {
    // We no longer auto-initialize a global client
  }

  /**
   * Initialize WhatsApp Web client
   */
  async initialize() {
    if (this.isInitializing || this.client) {
      return;
    }

    this.isInitializing = true;
    this.connectionStatus = 'initializing';

    console.log(`[WhatsApp Service] Initializing WhatsApp Web client...`);

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: SINGLE_TENANT_ID,
          dataPath: `./.wwebjs_auth`
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-canvas-aa',
            '--disable-2d-canvas-clip-aa',
            '--disable-gl-drawing-for-tests',
            '--disable-extensions',
            '--mute-audio'
          ]
        }
      });

      // QR Code event
      this.client.on('qr', (qr) => {
        this.qrCode = qr;
        this.connectionStatus = 'qr_needed';
        console.log(`[WhatsApp Service] QR Code generated`);
      });

      // Ready event
      this.client.on('ready', () => {
        this.isReady = true;
        this.connectionStatus = 'authenticated';
        this.qrCode = null;
        console.log(`[WhatsApp Service] ✅ WhatsApp Client is ready!`);
      });

      // Authenticated event
      this.client.on('authenticated', () => {
        console.log(`[WhatsApp Service] ✅ WhatsApp authenticated successfully`);
        this.connectionStatus = 'authenticated';
      });

      // Disconnected event
      this.client.on('disconnected', (reason: any) => {
        console.log(`[WhatsApp Service] ⚠️ WhatsApp disconnected:`, reason);
        this.isReady = false;
        this.connectionStatus = 'disconnected';
        this.client = null;
        this.isInitializing = false;
      });

      // Auth failure event
      this.client.on('auth_failure', (msg: any) => {
        console.error(`[WhatsApp Service] ❌ Auth failure:`, msg);
        this.connectionStatus = 'qr_needed';
      });

      await this.client.initialize();
      this.isInitializing = false;

    } catch (error: any) {
      console.error(`[WhatsApp Service] ❌ Initialization error:`, error.message);
      this.isInitializing = false;
      this.connectionStatus = 'disconnected';
      this.client = null;
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): {
    status: 'disconnected' | 'qr_needed' | 'authenticated' | 'initializing';
    qrCode: string | null;
  } {
    return {
      status: this.connectionStatus,
      qrCode: this.qrCode
    };
  }

  /**
   * Format phone number to WhatsApp format
   */
  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/[\s\-\(\)]/g, '');
    if (formatted.startsWith('0')) formatted = '254' + formatted.substring(1);
    if (formatted.startsWith('+254')) formatted = formatted.substring(1);
    if (formatted.startsWith('+')) formatted = formatted.substring(1);
    if (!formatted.startsWith('254')) formatted = '254' + formatted;
    return `${formatted}@c.us`;
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(params: WhatsAppMessage): Promise<{
    success: boolean;
    messageId?: string;
    message: string;
    error?: string;
  }> {
    try {
      if (!this.client || !this.isReady) {
        // Trigger initialization if not already in progress
        this.initialize();
        return {
          success: false,
          message: 'WhatsApp client is not ready. Please go to settings to authenticate.',
          error: `Status: ${this.connectionStatus}`
        };
      }

      const formattedPhone = this.formatPhoneNumber(params.to);
      const sentMessage = await this.client.sendMessage(formattedPhone, params.message);

      return {
        success: true,
        messageId: sentMessage.id.id,
        message: 'WhatsApp message sent successfully'
      };

    } catch (error: any) {
      console.error(`[WhatsApp Service] ❌ Error sending message:`, error.message);
      return {
        success: false,
        message: 'Failed to send WhatsApp message',
        error: error.message
      };
    }
  }

  /**
   * Send assessment report via WhatsApp to parent
   */
  async sendAssessmentReport(data: {
    learnerId: string;
    learnerName: string;
    learnerGrade: string;
    parentPhone: string;
    parentName?: string;
    term: string;
    totalTests: number;
    averageScore?: string;
    overallGrade?: string;
    totalMarks?: number;
    maxPossibleMarks?: number;
    subjects?: Record<string, string | { score: number, grade: string }>;
    pathwayPrediction?: { predictedPathway: string, confidence: number };
    schoolName?: string;
  }): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    const { parentPhone, parentName, learnerName, learnerGrade, term, averageScore, overallGrade, subjects, pathwayPrediction } = data;

    const greeting = parentName ? `Dear *${parentName.trim()}*,` : 'Dear *Parent*,';
    const schoolNameHeader = data.schoolName ? `*${data.schoolName.toUpperCase()}*` : '*SCHOOL REPORT*';

    const LEARNING_AREA_MAP: Record<string, string> = {
      'MATHEMATICS': 'MAT', 'ENGLISH': 'ENG', 'KISWAHILI': 'KIS',
      'SCIENCE AND TECHNOLOGY': 'SCITECH', 'SOCIAL STUDIES': 'SST',
      'CHRISTIAN RELIGIOUS EDUCATION': 'CRE', 'ISLAMIC RELIGIOUS EDUCATION': 'IRE',
      'CREATIVE ARTS AND SPORTS': 'CREATIVE', 'AGRICULTURE AND NUTRITION': 'AGRNT',
      'ENVIRONMENTAL ACTIVITIES': 'ENV', 'MATHEMATICAL ACTIVITIES': 'MAT',
      'ENGLISH LANGUAGE ACTIVITIES': 'ENG', 'KISWAHILI LANGUAGE ACTIVITIES': 'KIS',
      'RELIGIOUS EDUCATION': 'RE'
    };

    let subjectsSummary = '';
    if (subjects && Object.keys(subjects).length > 0) {
      const tableHeader = `SUBJECT   |  SCR |  GRD`;
      const separator = `----------|-----|----`;

      const subRows = Object.entries(subjects).map(([name, detail]) => {
        const upper = name.toUpperCase().trim();
        const code = LEARNING_AREA_MAP[upper] || (name.length > 10 ? name.substring(0, 10).toUpperCase() : name.toUpperCase());
        const displayCode = code.padEnd(10).slice(0, 10);

        let scoreStr = '';
        let gradeStr = '';

        if (typeof detail === 'string') {
          scoreStr = ' - '.padStart(5);
          gradeStr = detail.padStart(5);
        } else {
          scoreStr = Math.round(detail.score).toString().padStart(5);
          gradeStr = detail.grade.replace(/\d+/g, '').padStart(5);
        }

        return `${displayCode}|${scoreStr} |${gradeStr}`;
      });

      const avgLabel = "AVERAGE".padEnd(10);
      const avgScore = (averageScore + "%").padStart(6);
      const avgGrade = (overallGrade || '').replace(/\d+/g, '').padStart(4);
      const avgRow = `${avgLabel}|${avgScore}|${avgGrade}`;

      subjectsSummary = `\n\`\`\`\n${tableHeader}\n${separator}\n${subRows.join('\n')}\n${separator}\n${avgRow}\n\`\`\``;
    }

    const pathwaySnippet = pathwayPrediction ? `\n*AI Pathway Insight:* ${pathwayPrediction.predictedPathway} (${pathwayPrediction.confidence}% confidence)\n` : '';

    const message = `${schoolNameHeader}\n` +
      `Official Assessment Report\n\n` +
      `${greeting}\n` +
      `Here is the assessment summary for\n` +
      `*${learnerName}* for *${term}*:\n` +
      `${subjectsSummary}\n` +
      `${pathwaySnippet}\n` +
      `*Total Marks:* ${data.totalMarks || 'N/A'} / ${data.maxPossibleMarks || 'N/A'}\n` +
      `*Overall Status:* ${overallGrade?.replace(/\d+/g, '') || 'N/A'}\n\n` +
      `_Generated on ${new Date().toLocaleDateString()}_`;

    return await this.sendMessage({
      to: parentPhone,
      message
    });
  }

  /**
   * Send assessment notification to parent
   */
  async sendAssessmentNotification(params: {
    parentPhone: string;
    parentName: string;
    learnerName: string;
    assessmentType: string;
    subject?: string;
    grade?: string;
    term?: string;
  }): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    const { parentPhone, parentName, learnerName, assessmentType, subject, grade, term } = params;

    let message = `Dear ${parentName},\n\n`;
    message += `${assessmentType} assessment has been completed for ${learnerName}`;
    if (subject) message += ` in ${subject}`;
    if (grade) message += `.\n\nGrade: ${grade}`;
    if (term) message += `\nTerm: ${term}`;
    message += `\n\nYou can view the full report in the parent portal.`;
    message += `\n\n_This is an automated notification._`;

    return await this.sendMessage({
      to: parentPhone,
      message
    });
  }

  /**
   * Send bulk assessment notifications with batching
   */
  async sendBulkAssessmentNotifications(notifications: Array<any>): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    message: string;
  }> {
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const result = await this.sendAssessmentNotification({ ...notification });
        if (result.success) sent++;
        else failed++;
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (error) {
        failed++;
      }
    }

    return {
      success: sent > 0,
      sent,
      failed,
      message: `Sent ${sent} messages, ${failed} failed`
    };
  }

  /**
   * Send custom message to parent
   */
  async sendCustomMessage(params: {
    parentPhone: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    return await this.sendMessage({
      to: params.parentPhone,
      message: params.message
    });
  }

  /**
   * Send fee reminder to parent
   */
  async sendFeeReminder(params: {
    parentPhone: string;
    parentName: string;
    learnerName: string;
    amountDue: number;
    dueDate: string;
  }): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    const message = `Dear *${params.parentName}*,\n\n` +
      `This is a friendly reminder regarding school fees for *${params.learnerName}*.\n\n` +
      `*Amount Due:* KES ${params.amountDue.toLocaleString()}\n` +
      `*Due Date:* ${params.dueDate}\n\n` +
      `Please make payment at your earliest convenience.\n\n` +
      `For any queries, contact the school administration.\n\n` +
      `_This is an automated reminder._`;

    return await this.sendMessage({
      to: params.parentPhone,
      message
    });
  }

  /**
   * Send general announcement to parent
   */
  async sendAnnouncement(params: {
    parentPhone: string;
    parentName: string;
    title: string;
    content: string;
  }): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    const message = `Dear *${params.parentName}*,\n\n` +
      `*${params.title}*\n\n` +
      `${params.content}\n\n` +
      `Regards,\nSchool Administration`;

    return await this.sendMessage({
      to: params.parentPhone,
      message
    });
  }
}

export const whatsappService = new WhatsAppService();
