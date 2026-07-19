import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { couponsAPI, promotionsAPI, productsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

// ─── Coupons Tab ──────────────────────────────────────────────────────────────
function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await couponsAPI.getAll(); setCoupons(data.data); }
    catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!edit.name || !edit.code || !edit.discount_value) { toast.error('Required fields missing'); return; }
    setSaving(true);
    try {
      if (edit.id) { await couponsAPI.update(edit.id, edit); toast.success('Coupon updated'); }
      else { await couponsAPI.create(edit); toast.success('Coupon created'); }
      setShowModal(false); setEdit(null); load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => { setEdit({ discount_type: 'percentage', active: true }); setShowModal(true); }}>＋ New Coupon</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Discount</th><th>Min. Amount</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr> :
              coupons.map(c => (
                <tr key={c.id}>
                  <td><code style={{ background: 'var(--cream-200)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>{c.code}</code></td>
                  <td>{c.name}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                  <td>{c.minimum_amount > 0 ? `₹${c.minimum_amount}` : '—'}</td>
                  <td>{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}</td>
                  <td><span className={`badge ${c.active ? 'badge-success' : 'badge-gray'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                  <td><div className="table-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => { setEdit({ ...c }); setShowModal(true); }}>Edit</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={async () => { if (confirm('Delete?')) { await couponsAPI.delete(c.id); toast.success('Deleted'); load(); } }} data-tooltip="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div></td>
                </tr>
              ))}
              {!loading && !coupons.length && <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🎫</div><h3>No coupons</h3></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && edit && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">{edit.id ? 'Edit Coupon' : 'New Coupon'}</div><button className="modal-close" onClick={() => { setShowModal(false); setEdit(null); }}>✕</button></div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group"><label className="form-label required">Coupon Name</label><input className="form-control" value={edit.name || ''} onChange={e => setEdit((s: any) => ({ ...s, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label required">Coupon Code</label><input className="form-control" value={edit.code || ''} onChange={e => setEdit((s: any) => ({ ...s, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" style={{ textTransform: 'uppercase' }} /></div>
                <div className="form-group"><label className="form-label">Discount Type</label><select className="form-control form-select" value={edit.discount_type || 'percentage'} onChange={e => setEdit((s: any) => ({ ...s, discount_type: e.target.value }))}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option></select></div>
                <div className="form-group"><label className="form-label required">Discount Value</label><input className="form-control" type="number" min="0" value={edit.discount_value || ''} onChange={e => setEdit((s: any) => ({ ...s, discount_value: parseFloat(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Min. Order Amount</label><input className="form-control" type="number" min="0" value={edit.minimum_amount || ''} onChange={e => setEdit((s: any) => ({ ...s, minimum_amount: parseFloat(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Max Discount (₹)</label><input className="form-control" type="number" min="0" value={edit.maximum_discount || ''} onChange={e => setEdit((s: any) => ({ ...s, maximum_discount: parseFloat(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Usage Limit</label><input className="form-control" type="number" min="0" value={edit.usage_limit || ''} onChange={e => setEdit((s: any) => ({ ...s, usage_limit: parseInt(e.target.value) }))} placeholder="Leave empty for unlimited" /></div>
                <div className="form-group"><label className="form-label">Valid Until</label><input className="form-control" type="date" value={edit.valid_until?.split('T')[0] || ''} onChange={e => setEdit((s: any) => ({ ...s, valid_until: e.target.value }))} /></div>
              </div>
              <label className="form-check"><input type="checkbox" checked={edit.active ?? true} onChange={e => setEdit((s: any) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setShowModal(false); setEdit(null); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Promotions Tab ───────────────────────────────────────────────────────────
function PromotionsTab() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, prodRes] = await Promise.all([promotionsAPI.getAll(), productsAPI.getAll({ active: 'true', limit: 200 })]);
      setPromotions(pRes.data.data); setProducts(prodRes.data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!edit.name || !edit.discount_value) { toast.error('Required fields missing'); return; }
    setSaving(true);
    try {
      if (edit.id) { await promotionsAPI.update(edit.id, edit); toast.success('Updated'); }
      else { await promotionsAPI.create(edit); toast.success('Created'); }
      setShowModal(false); setEdit(null); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => { setEdit({ promotion_type: 'product', discount_type: 'percentage', minimum_quantity: 1, minimum_amount: 0, active: true }); setShowModal(true); }}>＋ New Promotion</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div> :
        promotions.map(p => (
          <div key={p.id} className="card">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <span className={`badge ${p.promotion_type === 'product' ? 'badge-warning' : 'badge-info'}`} style={{ marginTop: 4 }}>
                  {p.promotion_type === 'product' ? '🍔 Product' : '🧾 Order'} Promotion
                </span>
              </div>
              <span className={`badge ${p.active ? 'badge-success' : 'badge-gray'}`}>{p.active ? 'Active' : 'Off'}</span>
            </div>
            <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
              {p.promotion_type === 'product' ? (
                <><div>Product: <strong>{p.product_name || 'Any'}</strong></div><div>Min. Qty: <strong>{p.minimum_quantity}</strong></div></>
              ) : (
                <div>Min. Order: <strong>₹{p.minimum_amount}</strong></div>
              )}
              <div style={{ marginTop: 6, fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>
                {p.discount_type === 'percentage' ? `${p.discount_value}% off` : `₹${p.discount_value} off`}
              </div>
            </div>
            <div className="card-footer" style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { setEdit({ ...p }); setShowModal(true); }}>Edit</button>
              <button className="btn btn-danger btn-sm btn-icon" onClick={async () => { if (confirm('Delete?')) { await promotionsAPI.delete(p.id); toast.success('Deleted'); load(); } }} data-tooltip="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!loading && !promotions.length && <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-icon">🎯</div><h3>No promotions</h3><button className="btn btn-primary" onClick={() => { setEdit({ promotion_type: 'product', discount_type: 'percentage', minimum_quantity: 1, active: true }); setShowModal(true); }}>Create First Promotion</button></div>}
      </div>

      {showModal && edit && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">{edit.id ? 'Edit Promotion' : 'New Promotion'}</div><button className="modal-close" onClick={() => { setShowModal(false); setEdit(null); }}>✕</button></div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label required">Promotion Name</label><input className="form-control" value={edit.name || ''} onChange={e => setEdit((s: any) => ({ ...s, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Type</label><select className="form-control form-select" value={edit.promotion_type} onChange={e => setEdit((s: any) => ({ ...s, promotion_type: e.target.value }))}><option value="product">Product Promotion</option><option value="order">Order Promotion</option></select></div>
                <div className="form-group"><label className="form-label">Discount Type</label><select className="form-control form-select" value={edit.discount_type} onChange={e => setEdit((s: any) => ({ ...s, discount_type: e.target.value }))}><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
                <div className="form-group"><label className="form-label required">Discount Value</label><input className="form-control" type="number" min="0" value={edit.discount_value || ''} onChange={e => setEdit((s: any) => ({ ...s, discount_value: parseFloat(e.target.value) }))} /></div>
                {edit.promotion_type === 'product' ? (
                  <>
                    <div className="form-group"><label className="form-label">Product</label><select className="form-control form-select" value={edit.product_id || ''} onChange={e => setEdit((s: any) => ({ ...s, product_id: e.target.value || null }))}><option value="">Any Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Min. Quantity</label><input className="form-control" type="number" min="1" value={edit.minimum_quantity || 1} onChange={e => setEdit((s: any) => ({ ...s, minimum_quantity: parseInt(e.target.value) }))} /></div>
                  </>
                ) : (
                  <div className="form-group"><label className="form-label">Min. Order Amount (₹)</label><input className="form-control" type="number" min="0" value={edit.minimum_amount || ''} onChange={e => setEdit((s: any) => ({ ...s, minimum_amount: parseFloat(e.target.value) }))} /></div>
                )}
                <div className="form-group"><label className="form-label">Valid Until</label><input className="form-control" type="date" value={edit.valid_until?.split('T')[0] || ''} onChange={e => setEdit((s: any) => ({ ...s, valid_until: e.target.value }))} /></div>
              </div>
              <label className="form-check"><input type="checkbox" checked={edit.active ?? true} onChange={e => setEdit((s: any) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setShowModal(false); setEdit(null); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CouponsPromotionsPage() {
  const [tab, setTab] = useState<'coupons' | 'promotions'>('coupons');
  return (
    <>
      <div className="topbar"><div className="topbar-title">Coupons & Promotions</div></div>
      <div className="page-content">
        <div className="tabs mb-4"><button className={`tab ${tab === 'coupons' ? 'active' : ''}`} onClick={() => setTab('coupons')}>🎫 Coupons</button><button className={`tab ${tab === 'promotions' ? 'active' : ''}`} onClick={() => setTab('promotions')}>🎯 Promotions</button></div>
        {tab === 'coupons' ? <CouponsTab /> : <PromotionsTab />}
      </div>
    </>
  );
}
