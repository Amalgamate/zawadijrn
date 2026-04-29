import React from 'react';

/**
 * IndividualTestTemplate - CORPORATE EDITION
 * Professional focused result statement for a single assessment.
 */
const IndividualTestTemplate = ({ testData, learner, reportData = {}, id = "individual-test-report-content" }) => {
    if (!testData || !learner) return null;

    const brandColor = testData.brandColor || '#4a0404'; // Deep Maroon

    return (
        <div
            id={id}
            className="bg-white text-gray-900 font-sans p-10 mx-auto"
            style={{
                width: '794px',
                minHeight: '1123px', // EXACT A4 Height at 96dpi
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                position: 'relative',
                border: '1px solid #eee'
            }}
        >
            {/* 1. CORPORATE HEADER */}
            <div className="flex justify-between items-start mb-10 border-b-2 pb-6" style={{ borderColor: brandColor }}>
                <div className="flex items-center gap-5">
                    <div className="w-24 h-24 flex items-center justify-center rounded bg-white shadow-sm border border-gray-100 overflow-hidden">
                        {testData.logoUrl && testData.logoUrl !== '/branding/logo.png' ? (
                            <img src={testData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <img src="/branding/logo.png" alt="Logo" className="max-w-full max-h-full object-contain" />
                        )}
                    </div>
                    <div className="text-left">
                        <h1 className="text-3xl font-semibold uppercase tracking-tight leading-none mb-1">
                            {testData.schoolName || 'ACADEMIC SCHOOL'}
                        </h1>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-[0.1em]">
                            {testData.schoolMotto || 'Excellence in Knowledge and Character'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-5 py-2 bg-gray-900 text-white mb-2 inline-block rounded-sm font-semibold uppercase tracking-widest text-lg">
                        Test Statement
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest leading-none mt-2">
                        Continuous Assessment Result
                    </p>
                </div>
            </div>

            {/* 2. LEARNER & ASSESSMENT INFO */}
            <div className="flex gap-10 mb-10">
                <div className="flex-1 space-y-4">
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">Learner Particulars</p>
                        <h3 className="text-3xl font-semibold text-gray-800 uppercase italic leading-tight border-b-2 border-gray-900 pb-1">
                            {learner.firstName} {learner.lastName}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Admission Number</p>
                            <p className="text-lg font-semibold text-gray-800">{learner.admissionNumber}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Grade Level</p>
                            <p className="text-lg font-semibold text-gray-800 uppercase">{learner.grade}</p>
                        </div>
                    </div>
                </div>
                <div className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col justify-center text-center shadow-inner">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 font-semibold">Assessment Topic</p>
                    <h4 className="text-xl font-semibold text-indigo-900 uppercase leading-tight mb-2">
                        {testData.test?.learningArea || 'Learning Area'}
                    </h4>
                    <div className="inline-block px-3 py-1 bg-white border border-gray-300 rounded font-semibold text-[10px] text-gray-600 uppercase tracking-widest">
                        {testData.test?.title || 'Main Examination'}
                    </div>
                </div>
            </div>

            {/* 3. CORE RESULT BLOCK - CENTERED IMPACT */}
            <div className="mb-12 border-2 border-gray-900 rounded-lg overflow-hidden flex shadow-2xl">
                <div className="flex-1 p-10 flex flex-col items-center justify-center text-center text-white" style={{ backgroundColor: brandColor }}>
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-4">Performance Rank</p>
                    <div className="text-8xl font-semibold italic tracking-tighter mb-2">{testData.grade || (testData.percentage >= 80 ? 'A' : testData.percentage >= 60 ? 'B' : testData.percentage >= 50 ? 'C' : 'D')}</div>
                    <p className="text-lg font-semibold uppercase tracking-[0.3em] font-medium">Grade Level</p>
                </div>

                <div className="flex-[2] p-10 bg-white grid grid-cols-2 gap-10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Raw Score</p>
                        <p className="text-5xl font-semibold text-gray-900">
                            {testData.marksObtained} <span className="text-sm text-gray-400 font-medium tracking-normal italic">/ {testData.test?.totalMarks || 100}</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Percentage</p>
                        <p className="text-5xl font-semibold text-indigo-900">
                            {testData.percentage}%
                        </p>
                    </div>
                    <div className="col-span-2 border-t pt-6 grid grid-cols-2">
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Class Position</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {testData.position || '--'} <span className="text-[10px] text-gray-400 font-medium tracking-normal uppercase italic">out of {testData.outOf || '--'}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Performance Status</p>
                            <p className={`text-2xl font-semibold ${testData.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                {testData.percentage >= 50 ? 'PASS' : 'RETAKE SUGGESTED'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. FEEDBACK SECTION */}
            <div className="bg-gray-50 p-8 rounded border border-gray-200 mb-10 border-l-8" style={{ borderLeftColor: brandColor }}>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-[0.2em] mb-4">Instructor Feedback</h3>
                <p className="text-xl font-medium italic text-gray-700 leading-relaxed">
                    "{testData.teacherComment || 'Satisfactory performance. The learner demonstrates conceptual mastery while maintaining attention to technical detail.'}"
                </p>
            </div>

            {/* 5. SIGNATURES & VALIDATION - FIXED AT BOTTOM */}
            <div className="mt-auto pt-10 border-t border-dashed border-gray-300 grid grid-cols-2 gap-20">
                <div className="text-center">
                    <div className="h-10 border-b border-gray-900 flex items-center justify-center relative">
                        <span className="text-xs font-medium italic opacity-20 select-none uppercase tracking-widest">Official Verification Required</span>
                        {reportData?.schoolStamp && (
                            <img
                                src={reportData.schoolStamp}
                                alt="Stamp"
                                className="absolute h-14 w-auto object-contain opacity-70 pointer-events-none"
                                style={{ mixBlendMode: 'multiply', top: '-10px' }}
                            />
                        )}
                    </div>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mt-2">Subject Instructor Signature</p>
                </div>
                <div className="text-center">
                    <div className="h-10 border-b border-gray-900"></div>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mt-2">Parent / Guardian Acknowledgement</p>
                </div>
            </div>

            {/* SUB-FOOTER */}
            <div className="mt-8 text-center text-gray-300 border-t border-gray-50 pt-4">
                <p className="text-[8px] font-semibold uppercase tracking-[0.5em] mb-2 leading-none">Internal Academic Document - Not a Permanent Certificate</p>
                <p className="text-[10px] font-medium text-gray-400 italic">
                    Generated on {new Date().toLocaleDateString()} for {learner.firstName} {learner.lastName}.
                </p>
            </div>
        </div>
    );
};

export default IndividualTestTemplate;
