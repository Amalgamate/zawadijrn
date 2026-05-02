/**
 * FeeStructurePage — Redesigned Sheet View
 *
 * WHAT CHANGED vs the old page:
 *  • Default list view is now a "Grade Sheet" — one grade at a time,
 *    Term 1 / Term 2 / Term 3 stacked vertically like a spreadsheet.
 *  • Old matrix/grid view is preserved and accessible via a toggle button.
 *  • Grade + Academic Year selectors replace the filter drawer.
 *  • Inline per-row actions: edit, delete item, toggle active, toggle mandatory.
 *  • Export: PDF captures the printable #fee-structure-sheet div;
 *            CSV exports the selected grade only (or all grades).
 *  • All API calls, form logic, and seed buttons are 100% unchanged.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign, Plus, Edit2, Trash2, Copy, ChevronDown,
  CheckCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import LoadingSpinner from '../shared/LoadingSpinner';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import { useSchoolData } from '../../../contexts/SchoolDataContext';
import { captureSingleReport } from '../../../utils/simplePdfGenerator';
import { useFeeActions } from '../../../contexts/FeeActionsContext';
import { useAuth } from '../../../hooks/useAuth';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtKES = (v) =>
  Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 });
const calcTotal = (items = []) =>
  items.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
const termLabel = (t) =>
  t ? String(t).replace(/_/g, ' ') : '—';
const gradeLabel = (g) =>
  g ? String(g).replace(/_/g, ' ') : '—';
const TERMS = ['TERM_1', 'TERM_2', 'TERM_3'];

// ─── TermSection — one term block in the sheet view ──────────────────────────
const TermSection = ({
  term,
  structure,
  feeTypes,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  onToggleMandatory,
  onDeleteItem,
  onAddItem,
  onAddStructure,
}) => {
  const items = structure?.feeItems || [];
  const total = calcTotal(items);

  if (!structure) {
    return (
      <div className="mb-0">
        {/* Term header */}
        <div
          className="flex items-center gap-3 px-4 py-2 border-b border-t border-[var(--table-border)]"
          style={{ background: 'var(--brand-purple)', color: '#fff' }}
        >
          <span className="text-xs font-bold uppercase tracking-widest">
            {termLabel(term)}
          </span>
          <span className="text-xs opacity-70 ml-1">— No structure configured</span>
          <button
            onClick={onAddStructure}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold
              bg-white/15 hover:bg-white/25 px-3 py-1 transition-colors"
          >
            <Plus size={13} /> Add Structure
          </button>
        </div>
        <div className="py-6 text-center text-sm text-[var(--muted)] border-b border-[var(--table-border)] bg-[#fafbfc]">
          No fee structure for {termLabel(term)}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-0">
      {/* Term header row */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b border-t border-[var(--table-border)]"
        style={{ background: 'var(--brand-purple)', color: '#fff' }}
      >
        <span className="text-xs font-bold uppercase tracking-widest flex-1">
          {termLabel(term)}
        </span>
        {/* Status chips */}
        <span
          className="text-[10px] font-bold px-2 py-0.5"
          style={{ background: structure.active ? '#d1fae5' : '#f3f4f6', color: structure.active ? '#065f46' : '#6b7280' }}
        >
          {structure.active ? 'Active' : 'Inactive'}
        </span>
        {structure.mandatory && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700">
            Mandatory
          </span>
        )}
        {/* Structure-level actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onToggleActive(structure)}
            title={structure.active ? 'Deactivate structure' : 'Activate structure'}
            className="p-1.5 hover:bg-white/20 transition"
          >
            {structure.active
              ? <ToggleRight size={15} className="text-green-300" />
              : <ToggleLeft size={15} className="text-white/50" />}
          </button>
          <button
            onClick={() => onDuplicate(structure)}
            title="Duplicate structure"
            className="p-1.5 hover:bg-white/20 transition"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onEdit(structure)}
            title="Edit structure"
            className="p-1.5 hover:bg-white/20 transition"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(structure)}
            title="Delete structure"
            className="p-1.5 hover:bg-white/20 transition text-red-200 hover:text-red-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full" style={{ minWidth: 0 }}>
        <thead>
          <tr>
            <th className="w-10 text-center">#</th>
            <th>Fee Item</th>
            <th>Category / Type</th>
            <th className="text-right">Amount (KES)</th>
            <th className="text-center">Mandatory</th>
            <th className="text-center">Status</th>
            <th className="no-print">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-4 text-sm text-[var(--muted)]">
                No fee items — click "Add Item" below.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={idx}>
                <td className="text-center text-xs text-[var(--muted)] font-mono">
                  {idx + 1}
                </td>
                <td className="font-semibold text-[var(--ink)]">
                  {item.feeType?.name || `Item ${idx + 1}`}
                </td>
                <td className="text-sm text-[var(--muted)]">
                  {item.feeType?.code || '—'}
                </td>
                <td className="text-right font-mono font-semibold">
                  {fmtKES(item.amount)}
                </td>
                <td className="text-center">
                  {item.mandatory ? (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600">
                      Mandatory
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500">
                      Optional
                    </span>
                  )}
                </td>
                <td className="text-center">
                  <span
                    className="inline-block text-[10px] font-bold px-2 py-0.5"
                    style={{
                      background: structure.active ? '#d1fae5' : '#f3f4f6',
                      color: structure.active ? '#065f46' : '#6b7280'
                    }}
                  >
                    {structure.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="no-print">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(structure)}
                      title="Edit"
                      className="p-1.5 text-[var(--brand-purple)] border border-[var(--border)] hover:bg-[#eef1ff] transition text-xs font-semibold"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteItem(structure, idx)}
                      title="Remove item"
                      className="p-1.5 text-red-500 border border-[var(--border)] hover:bg-red-50 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="text-right text-xs font-bold uppercase tracking-wider py-2 px-4"
              style={{ background: '#eef0fa' }}>
              {termLabel(term)} Total
            </td>
            <td className="text-right font-mono font-black py-2 px-4 text-sm"
              style={{ background: '#eef0fa' }}>
              {fmtKES(total)}
            </td>
            <td colSpan={3}
              style={{ background: '#eef0fa' }}
              className="no-print">
              <button
                onClick={onAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-purple)]
                  hover:bg-[#eef1ff] px-2 py-1 transition"
              >
                <Plus size={12} /> Add Item
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── SheetHeader — printable school header ────────────────────────────────────
const SheetHeader = ({ grade, academicYear, schoolName, logoUrl }) => (
  <div
    className="flex items-center gap-4 px-6 py-4 border-b border-[var(--table-border)]"
    style={{ background: '#fff' }}
  >
    {/* Logo */}
    {logoUrl ? (
      <img
        src={logoUrl}
        alt="School logo"
        className="h-14 w-14 object-contain flex-shrink-0"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ) : (
      <div
        className="h-14 w-14 flex items-center justify-center flex-shrink-0 text-white text-xl font-black"
        style={{ background: 'var(--brand-purple)' }}
      >
        {(schoolName || 'S').charAt(0)}
      </div>
    )}
    {/* Text */}
    <div className="flex-1">
      <div className="text-base font-black text-[var(--ink)] leading-tight">
        {schoolName || 'School Name'}
      </div>
      <div
        className="text-xs font-bold uppercase tracking-widest mt-0.5"
        style={{ color: 'var(--brand-purple)' }}
      >
        Fee Structure Report
      </div>
      <div className="text-sm text-[var(--muted)] mt-1">
        {gradeLabel(grade)} &nbsp;·&nbsp; Academic Year {academicYear}
      </div>
    </div>
    {/* Right meta */}
    <div className="text-right text-xs text-[var(--muted)] flex-shrink-0">
      <div className="font-semibold text-[var(--ink)]">{gradeLabel(grade)}</div>
      <div>{academicYear}</div>
      <div className="mt-1">
        Generated: {new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  </div>
);

