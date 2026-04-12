import React, { useState, useEffect } from 'react';
import { Bus, Map, Users, Plus, Trash2, MapPin, UserPlus, Loader2, Search } from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import SmartLearnerSearch from '../../shared/SmartLearnerSearch';

const TransportManager = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  
  // Data for route being managed
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [allLearners, setAllLearners] = useState([]);
  const [addingPassenger, setAddingPassenger] = useState(false);
  const [newPassengerId, setNewPassengerId] = useState('');

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

  const fetchAllLearners = async () => {
    try {
      const res = await api.learner.getAll({ limit: 1000 }); // Increase limit to fetch all for search
      const learners = res.data || [];
      setAllLearners(learners);
    } catch (err) {
      console.error('Failed to fetch learners for search');
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'routes' && allLearners.length === 0) {
      fetchAllLearners();
    }
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

  // Passenger Management Logic
  const handleManagePassengers = async (route) => {
    setSelectedRoute(route);
    setShowPassengerModal(true);
    setLoading(true);
    try {
      const res = await api.transport.getAssignments(route.id);
      if (res.success) {
        setPassengers(res.data);
      }
    } catch (err) {
      showError('Failed to load passengers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassenger = async () => {
    if (!newPassengerId) return;
    setAddingPassenger(true);
    try {
      const res = await api.transport.createAssignment({
        routeId: selectedRoute.id,
        passengerId: newPassengerId,
        passengerType: 'LEARNER'
      });
      if (res.success) {
        showSuccess('Passenger added and automarked');
        setNewPassengerId('');
        // Refresh list
        const updated = await api.transport.getAssignments(selectedRoute.id);
        setPassengers(updated.data);
        fetchData(); // Update count in main table
      }
    } catch (err) {
      showError(err.message || 'Failed to add passenger');
    } finally {
      setAddingPassenger(false);
    }
  };

  const handleRemovePassenger = async (assignmentId) => {
    if (!window.confirm('Remove student from this route?')) return;
    try {
      await api.transport.deleteAssignment(assignmentId);
      showSuccess('Passenger removed');
      // Refresh list
      const updated = await api.transport.getAssignments(selectedRoute.id);
      setPassengers(updated.data);
      fetchData(); // Update count in main table
    } catch (err) {
      showError('Failed to remove passenger');
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
    <div className="max-w-7xl mx-auto p-8 animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <Bus className="text-blue-600" size={32} />
            Transport & Fleet
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage school buses, drivers, and transport routes.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95 transform"
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
        {loading && activeTab !== 'routes' ? (
          <div className="p-12 text-center text-gray-400 animate-pulse font-bold">Loading...</div>
        ) : activeTab === 'vehicles' ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black tracking-widest text-gray-400">
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
                  <td className="p-4 font-black tracking-tight text-gray-900 border-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Bus size={18} /></div>
                      {v.registrationNumber}
                    </div>
                  </td>
                  <td className="p-4 border-none">
                    <p className="font-bold text-gray-800">{v.driverName}</p>
                    <p className="text-xs text-gray-500">{v.driverPhone}</p>
                  </td>
                  <td className="p-4 text-gray-600 font-bold border-none">{v.capacity} Seats</td>
                  <td className="p-4 border-none">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase">{v.status || 'ACTIVE'}</span>
                  </td>
                  <td className="p-4 text-right border-none">
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 italic">No vehicles registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black tracking-widest text-gray-400">
              <tr>
                <th className="p-4">Route Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Fee Amount</th>
                <th className="p-4">Assigned Vehicle</th>
                <th className="p-4">Passengers</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {routes.map(r => (
                <tr key={r.id} className="hover:bg-indigo-50/10 transition group">
                  <td className="p-4 font-black tracking-tight text-gray-900 border-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><MapPin size={18} /></div>
                      {r.name}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 border-none">{r.description || '—'}</td>
                  <td className="p-4 font-black text-emerald-600 border-none">KES {parseFloat(r.amount).toLocaleString()}</td>
                  <td className="p-4 border-none">
                    {r.vehicle ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-black rounded-lg">{r.vehicle.registrationNumber}</span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-black border border-amber-200 px-2 py-1 rounded-lg">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 border-none">
                    <button 
                      onClick={() => handleManagePassengers(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs"
                    >
                      <Users size={14} />
                      {r._count?.assignments || 0} Students
                    </button>
                  </td>
                  <td className="p-4 text-right border-none">
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 italic">No routes registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8 overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Add New {activeTab === 'vehicles' ? 'Vehicle' : 'Route'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {activeTab === 'vehicles' ? VehicleForm : RouteForm}
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 font-bold rounded-xl transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 transform">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passenger Management Modal */}
      {showPassengerModal && selectedRoute && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><Users size={24} /></div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{selectedRoute.name} Passengers</h2>
                  <p className="text-blue-100 text-xs font-bold">Manage students assigned to this route</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPassengerModal(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >✕</button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Add Passenger Section */}
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Assign New Student</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <SmartLearnerSearch 
                      learners={allLearners}
                      selectedLearnerId={newPassengerId}
                      onSelect={(id) => setNewPassengerId(id)}
                      placeholder="Search by name or admission number..."
                      className="learner-search-compact"
                    />
                  </div>
                  <button
                    disabled={!newPassengerId || addingPassenger}
                    onClick={handleAddPassenger}
                    className="h-[42px] px-6 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-600/10 active:scale-95 transform"
                  >
                    {addingPassenger ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                    <span>Assign</span>
                  </button>
                </div>
              </div>

              {/* Passenger List Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex justify-between items-center">
                  <span>Assigned Students ({passengers.length})</span>
                  <span>Automarking Active</span>
                </h3>
                
                {loading ? (
                   <div className="py-12 text-center text-gray-400 font-bold animate-pulse">Loading passengers...</div>
                ) : passengers.length > 0 ? (
                  <div className="grid gap-2">
                    {passengers.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all group shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-400 uppercase">
                            {assignment.passenger?.firstName.charAt(0)}{assignment.passenger?.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 tracking-tight">
                              {assignment.passenger?.firstName} {assignment.passenger?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 font-bold">
                              {assignment.passenger?.admissionNumber} • {assignment.passenger?.grade?.replace(/_/g, ' ')} {assignment.passenger?.stream}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePassenger(assignment.id)}
                          className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group-hover:opacity-100"
                          title="Remove from Route"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <Users size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 font-bold">No students assigned to this route yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowPassengerModal(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg active:scale-95 transform"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportManager;
