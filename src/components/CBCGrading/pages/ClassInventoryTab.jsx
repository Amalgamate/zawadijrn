/**
 * ClassInventoryTab
 * Manages class inventory items (books, stationery, equipment)
 */

import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toInputDate } from '../utils/dateHelpers';
import { Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui';
import './ClassInventoryTab.css';

const CATEGORIES = [
  'Books',
  'Stationery',
  'Equipment',
  'Furniture',
  'Technology',
  'Sports',
  'Art Supplies',
  'Science Materials',
  'Other'
];

const CONDITIONS = [
  { value: 'GOOD', label: 'Good', color: 'green' },
  { value: 'FAIR', label: 'Fair', color: 'yellow' },
  { value: 'POOR', label: 'Poor', color: 'orange' },
  { value: 'DAMAGED', label: 'Damaged', color: 'red' }
];

const ClassInventoryTab = ({ classData, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    description: '',
    condition: 'GOOD',
    cost: '',
    location: '',
    acquisitionDate: ''
  });

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: '',
      quantity: 1,
      description: '',
      condition: 'GOOD',
      cost: '',
      location: '',
      acquisitionDate: ''
    });
    setShowAddForm(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      description: item.description || '',
      condition: item.condition,
      cost: item.cost || '',
      location: item.location || '',
      acquisitionDate: item.acquisitionDate ? item.acquisitionDate.split('T')[0] : ''
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingItem
        ? `/api/classes/${classData.id}/inventory/${editingItem.id}`
        : `/api/classes/${classData.id}/inventory`;

      const method = editingItem ? 'PUT' : 'POST';

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
      console.error('Failed to save inventory item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await fetch(`/api/classes/${classData.id}/inventory/${itemId}`, {
          method: 'DELETE'
        });
        onRefresh?.();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const filteredItems = classData.inventory?.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterCondition && item.condition !== filterCondition) return false;
    return true;
  }) || [];

  const getConditionColor = (condition) => {
    const cond = CONDITIONS.find(c => c.value === condition);
    return {
      bg: `bg-${cond?.color || 'gray'}-100`,
      text: `text-${cond?.color || 'gray'}-800`,
      dot: `bg-${cond?.color || 'gray'}-500`
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Class Inventory</h3>
          <p className="text-sm text-gray-500 mt-1">{filteredItems.length} items in class</p>
        </div>
        <Button
          onClick={handleAddClick}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Plus size={16} />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase">Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 uppercase">Filter by Condition</label>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map(cond => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Items */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const colors = getConditionColor(item.condition);
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    {/* Item Name */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Item</p>
                      <p className="font-bold text-gray-900 mt-1">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Category</p>
                      <p className="font-bold text-gray-900 mt-1">{item.category}</p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Quantity</p>
                      <p className="font-bold text-blue-600 mt-1 text-lg">{item.quantity}</p>
                    </div>

                    {/* Condition */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Condition</p>
                      <span className={`text-xs font-bold px-3 py-1 rounded mt-1 inline-block ${colors.bg} ${colors.text}`}>
                        {CONDITIONS.find(c => c.value === item.condition)?.label}
                      </span>
                    </div>

                    {/* Cost & Location */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Details</p>
                      <p className="text-sm mt-1">
                        {item.cost && <span className="block">Cost: ${item.cost.toFixed(2)}</span>}
                        {item.location && <span className="block text-xs text-gray-600">{item.location}</span>}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
            <p className="text-gray-600 font-semibold">No inventory items found</p>
            <p className="text-sm text-gray-500 mt-1">Add your first inventory item to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      {showAddForm && (
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  placeholder="e.g., English Textbook"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  min="1"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CONDITIONS.map(cond => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>

              {/* Cost */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Shelf A1"
                />
              </div>

              {/* Acquisition Date */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Acquisition Date</label>
                <input
                  type="date"
                  value={toInputDate(formData.acquisitionDate)}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClassInventoryTab;
