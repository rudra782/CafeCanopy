import React, { useEffect, useState, useCallback } from 'react';
import { kitchenAPI } from '../lib/api';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';
import { format, differenceInMinutes } from 'date-fns';

interface KDSTicket {
  id: string;
  order_number: string;
  table_number: string;
  stage: 'pending' | 'in_progress' | 'ready' | 'delivered';
  created_at: string;
  items: { id: string; name: string; quantity: number; notes: string; kitchen_status: string }[];
}

const STAGES: { key: KDSTicket['stage']; label: string; color: string; next?: string }[] = [
  { key: 'pending', label: 'New Orders', color: '#E09437', next: 'in_progress' },
  { key: 'in_progress', label: 'Cooking', color: '#4A90C4', next: 'ready' },
  { key: 'ready', label: 'Ready to Serve', color: '#3DAB6B' },
];

function getTimeMins(dateStr: string) {
  return differenceInMinutes(new Date(), new Date(dateStr));
}

export default function KitchenDisplay() {
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const { data } = await kitchenAPI.getTickets({ stage: 'pending,in_progress,ready' });
      setTickets(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    const socket = getSocket();
    socket.on('kitchen:order_updated', () => load());
    socket.on('kitchen:new_order', () => { load(); toast('🍳 New order received!', { icon: '🔔' }); });

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      socket.off('kitchen:order_updated');
      socket.off('kitchen:new_order');
    };
  }, [load]);

  const updateTicket = async (ticketId: string, nextStage: string) => {
    setUpdating(ticketId);
    try {
      await kitchenAPI.updateTicket(ticketId, nextStage);
      toast.success(nextStage === 'ready' ? '✅ Order marked ready!' : '👨‍🍳 Cooking started!');
      load();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const toggleItem = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'done' : 'pending';
    try {
      await kitchenAPI.updateItemStatus(itemId, newStatus);
      load();
    } catch {}
  };

  const getTicketsByStage = (stage: string) => tickets.filter(t => t.stage === stage);

  const getUrgencyClass = (mins: number) => {
    if (mins >= 20) return 'urgent';
    if (mins >= 10) return 'warning';
    return '';
  };

  return (
    <div className="kds-layout">
      {/* Header */}
      <div className="kds-header">
        <div>
          <div className="kds-title">☕ CafeCanopy Kitchen</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Kitchen Display System</div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', alignItems: 'center' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DAB6B' }} />OK</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E09437' }} />&gt;10 min</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D94F4F' }} />&gt;20 min</span>
          </div>
          {/* Clock */}
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream-100)', letterSpacing: 2 }}>
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} onClick={load}>↻</button>
        </div>
      </div>

      {/* Columns */}
      <div className="kds-columns">
        {STAGES.map(stage => {
          const stageTickets = getTicketsByStage(stage.key);
          return (
            <div key={stage.key} className="kds-column">
              <div className="kds-col-header" style={{ borderLeft: `4px solid ${stage.color}` }}>
                <div className="kds-col-title" style={{ color: stage.color }}>{stage.label}</div>
                <div className="kds-col-count" style={{ background: stage.color + '30', color: stage.color }}>{stageTickets.length}</div>
              </div>
              <div className="kds-tickets">
                {loading && <div style={{ textAlign: 'center', padding: 30 }}><div className="spinner" style={{ margin: 'auto', borderTopColor: stage.color }} /></div>}
                {!loading && stageTickets.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
                    {stage.key === 'pending' ? '✅ All caught up!' : '—'}
                  </div>
                )}
                {stageTickets.map(ticket => {
                  const mins = getTimeMins(ticket.created_at);
                  const urgency = getUrgencyClass(mins);
                  return (
                    <div key={ticket.id} className={`kds-ticket ${urgency}`}>
                      <div className="kds-ticket-header">
                        <div>
                          <div className="kds-order-num">#{ticket.order_number}</div>
                          {ticket.table_number && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Table {ticket.table_number}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {ticket.table_number && <span className="kds-table-tag">🪑 {ticket.table_number}</span>}
                          <div className="kds-time" style={{ color: mins >= 20 ? '#D94F4F' : mins >= 10 ? '#E09437' : 'var(--text-muted)' }}>
                            ⏱ {mins}m ago
                          </div>
                        </div>
                      </div>

                      <div className="kds-ticket-items">
                        {ticket.items.map(item => (
                          <div key={item.id} className={`kds-item ${item.kitchen_status === 'done' ? 'done' : ''}`}
                            onClick={() => toggleItem(item.id, item.kitchen_status)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div>
                              <div className="kds-item-name">{item.name}</div>
                              {item.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>📝 {item.notes}</div>}
                            </div>
                            <span className="kds-item-qty">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {stage.next && (
                        <div className="kds-ticket-footer">
                          <button
                            className="btn btn-sm"
                            style={{
                              flex: 1,
                              background: stage.key === 'pending' ? 'var(--info-bg)' : 'var(--success-bg)',
                              color: stage.key === 'pending' ? 'var(--info)' : 'var(--success)',
                              border: `1px solid ${stage.key === 'pending' ? 'rgba(74,144,196,0.3)' : 'rgba(61,171,107,0.3)'}`,
                              fontWeight: 700,
                            }}
                            onClick={() => updateTicket(ticket.id, stage.next!)}
                            disabled={updating === ticket.id}
                          >
                            {updating === ticket.id ? <span className="spinner spinner-sm" style={{ borderTopColor: 'currentColor' }} /> : null}
                            {stage.key === 'pending' ? '👨‍🍳 Start Cooking' : '✅ Mark Ready'}
                          </button>
                        </div>
                      )}
                      {stage.key === 'ready' && (
                        <div className="kds-ticket-footer">
                          <button
                            className="btn btn-sm btn-full"
                            style={{ background: 'rgba(61,171,107,0.15)', color: 'var(--success)', border: '1px solid rgba(61,171,107,0.3)', fontWeight: 700 }}
                            onClick={() => updateTicket(ticket.id, 'delivered')}
                          >
                            🍽️ Served - Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
