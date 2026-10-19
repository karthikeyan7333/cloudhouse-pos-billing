import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dataService } from '../services/dataService.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'staff';
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'cloudhouse_jwt_fallback_secret_key_2026';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Access denied: No authentication token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
      return;
    }
    req.user = decoded;
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required for this action.',
    });
    return;
  }

  next();
}

export function requireStaffOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Insufficient privileges.',
    });
    return;
  }

  next();
}

// In-memory sliding window rate limiter for authentication
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimitAuth(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'ip';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 15;

  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxAttempts) {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please wait 60 seconds before retrying.',
    });
    return;
  }

  record.count += 1;
  next();
}

