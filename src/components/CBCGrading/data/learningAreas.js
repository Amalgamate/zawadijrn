/**
 * CBC Learning Areas Structure
 * Complete learning areas with strands, sub-strands, and outcomes
 */

export const learningAreas = [
  // EARLY YEARS (Crèche to Transition)
  {
    id: 1,
    name: 'Literacy Activities',
    shortName: 'Literacy',
    code: 'LIT',
    gradeLevel: 'Early Years',
    grades: ['Crèche', 'Reception', 'Transition', 'Playgroup'],
    color: '#ec4899',
    icon: '🧸',
    weight: 1.0,
    strands: [{ id: 1, name: 'Oral Communication', subStrands: [{ name: 'Listening', outcomes: ['Responds to sounds', 'Follows simple instructions'] }] }]
  },
  {
    id: 2,
    name: 'Mathematical Activities',
    shortName: 'Math',
    code: 'MATH_EY',
    gradeLevel: 'Early Years',
    grades: ['Crèche', 'Reception', 'Transition', 'Playgroup'],
    color: '#3b82f6',
    icon: '🔢',
    weight: 1.0,
    strands: [{ id: 1, name: 'Numbers', subStrands: [{ name: 'Counting', outcomes: ['Counts 1-10', 'Identifies shapes'] }] }]
  },

  // PRE-PRIMARY (PP1, PP2)
  {
    id: 10,
    name: 'Literacy',
    shortName: 'Literacy',
    code: 'LIT_PP',
    gradeLevel: 'Pre-Primary',
    grades: ['PP1', 'PP2'],
    color: '#8b5cf6',
    icon: '🎨',
    weight: 1.0,
    strands: [{ id: 1, name: 'Reading Ready', subStrands: [{ name: 'Letter Recognition', outcomes: ['Identifies vowel sounds', 'Recognizes own name'] }] }]
  },

  // LOWER PRIMARY (Grade 1-3)
  {
    id: 20,
    name: 'Mathematics',
    shortName: 'Maths',
    code: 'MATH',
    gradeLevel: 'Lower Primary',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    color: '#3b82f6',
    icon: '🔢',
    weight: 1.0,
    strands: [
      {
        id: 1,
        name: 'Numbers',
        subStrands: [
          { name: 'Whole Numbers', outcomes: ['Count up to 1000', 'Place value', 'Addition and Subtraction'] },
          { name: 'Fractions', outcomes: ['Identify 1/2, 1/4', 'Compare fractions'] }
        ]
      },
      {
        id: 2,
        name: 'Measurement',
        subStrands: [
          { name: 'Length', outcomes: ['Measure in cm and m'] },
          { name: 'Money', outcomes: ['Identify currency', 'Simple shopping'] }
        ]
      }
    ]
  },
  {
    id: 21,
    name: 'English',
    shortName: 'ENG',
    code: 'ENG',
    gradeLevel: 'Lower Primary',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    color: '#10b981',
    icon: '📚',
    weight: 1.0,
    strands: [
      { id: 1, name: 'Listening and Speaking', subStrands: [{ name: 'Oral Communication', outcomes: ['Express ideas clearly'] }] },
      { id: 2, name: 'Reading', subStrands: [{ name: 'Reading Skills', outcomes: ['Read with fluency', 'Comprehension'] }] }
    ]
  },
  {
    id: 22,
    name: 'Kiswahili',
    shortName: 'Kiswa',
    code: 'KIS',
    gradeLevel: 'Lower Primary',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    color: '#f59e0b',
    icon: '🗣️',
    weight: 1.0,
    strands: [{ id: 1, name: 'Kusikiliza na Kuzungumza', subStrands: [{ name: 'Maamkizi', outcomes: ['Tumia maamkizi ipasavyo'] }] }]
  },
  {
    id: 23,
    name: 'Environmental Studies',
    shortName: 'ENV',
    code: 'ENV',
    gradeLevel: 'Lower Primary',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    color: '#3b82f6',
    icon: '🌍',
    weight: 1.0,
    strands: []
  },
  {
    id: 24,
    name: 'Creative Activities',
    shortName: 'CA',
    code: 'CA',
    gradeLevel: 'Lower Primary',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    color: '#ec4899',
    icon: '🎨',
    weight: 1.0,
    strands: []
  },
  {
    id: 25,
    name: 'Religious Education',
    shortName: 'RE',
    code: 'RE',
    gradeLevel: 'Lower Primary',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    color: '#8b5cf6',
    icon: '⛪',
    weight: 1.0,
    strands: []
  },
  {
    id: 26,
    name: 'Information Communications Technology',
    shortName: 'ICT',
    code: 'ICT',
    gradeLevel: 'Lower Primary',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    color: '#64748b',
    icon: '💻',
    weight: 1.0,
    strands: []
  },

  // UPPER PRIMARY (Grade 4-6)
  {
    id: 40,
    name: 'Science and Technology',
    shortName: 'Science',
    code: 'SCI',
    gradeLevel: 'Upper Primary',
    grades: ['Grade 4', 'Grade 5', 'Grade 6'],
    color: '#10b981',
    icon: '🧪',
    weight: 1.0,
    strands: [{ id: 1, name: 'Living Things', subStrands: [{ name: 'The Human Body', outcomes: ['Identify external parts', 'Functions of sense organs'] }] }]
  },
  {
    id: 41,
    name: 'Social Studies',
    shortName: 'Social',
    code: 'SOC',
    gradeLevel: 'Upper Primary',
    grades: ['Grade 4', 'Grade 5', 'Grade 6'],
    color: '#3b82f6',
    icon: '🌍',
    weight: 1.0,
    strands: [{ id: 1, name: 'Our Environment', subStrands: [{ name: 'Physical Features', outcomes: ['Locate features in the county'] }] }]
  },
  {
    id: 42,
    name: 'Agriculture',
    shortName: 'Agriculture',
    code: 'AGRI',
    gradeLevel: 'Upper Primary',
    grades: ['Grade 4', 'Grade 5', 'Grade 6'],
    color: '#15803d',
    icon: '🌱',
    weight: 1.0,
    strands: [
      { id: 1, name: 'Conserving our Environment', subStrands: [{ name: 'Soil Conservation', outcomes: ['Importance of soil', 'Soil recovery'] }] },
      { id: 2, name: 'Crop Production', subStrands: [{ name: 'Gardening Practices', outcomes: ['Land preparation', 'Planting techniques'] }] }
    ]
  },

  // JUNIOR SCHOOL (Grade 7-9)
  {
    id: 70,
    name: 'Integrated Science',
    shortName: 'Int. Science',
    code: 'ISCI',
    gradeLevel: 'Junior School',
    grades: ['Grade 7', 'Grade 8', 'Grade 9'],
    color: '#10b981',
    icon: '🧬',
    weight: 1.0,
    strands: [{ id: 1, name: 'Mixtures and Substances', subStrands: [{ name: 'Separation of Mixtures', outcomes: ['Demonstrate filtration', 'Appreciate purity'] }] }]
  },
  {
    id: 71,
    name: 'Pre-Technical Studies',
    shortName: 'Pre-Tech',
    code: 'PTECH',
    gradeLevel: 'Junior School',
    grades: ['Grade 7', 'Grade 8', 'Grade 9'],
    color: '#64748b',
    icon: '🛠️',
    weight: 1.0,
    strands: [{ id: 1, name: 'Materials', subStrands: [{ name: 'Tools and Safety', outcomes: ['Identify hand tools', 'Follow safety rules'] }] }]
  },
  {
    id: 72,
    name: 'Agriculture',
    shortName: 'Agriculture',
    code: 'AGRI_JS',
    gradeLevel: 'Junior School',
    grades: ['Grade 7', 'Grade 8', 'Grade 9'],
    color: '#166534',
    icon: '🚜',
    weight: 1.0,
    strands: [
      { id: 1, name: 'Agricultural Economics', subStrands: [{ name: 'Importance of Agriculture', outcomes: ['Role in economy', 'Food security'] }] },
      { id: 2, name: 'Animal Production', subStrands: [{ name: 'Livestock Management', outcomes: ['Feeding practices', 'Health care'] }] }
    ]
  },

  // SENIOR SCHOOL (Grade 10-12)
  {
    id: 100,
    name: 'Community Service Learning',
    shortName: 'CSL',
    code: 'CSL',
    gradeLevel: 'Senior School',
    grades: ['Grade 10', 'Grade 11', 'Grade 12'],
    color: '#f43f5e',
    icon: '🤝',
    weight: 1.0,
    strands: [{ id: 1, name: 'Community Engagement', subStrands: [{ name: 'Social Responsibility', outcomes: ['Participate in local projects'] }] }]
  },
  {
    id: 101,
    name: 'Agriculture',
    shortName: 'Agriculture',
    code: 'AGRI_SR',
    gradeLevel: 'Senior School',
    grades: ['Grade 10', 'Grade 11', 'Grade 12'],
    color: '#14532d',
    icon: '🌾',
    weight: 1.0,
    strands: [
      { id: 1, name: 'Advanced Crop Science', subStrands: [{ name: 'Plant Pathology', outcomes: ['Identify diseases', 'Pest control strategies'] }] },
      { id: 2, name: 'Farm Power and Machinery', subStrands: [{ name: 'Equipment Maintenance', outcomes: ['Service farm tools', 'Safe operation'] }] }
    ]
  }
];

/**
 * Get learning area by name
 * @param {string} name - Learning area name
 * @returns {Object|null} Learning area object or null
 */
export const getLearningAreaByName = (name) => {
  return learningAreas.find(area => area.name === name) || null;
};

/**
 * Get all strands for a learning area
 * @param {string} learningAreaName - Name of learning area
 * @returns {Array} Array of strands
 */
export const getStrandsForArea = (learningAreaName) => {
  const area = getLearningAreaByName(learningAreaName);
  return area ? area.strands : [];
};

/**
 * Get sub-strands for a specific strand
 * @param {string} learningAreaName - Name of learning area
 * @param {string} strandName - Name of strand
 * @returns {Array} Array of sub-strands
 */
export const getSubStrands = (learningAreaName, strandName) => {
  const strands = getStrandsForArea(learningAreaName);
  const strand = strands.find(s => s.name === strandName);
  return strand ? strand.subStrands : [];
};
