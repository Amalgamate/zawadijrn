import { google } from 'googleapis';
import { ApiError } from '../utils/error.util';

export class GoogleService {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Generate Auth URL for admin to authorize
     */
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent', // Force refresh token generation
        });
    }

    /**
     * Exchange code for tokens
     */
    async setCredentials(code: string) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            return tokens;
        } catch (error) {
            console.error('Error setting credentials:', error);
            throw new ApiError(400, 'Failed to authenticate with Google');
        }
    }

    /**
     * Create Google Meet event
     */
    async createMeeting(eventData: {
        summary: string;
        description?: string;
        startTime: string; // ISO string
        endTime: string;   // ISO string
        attendees?: string[]; // email addresses
    }) {
        // Check if we have credentials set (in a real app, retrieve from DB based on school/user)
        // For now assuming env vars or global set (which isn't ideal for multi-tenant but works for single admin)

        // TODO: Retrieve stored tokens from DB for the organization

        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        try {
            const event = {
                summary: eventData.summary,
                description: eventData.description,
                start: {
                    dateTime: eventData.startTime,
                    timeZone: 'Africa/Nairobi', // Localization
                },
                end: {
                    dateTime: eventData.endTime,
                    timeZone: 'Africa/Nairobi',
                },
                conferenceData: {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7),
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet',
                        },
                    },
                },
                attendees: eventData.attendees?.map(email => ({ email })),
            };

            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                conferenceDataVersion: 1,
            });

            return {
                eventId: response.data.id,
                meetLink: response.data.hangoutLink,
                htmlLink: response.data.htmlLink,
            };
        } catch (error: any) {
            console.error('Error creating Google Meeting:', error);
            throw new ApiError(500, 'Failed to create Google Meeting: ' + error.message);
        }
    }
}

export const googleService = new GoogleService();
