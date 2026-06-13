import React from 'react';
import { Coffee, Sparkles, Crown, Monitor, ChefHat, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function GetStartedPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    try {
      await authAPI.logout(refreshToken);
    } catch { }
    clearAuth();
    toast.success('Signed out successfully');
  };

  const handleRoleSelect = (roleName: 'admin' | 'employee' | 'kitchen' | 'customer') => {
    const rolePathMap = {
      admin: '/admin/dashboard',
      employee: '/pos',
      kitchen: '/kds',
      customer: '/customer/dashboard'
    };

    if (isAuthenticated && user) {
      if (user.role === roleName) {
        navigate(rolePathMap[roleName]);
      } else {
        // Log out first, then send to login page for the new role
        clearAuth();
        navigate(`/login?role=${roleName}`);
      }
    } else {
      if (roleName === 'customer') {
        navigate(`/register?role=${roleName}`);
      } else {
        navigate(`/login?role=${roleName}`);
      }
    }
  };

  const getPortalRedirectPath = () => {
    if (!user) return '/login';
    if (user.role === 'kitchen') return '/kds';
    if (user.role === 'employee') return '/pos';
    if (user.role === 'customer') return '/customer/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(185deg, #FEFDFB 0%, #FAF6F0 60%, #EDE0CE 100%)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Header / Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 8%',
        borderBottom: '1px solid rgba(139, 90, 43, 0.1)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(254, 253, 251, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            background: 'linear-gradient(135deg, var(--brown-400), var(--brown-600))',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: 'white',
            boxShadow: '0 4px 12px rgba(138, 99, 64, 0.2)'
          }}><Coffee size={22} style={{ color: 'white' }} /></div>
          <div>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--brown-800)',
              letterSpacing: '0.5px'
            }}>CafeCanopy</span>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--brown-500)', fontWeight: 700, letterSpacing: 1.5 }}>Smart POS Ecosystem</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated && user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Logged in as <strong style={{ textTransform: 'capitalize' }}>{user.name} ({user.role})</strong>
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>Sign Out</button>
              <button className="btn btn-primary" onClick={() => navigate(getPortalRedirectPath())}>Go to Workspace</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
              <button className="btn btn-primary" onClick={() => navigate('/register')}>Register Cafe</button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: '40px 8%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 800, marginBottom: 50 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--cream-200)',
            color: 'var(--brown-700)',
            padding: '8px 16px',
            borderRadius: 30,
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 24,
            boxShadow: 'var(--shadow-xs)'
          }}>
            <span><Sparkles size={14} style={{ color: 'var(--brown-700)' }} /></span> Intelligent Restaurant & Cafe Operations
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'min(3.5rem, 8vw)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--brown-900)',
            marginBottom: 20
          }}>
            Smarter POS.<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--brown-500), var(--brown-700))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Flawless Service.</span>
          </h1>
          <p style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 600,
            margin: '0 auto'
          }}>
            Empower your restaurant, coffee house, or lounge with a state-of-the-art terminal, interactive kitchen display, and real-time reports.
          </p>
        </div>

        {/* Portal Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 28,
          width: '100%',
          maxWidth: 1200,
          marginBottom: 60
        }}>
          {/* Admin Portal Card */}
          <div className="stat-card" style={{
            flexDirection: 'column',
            padding: 32,
            background: 'var(--bg-card)',
            borderRadius: 20,
            border: '1px solid rgba(220, 201, 174, 0.4)',
            boxShadow: 'var(--shadow-md)',
            alignItems: 'stretch'
          }}>
            <div style={{ display: 'flex', marginBottom: 16 }}><Crown size={36} style={{ color: 'var(--brown-600)' }} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brown-800)', marginBottom: 10 }}>Cafe Owner / Admin</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
              Configure your menu, manage category settings, control floor/table layouts, add employees, and track sales revenue.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => handleRoleSelect('admin')}>
              {isAuthenticated && user?.role === 'admin' ? 'Go to Admin Dashboard' : 'Enter Admin Portal'}
            </button>
          </div>

          {/* POS Terminal Card */}
          <div className="stat-card" style={{
            flexDirection: 'column',
            padding: 32,
            background: 'var(--bg-card)',
            borderRadius: 20,
            border: '1px solid rgba(220, 201, 174, 0.4)',
            boxShadow: 'var(--shadow-md)',
            alignItems: 'stretch'
          }}>
            <div style={{ display: 'flex', marginBottom: 16 }}><Monitor size={36} style={{ color: 'var(--brown-600)' }} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brown-800)', marginBottom: 10 }}>Cashier & POS Staff</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
              Access the rapid point-of-sale layout to process walk-in orders, manage sessions, handle billing, and apply discounts.
            </p>
            <button className="btn btn-secondary btn-full" onClick={() => handleRoleSelect('employee')}>
              {isAuthenticated && user?.role === 'employee' ? 'Go to POS Terminal' : 'Open POS Terminal'}
            </button>
          </div>

          {/* Kitchen Display Card */}
          <div className="stat-card" style={{
            flexDirection: 'column',
            padding: 32,
            background: 'var(--bg-card)',
            borderRadius: 20,
            border: '1px solid rgba(220, 201, 174, 0.4)',
            boxShadow: 'var(--shadow-md)',
            alignItems: 'stretch'
          }}>
            <div style={{ display: 'flex', marginBottom: 16 }}><ChefHat size={36} style={{ color: 'var(--brown-600)' }} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brown-800)', marginBottom: 10 }}>Kitchen Chef</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
              View and update current culinary tickets, prioritize orders, and notify cashiers when items are ready.
            </p>
            <button className="btn btn-secondary btn-full" onClick={() => handleRoleSelect('kitchen')}>
              {isAuthenticated && user?.role === 'kitchen' ? 'Go to Kitchen Display' : 'Launch KDS'}
            </button>
          </div>

          {/* Customer Loyalty Card */}
          <div className="stat-card" style={{
            flexDirection: 'column',
            padding: 32,
            background: 'var(--bg-card)',
            borderRadius: 20,
            border: '1px solid rgba(220, 201, 174, 0.4)',
            boxShadow: 'var(--shadow-md)',
            alignItems: 'stretch'
          }}>
            <div style={{ display: 'flex', marginBottom: 16 }}><Users size={36} style={{ color: 'var(--brown-600)' }} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brown-800)', marginBottom: 10 }}>Customer Portal</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
              Check loyalty tiers, view accrued points balance, browse your transaction log, and see active promotion codes.
            </p>
            <button className="btn btn-outline btn-full" onClick={() => handleRoleSelect('customer')}>
              {isAuthenticated && user?.role === 'customer' ? 'Go to Customer Portal' : 'Join Loyalty Club'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '30px 20px',
        borderTop: '1px solid rgba(139, 90, 43, 0.1)',
        fontSize: 13,
        color: 'var(--text-muted)',
        background: 'rgba(254, 253, 251, 0.5)'
      }}>
        © {new Date().getFullYear()} CafeCanopy. All rights reserved. Designed for elite hospitality management.
      </footer>
    </div>
  );
}
