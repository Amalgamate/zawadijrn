import React, { useState } from 'react';
import {
  LayoutGrid, Lock, Eye, EyeOff, RefreshCw,
  History, ChevronDown, ChevronUp, AlertTriangle, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApps } from '../../../../hooks/useApps';
import { useAuth } from '../../../../hooks/useAuth';

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled, loading }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled || loading}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
      ${checked ? 'bg-brand-purple' : 'bg-gray-200'}`}
    aria-checked={checked}
    role="switch"
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200
        ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

// ─── App Card ─────────────────────────────────────────────────────────────────
const AppCard = ({ app, isSuperAdmin, toggling, onToggle, onMandatory, onVisibility, onShowDeps }) => {
  const isToggling = toggling[app.slug];
  const canToggle  = isSuperAdmin || !app.isMandatory;

  const handleToggle = async () => {
    if (!canToggle) return;
    if (!app.isActive && app.dependencies?.length) {
      onShowDeps(app);
      return;
    }
    try {
      await onToggle(app.slug);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to toggle ${app.name}`);
    }
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200
      ${app.isActive
        ? 'border-brand-purple/30 bg-white shadow-sm shadow-brand-purple/10'
        : 'border-gray-200 bg-gray-50'
      }
      ${!app.isVisible && isSuperAdmin ? 'opacity-60' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{app.icon || '📦'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{app.name}</h3>
              {app.isMandatory && (
                <span title="Mandatory — cannot be toggled by school admin">
                  <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                </span>
              )}
              {isSuperAdmin && !app.isVisible && (
                <span title="Hidden from school admin">
                  <EyeOff className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </span>
              )}
            </div>
            {app.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{app.description}</p>
            )}
          </div>
        </div>

        <Toggle
          checked={app.isActive}
          onChange={handleToggle}
          disabled={!canToggle}
          loading={isToggling}
        />
      </div>

      {/* Dependencies */}
      {app.dependencies?.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          Requires: {app.dependencies.join(', ')}
        </p>
      )}

      {/* Super Admin Controls */}
      {isSuperAdmin && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={app.isMandatory}
              onChange={e => onMandatory(app.slug, e.target.checked)}
              className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
            />
            Mandatory
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={app.isVisible}
              onChange={e => onVisibility(app.slug, e.target.checked)}
              className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
            />
            Visible to admin
          </label>
        </div>
      )}
    </div>
  );
};

