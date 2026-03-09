import React, { useState, useEffect } from 'react';
import { Settings, BookOpen, PenTool } from 'lucide-react';
import SummativeAssessmentMobile from './SummativeAssessmentMobile';
import FormativeAssessment from './FormativeAssessment';
import SummativeTestsRouter from './SummativeTestsRouter';
import PerformanceScale from './PerformanceScale';

/**
 * MobileAssessmentsDashboard
 * Full-screen overlay with Summative / Formative tabs + config gear.
 * Rendered OUTSIDE MobileAppShell to avoid overflow:hidden clipping of fixed position.
 */
const MobileAssessmentsDashboard = ({ learners, brandingSettings, onNavigate, onBack }) => {
    const [activeTab, setActiveTab] = useState('summative');
    const [showConfigMenu, setShowConfigMenu] = useState(false);

    // Close config menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showConfigMenu && !event.target.closest('.cfg-menu')) {
                setShowConfigMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showConfigMenu]);

    return (
        /* z-30: above shell content (z-10) but below top bar + bottom nav (z-50) */
        <div className="fixed inset-0 flex flex-col bg-gray-50" style={{ zIndex: 35, paddingBottom: '64px', paddingTop: '64px' }}>

            {/* ── Tab Bar ── */}
            <div className="bg-white border-b border-gray-200 shadow-sm flex items-center px-4 shrink-0" style={{ position: 'relative', zIndex: 40 }}>
                <button
                    onClick={() => { setActiveTab('summative'); setShowConfigMenu(false); }}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'summative' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'}`}
                >
                    Summative
                </button>
                <button
                    onClick={() => { setActiveTab('formative'); setShowConfigMenu(false); }}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'formative' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'}`}
                >
                    Formative
                </button>

                {/* Gear icon */}
                <div className="cfg-menu relative">
                    <button
                        onClick={() => setShowConfigMenu(v => !v)}
                        className={`ml-2 py-3 px-3 border-b-2 transition-colors ${['tests', 'scales'].includes(activeTab) || showConfigMenu ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'}`}
                    >
                        <Settings size={20} />
                    </button>
                    {showConfigMenu && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 overflow-hidden" style={{ zIndex: 50 }}>
                            <button
                                onClick={() => { setActiveTab('tests'); setShowConfigMenu(false); }}
                                className={`w-full px-4 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'tests' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <BookOpen size={16} /> Tests
                            </button>
                            <button
                                onClick={() => { setActiveTab('scales'); setShowConfigMenu(false); }}
                                className={`w-full px-4 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'scales' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <PenTool size={16} /> Grading Scales
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tab Content ── 
                Uses overflow-y-auto + relative so embedded components scroll within this area.
                We pass embedded=true to SummativeAssessmentMobile so it drops fixed positioning. */}
            <div className="flex-1 overflow-y-auto relative bg-slate-50">
                {activeTab === 'summative' && (
                    <SummativeAssessmentMobile
                        learners={learners}
                        brandingSettings={brandingSettings}
                        embedded={true}
                        onBack={() => onNavigate && onNavigate('dashboard')}
                    />
                )}
                {activeTab === 'formative' && (
                    <FormativeAssessment learners={learners} />
                )}
                {activeTab === 'tests' && (
                    <SummativeTestsRouter />
                )}
                {activeTab === 'scales' && (
                    <PerformanceScale />
                )}
            </div>
        </div>
    );
};

export default MobileAssessmentsDashboard;
