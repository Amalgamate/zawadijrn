const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const openerResults = await prisma.summativeResult.count({
    where: { test: { testType: 'OPENER' } }
  });
  
  const midtermResults = await prisma.summativeResult.count({
    where: { test: { testType: 'MID_TERM' } }
  });
  
  const endtermResults = await prisma.summativeResult.count({
    where: { test: { testType: 'END_TERM' } }
  });
  
  console.log('📊 Summative Results by testType:');
  console.log('OPENER:', openerResults);
  console.log('MID_TERM:', midtermResults);
  console.log('END_TERM:', endtermResults);
  
  // Check a sample Grade 9 results per type
  const grade9Openers = await prisma.summativeResult.count({
    where: { 
      test: { testType: 'OPENER', grade: 'GRADE_9' }
    }
  });
  
  const grade9Midterms = await prisma.summativeResult.count({
    where: { 
      test: { testType: 'MID_TERM', grade: 'GRADE_9' }
    }
  });
  
  const grade9Endterms = await prisma.summativeResult.count({
    where: { 
      test: { testType: 'END_TERM', grade: 'GRADE_9' }
    }
  });
  
  console.log('\n📊 Grade 9 Results by testType:');
  console.log('OPENER:', grade9Openers);
  console.log('MID_TERM:', grade9Midterms);
  console.log('END_TERM:', grade9Endterms);
  
  await prisma.$disconnect();
})();
