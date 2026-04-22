/**
 * AppDepsModal — confirmation dialog shown when disabling an app
 * would cascade to deactivate its dependants, or when the API
 * returns a 400 listing what must be disabled first.
 *
 * Props:
 *   app        — the app the user is trying to toggle
 *   dependants — string[] of app names that depend on it
 *   onConfirm  — proceed anyway (only relevant for enabling with auto-deps)
 *   onClose    — dismiss without action
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function AppDepsModal({ app, dependants = [], onConfirm, onClose }) {
  const isBlocking = !onConfirm; // true = "you must disable these first" (no confirm)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <h2 className="font-semibold text-gray-800 text-base">
              {isBlocking ? 'Cannot disable module' : 'Dependencies will be enabled'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="text-sm text-gray-600 space-y-3">
          {isBlocking ? (
            <>
              <p>
                <span className="font-medium text-gray-800">{app.name}</span> cannot be
                disabled because the following active modules depend on it:
              </p>
              <ul className="space-y-1 pl-4 list-disc text-gray-700">
                {dependants.map(d => <li key={d}>{d}</li>)}
              </ul>
              <p className="text-gray-500">Disable those modules first, then try again.</p>
            </>
          ) : (
            <>
              <p>
                Enabling <span className="font-medium text-gray-800">{app.name}</span> will
                also automatically enable the following required modules:
              </p>
              <ul className="space-y-1 pl-4 list-disc text-gray-700">
                {dependants.map(d => <li key={d}>{d}</li>)}
              </ul>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {isBlocking ? 'OK' : 'Cancel'}
          </button>
          {!isBlocking && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Enable anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
