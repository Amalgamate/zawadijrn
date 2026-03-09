/**
 * Parents List Page - Table Format with WhatsApp Integration
 * Display and manage parent/guardian information in table format
 * Teachers can archive but not delete
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Mail, Phone, Eye, MessageCircle, Archive, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import EmptyState from '../shared/EmptyState';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../hooks/useAuth';
import BulkOperationsModal from '../shared/bulk/BulkOperationsModal';

const ParentsList = ({ parents = [], pagination, onFetchParents, onAddParent, onEditParent, onViewParent, onDeleteParent, onArchiveParent, onRefresh, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const { can, isRole } = usePermissions();
  useAuth(); // Auth context
  const currentUserIsTeacher = isRole('TEACHER');

  // Check if user can delete (only admins)
  const canDelete = can('DELETE_PARENT');

  // Server-side filtering effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFetchParents) {
        onFetchParents({
          page: 1,
          search: searchTerm,
          limit: pagination?.limit || 20
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, onFetchParents, pagination?.limit]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (onFetchParents) {
      onFetchParents({
        page: newPage,
        search: searchTerm,
        limit: pagination?.limit || 20
      });
    }
  };

  // Filter parents (fallback for client-side if onFetchParents is not provided)
  const filteredParents = onFetchParents ? parents : parents.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  // Handle WhatsApp message
  const handleWhatsAppMessage = (parent) => {
    if (!parent.phone) {
      alert('This parent does not have a phone number on file.');
      return;
    }

    // Format phone number (remove spaces, dashes, etc.)
    let phoneNumber = String(parent.phone).replace(/[\s()-]/g, '');

    // Ensure it starts with country code or at least positive digit
    if (!phoneNumber.startsWith('+')) {
      // If it starts with 0 (traditional local), we still need to decide how to handle it.
      // For now, we'll keep the logic but move it to a more generic helper if possible.
      // Since we want to remove the hardcoded +254 assumption:
      if (phoneNumber.startsWith('0')) {
        // We'll still need a way to know the default country code, but for now we'll just prepend +
        phoneNumber = '+' + phoneNumber;
      } else {
        phoneNumber = '+' + phoneNumber;
      }
    }

    // Default message template
    const message = encodeURIComponent(
      `Dear ${parent.name},\n\nGreetings from Zawadi SMS Academy.\n\n`
    );

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleReset = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Compact Quick Actions Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">

          {/* Search */}
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto flex-1">
            <div className="relative flex-grow md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search parents by name, phone, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              />
            </div>

            {/* Reset Button */}
            {searchTerm && (
              <button
                onClick={handleReset}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                title="Reset search"
              >
                <RefreshCw size={20} />
              </button>
            )}
          </div>

          {/* Action Buttons & Metrics */}
          <div className="flex gap-3 w-full xl:w-auto justify-end items-center">
            {/* Metrics */}
            <div className="flex items-center gap-4 mr-2 border-r pr-4 border-gray-200 h-10">
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Parents</p>
                <p className="text-xl font-bold text-gray-800 leading-none">{pagination?.total || parents.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parents Table */}
      {filteredParents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Parents Found"
          message={searchTerm ? "No parents match your search criteria." : "No parents have been added yet."}
          actionText={!searchTerm ? "Add Your First Parent" : null}
          onAction={onAddParent}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Parent/Guardian</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Relationship</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Occupation</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Learners</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">WhatsApp</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParents.map((parent) => (
                <tr key={parent.id} onClick={() => onViewParent(parent)} className="hover:bg-gray-50 cursor-pointer transition">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-purple/80 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {parent.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{parent.firstName} {parent.middleName ? `${parent.middleName} ` : ''}{parent.lastName}</p>
                        <p className="text-xs text-gray-500">{parent.county || 'Nairobi'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-purple/10 text-brand-purple">
                      {parent.relationship}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail size={14} className="text-brand-purple" />
                      <span className="truncate max-w-[150px] text-xs">{parent.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone size={14} className="text-brand-purple" />
                      <span className="text-xs">{parent.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {parent.occupation || 'N/A'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Users size={14} className="text-gray-500" />
                      <span className="font-semibold text-gray-700 text-xs">
                        {parent.learnerIds?.length || 0}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {parent.learnerIds?.length === 1 ? 'child' : 'children'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={parent.status} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleWhatsAppMessage(parent); }}
                      disabled={!parent.phone}
                      className={`p-1.5 rounded-lg transition ${parent.phone
                        ? 'text-brand-teal hover:bg-brand-teal/10'
                        : 'text-gray-300 cursor-not-allowed'
                        }`}
                      title={parent.phone ? 'Send WhatsApp message' : 'No phone number'}
                    >
                      <MessageCircle size={16} />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewParent(parent); }}
                        className="p-1.5 text-brand-teal hover:bg-brand-teal/10 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {!currentUserIsTeacher && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditParent(parent); }}
                          className="p-1.5 text-brand-purple hover:bg-brand-purple/10 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {/* Archive button for teachers, Delete for admins */}
                      {currentUserIsTeacher ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onArchiveParent && onArchiveParent(parent.id); }}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Archive Parent"
                        >
                          <Archive size={16} />
                        </button>
                      ) : canDelete ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteParent(parent.id); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                          title="No permission to delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> parents
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`p-2 rounded-lg border ${pagination.page === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`p-2 rounded-lg border ${pagination.page === pagination.totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Parent Operations"
        entityType="parents"
        onUploadComplete={() => {
          setShowBulkModal(false);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export default ParentsList;
