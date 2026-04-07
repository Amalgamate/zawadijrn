import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { configAPI } from '../../../../services/api/config.api';

const gradeLabel = (g) => {
  const s = String(g || '');
  if (s.startsWith('GRADE')) return `Grade ${s.replace('GRADE', '')}`;
  return s.replaceAll('_', ' ');
};

const FormGroups = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await configAPI.getClasses();
      const data = resp?.data || resp || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load classes');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const secondaryClasses = useMemo(() => {
    return rows
      .filter((c) => (c?.institutionType || '').toUpperCase() === 'SECONDARY')
      .slice()
      .sort((a, b) => {
        const ag = String(a.grade || '');
        const bg = String(b.grade || '');
        if (ag !== bg) return ag.localeCompare(bg);
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [rows]);

  const byGrade = useMemo(() => {
    const map = new Map();
    secondaryClasses.forEach((c) => {
      const g = c.grade || 'UNKNOWN';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(c);
    });
    return Array.from(map.entries()).sort(([a], [b]) => String(a).localeCompare(String(b)));
  }, [secondaryClasses]);

  const seed = async () => {
    setLoading(true);
    setError(null);
    try {
      await configAPI.seedClasses();
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to seed classes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Grade Streams</h1>
          <p className="mt-1 text-sm font-medium text-gray-600">
            Senior School classes grouped by grade (Grade 10–12).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={seed}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow hover:bg-indigo-700"
          >
            <Plus size={16} />
            Seed Classes
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-xs font-black text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm font-medium text-gray-600">Loading…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">{error}</div>
      ) : (
        <div className="space-y-4">
          {byGrade.map(([g, list]) => (
            <div key={g} className="rounded-2xl border bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div className="text-sm font-black text-gray-900">{gradeLabel(g)}</div>
                <div className="text-xs font-bold text-gray-600">{list.length} classes</div>
              </div>
              <div className="divide-y">
                {list.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-gray-900">{c.name}</div>
                      <div className="mt-1 text-xs font-bold text-gray-600">
                        Stream: {c.stream || '—'}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-gray-500">{c.code || ''}</div>
                  </div>
                ))}
                {list.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm font-medium text-gray-600">
                    No classes found for this grade.
                  </div>
                )}
              </div>
            </div>
          ))}

          {byGrade.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center text-sm font-medium text-gray-600">
              No Senior School classes found yet. Click <span className="font-black">Seed Classes</span>.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormGroups;