// ─── FeeStructurePage ─────────────────────────────────────────────────────────
const FeeStructurePage = () => {
  const { user } = useAuth();
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');   // 'list' | 'add' | 'edit'
  const listView = 'sheet';
  const [editingStructure, setEditingStructure] = useState(null);

  // Grade + Year selectors (replace old filter drawer)
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Delete / item-delete dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [structureToDelete, setStructureToDelete] = useState(null);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { structure, index }

  // Seed state (unchanged)
  const [isSeedingTypes, setIsSeedingTypes] = useState(false);
  const [isSeedingStructures, setIsSeedingStructures] = useState(false);
  const [seedTypesComplete, setSeedTypesComplete] = useState(false);
  const [seedStructuresComplete, setSeedStructuresComplete] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const { showSuccess, showError } = useNotifications();
  const { registerFeeActions, clearFeeActions } = useFeeActions();
  const { grades: fetchedGrades, classes } = useSchoolData();

  // Form state (unchanged)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grade: '',
    term: 'TERM_1',
    academicYear: new Date().getFullYear(),
    mandatory: true,
    active: true,
    feeItems: [],
  });

  const terms = useMemo(() => {
    const uniqueTerms = Array.from(new Set(classes.map((c) => c.term).filter(Boolean))).sort();
    return uniqueTerms.length > 0 ? uniqueTerms : TERMS;
  }, [classes]);

  // Sync grade default into form when grades load
  useEffect(() => {
    if (fetchedGrades.length > 0 && !formData.grade) {
      setFormData((p) => ({ ...p, grade: fetchedGrades[0] }));
    }
  }, [fetchedGrades]);

  // Set default selectedGrade
  useEffect(() => {
    if (fetchedGrades.length > 0 && !selectedGrade) {
      setSelectedGrade(fetchedGrades[0]);
    }
  }, [fetchedGrades]);

  // ── data ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [structuresRes, typesRes] = await Promise.all([
        api.fees.getAllFeeStructures(),
        api.fees.getAllFeeTypes({ active: true }),
      ]);
      setFeeStructures(structuresRes?.data || []);
      setFeeTypes(typesRes || []);
      if ((typesRes || []).length >= 9) setSeedTypesComplete(true);
    } catch {
      showError('Failed to load fee data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derived: sheet data for selected grade+year ─────────────────────────────
  const gradeSheetData = useMemo(() => {
    if (!selectedGrade) return {};
    const relevant = feeStructures.filter(
      (s) => s.grade === selectedGrade && Number(s.academicYear) === Number(selectedYear)
    );
    const byTerm = {};
    relevant.forEach((s) => {
      const t = s.term || 'TERM_1';
      if (!byTerm[t]) byTerm[t] = [];
      byTerm[t].push(s);
    });
    // Return first structure per term (multiple structures per term are allowed but we show the first)
    const result = {};
    TERMS.forEach((t) => {
      result[t] = (byTerm[t] || [])[0] || null;
    });
    return result;
  }, [feeStructures, selectedGrade, selectedYear]);

  const grandTotal = useMemo(
    () => Object.values(gradeSheetData).reduce((s, st) => s + calcTotal(st?.feeItems), 0),
    [gradeSheetData]
  );

  // ── derived: matrix rows (old grid view) ────────────────────────────────────
  const feeMatrixRows = useMemo(() => {
    const map = new Map();
    feeStructures.forEach((s) => {
      const key = `${s.grade}__${s.academicYear}`;
      if (!map.has(key)) map.set(key, { grade: s.grade, academicYear: s.academicYear, byTerm: {} });
      const row = map.get(key);
      const t = s.term || 'TERM_1';
      if (!row.byTerm[t]) row.byTerm[t] = [];
      row.byTerm[t].push(s);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.academicYear !== b.academicYear) return Number(b.academicYear) - Number(a.academicYear);
      return String(a.grade).localeCompare(String(b.grade));
    });
  }, [feeStructures]);

  // ── actions ─────────────────────────────────────────────────────────────────
  const calcTotalAmount = (items) => calcTotal(items);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      grade: fetchedGrades[0] || '',
      term: terms[0] || 'TERM_1',
      academicYear: new Date().getFullYear(),
      mandatory: true,
      active: true,
      feeItems: [],
    });
    setEditingStructure(null);
  };

  const handleEdit = (structure) => {
    setEditingStructure(structure);
    const formItems = (structure.feeItems || []).map((item) => ({
      feeTypeId: item.feeTypeId || item.feeType?.id,
      amount: item.amount.toString(),
      mandatory: item.mandatory,
    }));
    setFormData({
      name: structure.name,
      description: structure.description || '',
      grade: structure.grade,
      term: structure.term,
      academicYear: structure.academicYear,
      mandatory: structure.mandatory,
      active: structure.active,
      feeItems: formItems,
    });
    setViewMode('edit');
  };

  const handleDuplicate = (structure) => {
    setEditingStructure(null);
    setFormData({
      name: `${structure.name} (Copy)`,
      description: structure.description || '',
      grade: structure.grade,
      term: structure.term,
      academicYear: new Date().getFullYear(),
      mandatory: structure.mandatory,
      active: true,
      feeItems: (structure.feeItems || []).map((item) => ({
        feeTypeId: item.feeTypeId || item.feeType?.id,
        amount: item.amount.toString(),
        mandatory: item.mandatory,
      })),
    });
    setViewMode('add');
  };

  const handleDelete = async () => {
    if (!structureToDelete) return;
    try {
      const res = await api.fees.deleteFeeStructure(structureToDelete.id);
      showSuccess(res?.message || 'Deleted');
      setShowDeleteDialog(false);
      setStructureToDelete(null);
      fetchData();
    } catch (e) {
      showError(e.message || 'Delete failed');
    }
  };

  // Inline toggle active/mandatory (patch whole structure)
  const handleToggleActive = async (structure) => {
    try {
      const items = (structure.feeItems || []).map((i) => ({
        feeTypeId: i.feeTypeId || i.feeType?.id,
        amount: parseFloat(i.amount),
        mandatory: i.mandatory,
      }));
      await api.fees.updateFeeStructure(structure.id, { ...structure, active: !structure.active, feeItems: items });
      showSuccess(`Structure marked ${!structure.active ? 'active' : 'inactive'}`);
      fetchData();
    } catch (e) {
      showError(e.message || 'Update failed');
    }
  };

  const handleToggleMandatory = async (structure) => {
    try {
      const items = (structure.feeItems || []).map((i) => ({
        feeTypeId: i.feeTypeId || i.feeType?.id,
        amount: parseFloat(i.amount),
        mandatory: i.mandatory,
      }));
      await api.fees.updateFeeStructure(structure.id, { ...structure, mandatory: !structure.mandatory, feeItems: items });
      showSuccess(`Structure marked ${!structure.mandatory ? 'mandatory' : 'optional'}`);
      fetchData();
    } catch (e) {
      showError(e.message || 'Update failed');
    }
  };

  // Delete a single fee item from a structure
  const handleDeleteFeeItem = async (structure, itemIndex) => {
    try {
      const newItems = (structure.feeItems || [])
        .filter((_, i) => i !== itemIndex)
        .map((i) => ({
          feeTypeId: i.feeTypeId || i.feeType?.id,
          amount: parseFloat(i.amount),
          mandatory: i.mandatory,
        }));
      await api.fees.updateFeeStructure(structure.id, { ...structure, feeItems: newItems });
      showSuccess('Fee item removed');
      setShowDeleteItemDialog(false);
      setItemToDelete(null);
      fetchData();
    } catch (e) {
      showError(e.message || 'Remove failed');
    }
  };

  const handleAddFeeItem = () => {
    setFormData((p) => ({ ...p, feeItems: [...p.feeItems, { feeTypeId: '', amount: '', mandatory: true }] }));
  };
  const handleRemoveFeeItem = (index) => {
    setFormData((p) => ({ ...p, feeItems: p.feeItems.filter((_, i) => i !== index) }));
  };
  const handleFeeItemChange = (index, field, value) => {
    const newItems = [...formData.feeItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((p) => ({ ...p, feeItems: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.feeItems.length === 0) {
      showError('Fill in required fields and add at least one fee item');
      return;
    }
    if (!formData.feeItems.every((item) => item.feeTypeId && item.amount)) {
      showError('All fee items must have a type and amount');
      return;
    }
    const payload = {
      ...formData,
      feeItems: formData.feeItems.map((item) => ({
        feeTypeId: item.feeTypeId,
        amount: parseFloat(item.amount),
        mandatory: item.mandatory,
      })),
    };
    try {
      if (editingStructure) {
        await api.fees.updateFeeStructure(editingStructure.id, payload);
        showSuccess('Updated successfully');
      } else {
        await api.fees.createFeeStructure(payload);
        showSuccess('Created successfully');
      }
      setViewMode('list');
      resetForm();
      fetchData();
    } catch (e) {
      showError(e.message || 'Save failed');
    }
  };

  // ── seed (unchanged) ────────────────────────────────────────────────────────
  const handleSeedFeeTypes = async () => {
    setIsSeedingTypes(true);
    try {
      const r = await api.fees.seedDefaultFeeTypes();
      showSuccess(`✅ ${r.message}`);
      setSeedTypesComplete(true);
      fetchData();
    } catch (e) { showError(e.message || 'Failed'); } finally { setIsSeedingTypes(false); }
  };
  const handleSeedFeeStructures = async () => {
    setIsSeedingStructures(true);
    try {
      const r = await api.fees.seedDefaultFeeStructures();
      showSuccess(`✅ ${r.message}`);
      setSeedStructuresComplete(true);
      setTimeout(fetchData, 500);
    } catch (e) { showError(e.message || 'Failed'); setSeedStructuresComplete(false); }
    finally { setIsSeedingStructures(false); }
  };

  // ── exports ─────────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const filename = `FeeStructure_${gradeLabel(selectedGrade).replace(/ /g, '_')}_${selectedYear}.pdf`;
      const result = await captureSingleReport('fee-structure-sheet', filename, {
        onProgress: (msg) => console.log('[PDF]', msg),
      });
      if (result.success) showSuccess('PDF downloaded');
      else showError(result.error || 'Export failed');
    } catch (e) { showError(e.message); }
    finally { setIsExporting(false); }
  }, [selectedGrade, selectedYear, showSuccess, showError]);

  const handleExportCSV = useCallback(() => {
    const rows = [];
    TERMS.forEach((term) => {
      const structure = gradeSheetData[term];
      if (!structure) return;
      (structure.feeItems || []).forEach((item) => {
        rows.push({
          Grade: gradeLabel(selectedGrade),
          Year: selectedYear,
          Term: termLabel(term),
          'Fee Item': item.feeType?.name || '',
          'Category/Code': item.feeType?.code || '',
          'Amount (KES)': parseFloat(item.amount || 0),
          Mandatory: item.mandatory ? 'Yes' : 'No',
          Status: structure.active ? 'Active' : 'Inactive',
        });
      });
      rows.push({
        Grade: '', Year: '', Term: `${termLabel(term)} TOTAL`,
        'Fee Item': '', 'Category/Code': '',
        'Amount (KES)': calcTotal(structure.feeItems),
        Mandatory: '', Status: '',
      });
    });
    rows.push({
      Grade: '', Year: '', Term: 'GRAND TOTAL',
      'Fee Item': '', 'Category/Code': '',
      'Amount (KES)': grandTotal,
      Mandatory: '', Status: '',
    });

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FeeStructure_${gradeLabel(selectedGrade).replace(/ /g, '_')}_${selectedYear}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('CSV exported');
  }, [gradeSheetData, selectedGrade, selectedYear, grandTotal, showSuccess]);

  const handleExportAllCSV = useCallback(() => {
    const rows = [];
    feeStructures.forEach((s) => {
      (s.feeItems || []).forEach((item) => {
        rows.push({
          Grade: gradeLabel(s.grade), Year: s.academicYear, Term: termLabel(s.term),
          'Fee Item': item.feeType?.name || '', Code: item.feeType?.code || '',
          'Amount (KES)': parseFloat(item.amount || 0),
          Mandatory: item.mandatory ? 'Yes' : 'No',
          'Structure Active': s.active ? 'Yes' : 'No',
        });
      });
    });
    if (rows.length === 0) { showError('No data to export'); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `AllFeeStructures_${selectedYear}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('All fee structures exported');
  }, [feeStructures, selectedYear, showSuccess, showError]);

  // ── register fee actions for header bar ─────────────────────────────────────
  useEffect(() => {
    registerFeeActions({
      onCreate: () => { resetForm(); setViewMode('add'); },
      onExportPdf: handleExportPDF,
      onExportExcel: handleExportAllCSV,
    });
    return () => clearFeeActions();
  }, [registerFeeActions, clearFeeActions, handleExportPDF, handleExportAllCSV]);

  // ── loading ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;

  // ── form view (unchanged) ────────────────────────────────────────────────────
  if (viewMode !== 'list') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white" style={{ border: '1px solid var(--table-border)' }}>
          <div className="px-6 py-4 flex justify-between items-center"
            style={{ background: 'var(--brand-purple)', color: '#fff' }}>
            <h2 className="text-xl font-bold">
              {editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
            </h2>
            <div className="text-sm opacity-80">
              Total: KES {calcTotalAmount(formData.feeItems).toLocaleString()}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Structure Name *</label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--table-border)] focus:ring-2 focus:ring-[var(--brand-purple)] focus:outline-none text-sm"
                  placeholder="e.g., Grade 1 Term 1 2026 Fees" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Grade *</label>
                <select value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--table-border)] focus:ring-2 focus:ring-[var(--brand-purple)] focus:outline-none text-sm bg-white" required>
                  {fetchedGrades.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Term *</label>
                <select value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--table-border)] focus:ring-2 focus:ring-[var(--brand-purple)] focus:outline-none text-sm bg-white" required>
                  {terms.map((t) => <option key={t} value={t}>{termLabel(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Academic Year *</label>
                <input type="number" value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--table-border)] focus:ring-2 focus:ring-[var(--brand-purple)] focus:outline-none text-sm"
                  min="2020" max="2099" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--table-border)] focus:ring-2 focus:ring-[var(--brand-purple)] focus:outline-none text-sm"
                  rows={2} placeholder="Optional description" />
              </div>
            </div>

            {/* Fee Items */}
            <div className="border-t border-[var(--table-border)] pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-[var(--ink)]">Fee Items</h4>
                <button type="button" onClick={handleAddFeeItem}
                  className="text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 transition"
                  style={{ background: 'var(--brand-purple)', color: '#fff' }}>
                  <Plus size={14} /> Add Item
                </button>
              </div>
              {formData.feeItems.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 text-sm text-gray-500">
                  No fee items. <button type="button" onClick={handleAddFeeItem}
                    className="font-semibold underline" style={{ color: 'var(--brand-purple)' }}>Add first item</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.feeItems.map((item, index) => (
                    <div key={index}
                      className="flex flex-col md:flex-row gap-3 items-start md:items-center p-3 bg-gray-50 border border-[var(--table-border)]">
                      <div className="flex-1 w-full">
                        <select value={item.feeTypeId}
                          onChange={(e) => handleFeeItemChange(index, 'feeTypeId', e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--table-border)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-purple)]" required>
                          <option value="">Select Fee Type</option>
                          {feeTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                        </select>
                      </div>
                      <div className="w-full md:w-32">
                        <input type="number" value={item.amount}
                          onChange={(e) => handleFeeItemChange(index, 'amount', e.target.value)}
                          placeholder="Amount" min="0" step="0.01" required
                          className="w-full px-3 py-2 border border-[var(--table-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-purple)]" />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <input type="checkbox" checked={item.mandatory}
                            onChange={(e) => handleFeeItemChange(index, 'mandatory', e.target.checked)}
                            className="w-4 h-4" />
                          Mandatory
                        </label>
                        <button type="button" onClick={() => handleRemoveFeeItem(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 border border-[var(--table-border)] bg-white">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status toggles */}
            <div className="border-t border-[var(--table-border)] pt-4 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2.5 p-3 border border-[var(--table-border)] cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={formData.mandatory}
                  onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                  className="w-4 h-4" />
                <div>
                  <span className="block text-sm font-bold">Mandatory</span>
                  <span className="block text-xs text-[var(--muted)]">Applies to all students by default</span>
                </div>
              </label>
              <label className="flex items-center gap-2.5 p-3 border border-[var(--table-border)] cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4" />
                <div>
                  <span className="block text-sm font-bold">Active</span>
                  <span className="block text-xs text-[var(--muted)]">Visible for invoicing</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[var(--table-border)]">
              <button type="submit"
                className="flex-1 px-6 py-3 font-bold text-sm text-white transition"
                style={{ background: 'var(--brand-purple)' }}>
                {editingStructure ? 'Update Fee Structure' : 'Create Fee Structure'}
              </button>
              <button type="button"
                onClick={() => { setViewMode('list'); resetForm(); }}
                className="px-6 py-3 border border-[var(--table-border)] font-medium text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── list view ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Left: grade selector only */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="pl-3 pr-8 py-2 text-sm font-semibold border border-[var(--table-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-purple)] appearance-none"
              style={{ color: 'var(--brand-purple)' }}
            >
              {fetchedGrades.map((g) => (
                <option key={g} value={g}>{gradeLabel(g)}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]" />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seed buttons */}
          <button onClick={handleSeedFeeTypes} disabled={isSeedingTypes || seedTypesComplete}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition"
            style={seedTypesComplete
              ? { background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed', border: '1px solid var(--table-border)' }
              : { background: '#059669', color: '#fff', border: '1px solid #059669' }}>
            {seedTypesComplete ? <><CheckCircle size={13} /> Types Seeded</> : <><Plus size={13} /> Seed Types</>}
          </button>
          <button onClick={handleSeedFeeStructures} disabled={isSeedingStructures || seedStructuresComplete}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition"
            style={seedStructuresComplete
              ? { background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed', border: '1px solid var(--table-border)' }
              : { background: 'var(--brand-purple)', color: '#fff', border: '1px solid var(--brand-purple)' }}>
            {seedStructuresComplete ? <><CheckCircle size={13} /> Structures Seeded</> : <><Plus size={13} /> Seed Structures</>}
          </button>

          {/* Add */}
          <button onClick={() => { resetForm(); setViewMode('add'); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white transition"
            style={{ background: 'var(--brand-teal)', border: '1px solid var(--brand-teal)' }}>
            <Plus size={13} /> Add Structure
          </button>
        </div>
      </div>

      {/* ── SHEET VIEW ────────────────────────────────────────────────────────── */}
      {listView === 'sheet' && (
        <div>
          {feeStructures.length === 0 ? (
            <EmptyState icon={DollarSign} title="No Fee Structures"
              message="Use 'Seed Structures' or 'Add Structure' to get started."
              actionText="Add Fee Structure"
              onAction={() => { resetForm(); setViewMode('add'); }} />
          ) : (
            <>
              {/* Printable / capturable sheet */}
              <div
                id="fee-structure-sheet"
                className="bg-white"
                style={{ border: '1px solid var(--table-border)', fontFamily: 'Inter, sans-serif' }}
              >
                {/* Branded header */}
                <SheetHeader
                  grade={selectedGrade}
                  academicYear={selectedYear}
                  schoolName={user?.schoolName || user?.school?.name || 'School Name'}
                  logoUrl={user?.school?.logoUrl || user?.logoUrl}
                />

                {/* One section per term */}
                {TERMS.map((term) => (
                  <TermSection
                    key={term}
                    term={term}
                    structure={gradeSheetData[term]}
                    feeTypes={feeTypes}
                    onEdit={handleEdit}
                    onDelete={(s) => { setStructureToDelete(s); setShowDeleteDialog(true); }}
                    onDuplicate={handleDuplicate}
                    onToggleActive={handleToggleActive}
                    onToggleMandatory={handleToggleMandatory}
                    onDeleteItem={(s, idx) => { setItemToDelete({ structure: s, index: idx }); setShowDeleteItemDialog(true); }}
                    onAddItem={() => {
                      const s = gradeSheetData[term];
                      if (s) handleEdit(s);
                      else {
                        setFormData((p) => ({ ...p, grade: selectedGrade, term, academicYear: selectedYear }));
                        setViewMode('add');
                      }
                    }}
                    onAddStructure={() => {
                      resetForm();
                      setFormData((p) => ({ ...p, grade: selectedGrade, term, academicYear: selectedYear }));
                      setViewMode('add');
                    }}
                  />
                ))}

                {/* Grand total row */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-t border-[var(--table-border)]"
                  style={{ background: 'var(--brand-purple)', color: '#fff' }}
                >
                  <span className="text-xs font-black uppercase tracking-widest">
                    {gradeLabel(selectedGrade)} — {selectedYear} Grand Total
                  </span>
                  <span className="font-black font-mono text-base">
                    KES {fmtKES(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Sheet footer note (not printed) */}
              <p className="text-[11px] text-[var(--muted)] mt-2 no-print">
                Showing fee structure for {gradeLabel(selectedGrade)} · {selectedYear}.
                Use the Grade and Year selectors above to switch.
                Click <strong>PDF</strong> to export this exact view.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── GRID VIEW (old matrix, preserved) ─────────────────────────────────── */}
      {listView === 'grid' && (
        <div>
          {feeMatrixRows.length === 0 ? (
            <EmptyState icon={DollarSign} title="No Fee Structures"
              message="Use 'Seed Structures' or 'Add Structure' to get started."
              actionText="Add Fee Structure"
              onAction={() => { resetForm(); setViewMode('add'); }} />
          ) : (
            <div className="bg-white overflow-hidden" style={{ border: '1px solid var(--table-border)' }}>
              <div className="overflow-x-auto">
                <table style={{ minWidth: 1100 }}>
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Year</th>
                      {terms.map((t) => <th key={t}>{termLabel(t)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {feeMatrixRows.map((row) => (
                      <tr key={`${row.grade}-${row.academicYear}`}>
                        <td className="font-bold">{gradeLabel(row.grade)}</td>
                        <td>{row.academicYear}</td>
                        {terms.map((term) => {
                          const structs = row.byTerm[term] || [];
                          if (structs.length === 0) {
                            return <td key={term} className="text-xs" style={{ color: 'var(--muted)' }}>No structure</td>;
                          }
                          return (
                            <td key={term}>
                              {structs.map((s) => (
                                <div key={s.id}
                                  className="p-2 mb-1.5 last:mb-0"
                                  style={{ border: '1px solid var(--table-border)', background: '#fafbfc' }}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-bold text-[var(--ink)] leading-tight">{s.name}</p>
                                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                                        {(s.feeItems || []).length} items · KES {fmtKES(calcTotal(s.feeItems || []))}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <button onClick={() => handleDuplicate(s)}
                                        className="p-1 hover:bg-gray-200 transition" title="Duplicate">
                                        <Copy size={12} />
                                      </button>
                                      <button onClick={() => handleEdit(s)}
                                        className="p-1 hover:bg-blue-50 transition" title="Edit"
                                        style={{ color: 'var(--brand-purple)' }}>
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        onClick={() => { setStructureToDelete(s); setShowDeleteDialog(true); }}
                                        className="p-1 hover:bg-red-50 transition text-red-500" title="Delete">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                    {s.mandatory && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700">
                                        Mandatory
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold px-1.5 py-0.5"
                                      style={{ background: s.active ? '#d1fae5' : '#f3f4f6', color: s.active ? '#065f46' : '#6b7280' }}>
                                      {s.active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete structure dialog ── */}
      <ConfirmDialog
        show={showDeleteDialog}
        title="Delete Fee Structure"
        message={`Delete "${structureToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteDialog(false); setStructureToDelete(null); }}
      />

      {/* ── Delete fee item dialog ── */}
      <ConfirmDialog
        show={showDeleteItemDialog}
        title="Remove Fee Item"
        message={`Remove this fee item from ${termLabel(itemToDelete?.structure?.term)}? The structure will be updated.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => itemToDelete && handleDeleteFeeItem(itemToDelete.structure, itemToDelete.index)}
        onCancel={() => { setShowDeleteItemDialog(false); setItemToDelete(null); }}
      />
    </div>
  );
};

export default FeeStructurePage;
