import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Loader, CreditCard } from 'lucide-react';
import { communicationAPI } from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const PaymentSettings = () => {
    const [loading, setLoading] = useState(false);
    const [schoolId, setSchoolId] = useState('');
    const { showSuccess } = useNotifications();

    const [mpesaSettings, setMpesaSettings] = useState({
        enabled: false,
        consumerKey: '',
        consumerSecret: '',
        passkey: '',
        shortcode: '',
        hasConsumerKey: false,
        hasConsumerSecret: false,
        hasPasskey: false
    });

    useEffect(() => {
        const sid = localStorage.getItem('currentSchoolId');
        if (sid) {
            setSchoolId(sid);
            loadConfig(sid);
        }
    }, []);

    const loadConfig = async (sid) => {
        try {
            setLoading(true);
            const response = await communicationAPI.getConfig(sid);
            const config = response.data || response;

            setMpesaSettings({
                enabled: config.mpesaEnabled || false,
                consumerKey: '',
                consumerSecret: '',
                passkey: '',
                shortcode: config.mpesaShortcode || '',
                hasConsumerKey: !!config.mpesaConsumerKey,
                hasConsumerSecret: !!config.mpesaConsumerSecret,
                hasPasskey: !!config.mpesaPasskey
            });
        } catch (error) {
            console.error('Failed to load payment config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!schoolId) {
            showSuccess('No school selected');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                schoolId,
                mpesa: {
                    enabled: mpesaSettings.enabled,
                    shortcode: mpesaSettings.shortcode,
                    consumerKey: mpesaSettings.consumerKey || undefined,
                    consumerSecret: mpesaSettings.consumerSecret || undefined,
                    passkey: mpesaSettings.passkey || undefined
                }
            };

            await communicationAPI.saveConfig(payload);
            showSuccess('Payment settings saved successfully!');

            // Reload to update "has" flags
            await loadConfig(schoolId);
        } catch (error) {
            console.error('Save error:', error);
            showSuccess(error.message || 'Failed to save payment settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="text-green-600" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
                        <p className="text-sm text-gray-600">Configure payment gateways and integrations</p>
                    </div>
                </div>

                {/* M-Pesa Configuration */}
                <div className="border-t pt-6">
                    <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="text-green-600" size={24} />
                        <h3 className="text-lg font-bold">M-Pesa Configuration</h3>
                    </div>

                    {loading && !schoolId ? (
                        <div className="text-center py-4">
                            <Loader className="animate-spin inline" /> Loading config...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                <p className="font-medium mb-1">M-Pesa Integration</p>
                                <p>Configure M-Pesa Daraja API for automated fee collection and payment processing.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Business Shortcode</label>
                                    <input
                                        type="text"
                                        value={mpesaSettings.shortcode}
                                        onChange={(e) => setMpesaSettings({ ...mpesaSettings, shortcode: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="174379"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Your M-Pesa Paybill or Till number</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Consumer Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={mpesaSettings.consumerKey}
                                        onChange={(e) => setMpesaSettings({ ...mpesaSettings, consumerKey: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg pr-24"
                                        placeholder={mpesaSettings.hasConsumerKey ? '••••••••••••••••' : 'Enter consumer key...'}
                                    />
                                    {mpesaSettings.hasConsumerKey && !mpesaSettings.consumerKey && (
                                        <span className="absolute right-3 top-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">From Daraja API portal</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Consumer Secret</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={mpesaSettings.consumerSecret}
                                        onChange={(e) => setMpesaSettings({ ...mpesaSettings, consumerSecret: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg pr-24"
                                        placeholder={mpesaSettings.hasConsumerSecret ? '••••••••••••••••' : 'Enter consumer secret...'}
                                    />
                                    {mpesaSettings.hasConsumerSecret && !mpesaSettings.consumerSecret && (
                                        <span className="absolute right-3 top-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">From Daraja API portal</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Passkey</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={mpesaSettings.passkey}
                                        onChange={(e) => setMpesaSettings({ ...mpesaSettings, passkey: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg pr-24"
                                        placeholder={mpesaSettings.hasPasskey ? '••••••••••••••••' : 'Enter passkey...'}
                                    />
                                    {mpesaSettings.hasPasskey && !mpesaSettings.passkey && (
                                        <span className="absolute right-3 top-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Lipa Na M-Pesa Online Passkey</p>
                            </div>

                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={mpesaSettings.enabled}
                                            onChange={(e) => setMpesaSettings({ ...mpesaSettings, enabled: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">Enable M-Pesa Payments</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                                >
                                    {loading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                                    {loading ? 'Saving...' : 'Save Payment Settings'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Placeholder for future payment methods */}
                <div className="border-t mt-8 pt-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-400">Other Payment Methods</h3>
                    <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                        <p>Additional payment gateways (Stripe, PayPal, etc.) coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSettings;
