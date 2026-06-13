import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name: form.name, email: form.email, password: form.password, role: 'customer' });
      const { user, accessToken, refreshToken } = data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Account created! Welcome to CafeCanopy ☕');
      navigate('/customer/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✨</div>
          <h1 className="auth-hero-title">Join the<br />CafeCanopy<br />Community</h1>
          <p className="auth-hero-sub">Earn loyalty points, track your orders, and get exclusive offers when you sign up.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40 }}>
            {[
              { icon: '⭐', text: 'Earn 1 point per ₹1 spent' },
              { icon: '🎁', text: 'Exclusive member promotions' },
              { icon: '📋', text: 'Full order history' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span>{f.text}</span>
              </div>
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
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Start earning loyalty points today</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input className="form-control" placeholder="Your name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Email</label>
              <input className="form-control" type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Password</label>
              <input className="form-control" type="password" placeholder="Min 6 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Confirm Password</label>
              <input className="form-control" type="password" placeholder="Repeat password" value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-xl" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : null}
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brown-600)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
