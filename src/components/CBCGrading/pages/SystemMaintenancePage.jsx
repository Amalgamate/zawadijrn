import React, { useState } from 'react';
import { 
  ShieldAlert, RefreshCcw, Database, AlertTriangle, CheckCircle2, 
  Trash2, Loader2, ArrowLeft, Info, Search, Eraser
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import usePageNavigation from '../../../hooks/usePageNavigation';

const SystemMaintenancePage = () => {
  const navigateTo = usePageNavigation();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetStatus, setResetStatus] = useState('idle'); // idle, loading, success, error

  const REQUIRED_CONFIRM_TEXT = 'RESET TOTAL ACCOUNTING';

  const handleTotalReset = async () => {
    if (confirmText !== REQUIRED_CONFIRM_TEXT) {
      showError('Confirmation text mismatch');
      return;
    }

    try {
      setLoading(true);
      setResetStatus('loading');
      
      const response = await api.fees.resetAllAccounting({
        confirmToken: 'RESET_TOTAL_ACCOUNTING'
      });

      if (response.success) {
        showSuccess(response.message || 'Total reset complete!');
        setResetStatus('success');
        setConfirmText('');
        // We stay here to show the success state, but user can navigate away
      }
    } catch (error) {
      console.error('Reset error:', error);
      showError(error.message || 'Global reset failed. Please contact technical support.');
      setResetStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigateTo('FINANCE_DASHBOARD')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-medium text-slate-900">System Maintenance</h1>
          <p className="text-slate-500 text-sm">Administrative tools for data management and recovery</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Safety Header */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">Privileged Operations Area</h3>
            <p className="text-amber-800 text-sm mt-1">
              Actions in this section can cause permanent data loss or system-wide changes. 
              Only proceed if you are a designated Super Administrator.
            </p>
          </div>
        </div>

        {/* Total Accounting Reset Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                  <Eraser className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 text-lg">Total Financial Reset</h4>
                  <p className="text-slate-500 text-sm">Wipe all invoices, payments, and ledger entries for a fresh start.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
              <h5 className="text-xs font-medium text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-3 h-3" /> What will be deleted:
              </h5>
              <ul className="text-sm text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1 ml-5 list-disc">
                <li>Every Fee Invoice (All terms/years)</li>
                <li>All Fee Payments & Receipts</li>
                <li>All Fee Waivers & Pledges</li>
                <li>The entire General Ledger (Journal Entries)</li>
                <li>All recorded Expenses</li>
                <li>All Payroll History</li>
              </ul>
              <p className="text-xs text-red-600 font-medium mt-3 italic">
                * Structural data like Students, Staff, and Fee Structures will NOT be touched.
              </p>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setShowResetModal(true)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-all shadow-sm active:transform active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Factory Reset Accounting
              </button>
            </div>
          </div>
        </div>

        {/* Future Tooling Card Placeholder */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 opacity-60">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900">Automated Bulk Generation</h4>
              <p className="text-slate-500 text-sm">Massively generate invoices for all students based on assigned structures.</p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 p-6 text-white text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-medium">Catastrophic Action Required</h2>
              <p className="text-red-100 text-sm mt-1 opacity-90">
                This action is irreversible and will wipe all your financial balances.
              </p>
            </div>

            <div className="p-6">
              {resetStatus === 'success' ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">System Reset Successful!</h3>
                  <p className="text-slate-600 text-sm mb-6">All accounting records have been cleared. You are back to zero.</p>
                  <button 
                    onClick={() => {
                        setShowResetModal(false);
                        setResetStatus('idle');
                        navigateTo('FINANCE_DASHBOARD');
                    }}
                    className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    To confirm this action, please type <strong>{REQUIRED_CONFIRM_TEXT}</strong> in the field below. This safety check ensures you are making this decision intentionally.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type confirmation here..."
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none transition-all font-mono text-center tracking-wider"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => {
                            if (!loading) {
                              setShowResetModal(false);
                              setResetStatus('idle');
                              setConfirmText('');
                            }
                          }}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                        >
                          Abort
                        </button>
                        <button 
                          disabled={confirmText !== REQUIRED_CONFIRM_TEXT || loading}
                          onClick={handleTotalReset}
                          className={`flex-1 py-3 text-white font-medium rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all ${
                            confirmText === REQUIRED_CONFIRM_TEXT && !loading 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-slate-300 cursor-not-allowed shadow-none'
                          }`}
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Wipe'}
                        </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMaintenancePage;
