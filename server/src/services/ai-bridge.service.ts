/**
 * AI Bridge Service
 * A unified interface for interacting with various AI models (OpenAI, Anthropic, etc.)
 */

import axios from 'axios';
import { ApiError } from '../utils/error.util';

export interface PromptOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    jsonMode?: boolean;
}

export interface AIResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    provider: string;
}

export class AIBridgeService {
    private provider: string;
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.provider = process.env.AI_PROVIDER || 'openai';
        this.apiKey = process.env.AI_API_KEY || '';
        this.baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    }

    /**
     * Send a prompt to the configured AI provider
     */
    async generateCompletion(prompt: string, options: PromptOptions = {}): Promise<AIResponse> {
        if (!this.apiKey) {
            throw new ApiError(500, 'AI API Key is not configured');
        }

        try {
            if (this.provider === 'openai') {
                return await this.callOpenAI(prompt, options);
            } else {
                throw new ApiError(400, `Unsupported AI provider: ${this.provider}`);
            }
        } catch (error: any) {
            console.error(`AI Bridge Error (${this.provider}):`, error.response?.data || error.message);
            throw new ApiError(502, `AI Provider Error: ${error.message}`);
        }
    }

    private async callOpenAI(prompt: string, options: PromptOptions): Promise<AIResponse> {
        const response = await axios.post(
            `${this.baseUrl}/chat/completions`,
            {
                model: options.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: options.systemPrompt || 'You are a helpful assistant in a School Management System.' },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens,
                response_format: options.jsonMode ? { type: "json_object" } : undefined
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const completion = response.data;
        return {
            content: completion.choices[0].message.content,
            usage: {
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens
            },
            provider: 'openai'
        };
    }
}

export const aiBridgeService = new AIBridgeService();
