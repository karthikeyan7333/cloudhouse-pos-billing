import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  Tags,
  Users,
  Truck,
  RotateCcw,
  Receipt,
  BookOpen,
  BarChart3,
  Settings,
  ShoppingCart,
  Smartphone,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products & Stock', path: '/admin/products', icon: Shirt },
    { label: 'Categories', path: '/admin/categories', icon: Tags },
    { label: 'Staff Management', path: '/admin/staff', icon: Users },
    { label: 'Suppliers', path: '/admin/suppliers', icon: Truck },
    { label: 'Returns & Refunds', path: '/admin/returns', icon: RotateCcw },
    { label: 'Sales & Bills', path: '/admin/transactions', icon: Receipt },
    { label: 'Financial Ledger', path: '/admin/ledger', icon: BookOpen },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
    { label: 'Store Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop Navy Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#173C72] text-white shrink-0 shadow-xl border-r border-[#0f274a] select-none no-print">
        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-white text-lg tracking-wider border border-white/20">
              CH
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-white">
                CloudHouse
              </h1>
              <span className="text-[11px] text-blue-200 tracking-wide font-medium">
                Textile POS Suite
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="p-3 border-b border-white/10 space-y-2">
          <NavLink
            to="/pos"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 font-semibold text-xs text-white shadow-xs transition"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Open POS Register
            </span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </NavLink>

          <NavLink
            to="/admin/mobile"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-blue-100 font-medium transition"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Mobile Admin View
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
              PWA
            </span>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white/15 text-white shadow-xs font-bold border-l-4 border-amber-400 pl-2.5'
                    : 'text-blue-100/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-[#0f274a]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-blue-200 capitalize">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">
                Live Store POS Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/pos"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Go to POS Register</span>
              <span className="sm:hidden">POS</span>
            </NavLink>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#173C72] text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Flyout Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex">
            <div className="w-64 bg-[#173C72] text-white h-full flex flex-col p-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="font-bold text-white">CloudHouse Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    end={item.path === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-white/20 text-white font-bold' : 'text-blue-100 hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-blue-200">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-300 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Routed Page View */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
