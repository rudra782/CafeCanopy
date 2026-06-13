import React, { useEffect, useState } from 'react';
import { settingsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsAPI.get().then(({ data }) => { setSettings(data.data || {}); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await settingsAPI.update(settings); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const upd = (key: string, value: any) => setSettings((s: any) => ({ ...s, [key]: value }));

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Settings</div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save Settings'}</button>
      </div>
      <div className="page-content">
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div> : (
          <div style={{ maxWidth: 720 }}>
            <div className="card mb-4">
              <div className="card-header"><div className="card-title">🏪 Business Information</div></div>
              <div className="card-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Business Name</label><input className="form-control" value={settings.business_name || ''} onChange={e => upd('business_name', e.target.value)} placeholder="CafeCanopy" /></div>
                  <div className="form-group"><label className="form-label">GST Number</label><input className="form-control" value={settings.gst_number || ''} onChange={e => upd('gst_number', e.target.value)} placeholder="22AAAAA0000A1Z5" /></div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label><textarea className="form-control" rows={2} value={settings.address || ''} onChange={e => upd('address', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={settings.phone || ''} onChange={e => upd('phone', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={settings.email || ''} onChange={e => upd('email', e.target.value)} /></div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header"><div className="card-title">💰 Tax & Currency</div></div>
              <div className="card-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Default Tax Rate (%)</label><input className="form-control" type="number" min="0" max="100" value={settings.default_tax_rate ?? 5} onChange={e => upd('default_tax_rate', parseFloat(e.target.value))} /></div>
                  <div className="form-group"><label className="form-label">Currency Symbol</label><input className="form-control" value={settings.currency_symbol || '₹'} onChange={e => upd('currency_symbol', e.target.value)} /></div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header"><div className="card-title">⭐ Loyalty Program</div></div>
              <div className="card-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Points per ₹1 Spent</label><input className="form-control" type="number" min="0" step="0.1" value={settings.loyalty_points_per_rupee ?? 1} onChange={e => upd('loyalty_points_per_rupee', parseFloat(e.target.value))} /></div>
                  <div className="form-group"><label className="form-label">₹ Value per Point</label><input className="form-control" type="number" min="0" step="0.01" value={settings.loyalty_point_value ?? 0.1} onChange={e => upd('loyalty_point_value', parseFloat(e.target.value))} /></div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 10, fontSize: 13, color: 'var(--info)' }}>
                  ℹ️ Customers earn {settings.loyalty_points_per_rupee || 1} point per ₹1 spent, redeemable at ₹{settings.loyalty_point_value || 0.1} per point
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header"><div className="card-title">🧾 Receipt</div></div>
              <div className="card-body">
                <div className="form-group"><label className="form-label">Footer Message</label><textarea className="form-control" rows={2} value={settings.receipt_footer || ''} onChange={e => upd('receipt_footer', e.target.value)} placeholder="Thank you for visiting CafeCanopy! ☕" /></div>
                <div className="form-group"><label className="form-label">Receipt Header</label><textarea className="form-control" rows={2} value={settings.receipt_header || ''} onChange={e => upd('receipt_header', e.target.value)} placeholder="Your branding here..." /></div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">📧 Email Notifications</div></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'email_on_order', label: 'Email receipt on order completion' },
                    { key: 'email_on_signup', label: 'Welcome email on customer signup' },
                  ].map(item => (
                    <label key={item.key} className="form-check" style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--cream-100)', borderRadius: 10, cursor: 'pointer' }}>
                      <label className="toggle">
                        <input type="checkbox" checked={settings[item.key] ?? false} onChange={e => upd(item.key, e.target.checked)} />
                        <span className="toggle-slider" />
                      </label>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
