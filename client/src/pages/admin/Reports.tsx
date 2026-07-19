import { useEffect, useState } from 'react';
import { reportsAPI } from '../../lib/api';
import {
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  CreditCard,
  Award,
  Users,
  DollarSign,
  ShoppingBag,
  Receipt,
  Utensils,
  Clock,
  ClipboardList
} from 'lucide-react';

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
                { label: 'Total Revenue', value: fmt(data.kpis?.revenue), icon: DollarSign, color: 'green' },
                { label: 'Total Orders', value: data.kpis?.total_orders || 0, icon: ShoppingBag, color: 'blue' },
                { label: 'Avg Order Value', value: fmt(data.kpis?.avg_order_value), icon: Receipt, color: 'brown' },
                { label: 'Items Sold', value: data.kpis?.items_sold || 0, icon: Utensils, color: 'orange' },
              ].map(kpi => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="stat-card">
                    <div className={`stat-icon ${kpi.color}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">{kpi.label}</div>
                      <div className="stat-value">{kpi.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid-2 mb-6">
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} style={{ color: 'var(--brown-500)' }} />
                    <span>Revenue & Transaction Volume Trend</span>
                  </div>
                </div>
                <div className="card-body" style={{ padding: '16px' }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={data.sales_trend || []}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C8A97A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C8A97A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9B8878' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9B8878' }} tickFormatter={v => `₹${v}`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9B8878' }} />
                      <Tooltip formatter={(value: unknown, name?: unknown) => {
                        const metricKey = String(name ?? '');
                        const metricName = metricKey === 'revenue' ? 'Revenue' : 'Orders';
                        const metricValue = metricKey === 'revenue' ? `₹${Number(value ?? 0).toLocaleString()}` : String(value ?? '');
                        return [metricValue, metricName];
                      }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" name="revenue" stroke="#C8A97A" fill="url(#areaGrad)" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#A0784A" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={18} style={{ color: 'var(--brown-500)' }} />
                    <span>Payment Methods Distribution</span>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '16px' }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={data.payment_distribution || []} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="amount" paddingAngle={4}>
                        {(data.payment_distribution || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
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

            {/* Charts Row 2 */}
            <div className="grid-2 mb-6">
              {/* Top Products */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={18} style={{ color: 'var(--brown-500)' }} />
                    <span>Top Products by Revenue</span>
                  </div>
                </div>
                <div className="card-body" style={{ padding: '16px' }}>
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
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Utensils size={18} style={{ color: 'var(--brown-500)' }} />
                    <span>Revenue by Menu Category</span>
                  </div>
                </div>
                <div className="card-body" style={{ padding: '16px' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.top_categories || []}>
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

            {/* Charts Row 3 */}
            <div className="grid-2 mb-6">
              {/* Employee Sales Contribution */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={18} style={{ color: 'var(--brown-500)' }} />
                    <span>Employee Sales Performance</span>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '16px' }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={data.employee_performance || []} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="revenue" paddingAngle={4}>
                        {(data.employee_performance || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {(data.employee_performance || []).map((e: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[(i + 2) % COLORS.length] }} />
                        <span style={{ fontSize: 13, flex: 1 }}>{e.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-600)' }}>₹{Number(e.revenue || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {!data.employee_performance?.length && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No sales logged yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Shifts summary */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={18} style={{ color: 'var(--brown-500)' }} />
                    <span>Recent Cashier Shifts & Sessions</span>
                  </div>
                </div>
                <div className="table-wrapper" style={{ flex: 1, maxHeight: 220, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Opened By</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Orders</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.session_summary || []).map((s: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{s.opened_by}</td>
                          <td>
                            <span className={`badge ${s.status === 'open' ? 'badge-success' : 'badge-brown'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{s.orders || 0}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brown-600)' }}>₹{Number(s.revenue || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!(data.session_summary || []).length && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No session records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClipboardList size={18} style={{ color: 'var(--brown-500)' }} />
                  <span>Recent Orders Overview</span>
                </div>
                <span className="badge badge-brown">{(data.recent_orders || []).length} records</span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Date & Time</th></tr></thead>
                  <tbody>
                    {(data.recent_orders || []).map((o: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: 'var(--brown-600)' }}>{o.order_number}</td>
                        <td>{o.customer_name || 'Walk-in'}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(o.total || 0).toLocaleString()}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {!(data.recent_orders || []).length && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No orders in this period</td></tr>}
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
