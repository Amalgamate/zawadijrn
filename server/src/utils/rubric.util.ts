/**
 * CBC Rubric Utility Functions
 * Helper functions for working with detailed 8-level CBC rubric system
 */

import { DetailedRubricRating, RubricRating } from '@prisma/client';

/**
 * Rubric Rating Points Mapping
 */
export const RUBRIC_POINTS = {
  EE1: 8,
  EE2: 7,
  ME1: 6,
  ME2: 5,
  AE1: 4,
  AE2: 3,
  BE1: 2,
  BE2: 1
} as const;

/**
 * Rubric Rating Percentage Ranges
 */
export const RUBRIC_PERCENTAGES = {
  EE1: { min: 90, max: 100, label: 'Outstanding' },
  EE2: { min: 75, max: 89, label: 'Very High' },
  ME1: { min: 58, max: 74, label: 'High Average' },
  ME2: { min: 41, max: 57, label: 'Average' },
  AE1: { min: 31, max: 40, label: 'Low Average' },
  AE2: { min: 21, max: 30, label: 'Below Average' },
  BE1: { min: 11, max: 20, label: 'Low' },
  BE2: { min: 1, max: 10, label: 'Very Low' }
} as const;

/**
 * Convert detailed rating to points
 */
export function ratingToPoints(rating: DetailedRubricRating): number {
  return RUBRIC_POINTS[rating];
}

/**
 * Convert percentage to detailed rating
 */
export function percentageToDetailedRating(percentage: number): DetailedRubricRating {
  if (percentage >= 90) return 'EE1';
  if (percentage >= 75) return 'EE2';
  if (percentage >= 58) return 'ME1';
  if (percentage >= 41) return 'ME2';
  if (percentage >= 31) return 'AE1';
  if (percentage >= 21) return 'AE2';
  if (percentage >= 11) return 'BE1';
  return 'BE2';
}

/**
 * Convert points to detailed rating
 */
export function pointsToDetailedRating(points: number): DetailedRubricRating {
  if (points >= 8) return 'EE1';
  if (points >= 7) return 'EE2';
  if (points >= 6) return 'ME1';
  if (points >= 5) return 'ME2';
  if (points >= 4) return 'AE1';
  if (points >= 3) return 'AE2';
  if (points >= 2) return 'BE1';
  return 'BE2';
}

/**
 * Convert detailed rating to general rating (4-level)
 */
export function detailedToGeneralRating(detailedRating: DetailedRubricRating): RubricRating {
  switch (detailedRating) {
    case 'EE1':
    case 'EE2':
      return 'EE';
    case 'ME1':
    case 'ME2':
      return 'ME';
    case 'AE1':
    case 'AE2':
      return 'AE';
    case 'BE1':
    case 'BE2':
      return 'BE';
  }
}

/**
 * Get percentage range for a detailed rating
 */
export function getPercentageRange(rating: DetailedRubricRating): { min: number; max: number; label: string } {
  return RUBRIC_PERCENTAGES[rating];
}

/**
 * Get average percentage for a detailed rating (midpoint)
 */
export function getAveragePercentage(rating: DetailedRubricRating): number {
  const range = RUBRIC_PERCENTAGES[rating];
  return (range.min + range.max) / 2;
}

/**
 * Calculate detailed rating from multiple assessments
 * Takes an array of percentages and returns the average detailed rating
 */
export function calculateAverageRating(percentages: number[]): {
  detailedRating: DetailedRubricRating;
  points: number;
  averagePercentage: number;
} {
  if (percentages.length === 0) {
    return {
      detailedRating: 'BE2',
      points: 1,
      averagePercentage: 0
    };
  }

  const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const detailedRating = percentageToDetailedRating(averagePercentage);
  const points = ratingToPoints(detailedRating);

  return {
    detailedRating,
    points,
    averagePercentage: Math.round(averagePercentage * 10) / 10 // Round to 1 decimal
  };
}

/**
 * Calculate detailed rating from multiple detailed ratings
 * Takes an array of detailed ratings and returns the average
 */
