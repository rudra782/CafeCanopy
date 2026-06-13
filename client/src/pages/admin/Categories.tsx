import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Tag } from 'lucide-react';
import { categoriesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const PRESET_COLORS = ['#C8A97A','#E8B86D','#D4956A','#8BAF6B','#C97BA3','#7BAFC9','#A0784A','#CF6679','#7BAFC9','#B5A3CF'];

export default function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await categoriesAPI.getAll(); setCats(data.data); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEdit({ name: '', color: '#C8A97A' }); setShowModal(true); };
  const openEdit = (c: any) => { setEdit({ ...c }); setShowModal(true); };
  const closeModal = () => { setEdit(null); setShowModal(false); };

  const handleSave = async () => {
    if (!edit.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (edit.id) { await categoriesAPI.update(edit.id, edit); toast.success('Category updated'); }
      else { await categoriesAPI.create(edit); toast.success('Category created'); }
      closeModal(); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products will be uncategorized.')) return;
    try { await categoriesAPI.delete(id); toast.success('Category deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Categories</div><div className="topbar-subtitle">{cats.length} categories</div></div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openCreate}>＋ New Category</button>
      </div>
      <div className="page-content">
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {cats.map(c => (
              <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ height: 6, background: c.color }} />
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: c.color, opacity: 0.9, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.product_count} products</div>
                  </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c.id)}></button>
                </div>
              </div>
            ))}
            {cats.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-icon"></div><h3>No categories yet</h3><button className="btn btn-primary" onClick={openCreate}>＋ Create First Category</button></div>}
          </div>
        }
      </div>
      {showModal && edit && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">{edit.id ? 'Edit Category' : 'New Category'}</div><button className="modal-close" onClick={closeModal}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Category Name</label>
                <input className="form-control" value={edit.name} onChange={e => setEdit((c: any) => ({ ...c, name: e.target.value }))} placeholder="e.g. Coffee & Tea" />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {PRESET_COLORS.map(col => (
                    <div key={col} onClick={() => setEdit((c: any) => ({ ...c, color: col }))} style={{
                      width: 32, height: 32, borderRadius: 8, background: col, cursor: 'pointer',
                      border: edit.color === col ? '3px solid var(--brown-700)' : '3px solid transparent',
                      boxShadow: edit.color === col ? '0 0 0 1px var(--brown-700)' : 'none',
                      transition: 'all 0.15s',
                    }} />
                  ))}
                </div>
                <input type="color" value={edit.color} onChange={e => setEdit((c: any) => ({ ...c, color: e.target.value }))} style={{ width: '100%', height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
              </div>
              <div style={{ padding: '12px 16px', background: edit.color + '20', borderRadius: 10, border: `2px solid ${edit.color}`, textAlign: 'center' }}>
                <span style={{ fontWeight: 700, color: edit.color, fontSize: 14 }}>Preview: {edit.name || 'Category Name'}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (edit.id ? 'Update' : 'Create')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
