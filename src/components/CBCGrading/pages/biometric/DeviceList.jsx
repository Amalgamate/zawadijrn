import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Cpu, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  Signal,
  WifiOff,
  Search,
  ShieldAlert
} from 'lucide-react';
import { biometricAPI } from '../../../../services/api/biometric.api';

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', location: '', deviceType: 'ZKTECO_BRIDGE' });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await biometricAPI.getDevices();
      setDevices(data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await biometricAPI.registerDevice(newDevice);
      setIsAdding(false);
      setNewDevice({ name: '', location: '', deviceType: 'ZKTECO_BRIDGE' });
      fetchDevices();
    } catch (error) {
      console.error('Error creating device:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to decommission this terminal?')) {
      try {
        await biometricAPI.deleteDevice(id);
        fetchDevices();
      } catch (error) {
        console.error('Error deleting device:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Add Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Filter terminals..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
        >
          <Plus size={16} />
          Register Terminal
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 animate-in zoom-in-95 duration-300 shadow-xl shadow-indigo-500/5">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Name</label>
              <input 
                required
                value={newDevice.name}
                onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                placeholder="e.g. Main Entrance North"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Location</label>
              <input 
                required
                value={newDevice.location}
                onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                placeholder="e.g. Block A, Ground Floor"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="submit"
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
              >
                Confirm Registration
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-48 rounded-3xl border border-slate-100 animate-pulse" />
          ))
        ) : devices.length > 0 ? (
          devices.map((device) => (
            <div key={device.id} className="bg-white p-6 rounded-3xl border border-slate-200 group hover:border-indigo-200 transition-all shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl ${device.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Cpu size={28} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    device.isActive ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : 'bg-slate-50 text-slate-400 ring-1 ring-slate-400/20'
                  }`}>
                    {device.isActive ? <Signal size={12} /> : <WifiOff size={12} />}
                    {device.isActive ? 'Active' : 'Offline'}
                  </span>
                  <div className="p-1.5 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(device.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{device.name}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">{device.location}</p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <p className="text-[9px] font-black text-slate-900 font-mono tracking-tighter">
                    {device.deviceToken.split('-')[0].toUpperCase()}••••
                  </p>
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  Last Sync: {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-slate-200 flex flex-col items-center">
            <Cpu size={48} className="text-slate-100 mb-4" />
            <h4 className="text-slate-400 font-black uppercase tracking-widest">No Terminals Registered</h4>
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-2 italic">Register a device to begin biometric acquisition</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList;
