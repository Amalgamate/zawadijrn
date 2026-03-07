const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = [
  { startTime: '08:00', endTime: '08:45' },
  { startTime: '08:45', endTime: '09:30' },
  { startTime: '09:30', endTime: '10:15' },
  { startTime: '10:15', endTime: '11:00' },
  { startTime: '11:00', endTime: '11:45' },
  { startTime: '11:45', endTime: '12:30' },
  { startTime: '12:30', endTime: '13:15' },
  { startTime: '13:15', endTime: '14:00' }
];

const keyForSchedule = (classId, day, startTime) => `${classId}|${day}|${startTime}`;

async function run() {
  const classes = await prisma.class.findMany({
    where: {
      active: true,
      archived: false,
      schoolId: { not: null }
    },
    select: {
      id: true,
      name: true,
      grade: true,
      stream: true,
      teacherId: true,
      room: true,
      schoolId: true,
      academicYear: true,
      term: true
    },
    orderBy: [{ grade: 'asc' }, { stream: 'asc' }]
  });

  const learningAreas = await prisma.learningArea.findMany({
    select: { id: true, name: true, gradeLevel: true },
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }]
  });

  const subjectAssignments = await prisma.subjectAssignment.findMany({
    where: { active: true },
    select: { grade: true, learningAreaId: true, teacherId: true }
  });

  const existingSchedules = await prisma.classSchedule.findMany({
    where: {
      classId: { in: classes.map((c) => c.id) },
      archived: false,
      active: true
    },
    select: { classId: true, day: true, startTime: true }
  });

  const existingKeys = new Set(existingSchedules.map((s) => keyForSchedule(s.classId, s.day, s.startTime)));

  const areasByGrade = new Map();
  for (const area of learningAreas) {
    const grade = String(area.gradeLevel || '').toUpperCase();
    if (!areasByGrade.has(grade)) {
      areasByGrade.set(grade, []);
    }
    areasByGrade.get(grade).push(area);
  }

  const assignmentMap = new Map();
  for (const assignment of subjectAssignments) {
    const key = `${String(assignment.grade).toUpperCase()}|${assignment.learningAreaId}`;
    if (!assignmentMap.has(key)) {
      assignmentMap.set(key, []);
    }
    assignmentMap.get(key).push(assignment.teacherId);
  }

  const creates = [];
  let skippedExisting = 0;

  for (const classItem of classes) {
    const classGrade = String(classItem.grade || '').toUpperCase();
    const gradeAreas = areasByGrade.get(classGrade) || [];
    const fallbackAreas = learningAreas.slice(0, 8);
    const selectedAreas = gradeAreas.length > 0 ? gradeAreas : fallbackAreas;

    let areaCursor = 0;

    for (const day of DAYS) {
      for (const slot of SLOTS) {
        const existingKey = keyForSchedule(classItem.id, day, slot.startTime);
        if (existingKeys.has(existingKey)) {
          skippedExisting += 1;
          continue;
        }

        const learningArea = selectedAreas[areaCursor % selectedAreas.length];
        areaCursor += 1;

        const assignmentKey = `${classGrade}|${learningArea.id}`;
        const assignedTeachers = assignmentMap.get(assignmentKey) || [];
        const teacherId = assignedTeachers[0] || classItem.teacherId || null;

        creates.push({
          classId: classItem.id,
          subject: learningArea.name,
          day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: classItem.room || `${classItem.grade} ${classItem.stream || ''}`.trim(),
          teacherId,
          learningAreaId: learningArea.id,
          schoolId: classItem.schoolId,
          semester: classItem.term,
          academicYear: classItem.academicYear,
          active: true,
          archived: false
        });
      }
    }
  }

  let created = 0;
  const batchSize = 250;
  for (let index = 0; index < creates.length; index += batchSize) {
    const batch = creates.slice(index, index + batchSize);
    const result = await prisma.classSchedule.createMany({ data: batch });
    created += result.count;
  }

  console.log(
    JSON.stringify(
      {
        classes: classes.length,
        slotsPerClassTarget: DAYS.length * SLOTS.length,
        existingSchedules: existingSchedules.length,
        createdSchedules: created,
        skippedExisting
      },
      null,
      2
    )
  );
}

run()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
