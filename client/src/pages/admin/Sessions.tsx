import { useEffect, useState } from 'react';
import { sessionsAPI, ordersAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionOrders, setSessionOrders] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try { const { data } = await sessionsAPI.getAll(); setSessions(data.data || []); }
    catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const viewSession = async (session: any) => {
    setSelectedSession(session);
    try {
      const { data } = await ordersAPI.getAll({ session_id: session.id, limit: 50 });
      setSessionOrders(data.data);
    } catch {
      // Preserve the previous behavior: keep the selected session visible if order lookup fails.
    }
  };

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString()}`;
  const fmtDate = (d: string) => d ? format(new Date(d), 'dd MMM yyyy, HH:mm') : '—';

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">POS Sessions</div><div className="topbar-subtitle">{sessions.length} sessions</div></div>
        <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={load}>↻ Refresh</button>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div>
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div> : (
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Date</th><th>Opened By</th><th>Orders</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id} style={{ background: selectedSession?.id === s.id ? 'var(--cream-100)' : undefined }}>
                          <td style={{ fontSize: 13 }}>{fmtDate(s.opened_at)}</td>
                          <td>{s.employee_name}</td>
                          <td style={{ fontWeight: 700 }}>{s.order_count || 0}</td>
                          <td style={{ fontWeight: 700, color: 'var(--brown-600)' }}>{fmt(s.total_revenue)}</td>
                          <td><span className={`badge ${s.status === 'open' ? 'badge-success' : 'badge-gray'}`}>{s.status}</span></td>
                          <td><button className="btn btn-outline btn-sm" onClick={() => viewSession(s)}>📋 View</button></td>
                        </tr>
                      ))}
                      {!sessions.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No sessions found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {selectedSession && (
            <div>
              <div className="card mb-4">
                <div className="card-header">
                  <div className="card-title">Session Summary</div>
                  <button className="modal-close" onClick={() => setSelectedSession(null)}>✕</button>
                </div>
                <div className="card-body">
                  <div className="grid-2" style={{ gap: 12 }}>
                    {[
                      { label: 'Opened', value: fmtDate(selectedSession.opened_at) },
                      { label: 'Closed', value: fmtDate(selectedSession.closed_at) },
                      { label: 'Total Orders', value: selectedSession.order_count || 0 },
                      { label: 'Revenue', value: fmt(selectedSession.total_revenue) },
                      { label: 'Opening Cash', value: fmt(selectedSession.opening_amount) },
                      { label: 'Closing Cash', value: fmt(selectedSession.closing_amount) },
                    ].map(row => (
                      <div key={row.label} style={{ background: 'var(--cream-100)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{row.label}</div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Orders in Session</div></div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Order #</th><th>Items</th><th>Total</th><th>Time</th></tr></thead>
                    <tbody>
                      {sessionOrders.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 700, color: 'var(--brown-600)' }}>{o.order_number}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{o.item_count} items</td>
                          <td style={{ fontWeight: 700 }}>₹{Number(o.total || 0).toLocaleString()}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(o.created_at), 'HH:mm')}</td>
                        </tr>
                      ))}
                      {!sessionOrders.length && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No orders</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
