import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../../lib/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#C8A97A', '#A0784A', '#8A6340', '#6B4C2F', '#4A3420', '#D4B896'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week'>('day');

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await reportsAPI.get({
        from_date: `${fromDate}T00:00:00`,
        to_date: `${toDate}T23:59:59`,
        group_by: groupBy,
      });
      setData(res.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [fromDate, toDate, groupBy]);

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Reports & Analytics</div></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="form-control" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: 150 }} />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <input className="form-control" type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: 150 }} />
          <select className="form-control form-select" value={groupBy} onChange={e => setGroupBy(e.target.value as any)} style={{ width: 120 }}>
            <option value="hour">Hourly</option>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={load}>📊 Generate</button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-lg" /></div>
        ) : !data ? null : (
          <>
            {/* KPIs */}
            <div className="grid-4 mb-6">
              {[
                { label: 'Total Revenue', value: fmt(data.kpis?.revenue), icon: '💰', color: 'green' },
                { label: 'Total Orders', value: data.kpis?.total_orders || 0, icon: '📦', color: 'blue' },
                { label: 'Avg Order Value', value: fmt(data.kpis?.avg_order_value), icon: '🧾', color: 'brown' },
                { label: 'Items Sold', value: data.kpis?.items_sold || 0, icon: '🍽️', color: 'orange' },
              ].map(kpi => (
                <div key={kpi.label} className="stat-card">
                  <div className={`stat-icon ${kpi.color}`}>{kpi.icon}</div>
                  <div className="stat-info"><div className="stat-label">{kpi.label}</div><div className="stat-value">{kpi.value}</div></div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid-2 mb-6">
              <div className="card">
                <div className="card-header"><div className="card-title">📈 Revenue Trend</div></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.sales_trend || []}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C8A97A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C8A97A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9B8878' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9B8878' }} tickFormatter={v => `₹${v}`} />
                      <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#C8A97A" fill="url(#areaGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">💳 Payment Distribution</div></div>
                <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={data.payment_distribution || []} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="amount" paddingAngle={4}>
                        {(data.payment_distribution || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {(data.payment_distribution || []).map((p: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        <span style={{ fontSize: 13, flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-600)' }}>₹{Number(p.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-2 mb-6">
              {/* Top Products */}
              <div className="card">
                <div className="card-header"><div className="card-title">🏆 Top Products by Revenue</div></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(data.top_products || []).slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9B8878' }} tickFormatter={v => `₹${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9B8878' }} width={90} />
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="#C8A97A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Revenue */}
              <div className="card">
                <div className="card-header"><div className="card-title">🏷️ Revenue by Category</div></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.category_revenue || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9B8878' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9B8878' }} tickFormatter={v => `₹${v}`} />
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="#A0784A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="card">
              <div className="card-header"><div className="card-title">🧾 Recent Orders</div><span className="badge badge-brown">{(data.recent_orders || []).length} records</span></div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Order #</th><th>Customer</th><th>Cashier</th><th>Items</th><th>Subtotal</th><th>Tax</th><th>Discount</th><th>Total</th><th>Date & Time</th></tr></thead>
                  <tbody>
                    {(data.recent_orders || []).map((o: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: 'var(--brown-600)' }}>{o.order_number}</td>
                        <td>{o.customer_name || 'Walk-in'}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{o.cashier_name || '—'}</td>
                        <td>{o.item_count}</td>
                        <td>₹{Number(o.subtotal || 0).toLocaleString()}</td>
                        <td>₹{Number(o.tax_total || 0).toLocaleString()}</td>
                        <td style={{ color: o.discount_total > 0 ? 'var(--success)' : undefined }}>₹{Number(o.discount_total || 0).toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(o.total || 0).toLocaleString()}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {!(data.recent_orders || []).length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No orders in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
