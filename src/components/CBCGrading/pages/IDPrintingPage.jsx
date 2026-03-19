/**
 * ID Card Printing Page
 * Preview and print student ID cards individually or in bulk.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, CreditCard,
  Printer, CheckSquare, Square, Download, Loader2, Eye, X,
  AlertCircle, CheckCircle2, Settings2
} from 'lucide-react';
import { learnerAPI } from '../../../services/api';
import { useSchoolData } from '../../../contexts/SchoolDataContext';

// ─── Single ID card visual ───────────────────────────────────────────────────
const IDCard = ({ learner, school, cardStyle }) => {
  const { bgColor, textColor, accentColor } = cardStyle;
  const fullName = `${learner.firstName} ${learner.middleName ? learner.middleName + ' ' : ''}${learner.lastName}`;
  const admNo = learner.admNo || learner.admissionNumber || '—';
  const grade = learner.grade?.replace('_', ' ') || '—';
  const stream = learner.stream || '';

  return (
    <div
      className="relative w-[320px] h-[200px] rounded-xl overflow-hidden shadow-xl shrink-0 select-none"
      style={{ background: bgColor, color: textColor, fontFamily: 'sans-serif' }}
    >
      {/* Top accent strip */}
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: accentColor }} />

      {/* School name banner */}
      <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-4 pt-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{school?.name || 'School Name'}</p>
          <p className="text-[8px] uppercase tracking-wider opacity-50">Student Identification Card</p>
        </div>
        {school?.logoUrl ? (
          <img src={school.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-full border border-white/30" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border border-white/30" style={{ background: accentColor }}>
            🎓
          </div>
        )}
      </div>

      {/* Body */}
      <div className="absolute top-16 left-0 right-0 bottom-0 flex gap-3 px-4">
        {/* Photo placeholder */}
        <div className="shrink-0">
          {learner.photoUrl ? (
            <img src={learner.photoUrl} alt="" className="w-[68px] h-[68px] object-cover rounded-lg border-2 border-white/40 shadow" />
          ) : (
            <div className="w-[68px] h-[68px] rounded-lg flex items-center justify-center text-3xl border-2 border-white/30" style={{ background: `${accentColor}55` }}>
              {learner.gender === 'FEMALE' ? '👩‍🎓' : '👨‍🎓'}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 pt-1">
          <p className="font-black text-sm leading-tight truncate">{fullName}</p>
          <p className="text-[10px] opacity-60 mt-0.5">Adm: <span className="font-bold opacity-90">{admNo}</span></p>
          <p className="text-[10px] opacity-60">Grade: <span className="font-bold opacity-90">{grade} {stream}</span></p>
          <p className="text-[10px] opacity-60">Gender: <span className="font-bold opacity-90">{learner.gender || '—'}</span></p>
          {learner.primaryContactPhone && (
            <p className="text-[10px] opacity-60">Parent: <span className="font-bold opacity-90">{learner.primaryContactPhone}</span></p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 flex items-center px-4 justify-between"
        style={{ background: `${accentColor}cc` }}
      >
        <p className="text-[9px] font-bold uppercase tracking-wider opacity-90">
          {new Date().getFullYear()} Academic Year
        </p>
        {/* Simple barcode placeholder */}
        <div className="flex gap-[1px] items-center h-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-[1.5px] bg-white opacity-80" style={{ height: `${[8,12,6,14,10,8,12,6,14,8,10,12,6,14,10,8,12,6][i]}px` }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Print sheet: 4-up layout ────────────────────────────────────────────────
const PrintSheet = React.forwardRef(({ learners, school, cardStyle }, ref) => (
  <div ref={ref} className="hidden print:block">
    <style>{`
      @page { size: A4; margin: 10mm; }
      @media print {
        body * { visibility: hidden; }
        #print-area, #print-area * { visibility: visible; }
        #print-area { position: fixed; top: 0; left: 0; width: 100%; }
        .id-card-print { break-inside: avoid; }
      }
    `}</style>
    <div id="print-area" className="grid grid-cols-2 gap-4 p-4">
      {learners.map(l => (
        <div key={l.id} className="id-card-print">
          <IDCard learner={l} school={school} cardStyle={cardStyle} />
        </div>
      ))}
    </div>
  </div>
));

// ─── Preview modal ───────────────────────────────────────────────────────────
const PreviewModal = ({ learner, school, cardStyle, onClose, onPrint }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-black text-gray-900">ID Card Preview</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="p-6 flex justify-center">
        <IDCard learner={learner} school={school} cardStyle={cardStyle} />
      </div>
      <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">
          Close
        </button>
        <button
          onClick={() => { onPrint([learner]); onClose(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-purple/90 shadow-sm"
        >
          <Printer size={15} /> Print This Card
        </button>
      </div>
    </div>
  </div>
);

// ─── Style configurator ──────────────────────────────────────────────────────
const DEFAULT_STYLE = {
  bgColor:     '#1e1b4b',
  textColor:   '#ffffff',
  accentColor: '#7c3aed',
};

const StylePanel = ({ cardStyle, onChange, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-black text-gray-900">Card Style</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
      </div>
      <div className="p-5 space-y-4">
        {[
          { key: 'bgColor',     label: 'Background Colour' },
          { key: 'accentColor', label: 'Accent Colour'     },
          { key: 'textColor',   label: 'Text Colour'       },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            <input
              type="color"
              value={cardStyle[key]}
              onChange={e => onChange({ ...cardStyle, [key]: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
            />
          </div>
        ))}
        <button
          onClick={() => onChange(DEFAULT_STYLE)}
          className="w-full py-2 text-sm font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Reset to Default
        </button>
      </div>
    </div>
  </div>
);

// ─── Main page ───────────────────────────────────────────────────────────────
const IDPrintingPage = () => {
  const { grades, school } = useSchoolData();

  const [learners, setLearners]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterGrade, setFilterGrade]   = useState('all');
  const [pagination, setPagination]     = useState({ page: 1, pages: 1, total: 0, limit: 30 });
  const [selected, setSelected]         = useState([]);           // ids for bulk print
  const [previewLearner, setPreviewLearner] = useState(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [cardStyle, setCardStyle]       = useState(DEFAULT_STYLE);
  const [printQueue, setPrintQueue]     = useState([]);           // learners to print
  const [toast, setToast]               = useState(null);
  const printRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLearners = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const resp = await learnerAPI.getAll({
        page:   params.page   || pagination.page,
        limit:  30,
        search: params.search ?? searchTerm,
        status: 'ACTIVE',
        ...(params.grade && params.grade !== 'all' ? { grade: params.grade } : {}),
        ...(filterGrade !== 'all' && !params.grade  ? { grade: filterGrade } : {}),
      });
      if (resp?.success) {
        setLearners(resp.data || []);
        if (resp.pagination) setPagination(resp.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch learners:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterGrade, pagination.page]);

  useEffect(() => {
    const t = setTimeout(() => fetchLearners({ page: 1 }), 400);
    return () => clearTimeout(t);
  }, [searchTerm, filterGrade]);

  useEffect(() => { fetchLearners(); }, []);

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelected(learners.map(l => l.id));

  const clearSelection = () => setSelected([]);

  const handlePrint = (queue) => {
    setPrintQueue(queue);
    setTimeout(() => {
      window.print();
      showToast(`Printing ${queue.length} ID card${queue.length > 1 ? 's' : ''}…`);
    }, 200);
  };

  const handleBulkPrint = () => {
    const toBePrinted = learners.filter(l => selected.includes(l.id));
    if (toBePrinted.length === 0) { showToast('Select at least one student first.', 'error'); return; }
    handlePrint(toBePrinted);
  };

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-brand-purple text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Hidden print sheet */}
      <PrintSheet ref={printRef} learners={printQueue} school={school} cardStyle={cardStyle} />

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">

          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or admission number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              />
            </div>
            <select
              value={filterGrade}
              onChange={e => { setFilterGrade(e.target.value); fetchLearners({ page: 1, grade: e.target.value }); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-purple"
            >
              <option value="all">All Grades</option>
              {grades.map(g => <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>)}
            </select>
            {(searchTerm || filterGrade !== 'all') && (
              <button onClick={() => { setSearchTerm(''); setFilterGrade('all'); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <RefreshCw size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right border-r pr-4 border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
              <p className="text-xl font-black text-gray-800">{pagination.total}</p>
            </div>
            <button
              onClick={() => setShowStylePanel(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold"
            >
              <Settings2 size={15} /> Card Style
            </button>
            <button
              onClick={handleBulkPrint}
              disabled={selected.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 text-sm font-bold shadow-sm disabled:opacity-40 transition"
            >
              <Printer size={15} />
              Print Selected ({selected.length})
            </button>
          </div>
        </div>
      </div>

      {/* Bulk selection bar */}
      {selected.length > 0 && (
        <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl px-4 py-3 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="bg-brand-purple text-white text-sm font-bold px-3 py-1 rounded-full">{selected.length}</span>
            <span className="text-brand-purple font-semibold text-sm">Students selected for printing</span>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs font-bold text-brand-purple hover:bg-brand-purple/10 px-2 py-1 rounded">Select all {learners.length}</button>
            <button onClick={clearSelection} className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        {loading && learners.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 size={32} className="animate-spin text-brand-purple" />
          </div>
        ) : learners.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <CreditCard size={40} className="mb-2 opacity-30" />
            <p className="font-semibold">No students found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <button onClick={selected.length === learners.length ? clearSelection : selectAll} className="text-gray-400 hover:text-brand-purple transition">
                        {selected.length === learners.length && learners.length > 0
                          ? <CheckSquare size={18} className="text-brand-purple" />
                          : <Square size={18} />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Admission No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Grade & Stream</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Parent Contact</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {learners.map(learner => {
                    const isSelected = selected.includes(learner.id);
                    return (
                      <tr key={learner.id} className={`transition ${isSelected ? 'bg-brand-purple/5' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(learner.id)} className="text-gray-400 hover:text-brand-purple transition">
                            {isSelected ? <CheckSquare size={18} className="text-brand-purple" /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {learner.photoUrl
                              ? <img src={learner.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                              : <span className="text-2xl">{learner.gender === 'FEMALE' ? '👩‍🎓' : '👨‍🎓'}</span>}
                            <div>
                              <p className="font-semibold text-gray-900">{learner.firstName} {learner.lastName}</p>
                              {learner.middleName && <p className="text-xs text-gray-400">{learner.middleName}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-bold text-gray-700">
                          {learner.admNo || learner.admissionNumber || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {learner.grade?.replace('_', ' ')} {learner.stream}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{learner.gender || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {learner.primaryContactPhone || learner.guardianPhone || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewLearner(learner)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-brand-teal border border-brand-teal/30 rounded-lg hover:bg-brand-teal/10 transition"
                              title="Preview ID card"
                            >
                              <Eye size={13} /> Preview
                            </button>
                            <button
                              onClick={() => handlePrint([learner])}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-purple/90 shadow-sm transition"
                              title="Print ID card"
                            >
                              <Printer size={13} /> Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => fetchLearners({ page: pagination.page - 1 })} disabled={pagination.page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-brand-purple disabled:opacity-40 hover:bg-gray-100">
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-600 font-medium">{pagination.page} / {pagination.pages}</span>
                  <button onClick={() => fetchLearners({ page: pagination.page + 1 })} disabled={pagination.page === pagination.pages}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-brand-purple disabled:opacity-40 hover:bg-gray-100">
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {previewLearner && (
        <PreviewModal
          learner={previewLearner}
          school={school}
          cardStyle={cardStyle}
          onClose={() => setPreviewLearner(null)}
          onPrint={handlePrint}
        />
      )}
      {showStylePanel && (
        <StylePanel
          cardStyle={cardStyle}
          onChange={setCardStyle}
          onClose={() => setShowStylePanel(false)}
        />
      )}
    </div>
  );
};

export default IDPrintingPage;
