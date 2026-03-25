import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';

const MobileDashboard = ({ onNavigate, brandingSettings, user }) => {
    const { navSections } = useNavigation();

    // Filter out the dashboard itself so we don't have a button that links to where we already are
    const menuSections = navSections.filter(section => section.id !== 'dashboard');

    return (
        <div className="pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Welcome Card */}
            <div className="mb-6 bg-gradient-to-br from-[var(--brand-purple)] to-[#8c0082] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>

                <h2 className="text-2xl font-black tracking-tight relative z-10">
                    Hello, {user?.name?.split(' ')[0] || 'User'} 👋
                </h2>
                <p className="text-sm font-medium text-white/80 mt-1 relative z-10">
                    Welcome to {brandingSettings?.schoolName || 'Zawadi SMS'}
                </p>
            </div>

            <div className="px-1">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">Quick Access</h3>

                {/* Circular Grid Menu map */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-6">
                    {menuSections.map(section => {
                        // Find the default path for this section
                        const getFirstValidPath = (items) => {
                            if (!items || items.length === 0) return section.id;
                            for (const item of items) {
                                if (item.type === 'group') {
                                    const p = getFirstValidPath(item.items);
                                    if (p !== section.id) return p;
                                } else if (!item.comingSoon && item.path) {
                                    return item.path;
                                }
                            }
                            return section.id;
                        };

                        const defaultPath = getFirstValidPath(section.items);

                        return (
                            <button
                                key={section.id}
                                onClick={() => onNavigate(defaultPath)}
                                className="flex flex-col items-center gap-2 group outline-none"
                            >
                                <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[var(--brand-purple)] group-hover:bg-[var(--brand-purple)] group-hover:text-white transform group-hover:-translate-y-1 transition-all group-active:scale-95 duration-200">
                                    <section.icon size={26} strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-bold text-gray-600 group-hover:text-gray-900 text-center line-clamp-2 leading-tight tracking-tight">
                                    {section.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MobileDashboard;
