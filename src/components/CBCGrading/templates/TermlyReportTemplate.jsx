import React from 'react';

/**
 * TermlyReportTemplate - CORPORATE EDITION
 * Professional, clean design optimized for single-page A4 balance.
 */
const TermlyReportTemplate = ({ reportData, id = "termly-report-content" }) => {
    if (!reportData) return null;

    const brandColor = reportData.brandColor || '#4a0404'; // Deep Maroon

    return (
        <div
            id={id}
            className="bg-white text-gray-900 font-sans p-10 mx-auto"
            style={{
                width: '794px',
                height: '1123px', // EXACT A4 Height at 96dpi
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #eee'
            }}
        >
            {/* 1. CORPORATE HEADER */}
            <div className="flex justify-between items-start mb-6 border-b-2 pb-6" style={{ borderColor: brandColor }}>
                <div className="flex items-center gap-5">
                    <div className="w-24 h-24 flex items-center justify-center rounded bg-white shadow-sm border border-gray-100 overflow-hidden">
                        {reportData.logoUrl && reportData.logoUrl !== '/logo-new.png' ? (
                            <img src={reportData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <img src="/logo-new.png" alt="Logo" className="max-w-full max-h-full object-contain" />
                        )}
                    </div>
                    <div className="text-left">
                        <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">
                            {reportData.schoolName || 'ACADEMIC SCHOOL'}
                        </h1>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.1em]">
                            {reportData.schoolAddress || 'P.O. Box 1234, Nairobi, Kenya'}
                        </p>
                        <div className="flex gap-4 mt-1 text-[10px] font-bold text-gray-400 uppercase">
                            <span>TEL: {reportData.schoolPhone || '+254 700 000000'}</span>
                            <span>•</span>
                            <span>EMAIL: {reportData.schoolEmail || 'info@school.ac.ke'}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-5 py-2 text-white mb-2 inline-block rounded-sm font-black uppercase tracking-widest text-lg" style={{ backgroundColor: brandColor }}>
                        Progress Report
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {reportData.term?.replace('_', ' ') || 'Term'} | {reportData.academicYear || '2025'}
                    </p>
                </div>
            </div>

            {/* 2. LEARNER INFO TILE */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6 grid grid-cols-4 gap-4 shadow-sm">
                <div className="col-span-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Learner Full Name</p>
                    <p className="text-xl font-bold text-gray-800 uppercase tracking-tight border-b border-gray-300 pb-1">
                        {reportData.learner.firstName} {reportData.learner.lastName}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Admission No</p>
                    <p className="text-lg font-bold text-gray-800">{reportData.learner.admissionNumber}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grade Level</p>
                    <p className="text-lg font-bold text-gray-800 uppercase">{reportData.learner.grade}</p>
                </div>
            </div>

            {/* 3. PERFORMANCE TABLE - BALANCED */}
            <div className="mb-6 flex-grow flex flex-col border border-gray-900 rounded-sm overflow-hidden shadow-md bg-white">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-white" style={{ backgroundColor: brandColor }}>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest border-r border-white/20">Learning Area</th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest border-r border-white/20 w-32">Points / Marks</th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest w-32">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(reportData.summative?.summary?.bySubject || []).map((subject, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2.5 text-sm font-bold text-gray-700">{subject.subject}</td>
                                <td className="px-4 py-2.5 text-center text-sm font-bold text-gray-900 border-x border-gray-100">{subject.averagePercentage}%</td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className="font-bold text-lg" style={{ color: brandColor }}>{subject.grade}</span>
                                </td>
                            </tr>
                        ))}
                        {/* Fill remaining space to keep table size consistent */}
                        {Array.from({ length: Math.max(0, 10 - (reportData.summative?.summary?.bySubject?.length || 0)) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="h-9">
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 4. PERFORMANCE SUMMARY & KEY - COMPACT SIDE-BY-SIDE */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-1">Teacher's General Remarks</h4>
                    <p className="text-sm font-bold italic text-gray-600 leading-relaxed">
                        "{reportData.comments?.classTeacher || 'The learner has shown dedicated interest in all learning areas. Remarkable progress observed in social skills and mathematical reasoning.'}"
                    </p>
                </div>
                <div className="bg-white border border-gray-200 rounded p-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-1 text-center">Grading System Key</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-[9px] font-black uppercase">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> <span>80 - 100 : EXCEEDING</span></div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> <span>60 - 79 : MEETING</span></div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> <span>50 - 59 : APPROACHING</span></div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> <span>BELOW 50 : SUPPORT</span></div>
                    </div>
                </div>
            </div>

            {/* 5. CORPORATE FOOTER WITH SIGNATURES - FIXED AT BOTTOM */}
            <div className="mt-auto border-t-2 pt-6" style={{ borderColor: brandColor }}>
                <div className="grid grid-cols-3 gap-10 mb-6">
                    <div className="text-center">
                        <div className="border-b border-gray-300 h-8 mb-1"></div>
                        <p className="text-[9px] font-black text-gray-500 uppercase">Class Teacher</p>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                        {reportData.schoolStamp ? (
                            <img
                                src={reportData.schoolStamp}
                                alt="Stamp"
                                className="w-16 h-16 object-contain mb-1 opacity-80"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        ) : (
                            <div className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center mb-1">
                                <span className="text-[8px] font-black text-gray-300 uppercase leading-none">School<br />Stamp</span>
                            </div>
                        )}
                    </div>
                    <div className="text-center">
                        <div className="border-b border-gray-300 h-8 mb-1"></div>
                        <p className="text-[9px] font-black text-gray-500 uppercase">Head Teacher</p>
                    </div>
                </div>

                <div className="bg-gray-900 text-white p-3 rounded-sm text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                        {reportData.schoolSlogan || 'Excellence in Knowledge and Character'}
                    </p>
                    <p className="text-[8px] font-bold opacity-60">
                        Valid only with official school stamp and signatures. Generated via Zawadi SMS on {new Date().toLocaleDateString()}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermlyReportTemplate;