// ─── Dependency Warning Modal ─────────────────────────────────────────────────
const DepsModal = ({ app, onConfirm, onCancel }) => {
  if (!app) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <h3 className="font-medium text-gray-900">Enable dependencies?</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Enabling <strong>{app.name}</strong> will also activate:
        </p>
        <ul className="mb-5 space-y-1">
          {app.dependencies.map(d => (
            <li key={d} className="text-sm text-brand-purple font-medium flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
              {d}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(app.slug)}
            className="flex-1 rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-brand-purple/90"
          >
            Enable All
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Audit Log Row ────────────────────────────────────────────────────────────
const AuditRow = ({ log }) => {
  const actionColors = {
    ACTIVATED:   'bg-green-100 text-green-700',
    DEACTIVATED: 'bg-gray-100 text-gray-600',
    LOCKED:      'bg-amber-100 text-amber-700',
    UNLOCKED:    'bg-blue-100 text-blue-700',
    SHOWN:       'bg-purple-100 text-purple-700',
    HIDDEN:      'bg-red-100 text-red-700',
  };
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-2 px-3 text-sm">
        <span className="text-lg mr-1">{log.app?.icon}</span>
        {log.app?.name}
      </td>
      <td className="py-2 px-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
          {log.action}
        </span>
      </td>
      <td className="py-2 px-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-700">{log.performer?.firstName} {log.performer?.lastName}</span>
          <span className="text-[10px] text-gray-400 uppercase font-semibold">{log.roleAtTime}</span>
        </div>
      </td>
      <td className="py-2 px-3 text-xs text-gray-400">
        {new Date(log.createdAt).toLocaleString()}
      </td>
    </tr>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AppsPage = () => {
  const { user } = useAuth();
  const schoolId = user?.schoolId || user?.school?.id;

  const {
    appsByCategory, categories, loading, error,
    toggling, isSuperAdmin,
    toggle, setMandatory, setVisibility, refresh,
  } = useApps(schoolId);

  const [depsApp,        setDepsApp]        = useState(null);
  const [showAudit,      setShowAudit]      = useState(false);
  const [auditLogs,      setAuditLogs]      = useState([]);
  const [auditLoading,   setAuditLoading]   = useState(false);
  const [collapsedCats,  setCollapsedCats]  = useState({});

  const toggleCat = (cat) =>
    setCollapsedCats(p => ({ ...p, [cat]: !p[cat] }));

  const handleConfirmDeps = async (slug) => {
    setDepsApp(null);
    try {
      await toggle(slug);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enable app');
    }
  };

  const handleMandatory = async (slug, val) => {
    try {
      await setMandatory(slug, val);
      toast.success(`App ${val ? 'locked as mandatory' : 'unlocked'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleVisibility = async (slug, val) => {
    try {
      await setVisibility(slug, val);
      toast.success(`App ${val ? 'shown to' : 'hidden from'} school admin`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const loadAuditLog = async () => {
    if (!schoolId) return;
    setAuditLoading(true);
    try {
      const { appsApi } = await import('../../../../services/api/apps.api');
      const fn  = isSuperAdmin ? appsApi.getAuditLog : appsApi.getMyAuditLog;
      const res = await fn(schoolId);
      setAuditLogs(res.data.data || []);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setAuditLoading(false);
    }
  };

  const toggleAudit = () => {
    const next = !showAudit;
    setShowAudit(next);
    if (next && auditLogs.length === 0) loadAuditLog();
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={refresh} className="mt-3 text-sm text-brand-purple underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Apps</h1>
            <p className="text-sm text-gray-500">Enable or disable feature modules for this school</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Super Admin View</span>
            </div>
          )}
          <button
            onClick={refresh}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
          <LayoutGrid className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No apps found</p>
          <p className="text-sm text-gray-400 mt-1">Run the apps seed script to populate app definitions.</p>
        </div>
      ) : (
        categories.map(cat => {
          const catApps    = appsByCategory[cat] || [];
          const collapsed  = collapsedCats[cat];
          const activeCount = catApps.filter(a => a.isActive).length;

          return (
            <div key={cat} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800">{cat}</span>
                  <span className="text-xs text-gray-400">
                    {activeCount}/{catApps.length} active
                  </span>
                </div>
                {collapsed
                  ? <ChevronDown className="h-4 w-4 text-gray-400" />
                  : <ChevronUp   className="h-4 w-4 text-gray-400" />
                }
              </button>

              {/* App Grid */}
              {!collapsed && (
                <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catApps.map(app => (
                    <AppCard
                      key={app.slug}
                      app={app}
                      isSuperAdmin={isSuperAdmin}
                      toggling={toggling}
                      onToggle={toggle}
                      onMandatory={handleMandatory}
                      onVisibility={handleVisibility}
                      onShowDeps={setDepsApp}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Audit Log Section */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button
          onClick={toggleAudit}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-gray-700 text-sm">Audit Log</span>
          </div>
          {showAudit
            ? <ChevronUp   className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />
          }
        </button>

        {showAudit && (
          <div className="px-5 pb-5">
            {auditLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 rounded-full border-3 border-brand-purple border-t-transparent animate-spin" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No activity recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 px-3 text-xs font-semibold text-gray-500">App</th>
                      <th className="pb-2 px-3 text-xs font-semibold text-gray-500">Action</th>
                      <th className="pb-2 px-3 text-xs font-semibold text-gray-500">User / Role</th>
                      <th className="pb-2 px-3 text-xs font-semibold text-gray-500">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <AuditRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dependency Modal */}
      <DepsModal
        app={depsApp}
        onConfirm={handleConfirmDeps}
        onCancel={() => setDepsApp(null)}
      />
    </div>
  );
};

export default AppsPage;
