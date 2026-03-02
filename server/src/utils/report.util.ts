/**
 * Report Utility Functions
 * Helper functions for report generation, formatting, and calculations
 */

import { DetailedRubricRating, SummativeGrade } from '@prisma/client';
import * as rubricUtil from './rubric.util';

// ============================================
// GRADE & PERFORMANCE CALCULATIONS
// ============================================

/**
 * Convert summative grade to percentage (midpoint)
 */
export function gradeToPercentage(grade: SummativeGrade): number {
  switch (grade) {
    case 'A': return 90;
    case 'B': return 70;
    case 'C': return 55;
    case 'D': return 45;
    case 'E': return 30;
    default: return 0;
  }
}

/**
 * Get grade color for UI
 */
export function getGradeColor(grade: SummativeGrade): string {
  switch (grade) {
    case 'A': return '#10b981'; // Green
    case 'B': return '#3b82f6'; // Blue
    case 'C': return '#f59e0b'; // Orange
    case 'D': return '#ef4444'; // Red
    case 'E': return '#991b1b'; // Dark Red
    default: return '#6b7280'; // Gray
  }
}

/**
 * Get performance message based on percentage
 */
export function getPerformanceMessage(percentage: number): string {
  if (percentage >= 90) return 'Outstanding performance! Excellent work.';
  if (percentage >= 80) return 'Excellent performance! Keep it up.';
  if (percentage >= 70) return 'Very good performance. Continue working hard.';
  if (percentage >= 60) return 'Good performance. Focus on improvement areas.';
  if (percentage >= 50) return 'Fair performance. More effort needed.';
  if (percentage >= 40) return 'Below average. Significant improvement required.';
  return 'Needs urgent attention and support.';
}

/**
 * Calculate weighted average (for combining different assessment types)
 */
