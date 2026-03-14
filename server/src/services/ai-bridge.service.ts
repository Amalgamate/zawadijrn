/**
 * AI Bridge Service
 * Unified interface for AI models — supports Anthropic (Claude) and OpenAI.
 * Default provider: anthropic (Claude claude-sonnet-4-20250514)
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
        this.provider = process.env.AI_PROVIDER || 'anthropic';
        this.apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
        this.baseUrl = process.env.AI_BASE_URL || 'https://api.anthropic.com/v1';
    }

    /**
     * Send a prompt to the configured AI provider
     */
    async generateCompletion(prompt: string, options: PromptOptions = {}): Promise<AIResponse> {
        if (!this.apiKey) {
            throw new ApiError(500, 'AI API Key is not configured (set AI_API_KEY or ANTHROPIC_API_KEY in .env)');
        }

        if (this.provider === 'anthropic') {
            return await this.callAnthropic(prompt, options);
        } else if (this.provider === 'openai') {
            return await this.callOpenAI(prompt, options);
        } else {
            throw new ApiError(400, `Unsupported AI provider: ${this.provider}. Use 'anthropic' or 'openai'.`);
        }
    }

    /**
     * Anthropic Claude — primary provider
     */
    private async callAnthropic(prompt: string, options: PromptOptions): Promise<AIResponse> {
        const systemPrompt = options.systemPrompt || 'You are a helpful assistant in a School Management System.';
        // If JSON mode requested, strengthen the system prompt instruction
        const finalSystem = options.jsonMode
            ? `${systemPrompt} You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.`
            : systemPrompt;

        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    model: options.model || 'claude-sonnet-4-20250514',
                    max_tokens: options.maxTokens || 1024,
                    system: finalSystem,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    }
                }
            );

            const data = response.data;
            const content = data.content?.[0]?.text || '';

            return {
                content,
                usage: {
                    promptTokens: data.usage?.input_tokens || 0,
                    completionTokens: data.usage?.output_tokens || 0,
                    totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
                },
                provider: 'anthropic'
            };
        } catch (error: any) {
            const msg = error.response?.data?.error?.message || error.message;
            console.error('Anthropic API Error:', error.response?.data || error.message);
            throw new Error(`Anthropic API Error: ${msg}`);
        }
    }

    /**
     * OpenAI — secondary provider
     */
    private async callOpenAI(prompt: string, options: PromptOptions): Promise<AIResponse> {
        try {
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
                    response_format: options.jsonMode ? { type: 'json_object' } : undefined
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
        } catch (error: any) {
            const msg = error.response?.data?.error?.message || error.message;
            console.error('OpenAI API Error:', error.response?.data || error.message);
            throw new Error(`OpenAI API Error: ${msg}`);
        }
    }
}

export const aiBridgeService = new AIBridgeService();
