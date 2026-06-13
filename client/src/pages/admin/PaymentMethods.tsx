import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Tag } from 'lucide-react';
import { paymentMethodsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const PAYMENT_TYPES = [
  { value: 'cash', label: '💵 Cash', icon: '💵' },
  { value: 'card', label: '💳 Card', icon: '💳' },
  { value: 'upi', label: '📱 UPI', icon: '📱' },
  { value: 'wallet', label: '👛 Wallet', icon: '👛' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer', icon: '🏦' },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await paymentMethodsAPI.getAll(); setMethods(data.data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!edit.name || !edit.type) { toast.error('Name and type required'); return; }
    setSaving(true);
    try {
      if (edit.id) { await paymentMethodsAPI.update(edit.id, edit); toast.success('Updated'); }
      else { await paymentMethodsAPI.create(edit); toast.success('Created'); }
      setShowModal(false); setEdit(null); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Payment Methods</div><div className="topbar-subtitle">{methods.length} methods configured</div></div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => { setEdit({ type: 'cash', active: true }); setShowModal(true); }}>＋ Add Method</button>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {loading ? <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div> :
          methods.map(m => (
            <div key={m.id} className="card">
              <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                  {PAYMENT_TYPES.find(t => t.value === m.type)?.icon || '💰'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{m.type}</div>
                  {m.upi_id && <div style={{ fontSize: 12, color: 'var(--brown-600)', marginTop: 2 }}>📱 {m.upi_id}</div>}
                </div>
                <span className={`badge ${m.active ? 'badge-success' : 'badge-gray'}`}>{m.active ? 'Active' : 'Off'}</span>
              </div>
              <div className="card-footer" style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { setEdit({ ...m }); setShowModal(true); }}>Edit</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={async () => { if (confirm('Delete?')) { await paymentMethodsAPI.delete(m.id); toast.success('Deleted'); load(); } }}></button>
              </div>
            </div>
          ))}
          {!loading && methods.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-icon">💳</div><h3>No payment methods</h3><button className="btn btn-primary" onClick={() => { setEdit({ type: 'cash', active: true }); setShowModal(true); }}>Add First Method</button></div>}
        </div>
      </div>

      {showModal && edit && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">{edit.id ? 'Edit' : 'New'} Payment Method</div><button className="modal-close" onClick={() => { setShowModal(false); setEdit(null); }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label required">Name</label><input className="form-control" value={edit.name || ''} onChange={e => setEdit((s: any) => ({ ...s, name: e.target.value }))} placeholder="e.g. Cash, HDFC Card" /></div>
              <div className="form-group"><label className="form-label required">Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PAYMENT_TYPES.map(t => (
                    <div key={t.value} onClick={() => setEdit((s: any) => ({ ...s, type: t.value }))} style={{ padding: '10px 8px', border: `2px solid ${edit.type === t.value ? 'var(--brown-500)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: edit.type === t.value ? 'var(--cream-200)' : 'transparent', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 22 }}>{t.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: edit.type === t.value ? 'var(--brown-700)' : 'var(--text-muted)' }}>{t.label.split(' ')[1]}</div>
                    </div>
                  ))}
                </div>
              </div>
              {edit.type === 'upi' && <div className="form-group"><label className="form-label">UPI ID</label><input className="form-control" value={edit.upi_id || ''} onChange={e => setEdit((s: any) => ({ ...s, upi_id: e.target.value }))} placeholder="merchant@upi" /></div>}
              <label className="form-check"><input type="checkbox" checked={edit.active ?? true} onChange={e => setEdit((s: any) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setShowModal(false); setEdit(null); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
