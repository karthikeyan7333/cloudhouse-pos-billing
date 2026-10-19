import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, Shield, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useNotification } from '../context/NotificationContext.js';
import { api } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { success } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        success(`Welcome back, ${res.data.user.name}!`);

        // Check redirect target or route based on role
        const target = (location.state as any)?.from?.pathname;
        if (target) {
          navigate(target, { replace: true });
        } else if (res.data.user.role === 'staff') {
          navigate('/pos', { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        setErrorMessage(res.data.message || 'Login failed.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@cloudhousepos.com');
      setPassword('Admin@123');
    } else {
      setEmail('staff@cloudhousepos.com');
      setPassword('Staff@123');
    }
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Navy Header */}
        <div className="bg-[#173C72] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/20 mb-3 shadow-inner">
            <ShoppingBag className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">CloudHouse POS</h2>
          <p className="text-xs text-blue-100 mt-1">Textile & Retail Management Suite</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cloudhousepos.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instant Evaluator Demo Accounts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-blue-50 hover:text-[#173C72] hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Fill Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fill Staff</span>
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                setEmail('admin@cloudhousepos.com');
                setPassword('Admin@123');
                setIsLoading(true);
                try {
                  const res = await api.post('/auth/login', {
                    email: 'admin@cloudhousepos.com',
                    password: 'Admin@123',
                  });
                  if (res.data.success) {
                    login(res.data.token, res.data.user);
                    success('Authenticated as Admin Demo');
                    navigate('/admin');
                  }
                } catch {
                  setErrorMessage('Demo login failed. Please verify credentials.');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs mb-2"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Admin Demo Login (Dev Mode)</span>
            </button>

            <div className="text-[11px] text-slate-500 text-center">
              Staff: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">staff@cloudhousepos.com</code> / <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Staff@123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
