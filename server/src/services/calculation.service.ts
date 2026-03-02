/**
 * Calculation Service
 * Handles all score calculations using configured weights and aggregation rules
 * Implements various aggregation strategies for formative assessments in a single-tenant environment
 */

import { PrismaClient, FormativeAssessment, AggregationStrategy, FormativeAssessmentType, Term, Grade } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPE DEFINITIONS
// ============================================

interface AggregationConfig {
  strategy: AggregationStrategy;
  nValue?: number | null;
  weight?: number;
}

interface FormativeScoreBreakdown {
  assessmentType: FormativeAssessmentType;
  count: number;
  averageScore: number;
  averagePercentage: number;
  weight: number;
}

interface OverallFormativeScore {
  averagePercentage: number;
  breakdown: FormativeScoreBreakdown[];
  totalAssessments: number;
  strategy: string;
}

interface FinalScoreResult {
  finalScore: number;
  finalPercentage: number;
  formativeContribution: number;
  summativeContribution: number;
  formativeWeight: number;
  summativeWeight: number;
  formativeScore: number;
  summativeScore: number;
}

// ============================================
// CALCULATION SERVICE
// ============================================

export class CalculationService {

  /**
   * Calculate formative average using configured aggregation strategy
   */
  async calculateFormativeAverage(
    assessments: FormativeAssessment[],
    config: AggregationConfig
  ): Promise<number> {
    if (!assessments || assessments.length === 0) {
      return 0;
    }

    const percentages = assessments
      .map(a => a.percentage)
      .filter((p): p is number => p !== null);

    if (percentages.length === 0) {
      return 0;
    }

    switch (config.strategy) {
      case 'SIMPLE_AVERAGE':
        return this.simpleAverage(percentages);
      case 'BEST_N':
        return this.bestN(percentages, config.nValue || 3);
      case 'DROP_LOWEST_N':
        return this.dropLowestN(percentages, config.nValue || 1);
      case 'WEIGHTED_AVERAGE':
        return this.weightedAverage(assessments);
      case 'MEDIAN':
        return this.median(percentages);
      default:
        return this.simpleAverage(percentages);
    }
  }

