import React, { useEffect, useMemo, useState } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { configAPI } from '../../../../services/api/config.api';

const gradeLabel = (g) => {
  const s = String(g || '');
  if (s.startsWith('GRADE')) return `Grade ${s.replace('GRADE', '')}`;
  return s.replaceAll('_', ' ');
};

const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${className}`}>
    {children}
  </span>
);

const SubjectManagement = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [gradeLevel, setGradeLevel] = useState('');
  const [pathway, setPathway] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...(gradeLevel ? { gradeLevel } : {}),
        ...(pathway ? { pathway } : {}),
        ...(category ? { category } : {}),
      };
      const resp = await configAPI.getLearningAreas(params);
      const data = resp?.data || resp || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load learning areas');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeLevel, pathway, category]);

  const filters = useMemo(() => {
    const grades = Array.from(new Set(rows.map((r) => r.gradeLevel).filter(Boolean))).sort();
    const pathways = Array.from(new Set(rows.map((r) => r.pathway).filter(Boolean))).sort();
    const categories = Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).sort();
    return { grades, pathways, categories };
  }, [rows]);

  const shown = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => {
        const ag = String(a.gradeLevel || '');
        const bg = String(b.gradeLevel || '');
        if (ag !== bg) return ag.localeCompare(bg);
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [rows]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Subject Catalog</h1>
            <Pill className="bg-indigo-50 text-indigo-800 border-indigo-200">Secondary</Pill>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-600">
            View seeded learning areas with pathway/category metadata for Grade 10–12.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-xs font-black text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
          <Filter size={16} />
          Filters
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs font-black uppercase tracking-widest text-gray-600">
            Grade
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900"
            >
              <option value="">All</option>
              {filters.grades.map((g) => (
                <option key={g} value={g}>
                  {gradeLabel(g)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-black uppercase tracking-widest text-gray-600">
            Pathway
            <select
              value={pathway}
              onChange={(e) => setPathway(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900"
            >
              <option value="">All</option>
              {filters.pathways.map((p) => (
                <option key={p} value={p}>
                  {String(p).replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-black uppercase tracking-widest text-gray-600">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900"
            >
              <option value="">All</option>
              {filters.categories.map((c) => (
                <option key={c} value={c}>
                  {String(c).replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm font-medium text-gray-600">Loading…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">{error}</div>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b text-xs font-black uppercase tracking-widest text-gray-500">
            {shown.length} learning areas
          </div>
          <div className="divide-y">
            {shown.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-gray-900">{r.name}</div>
                  <div className="mt-1 text-xs font-bold text-gray-600">
                    {gradeLabel(r.gradeLevel)}
                    {r.isCore ? ' • Core' : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {r.pathway && (
                    <Pill className="bg-indigo-50 text-indigo-800 border-indigo-200">
                      {String(r.pathway).replaceAll('_', ' ')}
                    </Pill>
                  )}
                  {r.category && (
                    <Pill className="bg-slate-50 text-slate-700 border-slate-200">
                      {String(r.category).replaceAll('_', ' ')}
                    </Pill>
                  )}
                </div>
              </div>
            ))}
            {shown.length === 0 && (
              <div className="px-4 py-10 text-center text-sm font-medium text-gray-600">
                No learning areas match these filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;

