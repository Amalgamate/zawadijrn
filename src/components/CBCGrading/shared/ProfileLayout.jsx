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
                    <h1 className="text-2xl font-medium text-gray-800 tracking-tight">{title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {onPrint && (
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition shadow-sm no-print"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            disabled={secondaryAction.isLoading || secondaryAction.disabled}
                            className={`px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium text-sm flex items-center gap-2 no-print ${secondaryAction.className || ''} ${(secondaryAction.isLoading || secondaryAction.disabled) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {secondaryAction.icon && <secondaryAction.icon size={18} className={secondaryAction.isLoading ? 'animate-spin' : ''} />}
                            {secondaryAction.label}
                        </button>
                    )}
                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            disabled={primaryAction.isLoading || primaryAction.disabled}
                            className={`px-5 py-2.5 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition shadow-md font-medium text-sm tracking-wide flex items-center gap-2 no-print border border-transparent hover:border-brand-teal/20 ${primaryAction.className || ''} ${(primaryAction.isLoading || primaryAction.disabled) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {primaryAction.icon && <primaryAction.icon size={18} className={primaryAction.isLoading ? 'animate-spin' : ''} />}
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
