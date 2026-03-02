/**
 * Backup Settings Page
 */

import React, { useState } from 'react';
import { Download, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const BackupSettings = () => {
  const { showSuccess, showError } = useNotifications();
  const [backups, setBackups] = useState([
    { id: 1, date: '2026-01-15 10:30 AM', size: '2.5 MB', type: 'Auto' },
    { id: 2, date: '2026-01-10 09:15 AM', size: '2.3 MB', type: 'Manual' },
    { id: 3, date: '2026-01-05 14:20 PM', size: '2.4 MB', type: 'Auto' }
  ]);

  const handleCreateBackup = () => {
    const newBackup = {
      id: backups.length + 1,
      date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
      size: '2.6 MB',
      type: 'Manual'
    };
    setBackups(prev => [newBackup, ...prev]);
    showSuccess('Backup created successfully!');
  };

  const handleDownload = (id) => {
    showSuccess(`Backup #${id} downloaded!`);
  };

  const handleDelete = (id) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    showSuccess('Backup deleted successfully!');
  };

  const handleRestore = (id) => {
    showError('Restore feature will overwrite current data. Please confirm before proceeding.');
  };

  return (
    <div className="space-y-6">
      {/* Compact Action Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex justify-end">
        <button 
          onClick={handleCreateBackup} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <RefreshCw size={20} /> 
          <span>Create Backup</span>
        </button>
      </div>

      {/* Backup Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">About Backups</h3>
        <p className="text-blue-800 mb-3">Regular backups ensure your data is safe. Backups include all learner records, assessments, and system settings.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600">Last Backup</p>
            <p className="text-lg font-bold text-gray-900">Jan 15, 2026 10:30 AM</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600">Total Backups</p>
            <p className="text-lg font-bold text-gray-900">{backups.length} Backups</p>
          </div>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">Restore from Backup</h3>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="text-orange-800 flex items-start gap-2">
            <span className="text-2xl">⚠️</span>
            <span>Restoring from a backup will replace all current data. This action cannot be undone. Please ensure you have a recent backup before proceeding.</span>
          </p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".backup" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
          <button className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">
            <Upload size={20} /> Restore Backup
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-bold">Backup History</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {backups.map(backup => (
              <tr key={backup.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-800">{backup.date}</td>
                <td className="px-6 py-4 text-gray-600">{backup.size}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                    backup.type === 'Auto' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>{backup.type}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDownload(backup.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Download">
                      <Download size={18} />
                    </button>
                    <button onClick={() => handleRestore(backup.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Restore">
                      <RefreshCw size={18} />
                    </button>
                    <button onClick={() => handleDelete(backup.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Auto Backup Settings */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">Automatic Backup Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">Enable Automatic Backups</p>
              <p className="text-sm text-gray-600">System will create backups automatically</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Backup Frequency</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Backup Time</label>
              <input type="time" defaultValue="02:00" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
