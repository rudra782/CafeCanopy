import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/products', icon: '🍔', label: 'Products' },
  { path: '/admin/categories', icon: '🏷️', label: 'Categories' },
  { path: '/admin/floors', icon: '🏢', label: 'Floors' },
  { path: '/admin/tables', icon: '🪑', label: 'Tables' },
  { path: '/admin/customers', icon: '👥', label: 'Customers' },
  { path: '/admin/employees', icon: '👤', label: 'Employees' },
  { path: '/admin/payment-methods', icon: '💳', label: 'Payment Methods' },
  { path: '/admin/coupons', icon: '🎫', label: 'Coupons' },
  { path: '/admin/promotions', icon: '🎯', label: 'Promotions' },
  { path: '/admin/sessions', icon: '⏰', label: 'Sessions' },
  { path: '/admin/reports', icon: '📈', label: 'Reports' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    try { await authAPI.logout(refreshToken); } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="brand">
            <div className="brand-icon">☕</div>
            <div>
              <div className="brand-name">CafeCanopy</div>
              <div className="brand-tagline">POS System</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <div className="nav-section-label" style={{ marginTop: 8 }}>Quick Access</div>
          <NavLink to="/pos" className="nav-item" target="_blank">
            <span style={{ fontSize: 16 }}>🖥️</span>
            POS Terminal
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>↗</span>
          </NavLink>
          <NavLink to="/kds" className="nav-item" target="_blank">
            <span style={{ fontSize: 16 }}>🍳</span>
            Kitchen Display
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>↗</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-icon"
              data-tooltip="Logout"
              style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
