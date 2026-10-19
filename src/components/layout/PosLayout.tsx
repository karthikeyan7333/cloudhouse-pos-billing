import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, LogOut, Clock, ShieldCheck, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const PosLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* POS Top Header */}
      <header className="h-14 bg-[#173C72] text-white px-4 flex items-center justify-between shadow-md shrink-0 no-print select-none">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
              title="Return to Admin Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Portal</span>
            </NavLink>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>CloudHouse Retail POS</span>
                <span className="text-[10px] bg-emerald-500 text-white font-semibold px-1.5 py-0.2 rounded-full">
                  Terminal 01
                </span>
              </div>
              <div className="text-[10px] text-blue-200 hidden sm:block">
                Textiles & Ready-to-Wear Billing
              </div>
            </div>
          </div>
        </div>

        {/* Center Clock (Asia/Kolkata) */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-medium text-blue-100 bg-white/10 px-3 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>{timeStr} IST</span>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
              {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />}
              {user?.name}
            </div>
            <div className="text-[10px] text-blue-200 capitalize">
              Role: {user?.role}
            </div>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <button
            onClick={handleLogout}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* POS Content View */}
      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
