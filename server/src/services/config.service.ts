/**
 * Configuration Service
 * Manages term configurations and aggregation rules
 * Handles defaults, validation, and configuration retrieval
 */

import { PrismaClient, Term, Grade, FormativeAssessmentType, AggregationStrategy } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPE DEFINITIONS
// ============================================

interface CreateTermConfigInput {
  academicYear: number;
  term: Term;
  startDate: Date;
  endDate: Date;
  formativeWeight: number;
  summativeWeight: number;
  isActive?: boolean;
  createdBy: string;
}

interface UpdateTermConfigInput {
  startDate?: Date;
  endDate?: Date;
  formativeWeight?: number;
  summativeWeight?: number;
  isActive?: boolean;
  isClosed?: boolean;
}

interface CreateAggregationConfigInput {
  grade?: Grade;
  learningArea?: string;
  type: FormativeAssessmentType;
  strategy: AggregationStrategy;
  nValue?: number;
  weight?: number;
  createdBy: string;
}

interface UpdateAggregationConfigInput {
  strategy?: AggregationStrategy;
  nValue?: number;
  weight?: number;
}

interface StreamConfigInput {
  id?: string;
  name: string;
  active?: boolean;
}

interface UpsertClassInput {
  id?: string;
  name: string;
  grade: Grade;
  stream?: string | null;
  teacherId?: string | null;
  capacity?: number;
  room?: string | null;
  academicYear?: number;
  term?: Term;
  active?: boolean;
}

interface TermConfiguration {
  termConfig: any;
  aggregationConfigs: any[];
}

// ============================================
// CONFIG SERVICE
// ============================================

export class ConfigService {

  /**
   * Get term configuration
   * Creates default if it doesn't exist
   */
  async getTermConfig(params: {
    schoolId?: string;
    term: Term;
    academicYear: number;
  }): Promise<any> {
    const { term, academicYear } = params;

    let config = await prisma.termConfig.findUnique({
      where: {
        academicYear_term: {
          academicYear,
          term
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create default if doesn't exist
    if (!config) {
      config = await this.createDefaultTermConfig(term, academicYear);
    }

    return config;
  }

  /**
   * Create default term configuration
   */
  private async createDefaultTermConfig(
    term: Term,
    academicYear: number
  ): Promise<any> {
    // Calculate default dates based on term
    const dates = this.getDefaultTermDates(term, academicYear);

    // Find a system user or admin to assign as creator
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'HEAD_TEACHER', 'SUPER_ADMIN'] }
      }
    });

    if (!adminUser) {
      throw new Error('No admin user found to create default configuration');
    }

