import { feeAPI, assessmentAPI, learnerAPI, configAPI } from './api';

/**
 * PopulatorService
 * Utility to seed test data for fees and assessments
 */
export const PopulatorService = {
  /**
   * Populate system with fee types, structures, and learner invoices
   */
  async populateFees() {
    console.log('Starting Fee Population...');
    const results = {
      types: null,
      structures: null,
      invoices: null
    };

    try {
      // 1. Seed Default Fee Types
      console.log('Seeding Fee Types...');
      results.types = await feeAPI.seedDefaultFeeTypes();

      // 2. Seed Default Fee Structures
      console.log('Seeding Fee Structures...');
      results.structures = await feeAPI.seedDefaultFeeStructures();

      // 3. Bulk Generate Invoices for all learners
      // We'll generate for current year and TERM_1 by default
      const currentYear = new Date().getFullYear();
      console.log(`Generating Invoices for ${currentYear} TERM_1...`);
      results.invoices = await feeAPI.bulkGenerateInvoices({
        academicYear: currentYear,
        term: 'TERM_1',
        allLearners: true
      });

      return { success: true, data: results };
    } catch (error) {
      console.error('Fee Population Error:', error);
      throw error;
    }
  },

  /**
   * Populate system with summative tests and scores for all learners
   */
  async populateAssessments(schoolId) {
    console.log('Starting Assessment Population...');
    const results = {
      testsCreated: 0,
      scoresRecorded: 0
    };

    try {
      const currentYear = new Date().getFullYear();
      const currentTerm = 'TERM_1';

      // 1. Get all learning areas
      const areasRes = await configAPI.getLearningAreas(schoolId);
      const areas = areasRes?.data || areasRes || [];
      if (areas.length === 0) {
        throw new Error('No learning areas found. Please seed learning areas first.');
      }

      // 2. Get all learners
      const learnersRes = await learnerAPI.getAll({ status: 'ACTIVE', limit: 1000 });
      const learners = learnersRes?.data || learnersRes || [];
      if (learners.length === 0) {
        throw new Error('No active learners found for scoring.');
      }

      // Group learners by grade to create appropriate tests
      const learnersByGrade = learners.reduce((acc, l) => {
        if (!acc[l.grade]) acc[l.grade] = [];
        acc[l.grade].push(l);
        return acc;
      }, {});

      const grades = Object.keys(learnersByGrade);

      for (const grade of grades) {
        console.log(`Processing Grade: ${grade}`);
        const gradeLearners = learnersByGrade[grade];
        
        // For each learning area, ensure a test exists
        for (const area of areas) {
          // Determine if area applies to this grade (simplified check)
          // You might want a more sophisticated check here
          const testTitle = `${area.name} - Continuous Assessment`;
          
          const testData = {
            title: testTitle,
            learningArea: area.name,
            grade: grade,
            term: currentTerm,
            academicYear: currentYear,
            totalMarks: 50,
            passingMarks: 25,
            testDate: new Date().toISOString().split('T')[0],
            status: 'PUBLISHED'
          };

          const testRes = await assessmentAPI.createTest(testData);
          const testId = testRes?.data?.id || testRes?.id;
          
          if (testId) {
            results.testsCreated++;
            
            // Record random scores for all learners in this grade
            const scores = gradeLearners.map(l => ({
              learnerId: l.id,
              marksObtained: Math.floor(Math.random() * 30) + 15 // Random score between 15 and 45
            }));

            await assessmentAPI.recordBulkResults({
              testId: testId,
              results: scores
            });
            
            results.scoresRecorded += scores.length;
          }
        }
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('Assessment Population Error:', error);
      throw error;
    }
  }
};
