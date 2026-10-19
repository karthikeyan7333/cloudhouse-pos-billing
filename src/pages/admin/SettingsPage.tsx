import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Building, Receipt, Percent } from 'lucide-react';
import { BusinessSettings } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    tagline: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    currencyCode: 'INR',
    currencySymbol: '₹',
    defaultTaxRate: 5,
    maxDiscountPercent: 40,
    timezone: 'Asia/Kolkata',
    receiptHeader: '',
    receiptFooter: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useNotification();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      } catch {
        error('Failed to load store settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        success('Store settings & receipt template updated successfully!');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Store Profile & Tax Rules
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Business Settings & Receipt Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure retail store details, GSTIN, default tax rates, discount limits, and thermal receipt print layout.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-[#173C72]" />
            <h3 className="font-bold text-slate-900 text-sm">Store Profile & Legal Entity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Business / Brand Name *</label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN (India) *</label>
              <input
                type="text"
                required
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Phone *</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Billing Email *</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Address *</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">State</label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                <input
                  type="text"
                  value={settings.pincode}
                  onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Tax Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Currency, Tax & Discount Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Currency Code</label>
              <input
                type="text"
                disabled
                value={settings.currencyCode}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Currency Symbol</label>
              <input
                type="text"
                disabled
                value={settings.currencySymbol}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                min="0"
                max="28"
                value={settings.defaultTaxRate}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Cashier Discount (%)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.maxDiscountPercent}
                onChange={(e) =>
                  setSettings({ ...settings, maxDiscountPercent: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>
          </div>
        </div>

        {/* Receipt Header & Footer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Receipt className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">Thermal Receipt Header & Footer</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Receipt Header Text</label>
              <input
                type="text"
                value={settings.receiptHeader}
                onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                placeholder="e.g. TAX INVOICE - CLOUDHOUSE TEXTILES"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Receipt Footer Note / Return Policy</label>
              <textarea
                rows={3}
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Settings Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