    return await prisma.termConfig.create({
      data: {
        academicYear,
        term,
        startDate: dates.startDate,
        endDate: dates.endDate,
        formativeWeight: 30.0,
        summativeWeight: 70.0,
        isActive: false,
        isClosed: false,
        createdBy: adminUser.id
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Get default term dates based on Kenyan school calendar
   */
  private getDefaultTermDates(term: Term, academicYear: number): {
    startDate: Date;
    endDate: Date;
  } {
    const year = academicYear;

    switch (term) {
      case 'TERM_1':
        return {
          startDate: new Date(year, 0, 5),   // Early Jan
          endDate: new Date(year, 3, 15)     // Mid April
        };
      case 'TERM_2':
        return {
          startDate: new Date(year, 4, 1),   // May
          endDate: new Date(year, 7, 15)     // Mid August
        };
      case 'TERM_3':
        return {
          startDate: new Date(year, 8, 1),   // September
          endDate: new Date(year, 10, 30)    // November
        };
      default:
        return {
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31)
        };
    }
  }

  /**
   * Create or update term configuration
   */
  async upsertTermConfig(
    data: CreateTermConfigInput
  ): Promise<any> {
    this.validateWeights(data.formativeWeight, data.summativeWeight);

    const { academicYear, term, createdBy, ...updateData } = data;

    if (data.isActive) {
      await this.deactivateOtherTerms();
    }

    return await prisma.termConfig.upsert({
      where: {
        academicYear_term: {
          academicYear,
          term
        }
      },
      update: updateData,
      create: {
        academicYear,
        term,
        ...updateData,
        createdBy
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Update existing term configuration
   */
  async updateTermConfig(
    id: string,
    data: UpdateTermConfigInput
  ): Promise<any> {
    if (data.formativeWeight !== undefined || data.summativeWeight !== undefined) {
      const config = await prisma.termConfig.findUnique({ where: { id } });
      if (!config) throw new Error('Term configuration not found');

      const formativeWeight = data.formativeWeight ?? config.formativeWeight;
      const summativeWeight = data.summativeWeight ?? config.summativeWeight;
      this.validateWeights(formativeWeight, summativeWeight);
    }

    if (data.isActive) {
      await this.deactivateOtherTerms();
    }

    return await prisma.termConfig.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  private async deactivateOtherTerms(): Promise<void> {
    await prisma.termConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
  }

  private validateWeights(formativeWeight: number, summativeWeight: number): void {
    const total = formativeWeight + summativeWeight;
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Weights must sum to 100%. Current sum: ${total}%`);
    }
  }

  async getTermConfigs(schoolId?: string): Promise<any[]> {
    return await prisma.termConfig.findMany({
      orderBy: [
        { academicYear: 'desc' },
        { term: 'desc' }
      ],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async getActiveTermConfig(schoolId?: string): Promise<any | null> {
    return await prisma.termConfig.findFirst({
      where: { isActive: true },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async getAggregationConfig(params: {
    assessmentType: FormativeAssessmentType;
    grade?: Grade;
    learningArea?: string;
  }): Promise<any> {
    const { assessmentType, grade, learningArea } = params;

    return await prisma.aggregationConfig.findFirst({
      where: {
        type: assessmentType,
        OR: [
          { grade, learningArea },
          { grade, learningArea: null },
          { grade: null, learningArea },
          { grade: null, learningArea: null }
        ]
      },
      orderBy: [
        { grade: 'desc' },
        { learningArea: 'desc' }
      ],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async getAggregationConfigs(): Promise<any[]> {
    return await prisma.aggregationConfig.findMany({
      orderBy: [
        { type: 'asc' },
        { grade: 'asc' }
      ],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async createAggregationConfig(data: CreateAggregationConfigInput): Promise<any> {
    this.validateAggregationStrategy(data.strategy, data.nValue, data.weight);
    return await prisma.aggregationConfig.create({
      data: {
        ...data,
        weight: data.weight ?? 1.0
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async updateAggregationConfig(id: string, data: UpdateAggregationConfigInput): Promise<any> {
    const existing = await prisma.aggregationConfig.findUnique({ where: { id } });
    if (!existing) throw new Error('Aggregation configuration not found');

    const strategy = data.strategy ?? existing.strategy;
    const nValue = data.nValue !== undefined ? data.nValue : existing.nValue;
    const weight = data.weight !== undefined ? data.weight : existing.weight;
    this.validateAggregationStrategy(strategy, nValue, weight);

    return await prisma.aggregationConfig.update({
      where: { id },
      data,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async deleteAggregationConfig(id: string): Promise<void> {
    await prisma.aggregationConfig.delete({ where: { id } });
  }

  async getStreamConfigs(schoolId?: string): Promise<any[]> {
    // StreamConfig is global, but accept schoolId for API consistency
    return await prisma.streamConfig.findMany({ orderBy: { name: 'asc' } });
  }

  async upsertStreamConfig(data: StreamConfigInput): Promise<any> {
    const { id, name, active } = data;
    const existing = await prisma.streamConfig.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: id ? { not: id } : undefined
      }
    });

    if (existing) throw new Error(`Stream "${name}" already exists`);

    if (id) {
      return await prisma.streamConfig.update({
        where: { id },
        data: { name, active }
      });
    } else {
      return await prisma.streamConfig.create({
        data: { name, active: active ?? true }
      });
    }
  }

  async deleteStreamConfig(id: string): Promise<void> {
    await prisma.streamConfig.delete({ where: { id } });
  }

  async getClasses(schoolId?: string): Promise<any[]> {
    return await prisma.class.findMany({
      where: schoolId ? { schoolId } : undefined,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: [
        { academicYear: 'desc' },
        { grade: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async upsertClass(data: UpsertClassInput): Promise<any> {
    const { id, ...classData } = data;
    const normalizedData = {
      ...classData,
      stream: classData.stream || null,
      academicYear: classData.academicYear || 2026,
      term: classData.term || 'TERM_1'
    };

    if (id) {
      return await prisma.class.update({
        where: { id },
        data: normalizedData,
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } }
        }
      });
    } else {
      const existing = await prisma.class.findFirst({
        where: {
          grade: normalizedData.grade,
          stream: normalizedData.stream,
          academicYear: normalizedData.academicYear,
          term: normalizedData.term
        }
      });
      if (existing) throw new Error('Class already exists for this period.');

      return await prisma.class.create({
        data: {
          classCode: `CLS-${Date.now()}`,
          ...normalizedData
        },
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } }
        }
      });
    }
  }

  async deleteClass(id: string): Promise<void> {
    const enrollmentCount = await prisma.classEnrollment.count({ where: { classId: id } });
    if (enrollmentCount > 0) throw new Error('Cannot delete class with enrolled learners.');
    await prisma.class.delete({ where: { id } });
  }

  private validateAggregationStrategy(strategy: AggregationStrategy, nValue?: number | null, weight?: number | null): void {
    if ((strategy === 'BEST_N' || strategy === 'DROP_LOWEST_N') && (!nValue || nValue <= 0)) {
      throw new Error(`Strategy ${strategy} requires a positive nValue`);
    }
  }

  async getTermConfigurations(params: { term: Term; academicYear: number }): Promise<TermConfiguration> {
    const termConfig = await this.getTermConfig(params);
    const aggregationConfigs = await this.getAggregationConfigs();
    return { termConfig, aggregationConfigs };
  }
}

export const configService = new ConfigService();
