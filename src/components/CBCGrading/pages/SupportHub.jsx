/**
 * Help & Documentation Page - ENHANCED VERSION
 * Comprehensive user guide and knowledge base
 */

import React, { useState } from 'react';
import { Book, Search, ChevronDown, ChevronRight, HelpCircle, FileText, Video, Mail, MessageSquare, Settings } from 'lucide-react';

const SupportHub = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      color: 'blue',
      articles: [
        {
          title: 'System Overview',
          content: 'The CBC Grading System helps you manage learner records, attendance, assessments, and generate reports according to CBC curriculum standards. It includes integrated communication features for Email, SMS, and M-Pesa payments.'
        },
        {
          title: 'Dashboard Overview',
          content: 'The dashboard shows key statistics including total learners, teachers, attendance rates, and recent activities at a glance. Use it to quickly understand your school\'s status.'
        },
        {
          title: 'Navigation Guide',
          content: 'Use the sidebar to navigate between different modules: Learners, Teachers, Parents, Attendance, Assessment, Reports, Messages, Notices, and Settings.'
        },
        {
          title: 'First Time Setup',
          content: 'After logging in for the first time: 1) Configure School Settings 2) Set up Academic Year/Terms 3) Add Teachers 4) Configure Communication Settings (Email, SMS, M-Pesa) 5) Start adding learners.'
        }
      ]
    },
    {
      id: 'communications',
      title: 'Communication Settings',
      icon: MessageSquare,
      color: 'cyan',
      articles: [
        {
          title: 'Email Integration Setup',
          content: 'Go to Settings → Communication Settings → Email tab. Choose a provider (Resend recommended for 3K free emails/month, or SendGrid for 100/day free). Get an API key from the provider\'s website, enter it along with your "From Email" and "From Name". Save settings and test with a real email address.'
        },
        {
          title: 'SMS Integration Setup',
          content: 'Go to Settings → Communication Settings → SMS tab. Select provider (Africa\'s Talking for Kenya at KES 0.80/SMS recommended). For Africa\'s Talking: Use "sandbox" as username for free testing, or create account for production. Enter API key and set Sender ID (max 11 characters, e.g., ELIMCROWN). Save and test with a phone number in format 254712345678.'
        },
        {
          title: 'M-Pesa Integration Setup',
          content: 'Go to Settings → Communication Settings → M-Pesa tab. IntaSend is easiest (no Paybill needed, setup in 15 minutes). Sign up at intasend.com, get Public Key and Secret Key, enter Business Number. For production, Safaricom Daraja has lowest fees but requires Paybill number and takes 2-4 weeks approval. Save settings and test with phone number and small amount (KES 10).'
        },
        {
          title: 'Testing Integrations',
          content: 'After configuring Email, SMS, or M-Pesa, scroll down to the "Test" section. Enter a test email/phone number and click "Send Test". Check loading state, then verify success message appears. For M-Pesa, check your phone for STK push prompt. If test fails, verify API keys are correct.'
        },
        {
          title: 'Troubleshooting Communication Issues',
          content: 'Email not sending? Check API key is correct and "From Email" domain matches provider. SMS not delivering? Verify phone format (254...), check credits balance, confirm Sender ID is approved. M-Pesa failing? Ensure phone number is M-Pesa registered, check business number is correct, verify sufficient funds for testing.'
        },
        {
          title: 'Recommended Providers for Schools',
          content: 'Small schools (<200 students): Email-Resend, SMS-Africa\'s Talking, M-Pesa-IntaSend. Medium schools (200-500): Email-SendGrid, SMS-MobileSasa, M-Pesa-MobileSasa (all-in-one). Large schools (500+): Email-AWS SES, SMS-Africa\'s Talking, M-Pesa-Daraja (lowest fees).'
        }
      ]
    },
    {
      id: 'learners',
      title: 'Managing Learners',
      icon: FileText,
      color: 'green',
      articles: [
        {
          title: 'Adding New Learners',
          content: 'Click "Add Learner" button → Navigate to Admissions page → Fill the 4-step form: Step 1 (Personal Info: name, date of birth, gender, grade), Step 2 (Guardian Details: name, phone, email, relationship), Step 3 (Medical Info: allergies, conditions, emergency contact), Step 4 (Review & Submit). The learner will be added with "Active" status.'
        },
        {
          title: 'Editing Learner Information',
          content: 'Go to Learners List → Find the learner using search or filters → Click the green edit icon → Update any information across all tabs → Save changes. Changes are immediate and reflected in all reports.'
        },
        {
          title: 'Viewing Learner Details',
          content: 'Click the blue eye icon next to any learner to view complete profile including personal details, academic information (current grade, admission date), guardian contact info, and medical records.'
        },
        {
          title: 'Promoting Learners to Next Grade',
          content: 'At end of academic year: Go to Learner Management → Promotion → Select current grade → View list of learners eligible for promotion → Click "Promote All" or select specific learners → Confirm promotion. Learners move to next grade automatically.'
        },
        {
          title: 'Transfers & Exits',
          content: 'Transfer Out: Learner Management → Transfer Out → Select learner, enter transfer date, destination school, reason → Submit. This marks learner as "Transferred". Exit/Withdrawal: Click orange exit icon → Enter reason and date → Confirm. Learner status becomes "Exited".'
        },
        {
          title: 'Bulk Import Learners',
          content: 'For adding many learners at once: Download CSV template → Fill with learner data (name, DoB, gender, grade, guardian info) → Go to Admissions → Bulk Import → Upload CSV → Review data → Confirm import. System validates and imports all learners.'
        }
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance Management',
      icon: FileText,
      color: 'purple',
      articles: [
        {
          title: 'Marking Daily Attendance',
          content: 'Go to Daily Attendance → Select date (defaults to today), grade, and stream → System loads all learners in that class → Click Present, Absent, Late, or Excused for each learner → Use "Mark All Present" for quick entry → Save. You can also add notes for individual learners.'
        },
        {
          title: 'Viewing Attendance Reports',
          content: 'Navigate to Attendance Reports → Set filters: Grade (1-6 or All), Date Range (This Week, This Month, Custom) → Click Generate Report → View statistics: total days, present count, absent count, late count, excused count, attendance percentage → Export as PDF or Excel for record-keeping.'
        },
        {
          title: 'Understanding Attendance Status',
          content: 'Present (Green): Learner attended class. Absent (Red): Learner did not attend without valid reason. Late (Yellow): Learner arrived after start time. Excused (Blue): Learner has valid reason for absence (sick note, family emergency). Use notes field to add details.'
        },
        {
          title: 'Attendance Notifications',
          content: 'When SMS is configured: System can auto-send messages to parents when learner is marked absent. Go to Settings → Notifications → Enable "Attendance Alerts" → Set time (e.g., 11 AM daily) → Parents receive SMS: "Your child [Name] was absent today. Please contact school."'
        },
        {
          title: 'Weekly & Monthly Attendance Summaries',
          content: 'Use Attendance Reports with date range filters to view weekly/monthly trends. Identify learners with low attendance (below 80%) for early intervention. Export summary reports for school administration or Ministry of Education compliance.'
        }
      ]
    },
    {
      id: 'assessment',
      title: 'CBC Assessment & Grading',
      icon: FileText,
      color: 'orange',
      articles: [
        {
          title: 'Formative Assessment',
          content: 'Go to Formative Assessment → Select Term, Grade, Learning Area → Choose learner → Rate competencies using rubrics: EE (Exceeds Expectations) - Outstanding, ME (Meets Expectations) - Satisfactory, AE (Approaches Expectations) - Developing, BE (Below Expectations) - Needs support → Add detailed comments on strengths and areas for improvement → Save.'
        },
        {
          title: 'Understanding CBC Rubrics',
          content: 'EE (Exceeds Expectations): Learner demonstrates exceptional understanding, applies knowledge creatively, helps others. ME (Meets Expectations): Learner achieves expected competencies, works independently. AE (Approaches Expectations): Learner shows progress but needs more practice. BE (Below Expectations): Learner struggles, requires additional support and intervention.'
        },
        {
          title: 'Summative Tests & Scoring',
          content: 'Go to Summative Tests → Create New Test → Enter: Test Title (e.g., "End Term 1 Mathematics"), Date, Total Marks, Pass Mark (usually 50%) → Add learners to test → Enter marks for each learner → System auto-calculates: Percentage, Grade (A-E), Pass/Fail status → Generate class statistics (highest, lowest, average, pass rate).'
        },
        {
          title: 'Generating CBC Reports',
          content: 'Formative Reports: Shows rubric ratings across all learning areas for selected term. Summative Reports: Displays test scores, grades, percentages. Termly Reports: Comprehensive report combining formative assessments, summative tests, attendance, teacher comments, and head teacher remarks. Select learner → Generate → Download PDF or Print.'
        },
        {
          title: 'Grade Level Learning Areas',
          content: 'Lower Primary (1-3): Mathematics, English, Kiswahili, Environmental Activities, Religious Education (CRE/IRE/HRE), Creative Arts (Art, Music), Physical Education. Upper Primary (4-6): Adds Science, Social Studies, Home Science, Agriculture. Junior School (7-9): Pre-technical Studies, Business Studies, Life Skills.'
        },
        {
          title: 'Parent Report Distribution',
          content: 'After generating reports: Option 1: Print reports, sign, distribute at parent meetings. Option 2: If Email is configured, send reports as PDF attachments to parent emails. Option 3: If WhatsApp integration added, send reports via WhatsApp. Track which reports sent, mark as "Collected" when parent receives.'
        }
      ]
    },
    {
      id: 'settings',
      title: 'System Settings & Configuration',
      icon: Settings,
      color: 'gray',
      articles: [
        {
          title: 'School Information',
          content: 'Settings → School Settings → Update: School Name, Physical Address, Phone Number, Email Address, School Motto, Registration Number, Principal/Head Teacher Name → Upload school logo (PNG, max 5MB) → Set time zone for Kenya (EAT) → Save changes. This info appears on all reports and official documents.'
        },
        {
          title: 'Academic Year & Terms Setup',
          content: 'Settings → Academic Settings → Set Current Academic Year (e.g., 2026) → Define Term Dates: Term 1 (January-April): Start Date, End Date, Midterm Break. Term 2 (May-August): Dates. Term 3 (September-December): Dates → Set number of teaching days per term → Save. System uses this for attendance calculations and report generation.'
        },
        {
          title: 'Branding & Customization',
          content: 'Settings → Branding Settings → Upload School Logo → Set Brand Colors (Primary color for headers, Secondary for accents) → Customize Welcome Message for dashboard → Set Report Card Header/Footer text → Choose Color Scheme (default, dark mode, custom) → Apply changes system-wide.'
        },
        {
          title: 'User Management & Permissions',
          content: 'Settings → User Management → Add User: Enter name, email, phone, assign Role (Admin, Teacher, Class Teacher, Accountant) → Set Permissions: What modules user can access (Learners, Assessment, Reports, Settings) → Generate password or let user set → Send login credentials via email → Manage existing users: Edit, Deactivate, Reset password.'
        },
        {
          title: 'Backup & Data Export',
          content: 'Settings → Backup Settings → Enable Automatic Backups (daily, weekly, monthly) → Cloud storage: Connect Google Drive or Dropbox → Manual Backup: Click "Backup Now" → Downloads full database export → Restore: Upload previous backup file → Confirm restore (WARNING: Overwrites current data).'
        },
        {
          title: 'Notification Preferences',
          content: 'Settings → Notifications → Enable/Disable: Attendance Alerts (SMS to parents for absences), Assessment Reminders (Email to teachers), Fee Payment Alerts (SMS when M-Pesa received), Report Card Ready (Email to parents) → Set notification schedules → Test notifications to ensure working.'
        }
      ]
    },
    {
      id: 'grades',
      title: 'Grade Levels & Curriculum',
      icon: FileText,
      color: 'indigo',
      articles: [
        {
          title: 'Early Years Education (ECDE)',
          content: 'Crèche (0-2 years): Play-based learning, sensory activities. Reception (2-3 years): Social skills, basic motor development. Playgroup (3-4 years): Pre-reading, pre-math, creative play. Pre-Primary 1 (PP1, 4-5 years): Early literacy, numeracy, art. Pre-Primary 2 (PP2, 5-6 years): School readiness, foundational competencies.'
        },
        {
          title: 'Lower Primary (Grades 1-3)',
          content: 'Core Learning Areas: Mathematics (Number work, patterns, shapes), English Activities (Reading, Writing, Speaking), Kiswahili (Kusoma, Kuandika, Kuzungumza), Environmental Activities (Social, Science concepts), Religious Education (CRE/IRE/HRE), Creative Arts (Art & Craft, Music), Physical Education (Games, movement). Focus on play-based, activity-centered learning.'
        },
        {
          title: 'Upper Primary (Grades 4-6)',
          content: 'Expanded Curriculum: Mathematics, English, Kiswahili, Integrated Science, Social Studies, Religious Education, Creative Arts & Sports, Optional: Agriculture, Home Science. Greater emphasis on written work, projects, group activities. Preparation for Junior School transition.'
        },
        {
          title: 'Junior School (Grades 7-9)',
          content: 'Subject Areas: Languages (English, Kiswahili, Optional Foreign), Mathematics, Integrated Science, Health Education, Pre-Technical & Pre-Career, Social Studies, Religious Education, Sports & Physical Education. Introduction to electives and career pathways. Focus on competency-based assessment.'
        },
        {
          title: 'Senior School (Grades 10-12)',
          content: 'Specialized Pathways: STEM (Science, Technology, Engineering, Math), Social Sciences, Arts & Sports, Technical & Vocational. Learners choose pathway based on interests and aptitudes. Advanced subjects, projects, internships. Preparation for university, TVET, or employment.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting & FAQs',
      icon: HelpCircle,
      color: 'red',
      articles: [
        {
          title: 'Cannot Login',
          content: 'Check: 1) Username/email correct? 2) Password correct (case-sensitive)? 3) Account activated by admin? 4) Internet connection stable? 5) Browser cache cleared? If still failing, contact admin for password reset. Use "Forgot Password" link on login page.'
        },
        {
          title: 'Learner Not Appearing in List',
          content: 'Check Filters: 1) Is correct grade selected? 2) Status filter set to "Active"? (Exited learners hidden by default) 3) Search term spelled correctly? 4) Learner actually added to system? Go to Admissions to verify. If missing, re-add learner.'
        },
        {
          title: 'Report Generation Failing',
          content: 'Common causes: 1) No assessments entered for selected term → Enter formative/summative data first. 2) Learner has no marks → Ensure all subjects assessed. 3) Browser blocking pop-ups → Allow pop-ups for this site. 4) Slow internet → Wait for generation to complete. Try exporting as PDF instead of printing directly.'
        },
        {
          title: 'System Running Slow',
          content: 'Solutions: 1) Close unnecessary browser tabs 2) Clear browser cache & cookies 3) Use Chrome/Edge (better performance) 4) Check internet speed (minimum 2 Mbps recommended) 5) If many users online, performance may dip - schedule heavy tasks (bulk imports, reports) during off-peak hours.'
        },
        {
          title: 'M-Pesa Payment Not Reflecting',
          content: 'Wait time: M-Pesa confirmations take 30 seconds to 5 minutes. Check: 1) Transaction ID sent to phone? 2) Correct business number used? 3) M-Pesa callback URL configured? 4) Check Payment History in system. If payment made but not showing after 10 minutes, contact support with M-Pesa message screenshot.'
        },
        {
          title: 'How to Reset/Change Password',
          content: 'For your account: Settings → User Profile → Change Password → Enter current password, new password (min 8 characters), confirm → Save. For another user (Admin only): Settings → User Management → Find user → Click edit → Click "Reset Password" → Send new password via email or SMS.'
        }
      ]
    }
  ];

  const filteredSections = helpSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.articles.length > 0);

  return (
    <div className="space-y-6">

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for help articles... (e.g., 'SMS setup', 'add learner', 'attendance')"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Try searching "email", "sms", "m-pesa", "attendance", "assessment", or any feature you need help with
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <a
          href="#getting-started"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition cursor-pointer"
        >
          <Book size={32} className="mb-3" />
          <h3 className="font-bold text-lg mb-2">Getting Started</h3>
          <p className="text-blue-100 text-sm">New user? Start here</p>
        </a>

        <a
          href="#communications"
          className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl p-6 hover:from-cyan-600 hover:to-cyan-700 transition cursor-pointer"
        >
          <MessageSquare size={32} className="mb-3" />
          <h3 className="font-bold text-lg mb-2">Communications</h3>
          <p className="text-cyan-100 text-sm">Email, SMS, M-Pesa setup</p>
        </a>

        <a
          href="#video-tutorials"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:from-purple-600 hover:to-purple-700 transition cursor-pointer"
        >
          <Video size={32} className="mb-3" />
          <h3 className="font-bold text-lg mb-2">Video Tutorials</h3>
          <p className="text-purple-100 text-sm">Watch step-by-step guides</p>
        </a>

        <a
          href="mailto:support@elimcrown.ac.ke"
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 hover:from-green-600 hover:to-green-700 transition cursor-pointer"
        >
          <Mail size={32} className="mb-3" />
          <h3 className="font-bold text-lg mb-2">Contact Support</h3>
          <p className="text-green-100 text-sm">Get help from our team</p>
        </a>
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No results found</h3>
            <p className="text-gray-500">Try different search terms or browse categories below</p>
          </div>
        ) : (
          filteredSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div key={section.id} id={section.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${section.color}-100 rounded-lg flex items-center justify-center`}>
                      <SectionIcon className={`text-${section.color}-600`} size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                    <span className="text-sm text-gray-500">({section.articles.length} articles)</span>
                  </div>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {section.articles.map((article, index) => (
                      <div
                        key={index}
                        className="px-6 py-4 border-b last:border-b-0 hover:bg-gray-50 transition"
                      >
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          {article.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed pl-8">{article.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Additional Resources */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <HelpCircle size={20} />
          Need More Help?
        </h3>
        <p className="text-blue-700 mb-4">
          Can't find what you're looking for? Our support team is ready to assist you with any questions or issues.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:support@elimcrown.ac.ke"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
          >
            <Mail size={16} />
            Email Support
          </a>
          <a
            href="tel:0700000000"
            className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold flex items-center gap-2"
          >
            <MessageSquare size={16} />
            Call Us
          </a>
        </div>
        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Support Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM EAT<br />
            <strong>Email:</strong> support@elimcrown.ac.ke<br />
            <strong>Phone:</strong> 0700 000 000<br />
            <strong>Response Time:</strong> Within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportHub;
