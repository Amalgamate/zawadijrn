import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Download,
    Mail,
    Phone,
    MapPin,
    Loader2,
    Edit2,
    ExternalLink
} from 'lucide-react';
import { accountingAPI } from '../../../../services/api/accounting.api';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "../../../ui/dialog";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { toast } from "react-hot-toast";

const VendorManager = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form State
    const [newVendor, setNewVendor] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await accountingAPI.getVendors();
            if (response.success) {
                setVendors(response.data);
            }
        } catch (error) {
            toast.error("Failed to load vendors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleCreateVendor = async (e) => {
        e.preventDefault();
        try {
            const response = await accountingAPI.createVendor(newVendor);
            if (response.success) {
                toast.success("Vendor added successfully");
                setShowAddModal(false);
                setNewVendor({ name: '', email: '', phone: '', address: '' });
                fetchVendors();
            }
        } catch (error) {
            toast.error(error.message || "Failed to add vendor");
        }
    };

    const filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.phone?.includes(searchTerm)
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight text-brand-purple">Vendor Directory</h1>
                    <p className="text-gray-500 text-sm italic">Manage school suppliers and service providers</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
                        <Download size={18} className="text-gray-400" />
                        Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all shadow-md font-medium"
                    >
                        <Plus size={18} />
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find vendor by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6">
                                <th className="px-6 py-4">Vendor Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Address</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-brand-purple" />
                                            <span className="text-sm font-medium text-gray-500">Loading directory...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVendors.length > 0 ? (
                                filteredVendors.map(vendor => (
                                    <tr key={vendor.id} className="group hover:bg-gray-50/20 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold">
                                                    {vendor.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800">{vendor.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">SUP-{vendor.id.slice(0,6)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {vendor.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <Mail size={12} className="text-gray-300" />
                                                        {vendor.email}
                                                    </div>
                                                )}
                                                {vendor.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <Phone size={12} className="text-gray-300" />
                                                        {vendor.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 max-w-[200px] truncate">
                                                <MapPin size={12} className="text-gray-300 shrink-0" />
                                                {vendor.address || 'No address provided'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                ACTIVE
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all" title="Edit Vendor">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Ledgers">
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                        No vendors found in the directory.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Vendor Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Vendor</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateVendor} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Business Name</Label>
                            <Input
                                id="name"
                                value={newVendor.name}
                                onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                                placeholder="e.g. Quick Mart Supermarket"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newVendor.email}
                                    onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                                    placeholder="vendor@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={newVendor.phone}
                                    onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                                    placeholder="+254..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Physical Address</Label>
                            <Input
                                id="address"
                                value={newVendor.address}
                                onChange={(e) => setNewVendor({...newVendor, address: e.target.value})}
                                placeholder="Street, Building, Town"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button type="submit" className="bg-brand-purple text-white hover:bg-brand-purple/90">Save Vendor</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VendorManager;
