import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  Shield,
  User,
  KeyRound,
  CheckCircle2,
  XCircle,
  Receipt,
  Edit2,
  Phone,
  Mail,
} from 'lucide-react';
import { User as UserType } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
    phone: '',
  });

  // Password Reset Modal
  const [resetModalStaff, setResetModalStaff] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Toggle Status Confirm
  const [toggleStaff, setToggleStaff] = useState<UserType | null>(null);

  const { success, error } = useNotification();

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/staff');
      if (res.data.success) {
        setStaffList(res.data.users);
      }
    } catch {
      error('Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({ name: '', email: '', password: '', role: 'staff', phone: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserType) => {
    setEditingStaff(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phone: u.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        const res = await api.put(`/staff/${editingStaff.id || (editingStaff as any)._id}`, {
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
        });
        if (res.data.success) {
          success('Staff account updated successfully');
          setIsModalOpen(false);
          fetchStaff();
        }
      } else {
        const res = await api.post('/staff', formData);
        if (res.data.success) {
          success('New staff account created successfully');
          setIsModalOpen(false);
          fetchStaff();
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save staff account');
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleStaff) return;
    try {
      const targetId = toggleStaff.id || (toggleStaff as any)._id;
      const res = await api.patch(`/staff/${targetId}/toggle-status`);
      if (res.data.success) {
        success(res.data.message);
        setToggleStaff(null);
        fetchStaff();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Action failed: Last admin protection triggered.');
      setToggleStaff(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStaff || !newPassword || newPassword.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }
    try {
      const targetId = resetModalStaff.id || (resetModalStaff as any)._id;
      const res = await api.post(`/staff/${targetId}/reset-password`, { newPassword });
      if (res.data.success) {
        success('Password has been securely reset');
        setResetModalStaff(null);
        setNewPassword('');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Access Control & Cashiers
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Staff & Cashier Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure system access, assign roles (Admin / Staff), reset credentials, and prevent accidental admin lockout.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cashier / Staff</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Contact Phone</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No staff accounts found.
                  </td>
                </tr>
              ) : (
                staffList.map((u) => {
                  const uid = u.id || (u as any)._id;
                  const isAdminRole = u.role === 'admin';

                  return (
                    <tr key={uid} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                            isAdminRole ? 'bg-[#173C72]' : 'bg-[#2563EB]'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        {u.name}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate-600">{u.email}</td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 w-max ${
                            isAdminRole
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isAdminRole ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">{u.phone || '—'}</td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setResetModalStaff(u);
                            setNewPassword('');
                          }}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setToggleStaff(u)}
                          className={`p-1.5 rounded-lg transition ${
                            u.isActive !== false ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive !== false ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.isActive !== false ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Create Staff / Cashier Account'}
        subtitle="Staff have dedicated POS billing permissions; Admins have full access"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitStaff} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Priya Venkatesh (Cashier)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
            <input
              type="email"
              required
              disabled={!!editingStaff}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              placeholder="e.g. priya@cloudhousepos.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl disabled:bg-slate-100"
            />
          </div>

          {!editingStaff && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Role Permission *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="staff">Staff (POS Billing Terminal & Own History)</option>
              <option value="admin">Admin (Full Administrative & Reporting Access)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98401 xxxxx"
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
              {editingStaff ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      {resetModalStaff && (
        <Modal
          isOpen={!!resetModalStaff}
          onClose={() => setResetModalStaff(null)}
          title={`Reset Password: ${resetModalStaff.name}`}
          subtitle="Set a new secure password for this user"
          maxWidth="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">New Password (Min 6 chars) *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalStaff(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Toggle Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!toggleStaff}
        onClose={() => setToggleStaff(null)}
        onConfirm={handleToggleStatus}
        title={toggleStaff?.isActive !== false ? 'Deactivate Account?' : 'Activate Account?'}
        message={
          toggleStaff?.isActive !== false
            ? `Are you sure you want to deactivate ${toggleStaff?.name}? Note: The system strictly protects the last active administrator.`
            : `Are you sure you want to activate ${toggleStaff?.name}?`
        }
        confirmLabel={toggleStaff?.isActive !== false ? 'Deactivate' : 'Activate'}
        isDestructive={toggleStaff?.isActive !== false}
      />
    </div>
  );
};
