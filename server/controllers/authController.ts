import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cloudhouse_jwt_fallback_secret_key_2026';

export const authController = {
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const user = await dataService.findUserByEmail(email.trim());
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact your store administrator.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
        return;
      }

      // Record last login
      await dataService.updateUser(user._id.toString(), { lastLogin: new Date() });

      const tokenPayload = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

      res.status(200).json({
        success: true,
        message: 'Signed in successfully',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
  },

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await dataService.findUserById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
        },
      });
    } catch (err: any) {
      console.error('Get user profile error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
  },

  async logout(_req: AuthRequest, res: Response): Promise<void> {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  },
};
