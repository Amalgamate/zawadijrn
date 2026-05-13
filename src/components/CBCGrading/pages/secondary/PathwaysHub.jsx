import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Layers, RefreshCw, ShieldAlert } from 'lucide-react';
import api from '../../../../services/api';
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
  const [integrity, setIntegrity] = useState(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const loadIntegrity = async () => {
    setIntegrityLoading(true);
    try {
      const resp = await api.pathways.getCatalogIntegrity();
      setIntegrity(resp?.data || resp || null);
    } catch (e) {
      setIntegrity({
        success: false,
        checkedAt: new Date().toISOString(),
        counts: { issues: 1, errors: 1, warnings: 0 },
        issues: [{ code: 'INTEGRITY_FETCH_FAILED', message: e?.message || 'Failed to load catalog health', severity: 'error' }],
      });
    } finally {
      setIntegrityLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.pathways.listPathways();
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
    loadIntegrity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      if (!selected?.code) return;
      try {
        const resp = await api.pathways.getPathwayCategories(selected.code);
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
      await loadIntegrity();
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
          onClick={async () => {
            await load();
            await loadIntegrity();
          }}
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
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 ${
            integrity?.success ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-600">Catalog Health</div>
                <div className="mt-1 flex items-center gap-2">
                  {integrity?.success ? <CheckCircle2 size={18} className="text-emerald-600" /> : <ShieldAlert size={18} className="text-amber-700" />}
                  <span className={`text-sm font-semibold ${integrity?.success ? 'text-emerald-800' : 'text-amber-900'}`}>
                    {integrityLoading ? 'Checking integrity...' : (integrity?.success ? 'No critical integrity conflicts' : 'Catalog integrity needs attention')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Errors: {integrity?.counts?.errors || 0} • Warnings: {integrity?.counts?.warnings || 0}
                </p>
              </div>
              <button
                type="button"
                onClick={loadIntegrity}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={14} />
                Recheck
              </button>
            </div>

            {(integrity?.issues || []).length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-auto pr-1">
                {integrity.issues.slice(0, 8).map((issue, idx) => (
                  <div key={`${issue.code}-${idx}`} className="rounded-xl border border-white/70 bg-white/70 p-3">
                    <div className="flex items-center gap-2">
                      {issue.severity === 'error' ? <AlertTriangle size={14} className="text-red-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">{issue.code}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-800">{issue.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
        </div>
      )}
    </div>
  );
};

export default PathwaysHub;
