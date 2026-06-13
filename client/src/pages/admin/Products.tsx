import React, { useEffect, useState, useCallback } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

interface Product {
  id: string; name: string; category_id: string; category_name: string;
  category_color: string; price: number; tax: number; description: string;
  unit_of_measure: string; image_url: string; kitchen_enabled: boolean; active: boolean;
}

const UNITS = ['piece', 'plate', 'bowl', 'glass', 'cup', 'bottle', 'half', 'full', 'portion'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const limit = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsAPI.getAll({ search, category: categoryFilter, active: activeFilter || undefined, page, limit }),
        categoriesAPI.getAll({ active: 'true' }),
      ]);
      setProducts(prodRes.data.data);
      setTotal(prodRes.data.pagination.total);
      setCategories(catRes.data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, categoryFilter, activeFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditProduct({ active: true, kitchen_enabled: true, tax: 5 }); setShowModal(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setShowModal(true); };
  const closeModal = () => { setEditProduct(null); setShowModal(false); };

  const handleSave = async () => {
    if (!editProduct?.name || !editProduct?.price) { toast.error('Name and price are required'); return; }
    setSaving(true);
    try {
      if (editProduct.id) {
        await productsAPI.update(editProduct.id, editProduct);
        toast.success('Product updated');
      } else {
        await productsAPI.create(editProduct);
        toast.success('Product created');
      }
      closeModal();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Delete ${selected.length} products?`)) return;
    try {
      await productsAPI.bulkDelete(selected);
      toast.success(`${selected.length} products deleted`);
      setSelected([]);
      load();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkArchive = async (active: boolean) => {
    if (!selected.length) return;
    try {
      await productsAPI.bulkArchive(selected, active);
      toast.success(`${selected.length} products ${active ? 'activated' : 'archived'}`);
      setSelected([]);
      load();
    } catch { toast.error('Bulk archive failed'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await productsAPI.uploadImage(file);
      setEditProduct(p => ({ ...p, image_url: data.data.url }));
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Products</div>
          <div className="topbar-subtitle">{total} products total</div>
        </div>
        <div className="search-bar" style={{ marginLeft: 'auto' }}>
          <span className="search-icon">🔍</span>
          <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control form-select" style={{ width: 160 }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control form-select" style={{ width: 130 }} value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Archived</option>
        </select>
        <button className="btn btn-primary" onClick={openCreate}>＋ Add Product</button>
      </div>

      <div className="page-content">
        {selected.length > 0 && (
          <div className="card mb-4" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream-200)' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{selected.length} selected</span>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkArchive(false)}>Archive</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkArchive(true)}>Activate</button>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>Delete All</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>No products found</h3>
            <p>Add your first product to get started</p>
            <button className="btn btn-primary" onClick={openCreate}>＋ Add Product</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {products.map(p => (
              <div key={p.id} className="card" style={{ cursor: 'default', position: 'relative' }}>
                <div style={{ height: 4, background: p.category_color || 'var(--brown-300)', borderRadius: '14px 14px 0 0' }} />
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={e => setSelected(s => e.target.checked ? [...s, p.id] : s.filter(i => i !== p.id))}
                  style={{ position: 'absolute', top: 14, right: 12, width: 16, height: 16, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', gap: 12, padding: '12px 12px 0' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 70, height: 70, background: 'var(--cream-200)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🍽️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span className="color-dot" style={{ background: p.category_color }} /> {p.category_name || '—'}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brown-600)' }}>₹{p.price}</div>
                  </div>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge ${p.active ? 'badge-success' : 'badge-gray'}`}>{p.active ? 'Active' : 'Archived'}</span>
                  {p.kitchen_enabled && <span className="badge badge-warning">🍳 Kitchen</span>}
                  {p.tax > 0 && <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{p.tax}% Tax</span>}
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} data-tooltip="Delete"></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && editProduct && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">{editProduct.id ? 'Edit Product' : 'New Product'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">Product Name</label>
                  <input className="form-control" value={editProduct.name || ''} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cappuccino" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Category</label>
                  <select className="form-control form-select" value={editProduct.category_id || ''} onChange={e => setEditProduct(p => ({ ...p, category_id: e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Price (₹)</label>
                  <input className="form-control" type="number" min="0" step="0.5" value={editProduct.price || ''} onChange={e => setEditProduct(p => ({ ...p, price: parseFloat(e.target.value) }))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax (%)</label>
                  <input className="form-control" type="number" min="0" max="100" value={editProduct.tax ?? 5} onChange={e => setEditProduct(p => ({ ...p, tax: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <select className="form-control form-select" value={editProduct.unit_of_measure || 'piece'} onChange={e => setEditProduct(p => ({ ...p, unit_of_measure: e.target.value }))}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {editProduct.image_url && <img src={editProduct.image_url} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />}
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      {uploading ? '⏳ Uploading...' : '📁 Upload Image'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={editProduct.description || ''} onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <label className="form-check">
                  <input type="checkbox" checked={editProduct.kitchen_enabled ?? true} onChange={e => setEditProduct(p => ({ ...p, kitchen_enabled: e.target.checked }))} />
                  <span>🍳 Kitchen Enabled</span>
                </label>
                <label className="form-check">
                  <input type="checkbox" checked={editProduct.active ?? true} onChange={e => setEditProduct(p => ({ ...p, active: e.target.checked }))} />
                  <span>✅ Active</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : null}
                {saving ? 'Saving...' : (editProduct.id ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
