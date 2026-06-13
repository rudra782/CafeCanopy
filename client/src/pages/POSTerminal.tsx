import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore, usePOSStore } from '../store';
import { productsAPI, categoriesAPI, sessionsAPI, ordersAPI, customersAPI, couponsAPI, tablesAPI } from '../lib/api';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

const formatCurrency = (n: number) => `₹${Number(n || 0).toFixed(2)}`;

export default function POSTerminal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const store = usePOSStore();

  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Session
  const [sessionLoading, setSessionLoading] = useState(true);
  const [openingAmount, setOpeningAmount] = useState('');
  const [showSessionOpen, setShowSessionOpen] = useState(false);
  const [showSessionClose, setShowSessionClose] = useState(false);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [closingAmount, setClosingAmount] = useState('');

  // UI State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Payment
  const [activePayMethod, setActivePayMethod] = useState<string>('');
  const [amountReceived, setAmountReceived] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Orders list
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    loadSession();
    loadProducts();
  }, []);

  const loadSession = async () => {
    setSessionLoading(true);
    try {
      const { data } = await sessionsAPI.getCurrent();
      store.setSession(data.data);
    } catch {
      setShowSessionOpen(true);
    } finally {
      setSessionLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, payRes, tableRes] = await Promise.all([
        productsAPI.getAll({ active: 'true', limit: 200 }),
        categoriesAPI.getAll({ active: 'true' }),
        import('../lib/api').then(m => m.paymentMethodsAPI.getAll({ active: 'true' })),
        tablesAPI.getAll({ status: 'available' }),
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
      setPaymentMethods(payRes.data.data);
      setTables(tableRes.data.data);
      if (payRes.data.data[0]) setActivePayMethod(payRes.data.data[0].id);
    } catch { toast.error('Failed to load POS data'); }
    finally { setLoading(false); }
  };

  // Socket
  useEffect(() => {
    const socket = getSocket();
    socket.on('order:paid', () => { /* refresh */ });
    return () => { socket.off('order:paid'); };
  }, []);

  // Filtered products
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchSearch && matchCat;
  });

  // Payment method details
  const activePM = paymentMethods.find(pm => pm.id === activePayMethod);

  // Generate UPI QR
  useEffect(() => {
    if (activePM?.type === 'upi' && activePM?.upi_id) {
      const upiUrl = `upi://pay?pa=${activePM.upi_id}&pn=CafeCanopy&am=${store.cartTotal().toFixed(2)}&cu=INR`;
      QRCode.toDataURL(upiUrl, { width: 200, margin: 2 }).then(setQrDataUrl).catch(console.error);
    }
  }, [activePM, store.cartTotal()]);

  // Open session
  const openSession = async () => {
    try {
      const { data } = await sessionsAPI.open({ opening_amount: parseFloat(openingAmount) || 0 });
      store.setSession(data.data);
      setShowSessionOpen(false);
      toast.success('Session opened!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to open session');
    }
  };

  // Customer search
  const searchCustomers = async (q: string) => {
    setCustomerSearch(q);
    if (q.length < 2) { setCustomerResults([]); return; }
    try {
      const { data } = await customersAPI.getAll({ search: q, limit: 5 });
      setCustomerResults(data.data);
    } catch {}
  };

  const createAndSelectCustomer = async () => {
    if (!newCustomer.name) { toast.error('Name required'); return; }
    setCreatingCustomer(true);
    try {
      const { data } = await customersAPI.create(newCustomer);
      store.setCustomer(data.data);
      toast.success('Customer created and selected');
      setShowCustomerModal(false);
      setNewCustomer({ name: '', email: '', phone: '' });
    } catch { toast.error('Failed to create customer'); }
    finally { setCreatingCustomer(false); }
  };

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const { data } = await couponsAPI.validate(couponCode, store.cartSubtotal());
      store.setCoupon(data.data);
      toast.success(`Coupon applied! Saving ${formatCurrency(data.data.calculated_discount)}`);
      setShowCouponModal(false);
      setCouponCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  // Send to kitchen
  const sendToKitchen = async () => {
    if (!store.cartItems.length) { toast.error('Cart is empty'); return; }
    if (!store.currentSession) { toast.error('No open session'); return; }
    try {
      let orderId = store.currentOrderId;
      if (!orderId) {
        const { data } = await ordersAPI.create({
          table_id: store.selectedTable?.id,
          customer_id: store.selectedCustomer?.id,
          session_id: store.currentSession.id,
          items: store.cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, notes: i.notes })),
          coupon_code: store.appliedCoupon?.code,
        });
        orderId = data.data.id;
        store.setOrderId(orderId);
      }
      await ordersAPI.sendToKitchen(orderId!);
      toast.success('Order sent to kitchen! 🍳');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Process payment
  const processPayment = async () => {
    if (!store.cartItems.length) { toast.error('Cart is empty'); return; }
    if (!store.currentSession) { toast.error('No open session'); return; }
    if (!activePayMethod) { toast.error('Select payment method'); return; }
    setProcessingPayment(true);
    try {
      // Create order if not exists
      let orderId = store.currentOrderId;
      if (!orderId) {
        const { data } = await ordersAPI.create({
          table_id: store.selectedTable?.id,
          customer_id: store.selectedCustomer?.id,
          session_id: store.currentSession.id,
          items: store.cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, notes: i.notes })),
          coupon_code: store.appliedCoupon?.code,
        });
        orderId = data.data.id;
      }

      const total = store.cartTotal();
      const received = parseFloat(amountReceived) || total;
      await ordersAPI.processPayment(orderId!, [{
        payment_method_id: activePayMethod,
        amount: total,
        amount_received: received,
        change_due: Math.max(0, received - total),
        transaction_reference: transactionRef || undefined,
      }]);

      toast.success('Payment processed! ✅');
      store.clearCart();
      setAmountReceived('');
      setTransactionRef('');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Payment failed'); }
    finally { setProcessingPayment(false); }
  };

  const closeSession = async () => {
    if (!store.currentSession) return;
    try {
      const { data } = await sessionsAPI.close(store.currentSession.id, { closing_amount: parseFloat(closingAmount) || 0 });
      setSessionStats(data.data.stats);
      store.setSession(null);
      setShowSessionClose(false);
      toast.success('Session closed');
      setShowSessionOpen(true);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to close session'); }
  };

  const cartSubtotal = store.cartSubtotal();
  const cartTax = store.cartTax();
  const couponDiscount = store.appliedCoupon?.calculated_discount || 0;
  const cartTotal = store.cartTotal();
  const changedue = Math.max(0, (parseFloat(amountReceived) || 0) - cartTotal);

  if (sessionLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream-100)' }}><div className="spinner spinner-lg" /></div>;

  // Session Open Dialog
  if (showSessionOpen && !store.currentSession) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream-100)' }}>
      <div className="card" style={{ width: 400, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>☕</div>
        <h2 style={{ marginBottom: 8 }}>Open POS Session</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Enter the opening cash amount to start your shift</p>
        <div className="form-group">
          <label className="form-label">Opening Cash Amount (₹)</label>
          <input className="form-control" type="number" min="0" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} placeholder="e.g. 1000" style={{ textAlign: 'center', fontSize: 20, fontWeight: 700 }} />
        </div>
        <button className="btn btn-primary btn-full btn-xl" onClick={openSession}>Open Session</button>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="pos-layout">
      {/* Products Panel */}
      <div className="pos-products">
        {/* POS Topbar */}
        <div className="pos-topbar">
          <span className="pos-brand">☕ CafeCanopy POS</span>
          {store.currentSession && <span className="pos-session-badge">● Session Active</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} onClick={() => setShowOrders(!showOrders)}>📋 Orders</button>
            <button className="btn btn-sm" style={{ background: 'rgba(217,79,79,0.3)', color: '#ff9999', border: 'none' }} onClick={() => setShowSessionClose(true)}>✕ Close Session</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowTableModal(true)}>
            {store.selectedTable ? `🪑 ${store.selectedTable.table_number}` : '+ Table'}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          <div className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All</div>
          {categories.map(c => (
            <div key={c.id} className={`category-tab ${selectedCategory === c.id ? 'active' : ''}`} onClick={() => setSelectedCategory(c.id)}>
              <span className="cat-dot" style={{ background: c.color }} />
              {c.name}
            </div>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
        ) : (
          <div className="product-grid">
            {filtered.map(p => {
              const inCart = store.cartItems.find(i => i.product_id === p.id);
              return (
                <div key={p.id} className="product-card" onClick={() => store.addItem({ product_id: p.id, name: p.name, price: p.price, quantity: 1, tax: p.tax, image_url: p.image_url, category_color: p.category_color })}>
                  <div className="product-cat-bar" style={{ background: p.category_color || 'var(--brown-300)' }} />
                  {p.image_url ? (
                    <img className="product-img" src={p.image_url} alt={p.name} />
                  ) : (
                    <div className="product-img-placeholder">🍽️</div>
                  )}
                  {inCart && <div className="in-cart-badge">{inCart.quantity}</div>}
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">{formatCurrency(p.price)}</div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No products found</div>}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="pos-cart">
        <div className="cart-header">
          <div className="cart-table-info">
            {store.selectedTable && <span className="cart-table-tag">🪑 Table {store.selectedTable.table_number}</span>}
            <span style={{ fontSize: 13, fontWeight: 600 }}>Current Order</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCustomerModal(true)} style={{ fontSize: 12 }}>
              {store.selectedCustomer ? `👤 ${store.selectedCustomer.name.split(' ')[0]}` : '＋ Customer'}
            </button>
            {store.cartItems.length > 0 && <button className="btn btn-danger btn-sm" onClick={store.clearCart} style={{ fontSize: 12 }}>🗑️ Clear</button>}
          </div>
        </div>

        <div className="cart-items">
          {store.cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
              <div style={{ fontSize: 14 }}>Tap products to add to cart</div>
            </div>
          ) : (
            store.cartItems.map(item => (
              <div key={item.product_id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{formatCurrency(item.price)} × {item.quantity}</div>
                </div>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => store.updateQuantity(item.product_id, item.quantity - 1)}>−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => store.updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                </div>
                <div className="cart-item-total">{formatCurrency(item.price * item.quantity)}</div>
                <div className="cart-item-delete" onClick={() => store.removeItem(item.product_id)}>✕</div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
          <div className="summary-row"><span>Tax</span><span>{formatCurrency(cartTax)}</span></div>
          {couponDiscount > 0 && (
            <div className="summary-row discount">
              <span>🎫 Coupon ({store.appliedCoupon?.code})</span>
              <span>−{formatCurrency(couponDiscount)}</span>
            </div>
          )}
          <div className="summary-row total"><span>Total</span><span>{formatCurrency(cartTotal)}</span></div>
          <div className="cart-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCouponModal(true)} style={{ flex: 1 }}>
              {store.appliedCoupon ? '🎫 Applied' : '🎫 Coupon'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={sendToKitchen} style={{ flex: 1 }} disabled={!store.cartItems.length}>
              🍳 Kitchen
            </button>
          </div>
        </div>
      </div>

      {/* Payment Panel */}
      <div className="pos-payment">
        <div className="payment-header">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Payment</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brown-600)' }}>{formatCurrency(cartTotal)}</div>
        </div>

        <div className="payment-method-tabs">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Method</div>
          {paymentMethods.map(pm => (
            <button key={pm.id} className={`payment-method-btn ${activePayMethod === pm.id ? 'active' : ''}`} onClick={() => setActivePayMethod(pm.id)}>
              <div className="payment-icon">
                {pm.type === 'cash' ? '💵' : pm.type === 'card' ? '💳' : '📱'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{pm.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pm.type}</div>
              </div>
              {activePayMethod === pm.id && <span style={{ marginLeft: 'auto', color: 'var(--brown-600)' }}>✓</span>}
            </button>
          ))}

          {/* Cash details */}
          {activePM?.type === 'cash' && (
            <div style={{ marginTop: 8 }}>
              <div className="form-group">
                <label className="form-label">Amount Received (₹)</label>
                <input className="form-control" type="number" min="0" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} placeholder={formatCurrency(cartTotal)} style={{ fontSize: 18, fontWeight: 700, textAlign: 'center' }} />
              </div>
              {parseFloat(amountReceived) > 0 && (
                <div style={{ background: 'var(--success-bg)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--success)' }}>Change Due</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(changedue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Card details */}
          {activePM?.type === 'card' && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Transaction Reference</label>
              <input className="form-control" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} placeholder="e.g. TXN123456" />
            </div>
          )}

          {/* UPI QR */}
          {activePM?.type === 'upi' && qrDataUrl && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <img src={qrDataUrl} alt="UPI QR" style={{ width: 160, height: 160, margin: '0 auto', borderRadius: 12, border: '3px solid var(--border)' }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{activePM.upi_id}</div>
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-primary btn-full btn-xl"
            onClick={processPayment}
            disabled={!store.cartItems.length || processingPayment}
            style={{ fontSize: 16, fontWeight: 800 }}
          >
            {processingPayment ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : '💳'}
            {processingPayment ? 'Processing...' : `Pay ${formatCurrency(cartTotal)}`}
          </button>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">Select Customer</div><button className="modal-close" onClick={() => setShowCustomerModal(false)}>✕</button></div>
            <div className="modal-body">
              {store.selectedCustomer && (
                <div style={{ background: 'var(--cream-200)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontWeight: 600 }}>{store.selectedCustomer.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selected</div></div>
                  <button className="btn btn-danger btn-sm" onClick={() => { store.setCustomer(null); setShowCustomerModal(false); }}>Remove</button>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Search Customer</label>
                <input className="form-control" placeholder="Name, email or phone..." value={customerSearch} onChange={e => searchCustomers(e.target.value)} />
              </div>
              {customerResults.map(c => (
                <div key={c.id} onClick={() => { store.setCustomer(c); setShowCustomerModal(false); setCustomerSearch(''); setCustomerResults([]); }}
                  style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brown-400)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brown-700)', flexShrink: 0 }}>{c.name[0]}</div>
                  <div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone || c.email || '—'}</div></div>
                </div>
              ))}
              <hr className="divider" />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Create New Customer</div>
              <div className="form-group"><input className="form-control" placeholder="Name *" value={newCustomer.name} onChange={e => setNewCustomer(n => ({ ...n, name: e.target.value }))} /></div>
              <div className="form-group"><input className="form-control" placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer(n => ({ ...n, phone: e.target.value }))} /></div>
              <div className="form-group"><input className="form-control" type="email" placeholder="Email" value={newCustomer.email} onChange={e => setNewCustomer(n => ({ ...n, email: e.target.value }))} /></div>
              <button className="btn btn-primary btn-sm w-full" onClick={createAndSelectCustomer} disabled={creatingCustomer}>{creatingCustomer ? 'Creating...' : 'Create & Select'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">Apply Coupon</div><button className="modal-close" onClick={() => setShowCouponModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Coupon Code</label>
                <input className="form-control" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. SAVE20" style={{ textTransform: 'uppercase', fontSize: 18, fontWeight: 700, textAlign: 'center', letterSpacing: 2 }} />
              </div>
              {store.appliedCoupon && (
                <div style={{ background: 'var(--success-bg)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Applied: {store.appliedCoupon.code}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => { store.setCoupon(null); setCouponCode(''); setShowCouponModal(false); }}>Remove</button>
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowCouponModal(false)}>Cancel</button><button className="btn btn-primary" onClick={applyCoupon}>Apply Coupon</button></div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Select Table</div><button className="modal-close" onClick={() => setShowTableModal(false)}>✕</button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                {tables.map(t => (
                  <div key={t.id} className="table-tile available" style={{ height: 80 }}
                    onClick={() => { store.setTable(t); setShowTableModal(false); toast.success(`Table ${t.table_number} selected`); }}>
                    <div className="table-num">{t.table_number}</div>
                    <div className="table-seats">👥 {t.seats}</div>
                  </div>
                ))}
                {tables.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>No available tables</div>}
              </div>
              {store.selectedTable && (
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => { store.setTable(null); setShowTableModal(false); }}>Remove Table Selection</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {showSessionClose && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">Close Session</div><button className="modal-close" onClick={() => setShowSessionClose(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Closing Cash Amount (₹)</label>
                <input className="form-control" type="number" min="0" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} placeholder="Count cash in drawer" style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
              </div>
              <div style={{ background: 'var(--warning-bg)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--warning)' }}>
                ⚠️ This will end your POS session. All draft orders will remain open.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSessionClose(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={closeSession}>Close Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
