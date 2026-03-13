import React from 'react';
import {
    Trophy,
    Target,
    Brain,
    Lightbulb,
    TrendingUp,
    Briefcase,
    ExternalLink
} from 'lucide-react';

/**
 * PathwayPredictionPage - Page 2 of the Comprehensive CBC Report
 * AI-powered career navigation and pathway analysis for Grade 7-8 students.
 */
const PathwayPredictionPage = ({ data, brandColor = '#4a0404' }) => {
    if (!data || !data.pathwayPrediction) return null;

    const {
        predictedPathway,
        confidence,
        justification,
        careerRecommendations,
        growthAreas,
        clusterBreakdown
    } = data.pathwayPrediction;

    // Percentage calculations for the bar charts
    const stemWidth = `${clusterBreakdown?.STEM || 0}%`;
    const socialWidth = `${clusterBreakdown?.Social || 0}%`;
    const artsWidth = `${clusterBreakdown?.Arts || 0}%`;

    return (
        <div
            className="bg-white text-gray-900 font-sans p-10 flex flex-col page-break-before-always"
            style={{
                width: '794px',
                height: '1123px',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #eee'
            }}
        >
            {/* 1. SECTION HEADER */}
            <div className="flex items-center gap-4 mb-8 pb-4 border-b-2" style={{ borderColor: brandColor }}>
                <div className="p-3 rounded-lg text-white" style={{ backgroundColor: brandColor }}>
                    <Brain size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">AI Pathway Prediction</h2>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Senior School Career Navigator (Junior School Preview)</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 flex-grow">
                {/* LEFT COLUMN: VISUAL ANALYTICS */}
                <div className="col-span-12 lg:col-span-5 space-y-8">

                    {/* PATHWAY BADGE */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Recommended Pathway</p>
                        <div className="inline-flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-white shadow-inner" style={{ color: brandColor, border: `4px solid ${brandColor}` }}>
                                {predictedPathway?.includes('STEM') ? <Target size={40} /> :
                                    predictedPathway?.includes('Social') ? <Brain size={40} /> : <Trophy size={40} />}
                            </div>
                            <h3 className="text-xl font-black uppercase" style={{ color: brandColor }}>{predictedPathway || 'Analyzing...'}</h3>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-600">
                                    CONFIDENCE: {confidence}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CLUSTER BREAKDOWN VISUAL */}
                    <div className="space-y-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Academic Strength Clusters</p>

                        {/* STEM Cluster */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black uppercase text-gray-700">STEM Cluster</span>
                                <span className="text-xs font-bold text-gray-500">{clusterBreakdown?.STEM}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: stemWidth, backgroundColor: brandColor }}
                                />
                            </div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase italic">Maths, Integrated Science, Pre-Tech, Agriculture</p>
                        </div>

                        {/* Social Cluster */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black uppercase text-gray-700">Social Sciences</span>
                                <span className="text-xs font-bold text-gray-500">{clusterBreakdown?.Social}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gray-400 opacity-60"
                                    style={{ width: socialWidth }}
                                />
                            </div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase italic">Languages, Social Studies, RE, Life Skills</p>
                        </div>

                        {/* Arts Cluster */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black uppercase text-gray-700">Arts & Sports</span>
                                <span className="text-xs font-bold text-gray-500">{clusterBreakdown?.Arts}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gray-300 opacity-60"
                                    style={{ width: artsWidth }}
                                />
                            </div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase italic">Creative Arts, Music, P.E.</p>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: AI INSIGHTS */}
                <div className="col-span-12 lg:col-span-7 space-y-8 border-l border-gray-100 pl-8">

                    {/* JUSTIFICATION */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-brand-purple">
                            <Lightbulb size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-800">Counselor's Insight</h4>
                        </div>
                        <div className="bg-brand-purple/5 p-5 rounded-xl border border-brand-purple/10">
                            <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                                "{justification || "The learner exhibits balanced potential across multiple areas, with a distinct leaning towards experimental and analytical thinking styles typical of the STEM pathway."}"
                            </p>
                        </div>
                    </div>

                    {/* CAREER RECOMMENDATIONS */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-brand-teal">
                            <Briefcase size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-800">Potential Career Horizons</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {careerRecommendations?.map((career, i) => (
                                <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
                                    <span className="text-sm font-bold text-gray-700">{career}</span>
                                    <ExternalLink size={12} className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GROWTH AREAS */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-orange-500">
                            <TrendingUp size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-800">Future Readiness Tips</h4>
                        </div>
                        <ul className="space-y-2">
                            {growthAreas?.map((tip, i) => (
                                <li key={i} className="flex gap-2 text-[11px] font-bold text-gray-600">
                                    <span className="text-orange-500">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            {/* FOOTER ADVICE */}
            <div className="mt-10 p-6 bg-gray-900 rounded-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Important Note for Parents</h5>
                    <p className="text-[11px] font-medium leading-relaxed">
                        This predictive analysis is generated by Zawadi AI based on terminal academic performance.
                        It is intended for **career guidance only** and should be discussed with the learner's subject teachers and
                        career counselor to ensure alignment with the child's natural passions and tertiary goals.
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Brain size={80} />
                </div>
            </div>

            {/* SIGNATURE SECTION */}
            <div className="mt-8 grid grid-cols-2 gap-10 pt-6 border-t border-gray-100">
                <div className="text-center">
                    <div className="border-b border-gray-200 h-8 mb-1"></div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Career Guidance Counselor</p>
                </div>
                <div className="text-center">
                    <div className="border-b border-gray-200 h-8 mb-1"></div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Parent/Guardian Signature</p>
                </div>
            </div>
        </div>
    );
};

export default PathwayPredictionPage;
