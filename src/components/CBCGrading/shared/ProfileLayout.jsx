import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

const ProfileLayout = ({
    title,
    onBack,
    onPrint,
    primaryAction,
    secondaryAction,
    children
}) => {
    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Standardized Page Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600 no-print shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {onPrint && (
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-bold text-sm transition shadow-sm no-print"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className={`px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm font-bold text-sm flex items-center gap-2 no-print ${secondaryAction.className || ''}`}
                        >
                            {secondaryAction.icon && <secondaryAction.icon size={18} />}
                            {secondaryAction.label}
                        </button>
                    )}
                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            className={`px-5 py-2.5 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition shadow-md font-bold text-sm tracking-wide no-print ${primaryAction.className || ''}`}
                        >
                            {primaryAction.icon && <primaryAction.icon size={18} />}
                            {primaryAction.label}
                        </button>
                    )}
                </div>
            </div>

            {/* Layout Body */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default ProfileLayout;
