import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      const { user, accessToken, refreshToken, redirect } = data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(redirect || '/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>☕</div>
          <h1 className="auth-hero-title">Your Complete<br />Cafe Management<br />System</h1>
          <p className="auth-hero-sub">
            Streamline your operations with our all-in-one POS, kitchen display, and analytics platform.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
            {['Fast Orders', 'Real-time KDS', 'Smart Reports'].map(f => (
              <div key={f} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '8px 14px',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: 600,
              }}>✓ {f}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-logo">
            <div className="auth-logo-icon">☕</div>
            <span className="auth-logo-name">CafeCanopy</span>
          </div>
          <h2 className="auth-title">Sign in</h2>
          <p className="auth-subtitle">Enter your credentials to continue</p>

          {/* Demo credentials */}
          <div style={{ background: 'var(--cream-200)', borderRadius: 10, padding: '12px 14px', marginBottom: 24, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--brown-700)' }}>Demo Credentials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
              <span>👑 Admin: admin@cafecanopy.com / Admin@123</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Email</label>
              <input
                className="form-control"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-xl" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            New customer?{' '}
            <Link to="/register" style={{ color: 'var(--brown-600)', fontWeight: 600 }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
