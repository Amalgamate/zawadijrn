/**
 * PDF Generator Utility with Letterhead Support
 * Uses pdfmake for generating professional school reports
 * 
 * Installation required:
 * npm install pdfmake
 * 
 * @module utils/pdfGenerator
 */

// NOTE: This file requires pdfmake to be installed
// Run: npm install pdfmake

/**
 * Create letterhead template for school reports
 * @param {Object} schoolInfo - School branding information
 * @param {string} schoolInfo.schoolName - School name
 * @param {string} schoolInfo.logoUrl - School logo (base64 or URL)
 * @param {string} schoolInfo.brandColor - Primary brand color
 * @param {string} schoolInfo.address - School address
 * @param {string} schoolInfo.phone - School phone
 * @param {string} schoolInfo.email - School email
 * @param {string} schoolInfo.website - School website
 * @returns {Object} PDF letterhead configuration
 */
export const createLetterhead = (schoolInfo) => {
  const {
    schoolName = '',
    logoUrl = '',
    brandColor = '#1e3a8a',
    address = '',
    phone = '',
    email = '',
    website = ''
  } = schoolInfo;

  return {
    // Header configuration
    header: (currentPage, pageCount, pageSize) => {
      return {
        margin: [40, 30, 40, 10],
        stack: [
          {
            columns: [
              {
                // Logo section
                image: logoUrl,
                width: 60,
                height: 60,
                alignment: 'left'
              },
              {
                // School information
                width: '*',
                stack: [
                  {
                    text: schoolName.toUpperCase(),
                    style: 'schoolName',
                    alignment: 'center',
                    margin: [0, 5, 0, 2]
                  },
                  {
                    text: address,
                    style: 'schoolContact',
                    alignment: 'center'
                  },
                  {
                    text: `Tel: ${phone} | Email: ${email}`,
                    style: 'schoolContact',
                    alignment: 'center'
                  },
                  {
                    text: website,
                    style: 'schoolContact',
                    alignment: 'center',
                    color: brandColor
                  }
                ]
              },
              {
                // Right side space for balance
                width: 60,
                text: ''
              }
            ]
          },
          {
            // Separator line
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 10,
                x2: pageSize.width - 80,
                y2: 10,
                lineWidth: 2,
                lineColor: brandColor
              }
            ],
            margin: [0, 10, 0, 0]
          }
        ]
      };
    },

    // Footer configuration
    footer: (currentPage, pageCount) => {
      return {
        margin: [40, 10, 40, 20],
        stack: [
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 1,
                lineColor: '#cccccc'
              }
            ]
          },
          {
            columns: [
              {
                text: `Generated on: ${new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}`,
                style: 'footer',
                margin: [0, 5, 0, 0]
              },
              {
                text: `Page ${currentPage} of ${pageCount}`,
                style: 'footer',
                alignment: 'right',
                margin: [0, 5, 0, 0]
              }
            ]
          },
          {
            text: '"Nurturing Excellence, Building Character"',
            style: 'motto',
            alignment: 'center',
            margin: [0, 3, 0, 0]
          }
        ]
      };
    },

    // Styles
    styles: {
      schoolName: {
        fontSize: 18,
        bold: true,
        color: brandColor,
        letterSpacing: 1
      },
      schoolContact: {
        fontSize: 8,
        color: '#555555'
      },
      footer: {
        fontSize: 8,
        color: '#888888'
      },
      motto: {
        fontSize: 7,
        italics: true,
        color: '#999999'
      },
      reportTitle: {
        fontSize: 16,
        bold: true,
        alignment: 'center',
        color: brandColor,
        margin: [0, 10, 0, 5]
      },
      reportSubtitle: {
        fontSize: 12,
        alignment: 'center',
        color: '#666666',
        margin: [0, 0, 0, 15]
      },
      sectionHeader: {
        fontSize: 13,
        bold: true,
        color: brandColor,
        margin: [0, 15, 0, 8],
        decoration: 'underline'
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'white',
        fillColor: brandColor
      },
      tableCell: {
        fontSize: 10
      },
      label: {
        fontSize: 9,
        bold: true,
        color: '#555555'
      },
      value: {
        fontSize: 10,
        color: '#000000'
      }
    }
  };
};

/**
 * Generate Formative Report PDF
 * @param {Object} studentInfo - Student information
 * @param {Object} assessmentData - Assessment data
 * @param {Object} schoolInfo - School information for letterhead
 * @returns {Promise<Blob>} PDF blob
 */
