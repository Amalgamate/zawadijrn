/**
 * Configuration Validation Middleware
 * Validates term configuration and aggregation configuration inputs
 */

import { Request, Response, NextFunction } from 'express';
import { AggregationStrategy } from '@prisma/client';

// ============================================
// TERM CONFIGURATION VALIDATION
// ============================================

/**
 * Validate term configuration input
 */
export const validateTermConfig = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { formativeWeight, summativeWeight, startDate, endDate } = req.body;

  const errors: string[] = [];

  // Validate weights exist
  if (formativeWeight === undefined || formativeWeight === null) {
    errors.push('formativeWeight is required');
  }

  if (summativeWeight === undefined || summativeWeight === null) {
    errors.push('summativeWeight is required');
  }

  // Validate weights are numbers
  if (typeof formativeWeight !== 'number') {
    errors.push('formativeWeight must be a number');
  }

  if (typeof summativeWeight !== 'number') {
    errors.push('summativeWeight must be a number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid term configuration',
        details: errors
      }
    });
  }

  // Validate weights sum to 100
  const total = Number(formativeWeight) + Number(summativeWeight);
  if (Math.abs(total - 100) > 0.01) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_WEIGHTS',
        message: `Formative and summative weights must sum to 100%. Current sum: ${total}%`,
        details: {
          formativeWeight,
          summativeWeight,
          total
        }
      }
    });
  }

  // Validate weights are non-negative
  if (formativeWeight < 0) {
    errors.push('formativeWeight cannot be negative');
  }

  if (summativeWeight < 0) {
    errors.push('summativeWeight cannot be negative');
  }

  // Validate weights don't exceed 100 individually
  if (formativeWeight > 100) {
    errors.push('formativeWeight cannot exceed 100%');
  }

  if (summativeWeight > 100) {
    errors.push('summativeWeight cannot exceed 100%');
  }

  // Validate dates if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      errors.push('startDate must be a valid date');
    }

    if (isNaN(end.getTime())) {
      errors.push('endDate must be a valid date');
    }

    if (start >= end) {
      errors.push('startDate must be before endDate');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid term configuration',
        details: errors
      }
    });
  }

  next();
};

// ============================================
// AGGREGATION CONFIGURATION VALIDATION
// ============================================

/**
 * Validate aggregation configuration input
 */
export const validateAggregationConfig = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { strategy, nValue, weight } = req.body;

  const errors: string[] = [];

  // Validate strategy exists
  if (!strategy) {
    errors.push('strategy is required');
  }

  // Validate strategy is valid enum value
  const validStrategies: AggregationStrategy[] = [
    'SIMPLE_AVERAGE',
    'BEST_N',
    'DROP_LOWEST_N',
    'WEIGHTED_AVERAGE',
    'MEDIAN'
  ];

  if (strategy && !validStrategies.includes(strategy)) {
    errors.push(`strategy must be one of: ${validStrategies.join(', ')}`);
  }

  // Strategy-specific validation
  if (strategy === 'BEST_N' || strategy === 'DROP_LOWEST_N') {
    if (nValue === undefined || nValue === null) {
      errors.push(`Strategy ${strategy} requires an 'nValue' parameter`);
    } else if (typeof nValue !== 'number') {
      errors.push('nValue must be a number');
    } else if (nValue <= 0) {
      errors.push('nValue must be a positive number');
    } else if (!Number.isInteger(nValue)) {
      errors.push('nValue must be an integer');
    }
  }

  if (strategy === 'WEIGHTED_AVERAGE') {
    // Note: Weighted average uses the weight field on individual assessments
    // No specific validation needed here, but we could add warnings
    if (nValue !== undefined && nValue !== null) {
      // Warning: nValue is ignored for weighted average
      console.warn('nValue is ignored for WEIGHTED_AVERAGE strategy');
    }
  }

  // Validate weight if provided
  if (weight !== undefined && weight !== null) {
    if (typeof weight !== 'number') {
      errors.push('weight must be a number');
    } else if (weight < 0) {
      errors.push('weight cannot be negative');
    } else if (weight > 100) {
      errors.push('weight cannot exceed 100');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid aggregation configuration',
        details: errors
      }
    });
  }

  next();
};

// ============================================
// ASSESSMENT TYPE VALIDATION
// ============================================

/**
 * Validate formative assessment type
 */
export const validateAssessmentType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Assessment type is required',
        field: 'type'
      }
    });
  }

  const validTypes = [
    'OPENER',
    'WEEKLY',
    'MONTHLY',
    'CAT',
    'MID_TERM',
    'ASSIGNMENT',
    'PROJECT',
    'PRACTICAL',
    'QUIZ',
    'OTHER'
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TYPE',
        message: `Invalid assessment type. Must be one of: ${validTypes.join(', ')}`,
        field: 'type'
      }
    });
  }

  next();
};

// ============================================
// GRADE AND TERM VALIDATION
// ============================================

/**
 * Validate grade parameter
 */
export const validateGrade = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { grade } = req.body;

  if (!grade) {
    return next(); // Grade is optional in some cases
  }

  const validGrades = [
    'CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP',
    'PP1', 'PP2',
    'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
    'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
  ];

  if (!validGrades.includes(grade)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_GRADE',
        message: `Invalid grade. Must be one of: ${validGrades.join(', ')}`,
        field: 'grade'
      }
    });
  }

  next();
};

/**
 * Validate term parameter
 */
export const validateTerm = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { term } = req.body;

  if (!term) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Term is required',
        field: 'term'
      }
    });
  }

  const validTerms = ['TERM_1', 'TERM_2', 'TERM_3'];

  if (!validTerms.includes(term)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TERM',
        message: `Invalid term. Must be one of: ${validTerms.join(', ')}`,
        field: 'term'
      }
    });
  }

  next();
};

/**
 * Validate academic year
 */
export const validateAcademicYear = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { academicYear } = req.body;

  if (!academicYear) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Academic year is required',
        field: 'academicYear'
      }
    });
  }

  const year = Number(academicYear);

  if (!Number.isInteger(year)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_YEAR',
        message: 'Academic year must be an integer',
        field: 'academicYear'
      }
    });
  }

  if (year < 2020 || year > 2100) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_YEAR',
        message: 'Academic year must be between 2020 and 2100',
        field: 'academicYear'
      }
    });
  }

  next();
};

// ============================================
// COMPOSITE VALIDATORS
// ============================================

/**
 * Validate complete term configuration request
 */
export const validateCompleteTermConfig = [
  validateTerm,
  validateAcademicYear,
  validateTermConfig
];

/**
 * Validate complete aggregation configuration request
 */
export const validateCompleteAggregationConfig = [
  validateAssessmentType,
  validateAggregationConfig,
  validateGrade
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if value is a valid percentage (0-100)
 */
export const isValidPercentage = (value: any): boolean => {
  if (typeof value !== 'number') return false;
  return value >= 0 && value <= 100;
};

/**
 * Check if value is a positive integer
 */
export const isPositiveInteger = (value: any): boolean => {
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value > 0;
};

/**
 * Sanitize and parse date
 */
export const parseDate = (dateString: any): Date | null => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  return date;
};

// ============================================
// ERROR RESPONSE HELPER
// ============================================

/**
 * Standard validation error response
 */
export const validationErrorResponse = (
  res: Response,
  message: string,
  details?: any
) => {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details
    }
  });
};

/**
 * Standard not found error response
 */
export const notFoundErrorResponse = (
  res: Response,
  resource: string,
  id?: string
) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `${resource} not found${id ? `: ${id}` : ''}`,
      resource
    }
  });
};
