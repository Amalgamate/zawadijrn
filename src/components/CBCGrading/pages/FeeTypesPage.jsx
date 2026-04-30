import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';

const CATEGORIES = ['ACADEMIC', 'EXTRA_CURRICULAR', 'TRANSPORT', 'BOARDING', 'OTHER'];

const emptyForm = {
  code: '',
  name: '',
  description: '',
  category: 'ACADEMIC',
  isActive: true
};

const FeeTypesPage = () => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [feeTypes, setFeeTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fees.getAllFeeTypes();
      setFeeTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      showError(error.message || 'Failed to load fee types');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'ACADEMIC',
      isActive: item.isActive !== false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('Name is required');
      return;
    }
    if (!editing && !form.code.trim()) {
      showError('Code is required');
      return;
    }

    try {
      if (editing) {
        await api.fees.updateFeeType(editing.id, {
          name: form.name.trim(),
          description: form.description?.trim() || '',
          category: form.category,
          isActive: !!form.isActive
        });
        showSuccess('Fee type updated');
      } else {
        await api.fees.createFeeType({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          description: form.description?.trim() || '',
          category: form.category,
          isActive: !!form.isActive
        });
        showSuccess('Fee type created');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      loadTypes();
    } catch (error) {
      showError(error.message || 'Failed to save fee type');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete fee type "${item.name}"?`)) return;
    try {
      await api.fees.deleteFeeType(item.id);
      showSuccess('Fee type deleted');
      loadTypes();
    } catch (error) {
      showError(error.message || 'Failed to delete fee type');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Fee Types</h2>
          <p className="text-xs text-gray-500">Create and manage fee type definitions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition"
        >
          <Plus size={16} />
          New Fee Type
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Code {!editing && '*'}</label>
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                disabled={!!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g TUITION"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g Tuition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                value={form.isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === 'ACTIVE' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <X size={14} className="inline mr-1" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm hover:bg-brand-purple/90"
              >
                {editing ? 'Update Fee Type' : 'Create Fee Type'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && feeTypes.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-3 py-2 font-mono">{item.code}</td>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{String(item.category || '').replace(/_/g, ' ')}</td>
                <td className="px-3 py-2">{item.isActive ? 'ACTIVE' : 'INACTIVE'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1 text-brand-purple hover:bg-brand-purple/10 rounded">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(item)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-4 text-sm text-gray-500">Loading fee types...</div>}
        {!loading && feeTypes.length === 0 && <div className="p-4 text-sm text-gray-500">No fee types found.</div>}
      </div>
    </div>
  );
};

export default FeeTypesPage;