export function calculateAverageFromRatings(ratings: DetailedRubricRating[]): {
  detailedRating: DetailedRubricRating;
  points: number;
  averagePoints: number;
} {
  if (ratings.length === 0) {
    return {
      detailedRating: 'BE2',
      points: 1,
      averagePoints: 1
    };
  }

  const totalPoints = ratings.reduce((sum, rating) => sum + ratingToPoints(rating), 0);
  const averagePoints = totalPoints / ratings.length;
  const detailedRating = pointsToDetailedRating(Math.round(averagePoints));

  return {
    detailedRating,
    points: ratingToPoints(detailedRating),
    averagePoints: Math.round(averagePoints * 10) / 10
  };
}

/**
 * Get color for detailed rating (for UI)
 */
export function getRatingColor(rating: DetailedRubricRating): string {
  switch (rating) {
    case 'EE1':
    case 'EE2':
      return '#10b981'; // Green
    case 'ME1':
    case 'ME2':
      return '#3b82f6'; // Blue
    case 'AE1':
    case 'AE2':
      return '#f59e0b'; // Yellow/Orange
    case 'BE1':
    case 'BE2':
      return '#ef4444'; // Red
  }
}

/**
 * Get icon for detailed rating (for UI)
 */
export function getRatingIcon(rating: DetailedRubricRating): string {
  switch (rating) {
    case 'EE1':
    case 'EE2':
      return '⭐';
    case 'ME1':
    case 'ME2':
      return '✅';
    case 'AE1':
    case 'AE2':
      return '⚠️';
    case 'BE1':
    case 'BE2':
      return '❌';
  }
}

/**
 * Get descriptive text for detailed rating
 */
export function getRatingDescription(rating: DetailedRubricRating): string {
  const range = RUBRIC_PERCENTAGES[rating];
  const points = RUBRIC_POINTS[rating];
  return `${rating} (${points} points) - ${range.label} ${range.min}-${range.max}%`;
}

/**
 * Validate if percentage is valid
 */
export function isValidPercentage(percentage: number): boolean {
  return percentage >= 0 && percentage <= 100;
}

/**
 * Validate if points are valid
 */
export function isValidPoints(points: number): boolean {
  return points >= 1 && points <= 8;
}

/**
 * Format rating for display
 */
export function formatRating(rating: DetailedRubricRating): string {
  const icon = getRatingIcon(rating);
  const description = getRatingDescription(rating);
  return `${icon} ${description}`;
}

/**
 * Get all rating options (for dropdown/select)
 */
export function getAllRatingOptions(): Array<{
  value: DetailedRubricRating;
  label: string;
  points: number;
  percentage: string;
  color: string;
  icon: string;
}> {
  const ratings: DetailedRubricRating[] = ['EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2'];
  
  return ratings.map(rating => ({
    value: rating,
    label: RUBRIC_PERCENTAGES[rating].label,
    points: RUBRIC_POINTS[rating],
    percentage: `${RUBRIC_PERCENTAGES[rating].min}-${RUBRIC_PERCENTAGES[rating].max}%`,
    color: getRatingColor(rating),
    icon: getRatingIcon(rating)
  }));
}

/**
 * Calculate class average from multiple student ratings
 */
export function calculateClassAverage(studentRatings: DetailedRubricRating[]): {
  averageRating: DetailedRubricRating;
  averagePoints: number;
  distribution: Record<DetailedRubricRating, number>;
  totalStudents: number;
} {
  const distribution: Record<DetailedRubricRating, number> = {
    EE1: 0, EE2: 0, ME1: 0, ME2: 0,
    AE1: 0, AE2: 0, BE1: 0, BE2: 0
  };

  // Count distribution
  studentRatings.forEach(rating => {
    distribution[rating]++;
  });

  // Calculate average
  const { detailedRating, averagePoints } = calculateAverageFromRatings(studentRatings);

  return {
    averageRating: detailedRating,
    averagePoints,
    distribution,
    totalStudents: studentRatings.length
  };
}
