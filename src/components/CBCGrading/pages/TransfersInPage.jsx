/**
 * Transfers In Page
 * Manage incoming student transfers
 */

import React, { useState } from 'react';
import { CheckCircle, Eye, Filter, Search, UserPlus, XCircle } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import { useNotifications } from '../hooks/useNotifications';

const TransfersInPage = () => {
  const { showSuccess, showError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const [incomingTransfers, setIncomingTransfers] = useState([
    {
      id: 200, firstName: 'Brian', lastName: 'Mutua', previousSchool: 'Starehe Boys School',
      grade: 'Grade 5', stream: 'A', status: 'Pending', transferDate: '2025-01-20',
      documents: ['Transfer Letter', 'Birth Certificate', 'Progress Report'],
      guardian: 'Peter Mutua', guardianPhone: '+254701234567', reason: 'Relocation'
    },
    {
      id: 201, firstName: 'Diana', lastName: 'Wambui', previousSchool: 'Hillcrest Academy',
      grade: 'Grade 3', stream: 'B', status: 'Pending', transferDate: '2025-01-22',
      documents: ['Transfer Letter', 'Birth Certificate'], guardian: 'Mary Wambui',
      guardianPhone: '+254702345678', reason: 'Better opportunities'
    },
    {
      id: 202, firstName: 'Kevin', lastName: 'Omondi', previousSchool: 'Greenfield School',
      grade: 'Grade 4', stream: 'A', status: 'Approved', transferDate: '2025-01-15',
      documents: ['Transfer Letter', 'Birth Certificate', 'Medical Records'],
      guardian: 'James Omondi', guardianPhone: '+254703456789', reason: 'Family relocation'
    }
  ]);

  const handleApprove = (transfer) => {
    setIncomingTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, status: 'Approved' } : t));
    showSuccess(`${transfer.firstName} ${transfer.lastName} transfer approved!`);
    setShowDetailsModal(false);
  };

  const handleReject = (transfer) => {
    setIncomingTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, status: 'Rejected' } : t));
    showError(`${transfer.firstName} ${transfer.lastName} transfer rejected.`);
    setShowDetailsModal(false);
  };

  const filteredTransfers = incomingTransfers.filter(transfer => {
    const matchesSearch = transfer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.previousSchool.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transfer.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: incomingTransfers.length,
    pending: incomingTransfers.filter(t => t.status?.toLowerCase() === 'pending').length,
    approved: incomingTransfers.filter(t => t.status?.toLowerCase() === 'approved').length,
    rejected: incomingTransfers.filter(t => t.status?.toLowerCase() === 'rejected').length
  };

  return (
    <div className="space-y-6">

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-lg p-4">
          <p className="text-brand-purple text-sm font-bold uppercase tracking-wider">Total Transfers</p>
          <p className="text-3xl font-bold text-brand-purple">{stats.total}</p>
        </div>
        <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4">
          <p className="text-brand-teal text-sm font-bold uppercase tracking-wider">Pending</p>
          <p className="text-3xl font-bold text-brand-teal">{stats.pending}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm font-semibold">Approved</p>
          <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-semibold">Rejected</p>
          <p className="text-3xl font-bold text-red-800">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              placeholder="Search by name or school..."
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {filteredTransfers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No Transfers Found"
              message="No incoming transfers match your search criteria"
            />
          ) : (
            <table className="w-full">
              <thead className="border-b border-[color:var(--table-border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Previous School</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Grade/Stream</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Transfer Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">{transfer.firstName} {transfer.lastName}</p>
                        <p className="text-sm text-gray-500">{transfer.guardian}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{transfer.previousSchool}</td>
                    <td className="px-6 py-4 text-gray-700">{transfer.grade} - {transfer.stream}</td>
                    <td className="px-6 py-4 text-gray-600">{transfer.transferDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${transfer.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        transfer.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-brand-teal/10 text-brand-teal'
                        }`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedTransfer(transfer); setShowDetailsModal(true); }}
                          className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {transfer.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(transfer)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(transfer)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Transfer Details</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Student Name</p>
                  <p className="text-lg font-bold text-gray-900">{selectedTransfer.firstName} {selectedTransfer.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedTransfer.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    selectedTransfer.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-brand-teal/10 text-brand-teal'
                    }`}>
                    {selectedTransfer.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Previous School</p>
                  <p className="text-gray-900">{selectedTransfer.previousSchool}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Transfer Date</p>
                  <p className="text-gray-900">{selectedTransfer.transferDate}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Grade & Stream</p>
                  <p className="text-gray-900">{selectedTransfer.grade} - {selectedTransfer.stream}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Reason</p>
                  <p className="text-gray-900">{selectedTransfer.reason}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Parent/Guardian Information</p>
                <p className="text-gray-900">{selectedTransfer.guardian}</p>
                <p className="text-gray-600">{selectedTransfer.guardianPhone}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Submitted Documents</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedTransfer.documents.map((doc, idx) => (
                    <li key={idx} className="text-gray-700">{doc}</li>
                  ))}
                </ul>
              </div>

              {selectedTransfer.status === 'Pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedTransfer)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    <CheckCircle size={20} /> Approve Transfer
                  </button>
                  <button
                    onClick={() => handleReject(selectedTransfer)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    <XCircle size={20} /> Reject Transfer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersInPage;
