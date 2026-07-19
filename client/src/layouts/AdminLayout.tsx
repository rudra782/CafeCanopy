import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Tag, Grid, User, CreditCard, Ticket, Clock, TrendingUp, Settings, LogOut, Monitor, ChefHat, Coffee } from 'lucide-react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/products', icon: ShoppingBag, label: 'Products' },
  { path: '/admin/categories', icon: Tag, label: 'Categories' },
  { path: '/admin/tables', icon: Grid, label: 'Tables' },
  { path: '/admin/employees', icon: User, label: 'Employees' },
  { path: '/admin/payment-methods', icon: CreditCard, label: 'Payment Methods' },
  { path: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { path: '/admin/sessions', icon: Clock, label: 'Sessions' },
  { path: '/admin/reports', icon: TrendingUp, label: 'Reports' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    try { await authAPI.logout(refreshToken); } catch {
      // Preserve local logout if the network request fails.
    }
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
            <div className="brand-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Coffee size={20} style={{ color: 'white' }} /></div>
            <div>
              <div className="brand-name">CafeCanopy</div>
              <div className="brand-tagline">POS System</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {(() => {
            const hiddenForEmployee = [
              '/admin/employees',
              '/admin/payment-methods',
              '/admin/settings',
              '/admin/reports'
            ];
            const filteredItems = NAV_ITEMS.filter(item => {
              if (user?.role === 'employee') {
                return !hiddenForEmployee.includes(item.path);
              }
              return true;
            });
            return filteredItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            });
          })()}
          <div className="nav-section-label" style={{ marginTop: 8 }}>Quick Access</div>
          <NavLink to="/pos" className="nav-item" target="_blank">
            <Monitor size={18} />
            POS Terminal
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>↗</span>
          </NavLink>
          <NavLink to="/kds" className="nav-item" target="_blank">
            <ChefHat size={18} />
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
              <LogOut size={16} />
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