export function calculateWeightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length) {
    throw new Error('Values and weights arrays must have same length');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce((sum, val, idx) => {
    return sum + (val * weights[idx]);
  }, 0);

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

// ============================================
// RANKING & COMPARISON
// ============================================

/**
 * Calculate percentile rank
 */
export function calculatePercentile(
  studentScore: number,
  allScores: number[]
): number {
  if (allScores.length === 0) return 0;

  const belowCount = allScores.filter(score => score < studentScore).length;
  const percentile = (belowCount / allScores.length) * 100;

  return Math.round(percentile);
}

/**
 * Get rank position from score among all scores
 */
export function getRankPosition(
  studentScore: number,
  allScores: number[]
): { position: number; outOf: number } {
  const sortedScores = [...allScores].sort((a, b) => b - a);
  const position = sortedScores.findIndex(score => score === studentScore) + 1;

  return {
    position,
    outOf: allScores.length
  };
}

/**
 * Calculate class position suffix (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
}

// ============================================
// STATISTICAL FUNCTIONS
// ============================================

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/**
 * Find median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Calculate mode (most frequent value)
 */
export function calculateMode(values: number[]): number[] {
  if (values.length === 0) return [];

  const frequency = new Map<number, number>();
  values.forEach(val => {
    frequency.set(val, (frequency.get(val) || 0) + 1);
  });

  const maxFreq = Math.max(...Array.from(frequency.values()));
  const modes = Array.from(frequency.entries())
    .filter(([, freq]) => freq === maxFreq)
    .map(([val]) => val);

  return modes;
}

/**
 * Calculate quartiles (Q1, Q2/Median, Q3)
 */
export function calculateQuartiles(values: number[]): {
  q1: number;
  q2: number;
  q3: number;
} {
  if (values.length === 0) {
    return { q1: 0, q2: 0, q3: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  const q2 = calculateMedian(sorted);
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);

  const q1 = calculateMedian(lowerHalf);
  const q3 = calculateMedian(upperHalf);

  return { q1, q2, q3 };
}

// ============================================
// TREND ANALYSIS
// ============================================

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(
  previousValue: number,
  currentValue: number
): { rate: number; direction: 'up' | 'down' | 'stable' } {
  if (previousValue === 0) {
    return { rate: 0, direction: 'stable' };
  }

  const rate = Math.round(((currentValue - previousValue) / previousValue) * 100);

  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (rate > 2) direction = 'up';
  else if (rate < -2) direction = 'down';

  return { rate, direction };
}

/**
 * Calculate trend (improving, declining, stable)
 */
export function calculateTrend(values: number[]): {
  trend: 'improving' | 'declining' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
} {
  if (values.length < 2) {
    return { trend: 'stable', strength: 'weak' };
  }

  // Simple linear regression slope
  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = values.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (values[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  // Determine trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (slope > 1) trend = 'improving';
  else if (slope < -1) trend = 'declining';

  // Determine strength
  const absSlope = Math.abs(slope);
  let strength: 'strong' | 'moderate' | 'weak' = 'weak';
  if (absSlope > 5) strength = 'strong';
  else if (absSlope > 2) strength = 'moderate';

  return { trend, strength };
}

// ============================================
// DATA FORMATTING
// ============================================

/**
 * Format date for reports (e.g., "23rd January, 2026")
 */
export function formatReportDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();

  return `${getOrdinalSuffix(day)} ${month}, ${year}`;
}

/**
 * Format term name (TERM_1 -> Term 1)
 */
export function formatTermName(term: string): string {
  return term.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format learner name (First Middle Last)
 */
export function formatLearnerName(
  firstName: string,
  middleName: string | null,
  lastName: string
): string {
  const parts = [firstName];
  if (middleName) parts.push(middleName);
  parts.push(lastName);
  return parts.join(' ');
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================
// PERFORMANCE CATEGORIZATION
// ============================================

/**
 * Categorize learner performance level
 */
export function categorizePerformance(percentage: number): {
  level: string;
  description: string;
  color: string;
  emoji: string;
} {
  if (percentage >= 90) {
    return {
      level: 'Outstanding',
      description: 'Exceptional mastery of concepts',
      color: '#10b981',
      emoji: '🌟'
    };
  }
  if (percentage >= 80) {
    return {
      level: 'Excellent',
      description: 'Strong understanding and application',
      color: '#059669',
      emoji: '⭐'
    };
  }
  if (percentage >= 70) {
    return {
      level: 'Very Good',
      description: 'Good grasp of core concepts',
      color: '#3b82f6',
      emoji: '✅'
    };
  }
  if (percentage >= 60) {
    return {
      level: 'Good',
      description: 'Satisfactory understanding',
      color: '#0ea5e9',
      emoji: '👍'
    };
  }
  if (percentage >= 50) {
    return {
      level: 'Fair',
      description: 'Basic understanding achieved',
      color: '#f59e0b',
      emoji: '⚠️'
    };
  }
  if (percentage >= 40) {
    return {
      level: 'Below Average',
      description: 'Needs additional support',
      color: '#ef4444',
      emoji: '⚡'
    };
  }
  return {
    level: 'Needs Improvement',
    description: 'Requires significant intervention',
    color: '#991b1b',
    emoji: '🔔'
  };
}

/**
 * Get subject strength/weakness label
 */
export function getSubjectStatus(percentage: number): {
  status: 'strength' | 'neutral' | 'weakness';
  label: string;
} {
  if (percentage >= 70) {
    return { status: 'strength', label: 'Strength' };
  }
  if (percentage >= 50) {
    return { status: 'neutral', label: 'Moderate' };
  }
  return { status: 'weakness', label: 'Needs Focus' };
}

// ============================================
// RECOMMENDATION GENERATION
// ============================================

/**
 * Generate subject-specific recommendations
 */
export function generateSubjectRecommendations(
  subject: string,
  percentage: number,
  trend?: 'improving' | 'declining' | 'stable'
): string[] {
  const recommendations: string[] = [];

  // Performance-based recommendations
  if (percentage >= 80) {
    recommendations.push(`Excellent work in ${subject}. Consider advanced challenges.`);
  } else if (percentage >= 60) {
    recommendations.push(`Good progress in ${subject}. Focus on consistent improvement.`);
  } else if (percentage >= 50) {
    recommendations.push(`${subject} requires more attention. Regular practice recommended.`);
  } else {
    recommendations.push(`${subject} needs urgent intervention. Extra classes recommended.`);
  }

  // Trend-based recommendations
  if (trend === 'declining') {
    recommendations.push(`Recent decline in ${subject} performance. Identify and address gaps.`);
  } else if (trend === 'improving') {
    recommendations.push(`Positive trend in ${subject}. Maintain the momentum!`);
  }

  return recommendations;
}

/**
 * Generate overall recommendations based on complete performance
 */
export function generateOverallRecommendations(params: {
  academicAverage: number;
  attendanceRate: number;
  strengths: string[];
  weaknesses: string[];
  trend?: 'improving' | 'declining' | 'stable';
}): string[] {
  const { academicAverage, attendanceRate, strengths, weaknesses, trend } = params;
  const recommendations: string[] = [];

  // Academic recommendations
  if (academicAverage >= 75) {
    recommendations.push('Maintain excellent academic performance through consistent study habits.');
  } else if (academicAverage >= 60) {
    recommendations.push('Build on current academic foundation with targeted practice.');
  } else {
    recommendations.push('Academic performance needs improvement. Create structured study plan.');
  }

  // Attendance recommendations
  if (attendanceRate < 90) {
    recommendations.push('Improve attendance for better academic outcomes.');
  }

  // Strength-based recommendations
  if (strengths.length > 0) {
    recommendations.push(`Leverage strengths in ${strengths.join(', ')} to boost confidence.`);
  }

  // Weakness-based recommendations
  if (weaknesses.length > 0) {
    recommendations.push(`Prioritize improvement in ${weaknesses.join(', ')} through extra practice.`);
  }

  // Trend-based recommendations
  if (trend === 'improving') {
    recommendations.push('Positive learning trajectory. Continue current study methods.');
  } else if (trend === 'declining') {
    recommendations.push('Address declining performance through parent-teacher consultation.');
  }

  return recommendations;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate report data completeness
 */
export function validateReportCompleteness(data: {
  hasFormative: boolean;
  hasSummative: boolean;
  hasCompetencies: boolean;
  hasValues: boolean;
  hasAttendance: boolean;
}): {
  isComplete: boolean;
  missingComponents: string[];
  completionPercentage: number;
} {
  const components = [
    { name: 'Formative Assessments', has: data.hasFormative },
    { name: 'Summative Tests', has: data.hasSummative },
    { name: 'Core Competencies', has: data.hasCompetencies },
    { name: 'Values Assessment', has: data.hasValues },
    { name: 'Attendance Records', has: data.hasAttendance }
  ];

  const missingComponents = components
    .filter(c => !c.has)
    .map(c => c.name);

  const completionPercentage = Math.round(
    (components.filter(c => c.has).length / components.length) * 100
  );

  return {
    isComplete: missingComponents.length === 0,
    missingComponents,
    completionPercentage
  };
}

/**
 * Check if report is ready for publication
 */
export function isReportReadyForPublication(data: {
  hasFormative: boolean;
  hasSummative: boolean;
  hasTeacherComment: boolean;
}): { ready: boolean; reason?: string } {
  if (!data.hasFormative && !data.hasSummative) {
    return {
      ready: false,
      reason: 'At least one type of academic assessment required'
    };
  }

  if (!data.hasTeacherComment) {
    return {
      ready: false,
      reason: 'Class teacher comment required'
    };
  }

  return { ready: true };
}
