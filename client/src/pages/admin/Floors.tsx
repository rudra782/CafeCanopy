import React, { useEffect, useState } from 'react';
import { floorsAPI, tablesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const TABLE_STATUS_COLORS: Record<string, string> = {
  available: '#3DAB6B', occupied: '#D94F4F', reserved: '#E09437', paid: '#4A90C4',
};

export default function FloorsPage() {
  const [floors, setFloors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState<string>('');
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [editFloor, setEditFloor] = useState<any>(null);
  const [editTable, setEditTable] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await floorsAPI.getAll();
      setFloors(data.data);
      if (!activeFloor && data.data[0]) setActiveFloor(data.data[0].id);
    } catch { toast.error('Failed to load floors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const currentFloor = floors.find(f => f.id === activeFloor);

  const saveFloor = async () => {
    if (!editFloor?.name) { toast.error('Floor name required'); return; }
    setSaving(true);
    try {
      if (editFloor.id) { await floorsAPI.update(editFloor.id, editFloor); toast.success('Floor updated'); }
      else { await floorsAPI.create(editFloor); toast.success('Floor created'); }
      setShowFloorModal(false); setEditFloor(null); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const deleteFloor = async (id: string) => {
    if (!confirm('Delete floor and all its tables?')) return;
    try { await floorsAPI.delete(id); toast.success('Floor deleted'); load(); if (activeFloor === id) setActiveFloor(''); }
    catch { toast.error('Delete failed'); }
  };

  const saveTable = async () => {
    if (!editTable?.table_number) { toast.error('Table number required'); return; }
    setSaving(true);
    try {
      if (editTable.id) { await tablesAPI.update(editTable.id, editTable); toast.success('Table updated'); }
      else { await tablesAPI.create({ ...editTable, floor_id: activeFloor }); toast.success('Table created'); }
      setShowTableModal(false); setEditTable(null); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    try { await tablesAPI.delete(id); toast.success('Table deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Floors & Tables</div><div className="topbar-subtitle">Visual layout management</div></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setEditFloor({}); setShowFloorModal(true); }}>＋ Add Floor</button>
          {activeFloor && <button className="btn btn-primary" onClick={() => { setEditTable({ seats: 4, shape: 'square', active: true }); setShowTableModal(true); }}>＋ Add Table</button>}
        </div>
      </div>
      <div className="page-content">
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div> :
          <>
            {/* Floor tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {floors.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <button
                    className={`btn ${activeFloor === f.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveFloor(f.id)}
                    style={{ borderRadius: '10px 0 0 10px' }}
                  >
                    🏢 {f.name}
                    <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '1px 8px', fontSize: 12, marginLeft: 6 }}>
                      {f.tables?.length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => { setEditFloor(f); setShowFloorModal(true); }}
                    style={{ padding: '9px 8px', background: activeFloor === f.id ? 'var(--brown-500)' : 'var(--cream-200)', border: '1.5px solid var(--border-dark)', borderLeft: 'none', cursor: 'pointer', color: activeFloor === f.id ? 'white' : 'var(--text-secondary)', fontSize: 13 }}
                  >✏️</button>
                  <button
                    onClick={() => deleteFloor(f.id)}
                    style={{ padding: '9px 8px', background: activeFloor === f.id ? 'var(--brown-500)' : 'var(--cream-200)', border: '1.5px solid var(--border-dark)', borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', color: 'var(--error)', fontSize: 13 }}
                  >🗑️</button>
                </div>
              ))}
              {floors.length === 0 && <div className="empty-state" style={{ width: '100%' }}><div className="empty-icon">🏢</div><h3>No floors yet</h3><button className="btn btn-primary" onClick={() => { setEditFloor({}); setShowFloorModal(true); }}>＋ Add First Floor</button></div>}
            </div>

            {/* Legend */}
            {currentFloor && (
              <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  {Object.entries(TABLE_STATUS_COLORS).map(([status, color]) => (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                      <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">🏢 {currentFloor.name}</div>
                    <span className="badge badge-brown">{currentFloor.tables?.length || 0} tables</span>
                  </div>
                  <div style={{ padding: 20, minHeight: 300 }}>
                    {!currentFloor.tables?.length ? (
                      <div className="empty-state"><div className="empty-icon">🪑</div><h3>No tables on this floor</h3><button className="btn btn-primary" onClick={() => { setEditTable({ seats: 4, shape: 'square', active: true }); setShowTableModal(true); }}>＋ Add Table</button></div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                        {currentFloor.tables.map((t: any) => (
                          <div
                            key={t.id}
                            className={`table-tile ${t.status}`}
                            onClick={() => { setEditTable(t); setShowTableModal(true); }}
                            title={`Table ${t.table_number} - ${t.seats} seats`}
                          >
                            <div className="table-status-dot" />
                            <div className="table-num">{t.table_number}</div>
                            <div className="table-seats">👥 {t.seats}</div>
                            {!t.active && <div style={{ fontSize: 10, opacity: 0.6 }}>Inactive</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        }
      </div>

      {/* Floor Modal */}
      {showFloorModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">{editFloor?.id ? 'Edit Floor' : 'New Floor'}</div><button className="modal-close" onClick={() => { setShowFloorModal(false); setEditFloor(null); }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label required">Floor Name</label><input className="form-control" value={editFloor?.name || ''} onChange={e => setEditFloor((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ground Floor" /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setShowFloorModal(false); setEditFloor(null); }}>Cancel</button><button className="btn btn-primary" onClick={saveFloor} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><div className="modal-title">{editTable?.id ? 'Edit Table' : 'New Table'}</div><button className="modal-close" onClick={() => { setShowTableModal(false); setEditTable(null); }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label required">Table Number</label><input className="form-control" value={editTable?.table_number || ''} onChange={e => setEditTable((t: any) => ({ ...t, table_number: e.target.value }))} placeholder="e.g. T1, A3" /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Seats</label><input className="form-control" type="number" min="1" max="20" value={editTable?.seats || 4} onChange={e => setEditTable((t: any) => ({ ...t, seats: parseInt(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Shape</label><select className="form-control form-select" value={editTable?.shape || 'square'} onChange={e => setEditTable((t: any) => ({ ...t, shape: e.target.value }))}><option value="square">Square</option><option value="round">Round</option><option value="rectangle">Rectangle</option></select></div>
              </div>
              {editTable?.id && (
                <div className="form-group"><label className="form-label">Status</label><select className="form-control form-select" value={editTable.status} onChange={e => setEditTable((t: any) => ({ ...t, status: e.target.value }))}>
                  <option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option><option value="paid">Paid</option>
                </select></div>
              )}
              <label className="form-check"><input type="checkbox" checked={editTable?.active ?? true} onChange={e => setEditTable((t: any) => ({ ...t, active: e.target.checked }))} /><span>Active</span></label>
            </div>
            <div className="modal-footer">
              {editTable?.id && <button className="btn btn-danger btn-sm" onClick={() => deleteTable(editTable.id)}>Delete</button>}
              <button className="btn btn-secondary" onClick={() => { setShowTableModal(false); setEditTable(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTable} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
