/**
 * Strands Configuration for Learning Areas
 * Defines strands for each learning area across all grade levels
 * Based on CBC (Competency-Based Curriculum) framework
 */

export const STRANDS_BY_AREA = {
  // Mathematics Strands
  'Mathematics': [
    'Number and Numeration',
    'Operations',
    'Measurement',
    'Geometry and Spatial Sense',
    'Data Handling and Probability'
  ],
  'Mathematics Activities': [
    'Number Recognition',
    'Basic Counting',
    'Shapes and Patterns',
    'Sorting and Grouping',
    'Comparison'
  ],
  'Integrated Science': [
    'Life Processes and Living Things',
    'Materials and Their Properties',
    'Physical Processes',
    'Earth and Space',
    'Human Biology'
  ],
  'Science and Technology': [
    'Life Processes and Living Things',
    'Materials and Their Properties',
    'Energy and Motion',
    'Earth and Space',
    'Technological Design'
  ],

  // Language Strands
  'English Language': [
    'Listening and Speaking',
    'Reading and Comprehension',
    'Writing',
    'Grammar and Language Structures',
    'Literature Appreciation'
  ],
  'English Language Activities': [
    'Listening',
    'Speaking',
    'Pre-Reading Skills',
    'Letter Recognition',
    'Simple Communication'
  ],
  'English Activities': [
    'Oral Communication',
    'Phonics',
    'Word Recognition',
    'Simple Stories',
    'Alphabet and Sounds'
  ],
  'Kiswahili Language Activities': [
    'Listening and Speaking',
    'Reading',
    'Writing',
    'Grammar Basics',
    'Cultural Stories'
  ],
  'Kiswahili Lugha': [
    'Listening and Speaking',
    'Reading and Comprehension',
    'Writing',
    'Grammar and Language Structures',
    'Literature and Culture'
  ],
  'Kiswahili Activities': [
    'Oral Communication',
    'Phonics in Kiswahili',
    'Word Recognition',
    'Simple Stories',
    'Basic Grammar'
  ],
  'Indigenous Language Activities': [
    'Listening and Speaking',
    'Basic Vocabulary',
    'Cultural Expressions',
    'Simple Communication',
    'Language Preservation'
  ],

  // Social Studies Strands
  'Social Studies': [
    'Citizenship and Democracy',
    'Culture and Heritage',
    'Geography and Map Skills',
    'History and Time Concepts',
    'Economic Activities'
  ],
  'Social Studies Activities': [
    'Community Awareness',
    'Family and Home',
    'My School',
    'Neighborhood Exploration',
    'Basic Geography'
  ],
  'Environmental Activities': [
    'Living Things and Habitats',
    'Weather and Seasons',
    'Natural Resources',
    'Ecosystems',
    'Environmental Care'
  ],

  // Religious Education Strands
  'Christian Religious Education': [
    'God and Creation',
    'Jesus Christ',
    'Moral Living',
    'Worship and Prayer',
    'Bible Knowledge'
  ],
  'Islamic Religious Education': [
    'Islamic Beliefs',
    'The Quran and Hadith',
    'Islamic Practices',
    'Islamic Ethics',
    'Islamic History'
  ],
  'Religious Education': [
    'Belief and Faith',
    'Moral Values',
    'Prayer and Worship',
    'Life Skills',
    'Community Service'
  ],

  // Arts and Creative Strands
  'Creative Arts': [
    'Visual Arts',
    'Music',
    'Drama and Dance',
    'Craft and Design',
    'Performing Arts'
  ],
  'Creative Arts Activities': [
    'Drawing and Painting',
    'Music and Sounds',
    'Role Play and Drama',
    'Clay and Craft',
    'Movement and Dance'
  ],
  'Creative Arts and Sports': [
    'Visual Arts',
    'Music',
    'Performing Arts',
    'Physical Education',
    'Sports and Games'
  ],
  'Creative Activities': [
    'Art and Craft',
    'Music',
    'Movement',
    'Drama',
    'Creative Expression'
  ],

  // Physical Education Strands
  'Physical Education and Sports': [
    'Fitness and Health',
    'Movement Skills',
    'Sports and Games',
    'Team Activities',
    'Wellness and Nutrition'
  ],

  // Technology and Computing Strands
  'Computer Studies': [
    'Digital Citizenship',
    'Basic Computer Operations',
    'Internet Basics',
    'Digital Safety',
    'Programming Basics'
  ],
  'Computer Studies Activities': [
    'Computer Familiarization',
    'Using Input Devices',
    'Basic Software',
    'Internet Safety',
    'Digital Games'
  ],
  'Computer Studies (Interactive)': [
    'Computer Basics',
    'Interactive Learning',
    'Digital Tools',
    'Coding Concepts',
    'Internet Safety'
  ],
  'ICT / Digital Literacy': [
    'Digital Communication',
    'Information Management',
    'Cybersecurity',
    'Programming and Logic',
    'Digital Citizenship'
  ],
  'Coding and Robotics': [
    'Programming Concepts',
    'Algorithm Design',
    'Robotics Mechanics',
    'Problem Solving',
    'Project-Based Learning'
  ],

  // Agriculture and Pre-Technical Strands
  'Agriculture': [
    'Crop Production',
    'Animal Husbandry',
    'Soil and Water Management',
    'Farm Tools and Equipment',
    'Agricultural Economics'
  ],
  'Pre-Technical Studies': [
    'Introduction to Technology',
    'Mechanical Skills',
    'Electrical Basics',
    'Technical Drawing',
    'Problem Solving'
  ],

  // French Language Strands
  'French': [
    'Listening and Speaking',
    'Reading',
    'Writing',
    'French Grammar',
    'French Culture'
  ],
  'French (Optional)': [
    'Basic Greetings',
    'Simple Vocabulary',
    'Pronunciation',
    'Cultural Basics',
    'Beginner Conversations'
  ],

  // Senior School Pathway Subjects
  'Biology': [
    'Cell Biology',
    'Genetics and Evolution',
    'Ecology and Organisms',
    'Physiology and Disease',
    'Reproduction and Growth'
  ],
  'Chemistry': [
    'Atomic Structure',
    'Chemical Bonding',
    'States of Matter',
    'Chemical Reactions',
    'Acids and Bases'
  ],
  'Physics': [
    'Forces and Motion',
    'Energy and Work',
    'Waves and Optics',
    'Electricity and Magnetism',
    'Modern Physics'
  ],
  'History': [
    'Ancient Civilizations',
    'Medieval Period',
    'Early Modern History',
    'Modern History',
    'Contemporary Issues'
  ],
  'Geography': [
    'Physical Geography',
    'Human Geography',
    'Map Skills and GIS',
    'Environmental Geography',
    'Geopolitics'
  ],
  'Literature in English': [
    'Poetry',
    'Prose',
    'Drama',
    'Literary Criticism',
    'World Literature'
  ],
  'Community Service Learning': [
    'Service Projects',
    'Leadership',
    'Social Responsibility',
    'Community Engagement',
    'Civic Participation'
  ],
  'Life Skills Education': [
    'Health and Wellness',
    'Financial Literacy',
    'Career Guidance',
    'Emotional Intelligence',
    'Decision Making'
  ]
};

/**
 * Get strands for a specific learning area
 * @param {string} areaName - The learning area name
 * @returns {Array} Array of strand names, or empty array if not found
 */
export const getStrandsForArea = (areaName) => {
  return STRANDS_BY_AREA[areaName] || [];
};

/**
 * Get all unique strand names across all areas
 * @returns {Array} Array of all strand names
 */
export const getAllStrands = () => {
  const strands = new Set();
  Object.values(STRANDS_BY_AREA).forEach(strandArray => {
    strandArray.forEach(strand => strands.add(strand));
  });
  return Array.from(strands).sort();
};
