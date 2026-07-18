import { useEffect, useState } from 'react';
import { Trash2, Award, Trophy } from 'lucide-react';
import { employeesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'employee', 'kitchen'];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetId, setResetId] = useState('');
  const [historyEmployee, setHistoryEmployee] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await employeesAPI.getAll({ search });
      setEmployees(data.data); setTotal(data.pagination.total);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  const loadHistory = async (e: any) => {
    setHistoryEmployee(e);
    try {
      const { data } = await employeesAPI.getHistory(e.id);
      setHistory(data.data);
    } catch {
      toast.error('Failed to load employee order history');
    }
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (!edit.name || !edit.email || !edit.role) { toast.error('Name, email, role required'); return; }
    if (!edit.id && !edit.password) { toast.error('Password required'); return; }
    setSaving(true);
    try {
      if (edit.id) { await employeesAPI.update(edit.id, edit); toast.success('Employee updated'); }
      else { await employeesAPI.create(edit); toast.success('Employee created'); }
      setShowModal(false); setEdit(null); load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive (deactivate) this employee?')) return;
    try { await employeesAPI.delete(id, false); toast.success('Employee archived'); load(); }
    catch { toast.error('Failed to archive employee'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this employee account? This will permanently delete their sessions and history logs, and cannot be undone.')) return;
    try { await employeesAPI.delete(id, true); toast.success('Employee permanently deleted'); load(); }
    catch { toast.error('Failed to delete employee'); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await employeesAPI.resetPassword(resetId, newPassword);
      toast.success('Password reset successfully');
      setShowPasswordModal(false); setNewPassword(''); setResetId('');
    } catch { toast.error('Reset failed'); }
  };

  const ROLE_COLORS: Record<string, string> = { admin: 'badge-error', employee: 'badge-info', kitchen: 'badge-warning' };
  const LEVEL_COLORS: Record<string, string> = { Platinum: 'badge-error', Gold: 'badge-warning', Silver: 'badge-info', Bronze: 'badge-gray' };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Employees</div><div className="topbar-subtitle">{total} employees</div></div>
        <div className="search-bar" style={{ marginLeft: 'auto' }}><span className="search-icon">🔍</span><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={() => { setEdit({ role: 'employee', active: true }); setShowModal(true); }}>＋ Add Employee</button>
      </div>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Score</th><th>Level</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr> :
                employees.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brown-400), var(--brown-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {e.name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{e.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.email}</td>
                    <td><span className={`badge ${ROLE_COLORS[e.role] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{e.role}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--brown-600)' }}>
                      {e.role === 'employee' ? `₹${Number(e.score || 0).toLocaleString()}` : '—'}
                    </td>
                    <td>
                      {e.role === 'employee' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {e.performance_level === 'Platinum' && <Trophy size={14} style={{ color: '#E5E4E2' }} />}
                          {e.performance_level === 'Gold' && <Trophy size={14} style={{ color: '#FFD700' }} />}
                          {e.performance_level === 'Silver' && <Award size={14} style={{ color: '#C0C0C0' }} />}
                          {e.performance_level === 'Bronze' && <Award size={14} style={{ color: '#CD7F32' }} />}
                          <span className={`badge ${LEVEL_COLORS[e.performance_level] || 'badge-gray'}`}>
                            {e.performance_level || 'Bronze'}
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td><span className={`badge ${e.active ? 'badge-success' : 'badge-gray'}`}>{e.active ? 'Active' : 'Disabled'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{e.last_login ? new Date(e.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => { setEdit({ ...e }); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setResetId(e.id); setShowPasswordModal(true); }}>🔑 Reset</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => loadHistory(e)}>📋 History</button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleArchive(e.id)} style={{ color: 'var(--text-muted)' }} title="Archive (Deactivate)">Archive</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(e.id)} title="Delete Account Permanently">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && employees.length === 0 && <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">👤</div><h3>No employees found</h3></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {historyEmployee && (
          <div className="card" style={{ transition: 'all 0.3s ease' }}>
            <div style={{ padding: '24px 24px 12px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brown-400), var(--brown-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, boxShadow: 'var(--shadow-sm)' }}>
                    {historyEmployee.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{historyEmployee.name}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{historyEmployee.email}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }} onClick={() => { setHistoryEmployee(null); setHistory([]); }}>✕</button>
              </div>

              {/* Mini Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'var(--cream-50)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, textTransform: 'capitalize' }}>
                    <span className={`badge ${ROLE_COLORS[historyEmployee.role] || 'badge-gray'}`}>{historyEmployee.role}</span>
                  </div>
                </div>

                <div style={{ background: 'var(--cream-50)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Processed</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--brown-700)', marginTop: 4 }}>
                    ₹{Number(historyEmployee.score || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--cream-50)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Performance Level</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {historyEmployee.role === 'employee' ? (
                      <>
                        {historyEmployee.performance_level === 'Platinum' && <Trophy size={14} style={{ color: '#E5E4E2' }} />}
                        {historyEmployee.performance_level === 'Gold' && <Trophy size={14} style={{ color: '#FFD700' }} />}
                        {historyEmployee.performance_level === 'Silver' && <Award size={14} style={{ color: '#C0C0C0' }} />}
                        {historyEmployee.performance_level === 'Bronze' && <Award size={14} style={{ color: '#CD7F32' }} />}
                        <span className={`badge ${LEVEL_COLORS[historyEmployee.performance_level] || 'badge-gray'}`}>
                          {historyEmployee.performance_level || 'Bronze'}
                        </span>
                      </>
                    ) : '—'}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, paddingBottom: 12 }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📋 Orders Handled</span>
                  <span className="badge badge-brown" style={{ fontSize: 11, padding: '2px 6px' }}>{history.length}</span>
                </h4>

                <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                  {history.map(o => (
                    <div key={o.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, transition: 'all var(--transition-fast)' }} className="history-order-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--brown-700)', fontSize: 14 }}>{o.order_number}</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>₹{Number(o.total || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                        <span>Customer: <strong style={{ color: 'var(--text-secondary)' }}>{o.customer_name || 'Walk-in'}</strong></span>
                        <span>{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--cream-50)', padding: '6px 10px', borderRadius: 6, borderLeft: '3.5px solid var(--brown-300)' }}>
                        {o.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
                      </div>
                    </div>
                  ))}
                  {!history.length && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 12px', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                      No order history found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && edit && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">{edit.id ? 'Edit Employee' : 'New Employee'}</div><button className="modal-close" onClick={() => { setShowModal(false); setEdit(null); }}>✕</button></div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group"><label className="form-label required">Full Name</label><input className="form-control" value={edit.name || ''} onChange={e => setEdit((s: any) => ({ ...s, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label required">Email</label><input className="form-control" type="email" value={edit.email || ''} onChange={e => setEdit((s: any) => ({ ...s, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label required">Role</label><select className="form-control form-select" value={edit.role || 'employee'} onChange={e => setEdit((s: any) => ({ ...s, role: e.target.value }))}>{ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}</select></div>
                {!edit.id && <div className="form-group"><label className="form-label required">Password</label><input className="form-control" type="password" value={edit.password || ''} onChange={e => setEdit((s: any) => ({ ...s, password: e.target.value }))} placeholder="Min 6 chars" /></div>}
              </div>
              {edit.id && <label className="form-check"><input type="checkbox" checked={edit.active ?? true} onChange={e => setEdit((s: any) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setShowModal(false); setEdit(null); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">Reset Password</div><button className="modal-close" onClick={() => { setShowPasswordModal(false); setNewPassword(''); }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label required">New Password</label><input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setShowPasswordModal(false); setNewPassword(''); }}>Cancel</button><button className="btn btn-primary" onClick={handleResetPassword}>Reset Password</button></div>
          </div>
        </div>
      )}
    </>
  );
}
