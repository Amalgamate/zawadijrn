import React, { useState, useEffect } from 'react';
import { Settings, BookOpen, PenTool, CheckCircle, Target, Star, Heart, ArrowLeft } from 'lucide-react';
import SummativeAssessmentMobile from './SummativeAssessmentMobile';
import FormativeAssessment from './FormativeAssessment';
import CoreCompetenciesAssessment from './CoreCompetenciesAssessment';
import ValuesAssessment from './ValuesAssessment';
import SummativeTestsRouter from './SummativeTestsRouter';
import PerformanceScale from './PerformanceScale';
import { useInstitutionLabels } from '../../../hooks/useInstitutionLabels';
import { cn } from '../../../utils/cn';

const MobileAssessmentsDashboard = ({ learners, brandingSettings, onNavigate, onBack }) => {
    const [activeTab, setActiveTab] = useState('summative');
    const [showConfigMenu, setShowConfigMenu] = useState(false);
    const labels = useInstitutionLabels();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showConfigMenu && !event.target.closest('.cfg-menu')) {
                setShowConfigMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showConfigMenu]);

    const tabs = [
        { id: 'summative', label: 'Summative', icon: Target },
        { id: 'formative', label: 'Formative', icon: CheckCircle },
        { id: 'competencies', label: 'Competence', icon: Star },
        { id: 'values', label: 'Values', icon: Heart },
    ];

    const handleBack = () => {
        if (['tests', 'scales'].includes(activeTab)) {
            setActiveTab('summative');
        } else if (onBack) {
            onBack();
        } else if (onNavigate) {
            onNavigate('dashboard');
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-white z-[30] font-sans" style={{ paddingBottom: '80px' }}>
            
            {/* ── Premium Tab Bar with Glassmorphism ── */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center px-4 shrink-0 sticky top-0 z-40 shadow-sm">
                <button 
                   onClick={handleBack}
                   className="p-2 mr-1 text-gray-400 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex-1 flex gap-5 overflow-x-auto no-scrollbar py-0.5 ml-1">
                    {tabs.map((tab) => {
                         const Icon = tab.icon;
                         const isActive = activeTab === tab.id;
                         return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setShowConfigMenu(false); }}
                                className={cn(
                                    "flex items-center gap-2 py-4 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all relative whitespace-nowrap",
                                    isActive ? "text-[var(--brand-purple)]" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Icon size={14} strokeWidth={isActive ? 3 : 2.5} />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--brand-purple)] rounded-full shadow-[0_-2px_10px_rgba(82,0,80,0.4)] animate-in slide-in-from-bottom-1 duration-300" />
                                )}
                            </button>
                         );
                    })}
                </div>

                {/* Configuration Anchor */}
                <div className="cfg-menu relative ml-2">
                    <button
                        onClick={() => setShowConfigMenu(v => !v)}
                        className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90",
                            ['tests', 'scales'].includes(activeTab) || showConfigMenu 
                                ? "bg-purple-100/50 text-[var(--brand-purple)] border border-purple-200" 
                                : "text-gray-400 hover:bg-gray-50 bg-gray-50/50"
                        )}
                    >
                        <Settings size={20} strokeWidth={2.5} />
                    </button>
                    
                    {showConfigMenu && (
                        <div className="absolute top-full right-0 mt-3 w-60 bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-purple-200 py-3 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200" style={{ zIndex: 100 }}>
                            <div className="px-6 py-3 mb-1">
                                <p className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest leading-none">Assessment Suite</p>
                            </div>
                            <button
                                onClick={() => { setActiveTab('tests'); setShowConfigMenu(false); }}
                                className={cn(
                                    "w-full px-6 py-4 text-xs font-medium text-left flex items-center gap-4 transition-all",
                                    activeTab === 'tests' ? "bg-[var(--brand-purple)]/5 text-[var(--brand-purple)]" : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center transition-colors", activeTab === 'tests' ? "bg-white shadow-sm text-[var(--brand-purple)]" : "bg-gray-100 text-gray-400")}>
                                    <BookOpen size={18} strokeWidth={2.5} />
                                </div>
                                <span className="font-semibold uppercase tracking-tight">Configure Tests</span>
                            </button>
                            <button
                                onClick={() => { setActiveTab('scales'); setShowConfigMenu(false); }}
                                className={cn(
                                    "w-full px-6 py-4 text-xs font-medium text-left flex items-center gap-4 transition-all",
                                    activeTab === 'scales' ? "bg-[var(--brand-purple)]/5 text-[var(--brand-purple)]" : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center transition-colors", activeTab === 'scales' ? "bg-white shadow-sm text-[var(--brand-purple)]" : "bg-gray-100 text-gray-400")}>
                                    <PenTool size={18} strokeWidth={2.5} />
                                </div>
                                <span className="font-semibold uppercase tracking-tight">Performance Scales</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content Area ── */}
            <div className="flex-1 overflow-y-auto relative bg-white">
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
                {activeTab === 'competencies' && (
                    <CoreCompetenciesAssessment learners={learners} />
                )}
                {activeTab === 'values' && (
                    <ValuesAssessment learners={learners} />
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
