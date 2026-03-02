import React from 'react';
import { Construction } from 'lucide-react';

const VendorManager = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-brand-purple/10 rounded-full flex items-center justify-center mb-6">
            <Construction size={40} className="text-brand-purple animate-bounce" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Vendor Management</h1>
        <p className="text-gray-500 max-w-md">
            This accounting sub-module is currently being activated.
            The backend services are ready, and this interface will be available in the next update.
        </p>
    </div>
);

export default VendorManager;
