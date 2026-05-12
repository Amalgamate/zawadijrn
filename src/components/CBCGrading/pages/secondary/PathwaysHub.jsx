import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Layers, RefreshCw } from 'lucide-react';
import { fetchWithAuth } from '../../../../services/api/core';
import { configAPI } from '../../../../services/api/config.api';
import EmptyState from '../../shared/EmptyState';

const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${className}`}>
    {children}
  </span>
);

const PathwaysHub = () => {
  const [loading, setLoading] = useState(true);
  const [pathways, setPathways] = useState([]);
  const [selected, setSelected] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchWithAuth('/pathways');
      const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
      setPathways(rows);
      if (!selected && rows.length) setSelected(rows.find((p) => p.code !== 'CORE') || rows[0]);
    } catch (e) {
      setError(e?.message || 'Failed to load pathways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      if (!selected?.code) return;
      try {
        const resp = await fetchWithAuth(`/pathways/${selected.code}/categories`);
        const catRows = resp?.data?.categories || resp?.categories || [];
        setCategories(Array.isArray(catRows) ? catRows : []);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, [selected?.code]);

  const visiblePathways = useMemo(
    () => pathways.filter((p) => p?.code && p.code !== 'CORE'),
    [pathways]
  );

  const seedCatalog = async () => {
    setSeeding(true);
    setError(null);
    try {
      await configAPI.seedPathways();
      await configAPI.seedLearningAreas();
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to run secondary bootstrap seed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="-mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={seedCatalog}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold uppercase tracking-widest shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          <BookOpen size={16} />
          {seeding ? 'Seeding…' : 'Seed'}
        </button>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm font-medium text-gray-600">
          Loading pathways…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : visiblePathways.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Pathways Found"
          message="Click Seed to load pathways and subjects."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              <Layers size={16} />
              Pathways
            </div>
            <div className="mt-3 space-y-2">
              {visiblePathways.map((p) => {
                const active = selected?.code === p.code;
                return (
                  <button
                    key={p.id || p.code}
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`w-full text-left px-3 py-3 rounded-xl border transition ${
                      active
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{p.name || p.code}</div>
                      <Pill className={active ? 'bg-white/70 border-indigo-200 text-indigo-800' : 'bg-gray-50 border-gray-200 text-gray-700'}>
                        {p.code}
                      </Pill>
                    </div>
                    {p.description && (
                      <div className="mt-1 text-xs font-medium text-gray-600 line-clamp-2">{p.description}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Category constraints</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{selected?.name || selected?.code}</div>
              </div>
              <Pill className="bg-slate-50 text-slate-700 border-slate-200">min/max rules</Pill>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(categories || []).map((c) => (
                <div key={c.id || c.code} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <Pill className="bg-white border-gray-200 text-gray-700">{c.code}</Pill>
                  </div>
                  <div className="mt-2 text-xs font-medium text-gray-700">
                    Min: <span className="font-semibold">{c.minSelect}</span>
                    {' • '}
                    Max: <span className="font-semibold">{c.maxSelect == null ? '∞' : c.maxSelect}</span>
                  </div>
                  {c.description && <div className="mt-2 text-xs text-gray-600">{c.description}</div>}
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm font-medium text-gray-600">
                  No categories found for this pathway yet.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-700">Quick Stats</div>
              <ul className="mt-2 text-sm font-medium text-indigo-900/90 list-disc pl-5 space-y-1">
                <li>Pathways: {visiblePathways.length}</li>
                <li>Categories: {categories.length}</li>
                <li>Grades: 10-12</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathwaysHub;
