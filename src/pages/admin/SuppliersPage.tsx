import React, { useState, useEffect } from 'react';
import { Plus, Truck, Edit2, CheckCircle2, XCircle, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { Supplier } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    notes: '',
  });

  const [toggleSupplier, setToggleSupplier] = useState<Supplier | null>(null);

  const { success, error } = useNotification();

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.suppliers);
      }
    } catch {
      error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      code: s.code,
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      gstin: s.gstin || '',
      notes: s.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      error('Supplier name and unique code are required.');
      return;
    }

    try {
      if (editingSupplier) {
        const res = await api.put(`/suppliers/${editingSupplier._id}`, formData);
        if (res.data.success) {
          success('Supplier updated successfully');
          setIsModalOpen(false);
          fetchSuppliers();
        }
      } else {
        const res = await api.post('/suppliers', formData);
        if (res.data.success) {
          success('Supplier registered successfully');
          setIsModalOpen(false);
          fetchSuppliers();
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleSupplier) return;
    try {
      const res = await api.patch(`/suppliers/${toggleSupplier._id}/toggle-status`);
      if (res.data.success) {
        success(res.data.message);
        setToggleSupplier(null);
        fetchSuppliers();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update status');
      setToggleSupplier(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Procurement & Mills
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Textile Mills & Weavers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage fabric mills, handloom cooperatives, and apparel wholesale suppliers.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No suppliers registered.</div>
        ) : (
          suppliers.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-[#173C72] bg-blue-50 px-2 py-0.5 rounded">
                      {s.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{s.name}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  {s.contactPerson && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Contact:</span>
                      <span>{s.contactPerson}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.gstin && (
                    <div className="text-[11px] font-mono text-slate-700">
                      <span className="font-bold">GSTIN:</span> {s.gstin}
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                <button
                  onClick={() => setToggleSupplier(s)}
                  className={`text-[11px] font-bold ${
                    s.isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Supplier'}
        subtitle="Record textile manufacturer or weaver partner details"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Supplier / Mill Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kanchipuram Heritage Weavers Co-op"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Supplier Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUP-KANCHI"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. S. Ramanathan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 94440 xxxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                placeholder="sales@kanchiweavers.org"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN (India)</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="33AABCK1122P1Z5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Factory / Office Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address, city, state and PIN"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Fabric Specialization</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Pure Zari sarees, minimum lead time 14 days"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs"
            >
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Toggle Status */}
      <ConfirmDialog
        isOpen={!!toggleSupplier}
        onClose={() => setToggleSupplier(null)}
        onConfirm={handleToggleStatus}
        title={toggleSupplier?.isActive ? 'Deactivate Supplier?' : 'Activate Supplier?'}
        message={`Are you sure you want to ${
          toggleSupplier?.isActive ? 'deactivate' : 'activate'
        } ${toggleSupplier?.name}?`}
        confirmLabel={toggleSupplier?.isActive ? 'Deactivate' : 'Activate'}
        isDestructive={toggleSupplier?.isActive}
      />
    </div>
  );
};
