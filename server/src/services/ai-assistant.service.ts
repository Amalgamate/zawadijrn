/**
 * AI Assistant Service
 * High-level AI features for teachers and administrators.
 */

import { aiBridgeService } from './ai-bridge.service';
import { performanceService } from './performance.service';
import { performance } from 'perf_hooks';
import prisma from '../config/database';

export class AIAssistantService {
    /**
     * Generate professional teacher comments based on student performance data
     */
    async generateTeacherFeedback(learnerId: string, term: any, academicYear: number): Promise<string> {
        // 1. Fetch student performance data
        const learner = await prisma.learner.findUnique({
            where: { id: learnerId },
            select: { firstName: true, lastName: true, grade: true }
        });

        if (!learner) throw new Error('Learner not found');

        const performanceData = await performanceService.getLearnerPerformanceTrend(learnerId);

        // 2. Format data for the prompt
        const recentScores = performanceData.trend.map(t => `${t.period}: ${t.percentage}%`).join(', ');
        const status = performanceData.status;

        const prompt = `
      Generate a professional, encouraging, and constructive teacher report card comment for a student.
      
      Student Name: ${learner.firstName} ${learner.lastName}
      Grade: ${learner.grade}
      Current Term: ${term} ${academicYear}
      Performance History: ${recentScores}
      Overall Trend: ${status}
      
      Guidelines:
      - Use a professional yet warm tone.
      - Mention specific growth or areas needing attention based on the trend.
      - Keep it under 100 words.
      - Focus on CBC (Competency Based Curriculum) terminology like "Exceeding Expectations", "Meeting Expectations", etc., if appropriate.
    `;

        const response = await aiBridgeService.generateCompletion(prompt, {
            systemPrompt: "You are an expert CBC educator assisting teachers with report card comments."
        });

        return response.content;
    }

    /**
     * Predictive Analysis: Analyze if a student is at risk
     */
    async analyzeLearnerRisk(learnerId: string): Promise<string> {
        const performanceData = await performanceService.getLearnerPerformanceTrend(learnerId);

        if (performanceData.trend.length < 2) {
            return "Insufficient historical data for predictive analysis.";
        }

        const prompt = `
      Analyze the following performance trend for a student and determine if they are "at risk" of falling behind.
      Provide a brief justification and suggested interventions.
      
      Performance Data: ${JSON.stringify(performanceData.trend)}
      Current Status: ${performanceData.status}
      Recent Growth: ${performanceData.growth}%
      
      Format:
      Risk Level: [Low/Medium/High]
      Justification: ...
      Interventions: ...
    `;

        const response = await aiBridgeService.generateCompletion(prompt, {
            temperature: 0.3 // More analytical
        });

        return response.content;
    }

    /**
     * Generate CBC Pathway Prediction for Grade 7/8 students
     */
    async generatePathwayPrediction(learnerId: string, term: string, academicYear: number): Promise<any> {
        // 1. Fetch learner results for the specific term
        const results = await prisma.summativeResult.findMany({
            where: {
                learnerId,
                test: {
                    academicYear,
                    term: term as any
                }
            },
            include: {
                test: {
                    select: { learningArea: true }
                }
            }
        });

        // 2. Map subjects to clusters based on official CBC Junior School subjects
        const clusters = {
            STEM: [
                "Mathematics",
                "Integrated Science",
                "Pre-Technical Studies",
                "Agriculture and Nutrition",
                "Computer Science"
            ],
            SOCIAL: [
                "English",
                "Kiswahili",
                "Social Studies",
                "Religious Education",
                "Life Skills Education"
            ],
            ARTS: [
                "Creative Arts and Sports",
                "Music",
                "Physical Education"
            ]
        };

        const clusterScores: Record<string, number[]> = {
            STEM: [],
            SOCIAL: [],
            ARTS: []
        };

        results.forEach(r => {
            const subject = r.test.learningArea;
            // Case-insensitive/loose matching for reliability
            const findCluster = (sub: string) => {
                if (clusters.STEM.some(s => sub.includes(s) || s.includes(sub))) return 'STEM';
                if (clusters.SOCIAL.some(s => sub.includes(s) || s.includes(sub))) return 'SOCIAL';
                if (clusters.ARTS.some(s => sub.includes(s) || s.includes(sub))) return 'ARTS';
                return null;
            };

            const clusterKey = findCluster(subject);
            if (clusterKey) {
                clusterScores[clusterKey].push(r.percentage);
            }
        });

        const clusterAverages = {
            STEM: clusterScores.STEM.length > 0 ? Math.round(clusterScores.STEM.reduce((a, b) => a + b, 0) / clusterScores.STEM.length) : 0,
            SOCIAL: clusterScores.SOCIAL.length > 0 ? Math.round(clusterScores.SOCIAL.reduce((a, b) => a + b, 0) / clusterScores.SOCIAL.length) : 0,
            ARTS: clusterScores.ARTS.length > 0 ? Math.round(clusterScores.ARTS.reduce((a, b) => a + b, 0) / clusterScores.ARTS.length) : 0
        };

        // 3. Generate AI Prediction
        const prompt = `
      As a CBC Career Guidance Counselor, analyze these Junior School (Grade 7/8) performance clusters and predict the most suitable Senior School pathway.
      
      Learner Context: Grade 7/8 Student
      Term: ${term} ${academicYear}
      
      Performance Clusters (Averages):
      - STEM (Maths, Sciences, Tech): ${clusterAverages.STEM}%
      - Social Sciences (Languages, Humanities): ${clusterAverages.SOCIAL}%
      - Arts & Sports Science: ${clusterAverages.ARTS}%
      
      Instructions:
      1. Identify the primary strength cluster.
      2. Recommend one of the 3 official Senior School Pathways: STEM, Social Sciences, or Arts and Sports Science.
      3. Provide a data-driven justification.
      4. Suggest specific future career paths.
      5. Identify growth areas to solidify the choice.
      
      Required Output (JSON):
      {
        "predictedPathway": "STEM" | "Social Sciences" | "Arts and Sports Science",
        "confidence": 0-100,
        "justification": "Short professional explanation",
        "careerRecommendations": ["Career 1", "Career 2", "Career 3"],
        "growthAreas": ["Area 1", "Area 2"],
        "clusterBreakdown": {
          "STEM": ${clusterAverages.STEM},
          "Social": ${clusterAverages.SOCIAL},
          "Arts": ${clusterAverages.ARTS}
        }
      }
    `;

        try {
            const response = await aiBridgeService.generateCompletion(prompt, {
                jsonMode: true,
                systemPrompt: "You are a professional CBC career advisor. Output strictly valid JSON."
            });

            return JSON.parse(response.content);
        } catch (e) {
            console.error('Failed to generate or parse AI pathway prediction:', e);
            // Fallback if AI fails or key is missing
            const max = Math.max(clusterAverages.STEM, clusterAverages.SOCIAL, clusterAverages.ARTS);
            let pathway = "STEM";
            if (max === clusterAverages.SOCIAL) pathway = "Social Sciences";
            if (max === clusterAverages.ARTS) pathway = "Arts and Sports Science";

            return {
                predictedPathway: pathway,
                confidence: 50,
                justification: "Based on current cluster averages.",
                careerRecommendations: ["General Career Path"],
                growthAreas: ["Continue focusing on all areas"],
                clusterBreakdown: clusterAverages
            };
        }
    }
}

export const aiAssistantService = new AIAssistantService();