  private simpleAverage(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 100) / 100;
  }

  private bestN(scores: number[], n: number): number {
    if (scores.length === 0) return 0;
    if (n >= scores.length) return this.simpleAverage(scores);
    const sorted = [...scores].sort((a, b) => b - a);
    const bestScores = sorted.slice(0, n);
    return this.simpleAverage(bestScores);
  }

  private dropLowestN(scores: number[], n: number): number {
    if (scores.length === 0) return 0;
    if (n >= scores.length) return 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const afterDrop = sorted.slice(n);
    return this.simpleAverage(afterDrop);
  }

  private weightedAverage(assessments: FormativeAssessment[]): number {
    const validAssessments = assessments.filter(a => a.percentage !== null);
    if (validAssessments.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const assessment of validAssessments) {
      const weight = assessment.weight || 1.0;
      const percentage = assessment.percentage || 0;
      totalWeightedScore += percentage * weight;
      totalWeight += weight;
    }

    return totalWeight === 0 ? 0 : Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }

  private median(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Calculate overall formative score for a learner
   */
  async calculateOverallFormativeScore(params: {
    learnerId: string;
    classId: string;
    term: Term;
    academicYear: number;
  }): Promise<OverallFormativeScore> {
    const { learnerId, term, academicYear } = params;

    const assessments = await prisma.formativeAssessment.findMany({
      where: { learnerId, term, academicYear }
    });

    if (assessments.length === 0) {
      return { averagePercentage: 0, breakdown: [], totalAssessments: 0, strategy: 'NONE' };
    }

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      select: { grade: true }
    });

    if (!learner) throw new Error('Learner not found');

    const assessmentsByType = this.groupByType(assessments);
    const breakdown: FormativeScoreBreakdown[] = [];

    for (const [type, typeAssessments] of Object.entries(assessmentsByType)) {
      const assessmentType = type as FormativeAssessmentType;
      const config = await this.getAggregationConfig(assessmentType, learner.grade);
      const typeAverage = await this.calculateFormativeAverage(typeAssessments, config);

      breakdown.push({
        assessmentType,
        count: typeAssessments.length,
        averageScore: typeAverage,
        averagePercentage: typeAverage,
        weight: config.weight || 1.0
      });
    }

    return {
      averagePercentage: this.calculateWeightedTypeAverage(breakdown),
      breakdown,
      totalAssessments: assessments.length,
      strategy: 'MULTI_TYPE_WEIGHTED'
    };
  }

  private groupByType(assessments: FormativeAssessment[]): Record<string, FormativeAssessment[]> {
    return assessments.reduce((acc, assessment) => {
      const type = assessment.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(assessment);
      return acc;
    }, {} as Record<string, FormativeAssessment[]>);
  }

  private calculateWeightedTypeAverage(breakdown: FormativeScoreBreakdown[]): number {
    if (breakdown.length === 0) return 0;
    let totalWeightedScore = 0, totalWeight = 0;
    for (const item of breakdown) {
      totalWeightedScore += item.averagePercentage * item.weight;
      totalWeight += item.weight;
    }
    return totalWeight === 0 ? 0 : Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }

  /**
   * Get aggregation configuration
   */
  private async getAggregationConfig(
    assessmentType: FormativeAssessmentType,
    grade?: Grade
  ): Promise<AggregationConfig> {
    const config = await prisma.aggregationConfig.findFirst({
      where: {
        type: assessmentType,
        OR: [{ grade: grade }, { grade: null }]
      },
      orderBy: { grade: 'desc' }
    });

    if (config) {
      return { strategy: config.strategy, nValue: config.nValue, weight: config.weight };
    }

    return { strategy: 'SIMPLE_AVERAGE', nValue: null, weight: 1.0 };
  }

  /**
   * Calculate final weighted score
   */
  async calculateFinalScore(params: {
    learnerId: string;
    classId: string;
    term: Term;
    academicYear: number;
    formativeScore: number;
    summativeScore: number;
  }): Promise<FinalScoreResult> {
    const { term, academicYear, formativeScore, summativeScore } = params;

    const termConfig = await this.getTermConfig(term, academicYear);
    const formativeContribution = (formativeScore * termConfig.formativeWeight) / 100;
    const summativeContribution = (summativeScore * termConfig.summativeWeight) / 100;
    const finalScore = formativeContribution + summativeContribution;

    return {
      finalScore: Math.round(finalScore * 100) / 100,
      finalPercentage: Math.round(finalScore * 100) / 100,
      formativeContribution: Math.round(formativeContribution * 100) / 100,
      summativeContribution: Math.round(summativeContribution * 100) / 100,
      formativeWeight: termConfig.formativeWeight,
      summativeWeight: termConfig.summativeWeight,
      formativeScore,
      summativeScore
    };
  }

  /**
   * Get term configuration
   */
  private async getTermConfig(
    term: Term,
    academicYear: number
  ): Promise<{ formativeWeight: number; summativeWeight: number }> {
    const config = await prisma.termConfig.findFirst({
      where: { academicYear, term }
    });

    if (config) {
      return { formativeWeight: config.formativeWeight, summativeWeight: config.summativeWeight };
    }

    return { formativeWeight: 40.0, summativeWeight: 60.0 };
  }

  /**
   * Recalculate class scores
   */
  async recalculateClassScores(params: {
    classId: string;
    term: Term;
    academicYear: number;
  }): Promise<{ updated: number; errors: string[] }> {
    const { classId, term, academicYear } = params;

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId, active: true },
      include: { learner: true }
    });

    let updated = 0;
    const errors: string[] = [];

    for (const enrollment of enrollments) {
      try {
        const formativeResult = await this.calculateOverallFormativeScore({
          learnerId: enrollment.learnerId,
          classId,
          term,
          academicYear
        });

        const summativeResults = await prisma.summativeResult.findMany({
          where: {
            learnerId: enrollment.learnerId,
            test: { term, academicYear }
          }
        });

        const summativeScore = summativeResults.length > 0
          ? summativeResults.reduce((sum, r) => sum + r.percentage, 0) / summativeResults.length
          : 0;

        await this.calculateFinalScore({
          learnerId: enrollment.learnerId,
          classId,
          term,
          academicYear,
          formativeScore: formativeResult.averagePercentage,
          summativeScore
        });

        updated++;
      } catch (error) {
        errors.push(`Failed for learner ${enrollment.learner.admissionNumber}: ${error}`);
      }
    }

    return { updated, errors };
  }

  /**
   * Get calculation summary
   */
  async getCalculationSummary(params: {
    learnerId: string;
    classId: string;
    term: Term;
    academicYear: number;
  }): Promise<{
    formative: OverallFormativeScore;
    summative: { averagePercentage: number; testCount: number };
    final: FinalScoreResult;
  }> {
    const { learnerId, classId, term, academicYear } = params;

    const formativeResult = await this.calculateOverallFormativeScore({ learnerId, classId, term, academicYear });

    const summativeResults = await prisma.summativeResult.findMany({
      where: {
        learnerId,
        test: { term, academicYear }
      }
    });

    const summativeAverage = summativeResults.length > 0
      ? summativeResults.reduce((sum, r) => sum + r.percentage, 0) / summativeResults.length
      : 0;

    const finalScore = await this.calculateFinalScore({
      learnerId,
      classId,
      term,
      academicYear,
      formativeScore: formativeResult.averagePercentage,
      summativeScore: summativeAverage
    });

    return {
      formative: formativeResult,
      summative: {
        averagePercentage: Math.round(summativeAverage * 100) / 100,
        testCount: summativeResults.length
      },
      final: finalScore
    };
  }

  validateAggregationConfig(config: AggregationConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if ((config.strategy === 'BEST_N' || config.strategy === 'DROP_LOWEST_N') && (!config.nValue || config.nValue <= 0)) {
      errors.push(`Strategy ${config.strategy} requires a positive nValue`);
    }
    if (config.weight !== undefined && config.weight < 0) errors.push('Weight cannot be negative');
    return { valid: errors.length === 0, errors };
  }

  getAvailableStrategies(): Array<{ strategy: AggregationStrategy; name: string; description: string; requiresNValue: boolean; }> {
    return [
      { strategy: 'SIMPLE_AVERAGE', name: 'Simple Average', description: 'Average all assessment scores equally', requiresNValue: false },
      { strategy: 'BEST_N', name: 'Best N', description: 'Take the best N scores', requiresNValue: true },
      { strategy: 'DROP_LOWEST_N', name: 'Drop Lowest N', description: 'Drop N lowest scores', requiresNValue: true },
      { strategy: 'WEIGHTED_AVERAGE', name: 'Weighted Average', description: 'Weight each assessment based on its weight field', requiresNValue: false },
      { strategy: 'MEDIAN', name: 'Median', description: 'Use the middle value instead of average', requiresNValue: false }
    ];
  }
}

export const calculationService = new CalculationService();
