import React, { useEffect, useState } from 'react';
import { Coffee, Utensils, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../../store';
import { customerPortalAPI, productsAPI, categoriesAPI } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'order' | 'history' | 'loyalty'>('order');
  const [loading, setLoading] = useState(true);

  // Customer Loyalty Stats
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Catalog & Tables
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, catRes, tableRes, couponRes] = await Promise.all([
        customerPortalAPI.getDashboard(),
        productsAPI.getAll({ active: 'true', limit: 200 }),
        categoriesAPI.getAll({ active: 'true' }),
        customerPortalAPI.getTables(),
        customerPortalAPI.getCoupons(),
      ]);

      setDashboardData(dashRes.data.data);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
      setTables(tableRes.data.data);
      setCoupons(couponRes.data.data);

      if (tableRes.data.data?.[0]) {
        setSelectedTableId(tableRes.data.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load customer dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
    toast.success('Signed out successfully');
  };

  // Cart Handlers
  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[productId] <= 1) {
        delete copy[productId];
      } else {
        copy[productId] -= 1;
      }
      return copy;
    });
  };

  const clearCart = () => setCart({});

  // Calc Totals
  const getCartItemsCount = () => Object.values(cart).reduce((sum, q) => sum + q, 0);

  const getCartSubtotal = () => {
    return Object.entries(cart).reduce((sum, [pId, qty]) => {
      const prod = products.find(p => p.id === pId);
      return sum + (prod ? Number(prod.price) * qty : 0);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    const itemsCount = getCartItemsCount();
    if (itemsCount === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!selectedTableId) {
      toast.error('Please select a table');
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderItems = Object.entries(cart).map(([pId, qty]) => ({
        product_id: pId,
        quantity: qty,
      }));

      await customerPortalAPI.createOrder({
        table_id: selectedTableId,
        items: orderItems,
        notes: notes || undefined,
      });

      toast.success('Order placed! Waiting for cashier confirmation');
      clearCart();
      setNotes('');
      // Reload dashboard/orders history
      const dashRes = await customerPortalAPI.getDashboard();
      setDashboardData(dashRes.data.data);
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const formatCurrency = (n: number) => `₹${Number(n || 0).toFixed(2)}`;

  const filteredProducts = products.filter(p => {
    return selectedCategory === 'all' || p.category_id === selectedCategory;
  });

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      default: return '#CD7F32'; // bronze
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream-100)' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  const cust = dashboardData?.customer;
  const stats = dashboardData?.stats;
  const recentOrders = dashboardData?.recent_orders || [];
  const transactions = dashboardData?.loyalty_transactions || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream-100)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Header */}
      <header className="topbar" style={{
        background: 'var(--bg-card)',
        padding: '0 8%',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex' }}><Coffee size={24} style={{ color: 'var(--brown-600)' }} /></span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>CafeCanopy Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14 }}>Welcome, <strong>{cust?.name || user?.name}</strong></span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ padding: '32px 8%', display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 32 }}>

        {/* Left Area: Main Interaction */}
        <div>
          {/* Customer Loyalty Profile Card */}
          <div className="card mb-6" style={{
            background: 'linear-gradient(135deg, var(--brown-800), var(--brown-900))',
            color: 'white',
            padding: 28,
            borderRadius: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{
                  background: getTierColor(cust?.tier),
                  color: 'var(--brown-900)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: 8
                }}>{cust?.tier || 'Bronze'} Member</span>
                <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{cust?.name}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Loyalty Member since {new Date(cust?.created_at).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Points Balance</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--brown-100)' }}>{cust?.points || 0}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Lifetime Earned: {cust?.lifetime_points || 0}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 40, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Total Spend</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(stats?.lifetime_spend || 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Orders Visited</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{stats?.total_orders || 0}</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs mb-6">
            <button className={`tab ${activeTab === 'order' ? 'active' : ''}`} onClick={() => setActiveTab('order')}>Order Now</button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Order History</button>
            <button className={`tab ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => setActiveTab('loyalty')}>Coupons & Perks</button>
          </div>

          {/* Tab contents */}
          {activeTab === 'order' && (
            <div>
              {/* Table Selector */}
              <div className="card mb-6" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Select Your Table</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <select className="form-control form-select" value={selectedTableId} onChange={e => setSelectedTableId(e.target.value)} style={{ maxWidth: 240 }}>
                    <option value="">-- Choose Table --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.seats} seats) - {t.status === 'occupied' ? 'Occupied / Active' : 'Available'}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>We'll deliver your order directly to this table once confirmed.</span>
                </div>
              </div>

              {/* Product Catalog */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 8 }}>
                  <button className={`tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All Items</button>
                  {categories.map(c => (
                    <button key={c.id} className={`tab ${selectedCategory === c.id ? 'active' : ''}`} onClick={() => setSelectedCategory(c.id)}>
                      {c.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
                  {filteredProducts.map(p => {
                    const qty = cart[p.id] || 0;
                    return (
                      <div key={p.id} className="stat-card" style={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        padding: 16,
                        position: 'relative'
                      }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
                        ) : (
                          <div style={{ width: '100%', height: 120, background: 'var(--cream-100)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Utensils size={32} style={{ color: 'var(--brown-400)' }} /></div>
                        )}
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brown-800)', marginBottom: 4 }}>{p.name}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{ fontWeight: 700, color: 'var(--brown-600)' }}>{formatCurrency(p.price)}</span>

                          {qty > 0 ? (
                            <div className="qty-controls" style={{ transform: 'scale(0.9)' }}>
                              <button className="qty-btn" onClick={() => removeFromCart(p.id)}>−</button>
                              <span className="qty-value">{qty}</span>
                              <button className="qty-btn" onClick={() => addToCart(p.id)}>+</button>
                            </div>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => addToCart(p.id)}>Add</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Recent Orders</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o: any) => (
                      <tr key={o.id}>
                        <td><span style={{ fontWeight: 700, color: 'var(--brown-600)' }}>{o.order_number}</span></td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {o.items?.map((item: any, idx: number) => (
                              <span key={idx} style={{ fontSize: 13 }}>{item.name} x{item.quantity}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${o.status === 'paid' ? 'badge-success' :
                              o.status === 'preparing' ? 'badge-warning' :
                                o.status === 'draft' ? 'badge-gray' : 'badge-info'
                            }`} style={{ textTransform: 'capitalize' }}>
                            {o.status === 'draft' ? 'Waiting Confirmation' : o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(o.total)}</td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No order history found. Place your first order today!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Available Cafe Coupons</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {coupons.map((c: any) => (
                  <div key={c.id} style={{
                    border: '2px dashed var(--brown-300)',
                    background: 'var(--bg-card)',
                    padding: 20,
                    borderRadius: 12,
                    position: 'relative'
                  }}>
                    <span className="badge badge-brown" style={{ position: 'absolute', top: 12, right: 12 }}>
                      {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                    </span>
                    <h4 style={{ fontWeight: 800, fontSize: 18, color: 'var(--brown-700)', letterSpacing: 1 }}>{c.code}</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{c.description || 'Use this code on checkout to save on your next order.'}</p>
                    {c.minimum_spend && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Min. Spend: {formatCurrency(c.minimum_spend)}</div>}
                  </div>
                ))}
                {coupons.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No coupons available right now.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Checkout / Cart Summary */}
        <div style={{ position: 'sticky', top: 96, height: 'fit-content' }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>My Cart</h3>

            {getCartItemsCount() === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <ShoppingCart size={32} style={{ color: 'var(--brown-400)' }} />
                <p style={{ fontSize: 13, marginTop: 8 }}>Cart is empty. Select items on the left to add.</p>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                  {Object.entries(cart).map(([pId, qty]) => {
                    const prod = products.find(p => p.id === pId);
                    if (!prod) return null;
                    return (
                      <div key={pId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--cream-200)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{prod.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatCurrency(prod.price)} x{qty}</div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(Number(prod.price) * qty)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="form-group">
                  <label className="form-label">Order Notes</label>
                  <input className="form-control" placeholder="e.g. No sugar, extra hot" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
                    <span>Estimated Total:</span>
                    <strong style={{ fontSize: 18, color: 'var(--brown-700)' }}>{formatCurrency(getCartSubtotal())}</strong>
                  </div>

                  <button className="btn btn-primary btn-full btn-xl" onClick={handlePlaceOrder} disabled={submittingOrder}>
                    {submittingOrder ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : 'Place Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
