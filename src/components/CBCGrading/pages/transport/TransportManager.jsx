import React, { useState, useEffect } from 'react';
import { Bus, Map, Users, Plus, Trash2, MapPin } from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const TransportManager = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    registrationNumber: '',
    capacity: '',
    driverName: '',
    driverPhone: '',
    name: '',
    description: '',
    amount: '',
    vehicleId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vehicles') {
        const res = await api.transport.getVehicles();
        if (res.success) setVehicles(res.data);
      } else {
        const res = await api.transport.getRoutes();
        if (res.success) setRoutes(res.data);
      }
    } catch (err) {
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    // When switching to routes, we need vehicles for the dropdown
    if (activeTab === 'routes') {
      api.transport.getVehicles().then(res => {
        if (res.success) setVehicles(res.data);
      });
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'vehicles') {
        const res = await api.transport.createVehicle(formData);
        if (res.success) {
          showSuccess('Vehicle added successfully');
          fetchData();
        }
      } else {
        const res = await api.transport.createRoute(formData);
        if (res.success) {
          showSuccess('Route added successfully');
          fetchData();
        }
      }
      setShowAddModal(false);
      setFormData({
        registrationNumber: '', capacity: '', driverName: '', driverPhone: '',
        name: '', description: '', amount: '', vehicleId: ''
      });
    } catch (error) {
      showError('Failed to save record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (activeTab === 'vehicles') {
        await api.transport.deleteVehicle(id);
      } else {
        await api.transport.deleteRoute(id);
      }
      showSuccess('Record deleted');
      fetchData();
    } catch (error) {
      showError('Failed to delete record');
    }
  };

  const VehicleForm = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Registration #</label>
        <input 
          type="text" 
          value={formData.registrationNumber} 
          onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
          className="w-full border rounded-lg p-2" 
          required 
          placeholder="e.g. KAB 123C"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Capacity</label>
        <input 
          type="number" 
          value={formData.capacity} 
          onChange={e => setFormData({ ...formData, capacity: e.target.value })}
          className="w-full border rounded-lg p-2" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Driver Name</label>
        <input 
          type="text" 
          value={formData.driverName} 
          onChange={e => setFormData({ ...formData, driverName: e.target.value })}
          className="w-full border rounded-lg p-2" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Driver Phone</label>
        <input 
          type="text" 
          value={formData.driverPhone} 
          onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
          className="w-full border rounded-lg p-2" 
        />
      </div>
    </div>
  );

  const RouteForm = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Route Name</label>
        <input 
          type="text" 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded-lg p-2" 
          required 
          placeholder="e.g. Westlands - Kileleshwa"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Fee Amount (KSH)</label>
        <input 
          type="number" 
          step="0.01"
          value={formData.amount} 
          onChange={e => setFormData({ ...formData, amount: e.target.value })}
          className="w-full border rounded-lg p-2" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Assign Vehicle</label>
        <select 
          value={formData.vehicleId} 
          onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
          className="w-full border rounded-lg p-2"
        >
          <option value="">-- No Vehicle Assigned --</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.registrationNumber} ({v.driverName})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Description (Stops)</label>
        <textarea 
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full border rounded-lg p-2" 
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Bus className="text-blue-600" size={32} />
            Transport & Fleet
          </h1>
          <p className="text-gray-500 mt-1">Manage school buses, drivers, and transport routes.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          <span>Add {activeTab === 'vehicles' ? 'Vehicle' : 'Route'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('vehicles')} 
          className={`pb-3 px-4 font-bold transition-all ${activeTab === 'vehicles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Fleet Vehicles
        </button>
        <button 
          onClick={() => setActiveTab('routes')} 
          className={`pb-3 px-4 font-bold transition-all ${activeTab === 'routes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Bus Routes
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 text-center text-gray-400 animate-pulse">Loading...</div>
        ) : activeTab === 'vehicles' ? (
          <table className="w-full text-left">
            <thead className="bg-[color:var(--table-header-bg)] border-b border-[color:var(--table-border)] text-[10px] uppercase font-semibold tracking-widest text-[color:var(--table-header-fg)]">
              <tr>
                <th className="p-4">Registration</th>
                <th className="p-4">Driver Details</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-blue-50/10 transition group">
                  <td className="p-4 font-black tracking-tight text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Bus size={18} /></div>
                      {v.registrationNumber}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{v.driverName}</p>
                    <p className="text-xs text-gray-500">{v.driverPhone}</p>
                  </td>
                  <td className="p-4 text-gray-600 font-bold">{v.capacity} Seats</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg uppercase">{v.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">No vehicles registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[color:var(--table-header-bg)] border-b border-[color:var(--table-border)] text-[10px] uppercase font-semibold tracking-widest text-[color:var(--table-header-fg)]">
              <tr>
                <th className="p-4">Route Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Fee Amount</th>
                <th className="p-4">Assigned Vehicle</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {routes.map(r => (
                <tr key={r.id} className="hover:bg-indigo-50/10 transition group">
                  <td className="p-4 font-black tracking-tight text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><MapPin size={18} /></div>
                      {r.name}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{r.description || '—'}</td>
                  <td className="p-4 font-black text-emerald-600">KES {parseFloat(r.amount).toLocaleString()}</td>
                  <td className="p-4">
                    {r.vehicle ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">{r.vehicle.registrationNumber}</span>
                    ) : (
                      <span className="text-xs text-amber-500 font-bold border border-amber-200 px-2 py-1 rounded-lg">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">No routes registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">
                Add New {activeTab === 'vehicles' ? 'Vehicle' : 'Route'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {activeTab === 'vehicles' ? VehicleForm : RouteForm}
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-50 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportManager;
