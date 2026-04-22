import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Gauge, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';

const PerformanceScale = () => {
    useEffect(() => {
        // Automatically redirect admins to the new location
        const navigateToSettings = () => {
            window.dispatchEvent(new CustomEvent('pageNavigate', {
                detail: { page: 'settings-academic', params: { tab: 'performance-levels' } }
            }));
        };

        const timer = setTimeout(navigateToSettings, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <Card className="max-w-md w-full border-indigo-100 shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                        <Gauge className="text-indigo-600" size={32} />
                    </div>
                    <CardTitle className="text-2xl font-medium text-slate-900">Module Relocated</CardTitle>
                    <CardDescription className="text-slate-500">
                        Performance Scale management has been moved to Academic Settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-4 space-y-6">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        To centralize administrative controls, all grading rubrics and performance levels are now managed under the 
                        <span className="font-medium text-slate-900"> Academic Settings</span> tab.
                    </p>
                    
                    <Button 
                        onClick={() => window.dispatchEvent(new CustomEvent('pageNavigate', {
                            detail: { page: 'settings-academic', params: { tab: 'performance-levels' } }
                        }))}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 flex items-center justify-center gap-2 group transition-all"
                    >
                        <span>Go to Academic Settings</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <p className="text-[10px] text-slate-400 font-medium italic">
                        You will be redirected automatically in a few seconds...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default PerformanceScale;
