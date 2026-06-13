import React, { useState, useEffect } from 'react';
import { Coffee, Sparkles, Star, Gift, ClipboardList } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [role, setRole] = useState<'admin' | 'employee' | 'kitchen' | 'customer'>('admin');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['admin', 'employee', 'kitchen', 'customer'].includes(roleParam)) {
      setRole(roleParam as any);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name: form.name, email: form.email, password: form.password, role });
      const { user, accessToken, refreshToken } = data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Account created! Welcome to CafeCanopy');
      
      if (user.role === 'kitchen') {
        navigate('/kds');
      } else if (user.role === 'customer') {
        navigate('/customer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
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
          <div style={{ display: 'flex', marginBottom: 24 }}><Sparkles size={64} style={{ color: 'var(--brown-600)' }} /></div>
          <h1 className="auth-hero-title">Join the<br />CafeCanopy<br />Community</h1>
          <p className="auth-hero-sub">Get started with our state-of-the-art cafe POS ecosystem.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40 }}>
            {[
              { icon: Star, text: 'Earn loyalty points and manage staff' },
              { icon: Gift, text: 'Exclusive system capabilities' },
              { icon: ClipboardList, text: 'Real-time sync between POS & KDS' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
                  <Icon size={20} />
                  <span>{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-logo">
            <div className="auth-logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Coffee size={18} style={{ color: 'white' }} /></div>
            <span className="auth-logo-name">CafeCanopy</span>
          </div>
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Register and select your role to continue</p>

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
              <label className="form-label required">Register As</label>
              <select className="form-control form-select" value={role} onChange={e => setRole(e.target.value as any)}>
                <option value="admin">Cafe Owner / Admin</option>
                <option value="employee">Cashier / POS Staff</option>
                <option value="kitchen">Kitchen Staff</option>
                <option value="customer">Loyalty Customer</option>
              </select>
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
