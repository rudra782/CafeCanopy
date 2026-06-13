import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Tag } from 'lucide-react';
import { customersAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await customersAPI.getAll({ search });
      setCustomers(data.data); setTotal(data.pagination.total);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (!edit.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (edit.id) { await customersAPI.update(edit.id, edit); toast.success('Customer updated'); }
      else { await customersAPI.create(edit); toast.success('Customer created'); }
      setShowModal(false); setEdit(null); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const loadHistory = async (c: any) => {
    setHistoryCustomer(c);
    try { const { data } = await customersAPI.getHistory(c.id); setHistory(data.data); }
    catch { toast.error('Failed to load history'); }
  };

  const TIER_COLORS: Record<string, string> = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2' };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Customers</div><div className="topbar-subtitle">{total} customers</div></div>
        <div className="search-bar" style={{ marginLeft: 'auto' }}><span className="search-icon">🔍</span><input placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={() => { setEdit({}); setShowModal(true); }}>＋ Quick Create</button>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Lifetime Spend</th><th>Loyalty</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr> :
                customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brown-700)', flexShrink: 0 }}>
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.phone || '—'}</td>
                    <td><span style={{ fontWeight: 700 }}>{c.order_count || 0}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--brown-600)' }}>₹{Number(c.lifetime_spend || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLORS[c.tier] || '#C8A97A', display: 'inline-block' }} />
                        <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{c.tier || 'bronze'}</span>
                        <span className="badge badge-brown">{c.points || 0} pts</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => { setEdit({ ...c }); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => loadHistory(c)}>📋 History</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && customers.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👥</div><h3>No customers found</h3></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && edit !== null && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">{edit.id ? 'Edit Customer' : 'New Customer'}</div><button className="modal-close" onClick={() => { setShowModal(false); setEdit(null); }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label required">Full Name</label><input className="form-control" value={edit.name || ''} onChange={e => setEdit((s: any) => ({ ...s, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={edit.email || ''} onChange={e => setEdit((s: any) => ({ ...s, email: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={edit.phone || ''} onChange={e => setEdit((s: any) => ({ ...s, phone: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setShowModal(false); setEdit(null); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}

      {historyCustomer && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header"><div className="modal-title">📋 {historyCustomer.name}'s Order History</div><button className="modal-close" onClick={() => { setHistoryCustomer(null); setHistory([]); }}>✕</button></div>
            <div className="modal-body" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: 'var(--cream-100)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 16px', fontSize: 11, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order</th>
                  <th style={{ padding: '10px 16px', fontSize: 11, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items</th>
                  <th style={{ padding: '10px 16px', fontSize: 11, textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</th>
                  <th style={{ padding: '10px 16px', fontSize: 11, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                </tr></thead>
                <tbody>
                  {history.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--cream-200)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--brown-600)' }}>{o.order_number}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{o.items?.slice(0, 2).map((i: any) => `${i.name} x${i.quantity}`).join(', ')}{o.items?.length > 2 ? ` +${o.items.length - 2} more` : ''}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>₹{Number(o.total || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!history.length && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No order history</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
