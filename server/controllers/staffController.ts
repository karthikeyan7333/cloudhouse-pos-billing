import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const staffController = {
  async getStaffList(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await dataService.getAllUsers();
      res.status(200).json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch staff list' });
    }
  },

  async createStaff(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, role, phone } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        return;
      }

      const existing = await dataService.findUserByEmail(email);
      if (existing) {
        res.status(400).json({ success: false, message: 'A user with this email already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await dataService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'staff',
        phone: phone?.trim(),
        isActive: true,
      });

      const { password: _, ...cleanUser } = newUser as any;
      res.status(201).json({ success: true, message: 'Staff account created successfully', user: cleanUser });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create staff account' });
    }
  },

  async updateStaff(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, role, phone } = req.body;

      const user = await dataService.findUserById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Staff member not found' });
        return;
      }

      // If demoting from admin, protect last active admin
      if (user.role === 'admin' && role === 'staff') {
        const adminCount = await dataService.countActiveAdmins();
        if (adminCount <= 1) {
          res.status(400).json({
            success: false,
            message: 'Action blocked: Cannot demote the last remaining active Administrator.',
          });
          return;
        }
      }

      const updated = await dataService.updateUser(id, {
        name: name?.trim(),
        role: role === 'admin' ? 'admin' : 'staff',
        phone: phone?.trim(),
      });

      res.status(200).json({ success: true, message: 'Staff details updated successfully', user: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update staff' });
    }
  },

  async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await dataService.findUserById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Staff member not found' });
        return;
      }

      // Protect last active administrator from deactivation
      if (user.role === 'admin' && user.isActive) {
        const adminCount = await dataService.countActiveAdmins();
        if (adminCount <= 1) {
          res.status(400).json({
            success: false,
            message: 'Action blocked: Cannot deactivate the last remaining active Administrator.',
          });
          return;
        }
      }

      const updated = await dataService.updateUser(id, { isActive: !user.isActive });
      res.status(200).json({
        success: true,
        message: `Account ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        user: updated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to toggle staff status' });
    }
  },

  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await dataService.updateUser(id, { password: hashedPassword });

      res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to reset staff password' });
    }
  },
};
