import React from 'react';
import { Camera } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ProfileHeader = ({
    name,
    avatar,
    avatarFallback,
    status,
    badges = [],
    tabs = [],
    activeTab,
    onTabChange,
    onPhotoClick,
    bannerPattern = 'pattern-grid-lg',
    bannerColor = 'brand-teal',
    quickStats = [],
    compact = false
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
            {/* Elegant Banner Area */}
            <div className={`${compact ? 'h-24' : 'h-32'} bg-gray-50 border-b border-gray-100 relative overflow-hidden transition-all`}>
                <div className={`absolute inset-0 opacity-10 ${bannerPattern} text-${bannerColor}`}></div>
                <div className="absolute inset-0 bg-white/20"></div>
            </div>

            <div className="px-8 pb-4">
                {/* Profile Identity Section */}
                <div className="relative flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                    <div className="flex items-end gap-6 w-full md:w-auto">
                        {/* Avatar */}
                        <div className={`group relative ${compact ? 'w-24 h-24' : 'w-28 h-28'} bg-white p-1 rounded-full shadow-lg transition-all`}>
                            <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center text-3xl font-medium text-gray-400 overflow-hidden border-2 border-white ring-1 ring-gray-100">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center bg-${bannerColor} text-white text-3xl font-medium`}>
                                        {avatarFallback || '??'}
                                    </div>
                                )}
                            </div>
                            {onPhotoClick && (
                                <button
                                    onClick={onPhotoClick}
                                    className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                >
                                    <Camera size={24} className="mb-1" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">Change</span>
                                </button>
                            )}
                        </div>

                        {/* Identity Details */}
                        <div className="mb-1 flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className={`${compact ? 'text-2xl' : 'text-3xl'} font-medium text-gray-900 tracking-tight transition-all`}>
                                    {name}
                                </h2>
                                {status && <StatusBadge status={status} />}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-gray-600 mt-2">
                                {badges.map((badge, idx) => (
                                    <React.Fragment key={idx}>
                                        {idx > 0 && <span className="text-gray-300">•</span>}
                                        <span className={`flex items-center gap-1.5 text-sm font-medium ${badge.className || ''}`}>
                                            {badge.icon && <badge.icon size={14} className="text-gray-400" />}
                                            {badge.text}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Optional Quick Stats Row */}
                {quickStats.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-2">
                        {quickStats.map((stat, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
                                <p className={`text-lg font-medium ${stat.className || 'text-gray-900'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Standardized Tabs Navigation */}
                {tabs.length > 0 && (
                    <div className="border-t border-gray-100 flex overflow-x-auto hide-scrollbar pt-2 -mx-8 px-8 no-print">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id
                                    ? `border-${bannerColor} text-${bannerColor} bg-${bannerColor}/5 rounded-t-lg`
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileHeader;
