/**
 * AppAuditLog — table of append-only app toggle actions.
 * Only rendered for SUPER_ADMIN (enforced by the parent page, not here).
 */

import React, { useState, useEffect } from 'react';
import { appsApi } from '../../services/api/apps.api';
import { Loader2, RefreshCw } from 'lucide-react';

const ACTION_STYLES = {
  ACTIVATED:   'bg-green-100 text-green-700',
  DEACTIVATED: 'bg-gray-100 text-gray-600',
  LOCKED:      'bg-amber-100 text-amber-700',
  UNLOCKED:    'bg-blue-100 text-blue-700',
  SHOWN:       'bg-purple-100 text-purple-700',
  HIDDEN:      'bg-red-100 text-red-600',
};

function ActionBadge({ action }) {
  const cls = ACTION_STYLES[action] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {action.charAt(0) + action.slice(1).toLowerCase()}
    </span>
  );
}

export default function AppAuditLog({ schoolId }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchLogs = async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appsApi.getAuditLog(schoolId);
      setLogs(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">Loading audit log…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 py-6 text-center">{error}</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Audit Log</h3>
        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No actions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">App</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Performed by</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-gray-800">
                    {log.app?.icon && <span className="mr-1.5">{log.app.icon}</span>}
                    {log.app?.name ?? log.appId}
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">
                    {log.performer?.email ?? log.performedBy}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.roleAtTime}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
