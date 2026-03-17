import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/services/api'; // Assuming there's a base api service

const ResetUtility = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [options, setOptions] = useState({
    summativeTests: false,
    formativeAssessments: false,
    gradingScales: false,
    assessmentAudits: false,
  });

  const handleToggle = (id) => {
    setOptions(prev => ({ ...prev, [id]: !prev[id] }));
    setSuccess(null);
    setError(null);
  };

  const hasSelection = Object.values(options).some(v => v);

  const handleReset = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await api.post('/assessments/setup/reset', options);
      if (response.data.success) {
        setSuccess(response.data.data);
        setShowConfirmation(false);
        // Reset selections after success
        setOptions({
          summativeTests: false,
          formativeAssessments: false,
          gradingScales: false,
          assessmentAudits: false,
        });
      } else {
        setError(response.data.message || 'Reset failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-red-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-red-50/50 border-b border-red-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
            </div>
            <div>
              <CardTitle className="text-xl text-red-900">Database Reset Utility</CardTitle>
              <CardDescription className="text-red-700 font-medium">
                Selectively wipe assessment records. This action is irreversible.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50 text-red-900 border-l-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-bold uppercase tracking-tight text-xs">Crucial Warning</AlertTitle>
            <AlertDescription className="text-sm font-medium mt-1">
              Resetting parts of the database will permanently delete the selected records. Ensure you have backups if necessary.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => handleToggle('summativeTests')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                options.summativeTests ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <Checkbox 
                id="summativeTests" 
                checked={options.summativeTests}
                className="mt-1"
              />
              <div className="space-y-1">
                <label htmlFor="summativeTests" className="text-sm font-black text-slate-800 uppercase tracking-tight cursor-pointer">
                  Summative Tests & Results
                </label>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Deletes all summative tests, student marks, and change histories.
                </p>
              </div>
            </div>

            <div 
              onClick={() => handleToggle('formativeAssessments')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                options.formativeAssessments ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <Checkbox 
                id="formativeAssessments" 
                checked={options.formativeAssessments}
                className="mt-1"
              />
              <div className="space-y-1">
                <label htmlFor="formativeAssessments" className="text-sm font-black text-slate-800 uppercase tracking-tight cursor-pointer">
                  Formative Assessments
                </label>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Deletes all CBCA formative ratings and teacher remarks.
                </p>
              </div>
            </div>

            <div 
              onClick={() => handleToggle('gradingScales')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                options.gradingScales ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <Checkbox 
                id="gradingScales" 
                checked={options.gradingScales}
                className="mt-1"
              />
              <div className="space-y-1">
                <label htmlFor="gradingScales" className="text-sm font-black text-slate-800 uppercase tracking-tight cursor-pointer">
                  Scales & Configuration
                </label>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Deletes grading systems, rubric ranges, and scale groups.
                </p>
              </div>
            </div>

            <div 
              onClick={() => handleToggle('assessmentAudits')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                options.assessmentAudits ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <Checkbox 
                id="assessmentAudits" 
                checked={options.assessmentAudits}
                className="mt-1"
              />
              <div className="space-y-1">
                <label htmlFor="assessmentAudits" className="text-sm font-black text-slate-800 uppercase tracking-tight cursor-pointer">
                  SMS & Audit Logs
                </label>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Clear assessment-related SMS records and audit trails.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            {!showConfirmation ? (
              <Button
                disabled={!hasSelection || loading}
                onClick={() => setShowConfirmation(true)}
                className="h-12 px-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-red-100 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Trash2 className="mr-2" size={16} />}
                Initiate Selective Reset
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <p className="text-sm font-bold text-red-900 text-center max-w-sm">
                  Are you absolutely sure? This will permanently remove the data from the server.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowConfirmation(false)}
                    className="h-11 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReset}
                    className="h-11 px-8 rounded-xl bg-red-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-200"
                  >
                    Yes, Reset Selected
                  </Button>
                </div>
              </div>
            )}
            
            {!hasSelection && !success && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Select at least one category to continue
              </p>
            )}
          </div>

          {success && (
            <Alert className="mt-8 border-brand-teal bg-brand-teal/5 text-brand-teal border-l-4">
              <CheckCircle2 className="h-5 w-5" />
              <AlertTitle className="font-black uppercase tracking-tight text-xs">Reset Successful</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="text-[11px] font-medium">The following items were successfully cleared from the database:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(success).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center bg-white/50 px-3 py-1.5 rounded-lg border border-brand-teal/10">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{key.replace(/Deleted/g, '')}</span>
                      <span className="text-xs font-black">{val}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-8 border-red-200 bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-bold">Error Occurred</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetUtility;
