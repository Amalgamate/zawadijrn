import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, Loader2, RefreshCw } from 'lucide-react';
import { tertiaryApi } from '../../../services/api/tertiary.api';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tertiaryApi.getDepartments();
      if (res.success) setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 font-sans space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Tertiary</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="text-indigo-600" size={28} />
            Department Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Manage academic departments and their respective faculties.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-lg shadow-indigo-600/20">
            <Plus size={16} /> New Department
          </button>
        </div>
      </div>

      <div className="bg-white border text-center border-slate-200 shadow-sm rounded-2xl overflow-hidden p-16">
         {/* Placeholder logic for now */}
         {loading ? (
             <div className="flex items-center justify-center text-slate-400">
               <Loader2 className="animate-spin mr-2" /> Loading departments...
             </div>
         ) : departments.length === 0 ? (
             <>
               <Building2 size={40} className="mx-auto text-slate-200 mb-3" />
               <p className="font-black text-slate-600 text-lg">No departments found</p>
               <p className="text-slate-400 text-sm mt-1">Click "New Department" to get started.</p>
             </>
         ) : (
            <p className="text-slate-600">You have {departments.length} departments.</p>
         )}
      </div>
    </div>
  );
};
export default DepartmentManagement;
