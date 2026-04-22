import React, { useState, useEffect, useCallback } from 'react';
import {
    Bus, MapPin, Users, Plus, Trash2, UserPlus,
    Loader2, Pencil, X, AlertTriangle, CreditCard
} from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import SmartLearnerSearch from '../../shared/SmartLearnerSearch';
import usePageNavigation from '../../../../hooks/usePageNavigation';

// ─── small helpers ────────────────────────────────────────────────────────────

const EMPTY_VEHICLE = { registrationNumber: '', capacity: '', driverName: '', driverPhone: '' };
const EMPTY_ROUTE   = { name: '', description: '', amount: '', vehicleId: '' };

function CapacityBadge({ assigned, capacity }) {
    if (!capacity) return null;
    const pct  = Math.round((assigned / capacity) * 100);
    const full  = assigned >= capacity;
    const warn  = pct >= 80;
    const color = full ? 'bg-red-100 text-red-700' : warn ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
    return (
        <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
            {assigned}/{capacity}
        </span>
    );
}

function Modal({ title, onClose, children, wide = false }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} my-8 overflow-hidden`}>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function FormField({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputCls = 'w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';

// ─── vehicle form ─────────────────────────────────────────────────────────────

function VehicleForm({ data, onChange }) {
    return (
        <div className="space-y-4">
            <FormField label="Registration Number">
                <input className={inputCls} value={data.registrationNumber}
                    onChange={e => onChange({ ...data, registrationNumber: e.target.value })}
                    placeholder="e.g. KAB 123C" required />
            </FormField>
            <FormField label="Capacity (seats)">
                <input className={inputCls} type="number" min="1" value={data.capacity}
                    onChange={e => onChange({ ...data, capacity: e.target.value })}
                    required />
            </FormField>
            <FormField label="Driver Name">
                <input className={inputCls} value={data.driverName}
                    onChange={e => onChange({ ...data, driverName: e.target.value })}
                    required />
            </FormField>
            <FormField label="Driver Phone">
                <input className={inputCls} value={data.driverPhone}
                    onChange={e => onChange({ ...data, driverPhone: e.target.value })}
                    placeholder="Optional" />
            </FormField>
        </div>
    );
}

// ─── route form ───────────────────────────────────────────────────────────────

function RouteForm({ data, onChange, vehicles }) {
    return (
        <div className="space-y-4">
            <FormField label="Route Name">
                <input className={inputCls} value={data.name}
                    onChange={e => onChange({ ...data, name: e.target.value })}
                    placeholder="e.g. Westlands – Kileleshwa" required />
            </FormField>
            <FormField label="Fee Amount (KES)">
                <input className={inputCls} type="number" step="0.01" min="0" value={data.amount}
                    onChange={e => onChange({ ...data, amount: e.target.value })}
                    required />
            </FormField>
            <FormField label="Assigned Vehicle">
                <select className={inputCls} value={data.vehicleId}
                    onChange={e => onChange({ ...data, vehicleId: e.target.value })}>
                    <option value="">— No vehicle —</option>
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.registrationNumber} · {v.driverName} ({v.capacity} seats)
                        </option>
                    ))}
                </select>
            </FormField>
            <FormField label="Stops / Description">
                <textarea className={inputCls} rows={3} value={data.description}
                    onChange={e => onChange({ ...data, description: e.target.value })}
                    placeholder="List major pick-up stops…" />
            </FormField>
        </div>
    );
}

// ─── summary bar ─────────────────────────────────────────────────────────────

function SummaryBar({ summary }) {
    if (!summary) return null;
    const cards = [
        { label: 'Vehicles',           value: summary.vehicleCount },
        { label: 'Routes',             value: summary.routeCount },
        { label: 'Assignments',        value: summary.assignmentCount },
        { label: 'Transport Students', value: summary.transportStudentCount },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {cards.map(c => (
                <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-2xl font-semibold text-gray-900">{c.value ?? '—'}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{c.label}</p>
                </div>
            ))}
            {summary.overCapacityRoutes?.length > 0 && (
                <div className="col-span-2 md:col-span-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 font-medium">
                    <AlertTriangle size={16} />
                    Over-capacity: {summary.overCapacityRoutes.map(r => `${r.name} (${r.assigned}/${r.capacity})`).join(', ')}
                </div>
            )}
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

const TransportManager = () => {
    const [activeTab, setActiveTab]     = useState('vehicles');
    const navigateTo = usePageNavigation();
    const [vehicles, setVehicles]       = useState([]);
    const [routes, setRoutes]           = useState([]);
    const [summary, setSummary]         = useState(null);
    const [loading, setLoading]         = useState(false);
    const { showSuccess, showError }    = useNotifications();

    // Add / Edit vehicle
    const [vehicleModal, setVehicleModal]   = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [vehicleForm, setVehicleForm]     = useState(EMPTY_VEHICLE);
    const [savingVehicle, setSavingVehicle] = useState(false);

    // Add / Edit route
    const [routeModal, setRouteModal]     = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const [routeForm, setRouteForm]       = useState(EMPTY_ROUTE);
    const [savingRoute, setSavingRoute]   = useState(false);

    // Passenger management
    const [passengerModal, setPassengerModal] = useState(false);
    const [selectedRoute, setSelectedRoute]   = useState(null);
    const [passengers, setPassengers]         = useState([]);
    const [allLearners, setAllLearners]       = useState([]);
    const [newPassengerId, setNewPassengerId] = useState('');
    const [addingPassenger, setAddingPassenger] = useState(false);
    const [loadingPassengers, setLoadingPassengers] = useState(false);

    // ── data fetching ─────────────────────────────────────────────────────────

    const fetchSummary = useCallback(async () => {
        try {
            const res = await api.transport.getSummary();
            if (res.success) setSummary(res.data);
        } catch { /* non-fatal */ }
    }, []);

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.transport.getVehicles();
            if (res.success) setVehicles(res.data);
        } catch { showError('Failed to load vehicles'); }
        finally { setLoading(false); }
    }, []);

    const fetchRoutes = useCallback(async () => {
        setLoading(true);
        try {
            const [rRes, vRes] = await Promise.all([
                api.transport.getRoutes(),
                api.transport.getVehicles()
            ]);
            if (rRes.success) setRoutes(rRes.data);
            if (vRes.success) setVehicles(vRes.data);
        } catch { showError('Failed to load routes'); }
        finally { setLoading(false); }
    }, []);

    const fetchAllLearners = useCallback(async () => {
        if (allLearners.length > 0) return;
        try {
            const res = await api.learner.getAll({ limit: 1000 });
            setAllLearners(res.data || []);
        } catch { /* non-fatal */ }
    }, [allLearners.length]);

    useEffect(() => {
        fetchSummary();
        if (activeTab === 'vehicles') fetchVehicles();
        else if (activeTab === 'routes') fetchRoutes();
    }, [activeTab]);

    // ── vehicle CRUD ──────────────────────────────────────────────────────────

    const openAddVehicle = () => {
        setEditingVehicle(null);
        setVehicleForm(EMPTY_VEHICLE);
        setVehicleModal(true);
    };

    const openEditVehicle = (v) => {
        setEditingVehicle(v);
        setVehicleForm({
            registrationNumber: v.registrationNumber,
            capacity:           String(v.capacity),
            driverName:         v.driverName,
            driverPhone:        v.driverPhone || ''
        });
        setVehicleModal(true);
    };

    const saveVehicle = async (e) => {
        e.preventDefault();
        setSavingVehicle(true);
        try {
            if (editingVehicle) {
                const res = await api.transport.updateVehicle(editingVehicle.id, vehicleForm);
                if (res.success) { showSuccess('Vehicle updated'); fetchVehicles(); fetchSummary(); }
            } else {
                const res = await api.transport.createVehicle(vehicleForm);
                if (res.success) { showSuccess('Vehicle added'); fetchVehicles(); fetchSummary(); }
            }
            setVehicleModal(false);
        } catch (err) {
            showError(err?.message || 'Failed to save vehicle');
        } finally { setSavingVehicle(false); }
    };

    const deleteVehicle = async (id) => {
        if (!window.confirm('Archive this vehicle?')) return;
        try {
            await api.transport.deleteVehicle(id);
            showSuccess('Vehicle archived');
            fetchVehicles();
            fetchSummary();
        } catch { showError('Failed to archive vehicle'); }
    };

    // ── route CRUD ────────────────────────────────────────────────────────────

    const openAddRoute = () => {
        setEditingRoute(null);
        setRouteForm(EMPTY_ROUTE);
        setRouteModal(true);
    };

    const openEditRoute = (r) => {
        setEditingRoute(r);
        setRouteForm({
            name:        r.name,
            description: r.description || '',
            amount:      String(r.amount),
            vehicleId:   r.vehicleId || ''
        });
        setRouteModal(true);
    };

    const saveRoute = async (e) => {
        e.preventDefault();
        setSavingRoute(true);
        try {
            if (editingRoute) {
                const res = await api.transport.updateRoute(editingRoute.id, routeForm);
                if (res.success) { showSuccess('Route updated'); fetchRoutes(); fetchSummary(); }
            } else {
                const res = await api.transport.createRoute(routeForm);
                if (res.success) { showSuccess('Route created'); fetchRoutes(); fetchSummary(); }
            }
            setRouteModal(false);
        } catch (err) {
            showError(err?.message || 'Failed to save route');
        } finally { setSavingRoute(false); }
    };

    const deleteRoute = async (id) => {
        if (!window.confirm('Archive this route?')) return;
        try {
            await api.transport.deleteRoute(id);
            showSuccess('Route archived');
            fetchRoutes();
            fetchSummary();
        } catch { showError('Failed to archive route'); }
    };

    // ── passenger management ──────────────────────────────────────────────────

    const openPassengerModal = async (route) => {
        setSelectedRoute(route);
        setPassengerModal(true);
        setNewPassengerId('');
        setLoadingPassengers(true);
        fetchAllLearners();
        try {
            const res = await api.transport.getAssignments(route.id);
            if (res.success) setPassengers(res.data);
        } catch { showError('Failed to load passengers'); }
        finally { setLoadingPassengers(false); }
    };

    const refreshPassengers = async () => {
        if (!selectedRoute) return;
        try {
            const res = await api.transport.getAssignments(selectedRoute.id);
            if (res.success) setPassengers(res.data);
        } catch { /* non-fatal */ }
    };

    const addPassenger = async () => {
        if (!newPassengerId) return;
        setAddingPassenger(true);
        try {
            const res = await api.transport.createAssignment({
                routeId:      selectedRoute.id,
                passengerId:  newPassengerId,
                passengerType: 'LEARNER'
            });
            if (res.success) {
                showSuccess('Student assigned');
                setNewPassengerId('');
                await refreshPassengers();
                fetchRoutes();
                fetchSummary();
            }
        } catch (err) {
            showError(err?.message || 'Failed to assign student');
        } finally { setAddingPassenger(false); }
    };

    const removePassenger = async (assignmentId) => {
        if (!window.confirm('Remove student from this route?')) return;
        try {
            await api.transport.deleteAssignment(assignmentId);
            showSuccess('Student removed');
            await refreshPassengers();
            fetchRoutes();
            fetchSummary();
        } catch { showError('Failed to remove student'); }
    };

    // ── tab capacity info ─────────────────────────────────────────────────────

    const getRouteCapacityInfo = (route) => {
        const vehicle   = vehicles.find(v => v.id === route.vehicleId);
        const assigned  = route._count?.assignments ?? 0;
        const capacity  = vehicle?.capacity ?? null;
        const isFull    = capacity !== null && assigned >= capacity;
        return { assigned, capacity, isFull };
    };

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 font-sans">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-3 tracking-tight">
                        <Bus className="text-blue-600" size={30} />
                        Transport & Fleet
                    </h1>
                    <p className="text-gray-500 mt-0.5 text-sm font-medium">
                        Manage school buses, drivers and transport routes.
                    </p>
                </div>
                {activeTab !== 'students' && (
                    <button
                        onClick={activeTab === 'vehicles' ? openAddVehicle : openAddRoute}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95 text-sm"
                    >
                        <Plus size={18} />
                        {activeTab === 'vehicles' ? 'Add Vehicle' : 'Add Route'}
                    </button>
                )}
                {activeTab === 'students' && (
                    <button
                        onClick={() => navigateTo('transport-students')}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95 text-sm"
                    >
                        <CreditCard size={18} />
                        Open Full View
                    </button>
                )}
            </div>

            {/* Summary bar */}
            <SummaryBar summary={summary} />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-5">
                {[
                    ['vehicles', 'Fleet Vehicles'],
                    ['routes',   'Bus Routes & Roster'],
                    ['students', 'Transport Students'],
                ].map(([id, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`pb-3 px-4 font-medium text-sm transition-all ${activeTab === id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Transport Students shortcut panel ─────────────────────────── */}
            {activeTab === 'students' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-16 space-y-4 text-gray-400 px-8 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <CreditCard size={32} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-xl text-gray-800">Transport Student Fee Tracker</p>
                            <p className="text-sm text-gray-400 mt-1.5 max-w-sm mx-auto">
                                View every transport student with their fee invoices, balances, payment status and send SMS/WhatsApp reminders — all in one place.
                            </p>
                        </div>
                        {summary && (
                            <div className="flex items-center gap-6 py-3 px-6 bg-blue-50 rounded-xl text-sm font-medium text-blue-700">
                                <span>{summary.transportStudentCount ?? 0} students enrolled</span>
                                <span className="text-blue-300">·</span>
                                <span>{summary.routeCount ?? 0} active routes</span>
                            </div>
                        )}
                        <button
                            onClick={() => navigateTo('transport-students')}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center gap-2 text-sm mt-2"
                        >
                            <CreditCard size={18} /> Open Transport Students
                        </button>
                    </div>
                </div>
            )}

            {/* Table — only shown for vehicles / routes tabs */}
            {activeTab !== 'students' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[360px]">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 font-medium animate-pulse">Loading…</div>
                    ) : activeTab === 'vehicles' ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-semibold tracking-widest text-gray-400">
                                <tr>
                                    <th className="p-4">Registration</th>
                                    <th className="p-4">Driver</th>
                                    <th className="p-4">Capacity</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {vehicles.map(v => (
                                    <tr key={v.id} className="hover:bg-blue-50/10 transition group">
                                        <td className="p-4 border-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Bus size={16} />
                                                </div>
                                                <span className="font-semibold tracking-tight text-gray-900">{v.registrationNumber}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-none">
                                            <p className="font-medium text-gray-800 text-sm">{v.driverName}</p>
                                            <p className="text-xs text-gray-400">{v.driverPhone || '—'}</p>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium border-none text-sm">{v.capacity} seats</td>
                                        <td className="p-4 border-none">
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-lg uppercase">
                                                {v.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right border-none">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditVehicle(v)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                                    <Pencil size={15} />
                                                </button>
                                                <button onClick={() => deleteVehicle(v.id)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Archive">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {vehicles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-400 italic text-sm">
                                            No vehicles registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-semibold tracking-widest text-gray-400">
                                <tr>
                                    <th className="p-4">Route</th>
                                    <th className="p-4">Fee</th>
                                    <th className="p-4">Vehicle</th>
                                    <th className="p-4">Passengers</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {routes.map(r => {
                                    const { assigned, capacity, isFull } = getRouteCapacityInfo(r);
                                    return (
                                        <tr key={r.id} className="hover:bg-indigo-50/10 transition group">
                                            <td className="p-4 border-none">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold tracking-tight text-gray-900 text-sm">{r.name}</p>
                                                        {r.description && <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{r.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-semibold text-emerald-600 border-none text-sm">
                                                KES {parseFloat(r.amount).toLocaleString()}
                                            </td>
                                            <td className="p-4 border-none">
                                                {r.vehicle ? (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-lg">
                                                        {r.vehicle.registrationNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-500 font-semibold border border-amber-200 px-2 py-0.5 rounded-lg">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 border-none">
                                                <button
                                                    onClick={() => openPassengerModal(r)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all
                                                        ${isFull
                                                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                                >
                                                    <Users size={13} />
                                                    {assigned} students
                                                    <CapacityBadge assigned={assigned} capacity={capacity} />
                                                </button>
                                            </td>
                                            <td className="p-4 text-right border-none">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditRoute(r)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => deleteRoute(r.id)}
                                                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Archive">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {routes.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-400 italic text-sm">
                                            No routes registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Vehicle modal ──────────────────────────────────────────────── */}
            {vehicleModal && (
                <Modal title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setVehicleModal(false)}>
                    <form onSubmit={saveVehicle} className="space-y-4">
                        <VehicleForm data={vehicleForm} onChange={setVehicleForm} />
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setVehicleModal(false)}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 font-medium rounded-xl text-sm transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={savingVehicle}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-600/20 transition active:scale-95 disabled:opacity-60 flex items-center gap-2">
                                {savingVehicle && <Loader2 size={14} className="animate-spin" />}
                                {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Route modal ────────────────────────────────────────────────── */}
            {routeModal && (
                <Modal title={editingRoute ? 'Edit Route' : 'Add Route'} onClose={() => setRouteModal(false)}>
                    <form onSubmit={saveRoute} className="space-y-4">
                        <RouteForm data={routeForm} onChange={setRouteForm} vehicles={vehicles} />
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setRouteModal(false)}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 font-medium rounded-xl text-sm transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={savingRoute}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-600/20 transition active:scale-95 disabled:opacity-60 flex items-center gap-2">
                                {savingRoute && <Loader2 size={14} className="animate-spin" />}
                                {editingRoute ? 'Save Changes' : 'Create Route'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Passenger modal ────────────────────────────────────────────── */}
            {passengerModal && selectedRoute && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal header */}
                        <div className="p-5 border-b border-gray-100 bg-blue-600 text-white flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl"><Users size={20} /></div>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">{selectedRoute.name}</h2>
                                    <p className="text-blue-100 text-xs font-medium">
                                        {passengers.length} student{passengers.length !== 1 ? 's' : ''} assigned
                                        {selectedRoute.vehicle && (
                                            <> · {selectedRoute.vehicle.capacity} seat capacity</>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setPassengerModal(false)}
                                className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            {/* Add student section */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Assign Student</p>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <SmartLearnerSearch
                                            learners={allLearners}
                                            selectedLearnerId={newPassengerId}
                                            onSelect={id => setNewPassengerId(id)}
                                            placeholder="Search by name or admission number…"
                                        />
                                    </div>
                                    <button
                                        disabled={!newPassengerId || addingPassenger}
                                        onClick={addPassenger}
                                        className="h-[42px] px-5 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-600/10 active:scale-95 text-sm flex-shrink-0"
                                    >
                                        {addingPassenger
                                            ? <Loader2 className="animate-spin" size={16} />
                                            : <UserPlus size={16} />}
                                        Assign
                                    </button>
                                </div>
                            </div>

                            {/* Passenger list */}
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                                    Assigned Students ({passengers.length})
                                </p>

                                {loadingPassengers ? (
                                    <div className="py-10 text-center text-gray-400 font-medium animate-pulse">Loading…</div>
                                ) : passengers.length > 0 ? (
                                    <div className="grid gap-2">
                                        {passengers.map(a => (
                                            <div key={a.id}
                                                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition group shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-400 text-xs uppercase flex-shrink-0">
                                                        {a.passenger?.firstName?.[0]}{a.passenger?.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm tracking-tight">
                                                            {a.passenger?.firstName} {a.passenger?.lastName}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 font-medium">
                                                            {a.passenger?.admissionNumber} · {a.passenger?.grade?.replace(/_/g, ' ')} {a.passenger?.stream}
                                                            {a.pickupPoint && <> · 📍 {a.pickupPoint}</>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => removePassenger(a.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                                    title="Remove from route">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                                        <Users size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-400 font-medium text-sm">No students assigned yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                            <button
                                onClick={() => { setPassengerModal(false); navigateTo('transport-students'); }}
                                className="flex items-center gap-1.5 px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-xl font-medium text-sm transition"
                            >
                                <CreditCard size={14} /> View Fee Balances
                            </button>
                            <button onClick={() => setPassengerModal(false)}
                                className="px-5 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition shadow-lg text-sm active:scale-95">
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