export const generateFormativeReportPDF = async (studentInfo, assessmentData, schoolInfo) => {
  // This function will be implemented after pdfmake is installed
  const pdfMake = await import('pdfmake/build/pdfmake');
  const pdfFonts = await import('pdfmake/build/vfs_fonts');
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  const letterhead = createLetterhead(schoolInfo);

  const docDefinition = {
    ...letterhead,
    pageSize: 'A4',
    pageMargins: [40, 120, 40, 70],
    content: [
      {
        text: 'FORMATIVE ASSESSMENT REPORT',
        style: 'reportTitle'
      },
      {
        text: `${assessmentData.term} - Academic Year ${assessmentData.academicYear}`,
        style: 'reportSubtitle'
      },

      // Student Information Section
      {
        text: 'STUDENT INFORMATION',
        style: 'sectionHeader'
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                columns: [
                  { text: 'Name:', style: 'label', width: '30%' },
                  { text: `${studentInfo.firstName} ${studentInfo.lastName}`, style: 'value', width: '70%' }
                ]
              },
              {
                columns: [
                  { text: 'Admission No:', style: 'label', width: '30%' },
                  { text: studentInfo.admissionNumber, style: 'value', width: '70%' }
                ],
                margin: [0, 3, 0, 0]
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                columns: [
                  { text: 'Class:', style: 'label', width: '30%' },
                  { text: `${studentInfo.grade} - ${studentInfo.stream}`, style: 'value', width: '70%' }
                ]
              },
              {
                columns: [
                  { text: 'Term:', style: 'label', width: '30%' },
                  { text: assessmentData.term, style: 'value', width: '70%' }
                ],
                margin: [0, 3, 0, 0]
              }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Assessment Summary Section
      {
        text: 'ASSESSMENT SUMMARY BY LEARNING AREA',
        style: 'sectionHeader'
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Learning Area', style: 'tableHeader' },
              { text: 'EE', style: 'tableHeader' },
              { text: 'ME', style: 'tableHeader' },
              { text: 'AE', style: 'tableHeader' },
              { text: 'BE', style: 'tableHeader' },
              { text: 'Overall', style: 'tableHeader' }
            ],
            ...assessmentData.learningAreas.map(area => [
              { text: area.name, style: 'tableCell' },
              { text: area.ee || 0, style: 'tableCell', alignment: 'center' },
              { text: area.me || 0, style: 'tableCell', alignment: 'center' },
              { text: area.ae || 0, style: 'tableCell', alignment: 'center' },
              { text: area.be || 0, style: 'tableCell', alignment: 'center' },
              { text: area.overall, style: 'tableCell', alignment: 'center', bold: true }
            ])
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#dddddd',
          vLineColor: () => '#dddddd'
        }
      },

      // CBC Rubric Legend
      {
        text: 'CBC RUBRIC LEGEND',
        style: 'sectionHeader'
      },
      {
        ul: [
          'EE - Exceeds Expectations: Outstanding performance',
          'ME - Meets Expectations: Satisfactory performance',
          'AE - Approaches Expectations: Needs improvement',
          'BE - Below Expectations: Significant support needed'
        ],
        style: 'tableCell'
      },

      // Teacher's Comment
      {
        text: "TEACHER'S COMMENT",
        style: 'sectionHeader'
      },
      {
        text: assessmentData.teacherComment || 'No comments provided.',
        style: 'tableCell',
        margin: [0, 0, 0, 10]
      },

      // Signatures
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: '_________________________', margin: [0, 30, 0, 2] },
              { text: "Class Teacher's Signature", style: 'label' },
              { text: `Date: ______________`, style: 'label', margin: [0, 5, 0, 0] }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: '_________________________', margin: [0, 30, 0, 2] },
              { text: "Parent's Signature", style: 'label' },
              { text: `Date: ______________`, style: 'label', margin: [0, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 20, 0, 0]
      }
    ]
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBlob((blob) => {
        resolve(blob);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Summative Report PDF
 * @param {Object} studentInfo - Student information
 * @param {Object} resultsData - Test results data
 * @param {Object} schoolInfo - School information for letterhead
 * @returns {Promise<Blob>} PDF blob
 */
export const generateSummativeReportPDF = async (studentInfo, resultsData, schoolInfo) => {
  const pdfMake = await import('pdfmake/build/pdfmake');
  const pdfFonts = await import('pdfmake/build/vfs_fonts');
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  const letterhead = createLetterhead(schoolInfo);

  const docDefinition = {
    ...letterhead,
    pageSize: 'A4',
    pageMargins: [40, 120, 40, 70],
    content: [
      {
        text: 'SUMMATIVE ASSESSMENT REPORT',
        style: 'reportTitle'
      },
      {
        text: `${resultsData.term} - Academic Year ${resultsData.academicYear}`,
        style: 'reportSubtitle'
      },

      // Student Information
      {
        text: 'STUDENT INFORMATION',
        style: 'sectionHeader'
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                columns: [
                  { text: 'Name:', style: 'label', width: '30%' },
                  { text: `${studentInfo.firstName} ${studentInfo.lastName}`, style: 'value', width: '70%' }
                ]
              },
              {
                columns: [
                  { text: 'Admission No:', style: 'label', width: '30%' },
                  { text: studentInfo.admissionNumber, style: 'value', width: '70%' }
                ],
                margin: [0, 3, 0, 0]
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                columns: [
                  { text: 'Class:', style: 'label', width: '30%' },
                  { text: `${studentInfo.grade} - ${studentInfo.stream}`, style: 'value', width: '70%' }
                ]
              },
              {
                columns: [
                  { text: 'Term:', style: 'label', width: '30%' },
                  { text: resultsData.term, style: 'value', width: '70%' }
                ],
                margin: [0, 3, 0, 0]
              }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Results Table
      {
        text: 'EXAMINATION RESULTS',
        style: 'sectionHeader'
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Subject', style: 'tableHeader' },
              { text: 'Marks', style: 'tableHeader' },
              { text: 'Out of', style: 'tableHeader' },
              { text: '%', style: 'tableHeader' },
              { text: 'Grade', style: 'tableHeader' },
              { text: 'Position', style: 'tableHeader' }
            ],
            ...resultsData.subjects.map(subject => [
              { text: subject.name, style: 'tableCell' },
              { text: subject.marks, style: 'tableCell', alignment: 'center' },
              { text: subject.total, style: 'tableCell', alignment: 'center' },
              { text: `${subject.percentage}%`, style: 'tableCell', alignment: 'center', bold: true },
              { text: subject.grade, style: 'tableCell', alignment: 'center', bold: true },
              { text: subject.position, style: 'tableCell', alignment: 'center' }
            ]),
            [
              { text: 'TOTAL/AVERAGE', style: 'tableHeader', colSpan: 2 },
              {},
              { text: resultsData.totalPossible, style: 'tableHeader', alignment: 'center' },
              { text: `${resultsData.averagePercentage}%`, style: 'tableHeader', alignment: 'center' },
              { text: resultsData.overallGrade, style: 'tableHeader', alignment: 'center' },
              { text: resultsData.overallPosition, style: 'tableHeader', alignment: 'center' }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#dddddd',
          vLineColor: () => '#dddddd'
        }
      },

      // Grading System
      {
        text: 'GRADING SYSTEM',
        style: 'sectionHeader'
      },
      {
        columns: [
          {
            width: '50%',
            table: {
              body: [
                ['A', '80 - 100%', 'Excellent'],
                ['B', '60 - 79%', 'Good'],
                ['C', '50 - 59%', 'Satisfactory']
              ]
            },
            layout: 'lightHorizontalLines'
          },
          {
            width: '50%',
            table: {
              body: [
                ['D', '40 - 49%', 'Pass'],
                ['E', '0 - 39%', 'Fail']
              ]
            },
            layout: 'lightHorizontalLines'
          }
        ],
        style: 'tableCell'
      },

      // Comments
      {
        text: "TEACHER'S COMMENT",
        style: 'sectionHeader'
      },
      {
        text: resultsData.teacherComment || 'No comments provided.',
        style: 'tableCell',
        margin: [0, 0, 0, 10]
      },

      // Signatures
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: '_________________________', margin: [0, 30, 0, 2] },
              { text: "Class Teacher's Signature", style: 'label' },
              { text: `Date: ______________`, style: 'label', margin: [0, 5, 0, 0] }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: '_________________________', margin: [0, 30, 0, 2] },
              { text: "Parent's Signature", style: 'label' },
              { text: `Date: ______________`, style: 'label', margin: [0, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 20, 0, 0]
      }
    ]
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBlob((blob) => {
        resolve(blob);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Download PDF blob as file
 * @param {Blob} blob - PDF blob
 * @param {string} filename - Filename for download
 */
export const downloadPDF = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Helper function to convert image URL to base64
 * @param {string} url - Image URL
 * @returns {Promise<string>} Base64 string
 */
export const imageToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = reject;
    img.src = url;
  });
};
