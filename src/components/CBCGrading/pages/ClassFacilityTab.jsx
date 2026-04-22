/**
 * ClassFacilityTab
 * Manages class facilities and maintenance tracking
 */

import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Wrench } from 'lucide-react';
import { toInputDate } from '../utils/dateHelpers';
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui';
import './ClassFacilityTab.css';

const FACILITY_TYPES = [
  'Projector',
  'Whiteboard',
  'Computer',
  'Desk',
  'Chair',
  'Cabinet',
  'Door',
  'Window',
  'Air Conditioner',
  'Light',
  'Other'
];

const CONDITIONS = [
  { value: 'FUNCTIONAL', label: 'Functional', color: 'green' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair', color: 'yellow' },
  { value: 'NON_FUNCTIONAL', label: 'Non-Functional', color: 'red' }
];

const ClassFacilityTab = ({ classData, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [formData, setFormData] = useState({
    facilityName: '',
    facilityType: '',
    quantity: 1,
    condition: 'FUNCTIONAL',
    maintenanceRequired: false,
    lastMaintenance: ''
  });

  const handleAddClick = () => {
    setEditingFacility(null);
    setFormData({
      facilityName: '',
      facilityType: '',
      quantity: 1,
      condition: 'FUNCTIONAL',
      maintenanceRequired: false,
      lastMaintenance: ''
    });
    setShowAddForm(true);
  };

  const handleEditClick = (facility) => {
    setEditingFacility(facility);
    setFormData({
      facilityName: facility.facilityName,
      facilityType: facility.facilityType,
      quantity: facility.quantity,
      condition: facility.condition,
      maintenanceRequired: facility.maintenanceRequired || false,
      lastMaintenance: facility.lastMaintenance
        ? facility.lastMaintenance.split('T')[0]
        : ''
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingFacility
        ? `/api/classes/${classData.id}/facilities/${editingFacility.id}`
        : `/api/classes/${classData.id}/facilities`;

      const method = editingFacility ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddForm(false);
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to save facility:', error);
    }
  };

  const handleDelete = async (facilityId) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this facility?')) {
      try {
        await fetch(`/api/classes/${classData.id}/facilities/${facilityId}`, {
          method: 'DELETE'
        });
        onRefresh?.();
      } catch (error) {
        console.error('Failed to delete facility:', error);
      }
    }
  };

  const filteredFacilities = classData.facilities?.filter(facility => {
    if (filterType && facility.facilityType !== filterType) return false;
    if (filterCondition && facility.condition !== filterCondition) return false;
    return true;
  }) || [];

  const getConditionStyle = (condition) => {
    const cond = CONDITIONS.find(c => c.value === condition);
    return {
      bg: `bg-${cond?.color || 'gray'}-100`,
      text: `text-${cond?.color || 'gray'}-800`,
      border: `border-${cond?.color || 'gray'}-300`
    };
  };

  // Statistics
  const functionalCount = classData.facilities?.filter(f => f.condition === 'FUNCTIONAL').length || 0;
  const needsRepairCount = classData.facilities?.filter(f => f.condition === 'NEEDS_REPAIR').length || 0;
  const nonFunctionalCount = classData.facilities?.filter(f => f.condition === 'NON_FUNCTIONAL').length || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Class Facilities</h3>
          <p className="text-sm text-gray-500 mt-1">{filteredFacilities.length} facilities tracked</p>
        </div>
        <Button
          onClick={handleAddClick}
          className="bg-red-600 hover:bg-red-700"
          size="sm"
        >
          <Plus size={16} />
          Add Facility
        </Button>
      </div>

      {/* Statistics Cards */}
      {classData.facilities && classData.facilities.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs font-medium text-green-900">Functional</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{functionalCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs font-medium text-yellow-900">Needs Repair</p>
              <p className="text-2xl font-semibold text-yellow-600 mt-1">{needsRepairCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs font-medium text-red-900">Non-Functional</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">{nonFunctionalCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Types</option>
            {FACILITY_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 uppercase">Filter by Condition</label>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map(cond => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      {filteredFacilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFacilities.map(facility => {
            const styles = getConditionStyle(facility.condition);
            const conditionLabel = CONDITIONS.find(c => c.value === facility.condition)?.label;
            const isNeedMaintenance = facility.maintenanceRequired;

            return (
              <Card key={facility.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Facility</p>
                      <p className="font-medium text-gray-900 mt-1">{facility.facilityName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${styles.bg} ${styles.text}`}>
                      {conditionLabel}
                    </span>
                  </div>

                  {/* Type and Quantity */}
                  <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Type</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{facility.facilityType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Quantity</p>
                      <p className="text-sm font-medium text-blue-600 mt-1">{facility.quantity}</p>
                    </div>
                  </div>

                  {/* Maintenance Status */}
                  {isNeedMaintenance && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex gap-2 items-center">
                        <Wrench size={14} className="text-yellow-700" />
                        <span className="text-xs font-medium text-yellow-900">Maintenance Required</span>
                      </div>
                    </div>
                  )}

                  {/* Last Maintenance */}
                  {facility.lastMaintenance && (
                    <div className="mb-3 text-xs text-gray-600">
                      <p className="font-medium">Last Maintenance</p>
                      <p>{new Date(facility.lastMaintenance).toLocaleDateString()}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleEditClick(facility)}
                      className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(facility.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 font-semibold">No facilities tracked</p>
            <p className="text-sm text-gray-500 mt-1">Add facilities to track classroom resources</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      {showAddForm && (
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFacility ? 'Edit Facility' : 'Add Facility'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Facility Name */}
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Facility Name *</label>
                <input
                  type="text"
                  value={formData.facilityName}
                  onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  placeholder="e.g., Projector 1"
                />
              </div>

              {/* Facility Type */}
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Facility Type *</label>
                <select
                  value={formData.facilityType}
                  onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select Type</option>
                  {FACILITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  min="1"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Condition *</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  {CONDITIONS.map(cond => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>

              {/* Last Maintenance */}
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Last Maintenance</label>
                <input
                  type="date"
                  value={toInputDate(formData.lastMaintenance)}
                  onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Maintenance Required */}
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <input
                  type="checkbox"
                  id="maintenanceRequired"
                  checked={formData.maintenanceRequired}
                  onChange={(e) => setFormData({ ...formData, maintenanceRequired: e.target.checked })}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="maintenanceRequired" className="text-sm font-medium text-yellow-900 cursor-pointer flex-1">
                  Maintenance Required
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {editingFacility ? 'Update Facility' : 'Add Facility'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClassFacilityTab;
