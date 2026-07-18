import { useEffect, useState } from 'react';
import { reportsAPI } from '../../lib/api';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { ShoppingBag, DollarSign, Receipt, Percent, TrendingUp, CreditCard, Award, User, ClipboardList } from 'lucide-react';

const COLORS = ['#C8A97A', '#A0784A', '#8A6340', '#6B4C2F', '#4A3420', '#D4B896'];

const KPICard = ({ icon: Icon, label, value, color }: any) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={22} strokeWidth={2.5} />
    </div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today');

  const getDateRange = () => {
    const now = new Date();
    if (range === 'today') return { from_date: format(now, "yyyy-MM-dd'T'00:00:00"), to_date: format(now, "yyyy-MM-dd'T'23:59:59") };
    if (range === 'week') return { from_date: format(subDays(now, 7), "yyyy-MM-dd'T'00:00:00"), to_date: format(now, "yyyy-MM-dd'T'23:59:59") };
    return { from_date: format(subDays(now, 30), "yyyy-MM-dd'T'00:00:00"), to_date: format(now, "yyyy-MM-dd'T'23:59:59") };
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await reportsAPI.get(getDateRange());
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range]);

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div className="tabs">
            {(['today', 'week', 'month'] as const).map(r => (
              <button key={r} className={`tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      <div className="page-content">
        {/* KPIs */}
        <div className="grid-4 mb-6">
          <KPICard icon={ShoppingBag} label="Total Orders" value={data?.kpis?.total_orders || 0} color="brown" />
          <KPICard icon={DollarSign} label="Revenue" value={fmt(data?.kpis?.revenue)} color="green" />
          <KPICard icon={Receipt} label="Avg. Order Value" value={fmt(data?.kpis?.avg_order_value)} color="blue" />
          <KPICard icon={Percent} label="Total Discounts" value={fmt(data?.kpis?.total_discounts)} color="orange" />
        </div>

        <div className="grid-2 mb-6">
          {/* Sales Trend */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} style={{ color: 'var(--brown-500)' }} />
                <span>Sales Trend</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.sales_trend || []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8A97A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C8A97A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9B8878' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9B8878' }} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#C8A97A" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Distribution */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} style={{ color: 'var(--brown-500)' }} />
                <span>Payment Methods</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px', display: 'flex', gap: 24, alignItems: 'center' }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={data?.payment_distribution || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="amount" paddingAngle={3}>
                    {(data?.payment_distribution || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {(data?.payment_distribution || []).map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>₹{Number(p.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2 mb-6">
          {/* Top Products */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} style={{ color: 'var(--brown-500)' }} />
                <span>Top Products</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(data?.top_products || []).slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9B8878' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9B8878' }} width={100} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#C8A97A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employee Performance */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} style={{ color: 'var(--brown-500)' }} />
                <span>Employee Performance</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cream-100)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 16px', fontSize: 11, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Employee</th>
                    <th style={{ padding: '10px 16px', fontSize: 11, textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Orders</th>
                    <th style={{ padding: '10px 16px', fontSize: 11, textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.employee_performance || []).map((e: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--cream-200)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600 }}>{e.name}</td>
                      <td style={{ padding: '10px 16px', fontSize: 14, textAlign: 'right' }}>{e.orders}</td>
                      <td style={{ padding: '10px 16px', fontSize: 14, textAlign: 'right', color: 'var(--brown-600)', fontWeight: 700 }}>₹{Number(e.revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!data?.employee_performance?.length && (
                    <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No data for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={18} style={{ color: 'var(--brown-500)' }} />
              <span>Recent Orders</span>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_orders || []).map((o: any, i: number) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 700, color: 'var(--brown-600)' }}>{o.order_number}</span></td>
                    <td>{o.customer_name || 'Walk-in'}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(o.total || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(o.created_at).toLocaleTimeString('en-IN')}
                    </td>
                  </tr>
                ))}
                {!data?.recent_orders?.length && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No orders today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
