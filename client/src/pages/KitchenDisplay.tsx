import React, { useEffect, useState, useCallback } from 'react';
import { kitchenAPI } from '../lib/api';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';
import { format, differenceInMinutes } from 'date-fns';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  Coffee,
  Search,
  Clock,
  FileText,
  CheckCircle,
  LogOut,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface KDSTicket {
  id: string;
  order_number: string;
  table_number: string;
  stage: 'to_cook' | 'preparing' | 'completed' | 'delivered';
  created_at: string;
  items: { id: string; name: string; quantity: number; notes: string; kitchen_status: string; category: string }[];
}

function getTimeMins(dateStr: string) {
  if (!dateStr) return 0;
  try {
    return differenceInMinutes(new Date(), new Date(dateStr));
  } catch (e) {
    return 0;
  }
}

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Search & Tab state
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'to_cook' | 'preparing' | 'completed'>('to_cook');

  const handleLogout = () => {
    clearAuth();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const load = useCallback(async () => {
    try {
      const { data } = await kitchenAPI.getTickets({ stage: 'to_cook,preparing,completed' });
      setTickets(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    const socket = getSocket();
    socket.on('kitchen:ticket_updated', () => load());
    socket.on('kitchen:new_ticket', () => {
      load();
      toast('New order received!', { icon: '🔔' });
    });

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      socket.off('kitchen:ticket_updated');
      socket.off('kitchen:new_ticket');
    };
  }, [load]);

  const advanceTicket = async (ticket: KDSTicket) => {
    if (updating || !ticket) return;
    let nextStage: string;
    if (ticket.stage === 'to_cook') {
      nextStage = 'preparing';
    } else if (ticket.stage === 'preparing') {
      nextStage = 'completed';
    } else if (ticket.stage === 'completed') {
      nextStage = 'delivered'; // served and removed
    } else {
      return;
    }

    setUpdating(ticket.id);
    try {
      await kitchenAPI.updateTicket(ticket.id, nextStage);
      toast.success(
        nextStage === 'completed' 
          ? 'Order marked ready to serve!' 
          : nextStage === 'preparing' 
            ? 'Cooking started!' 
            : 'Order served and cleared!'
      );
      load();
    } catch {
      toast.error('Failed to update stage');
    } finally {
      setUpdating(null);
    }
  };

  const toggleItem = async (e: React.MouseEvent, itemId: string, currentStatus: string) => {
    e.stopPropagation(); // Prevent card container click (advancing stage)
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await kitchenAPI.updateItemStatus(itemId, newStatus);
      load();
    } catch {
      toast.error('Failed to update item status');
    }
  };

  // Filter tickets dynamically
  const filteredTickets = (tickets || []).filter(ticket => {
    if (!ticket) return false;
    const orderNum = ticket.order_number || '';
    const orderNumStr = orderNum.replace('C-', '').replace('CC-', '');
    
    const matchesSearch = !search ||
      orderNum.toLowerCase().includes(search.toLowerCase()) ||
      orderNumStr.includes(search) ||
      (ticket.items && ticket.items.some(item => item && item.name && item.name.toLowerCase().includes(search.toLowerCase())));

    const matchesTab = activeTab === 'all' || ticket.stage === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background: #09090b !important;
          color: #fafafa;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .kds-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #09090b;
        }
        .kds-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .kds-topbar {
          background: #18181b;
          border-bottom: 1px solid #27272a;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .kds-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .kds-brand-logo {
          background: #8b5a2b;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .kds-brand-text {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .kds-brand-sub {
          font-size: 9px;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 1px;
          font-weight: 700;
        }
        .kds-center-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .kds-tabs {
          display: flex;
          background: #09090b;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #27272a;
        }
        .kds-tab {
          background: none;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          color: #a1a1aa;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .kds-tab:hover {
          color: #fff;
        }
        .kds-tab.active {
          background: #27272a;
          color: #fff;
        }
        .kds-tab-badge {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: #a1a1aa;
          padding: 2px 6px;
          border-radius: 12px;
        }
        .kds-tab.active .kds-tab-badge {
          background: #8b5a2b;
          color: #fff;
        }
        .kds-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .kds-search-input {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 8px 12px 8px 36px;
          color: #fff;
          font-size: 13px;
          width: 200px;
          transition: all 0.2s;
        }
        .kds-search-input:focus {
          border-color: #8b5a2b;
          outline: none;
          width: 240px;
        }
        .kds-search-icon {
          position: absolute;
          left: 12px;
          color: #71717a;
        }
        .kds-clock {
          font-family: monospace;
          font-size: 18px;
          font-weight: 700;
          color: #e4e4e7;
          letter-spacing: 1px;
          background: #09090b;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #27272a;
        }
        .kds-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        .kds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .kds-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 18px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: all 0.2s;
          position: relative;
        }
        .kds-card:hover {
          border-color: #8b5a2b;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        }
        .kds-card.to_cook {
          border-top: 4px solid #e09437;
        }
        .kds-card.preparing {
          border-top: 4px solid #4a90c4;
        }
        .kds-card.completed {
          border-top: 4px solid #3dab6b;
        }
        .kds-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #27272a;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .kds-order-number {
          font-size: 20px;
          font-weight: 900;
          color: #fff;
          letter-spacing: 0.5px;
        }
        .kds-time-elapsed {
          font-size: 11px;
          color: #a1a1aa;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kds-table-badge {
          background: rgba(255,255,255,0.05);
          border: 1px solid #27272a;
          color: #e4e4e7;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }
        .kds-card-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .kds-item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .kds-item-row:hover {
          background: rgba(255,255,255,0.03);
        }
        .kds-item-row.done {
          text-decoration: line-through;
          opacity: 0.35;
        }
        .kds-item-qty {
          font-weight: 800;
          color: #8b5a2b;
          font-size: 14px;
          margin-right: 10px;
        }
        .kds-item-details {
          flex: 1;
        }
        .kds-item-name {
          font-size: 14px;
          color: #fff;
          font-weight: 700;
        }
        .kds-item-notes {
          font-size: 11px;
          color: #ef4444;
          font-style: italic;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kds-card-footer {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid #27272a;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .kds-card.to_cook .kds-card-footer { color: #e09437; }
        .kds-card.preparing .kds-card-footer { color: #4a90c4; }
        .kds-card.completed .kds-card-footer { color: #3dab6b; }
      `}</style>

      <div className="kds-layout">
        {/* Main Content Area */}
        <div className="kds-main">
          {/* Top Navbar */}
          <header className="kds-topbar">
            <div className="kds-brand">
              <div className="kds-brand-logo">
                <Coffee size={20} />
              </div>
              <div>
                <span className="kds-brand-text">CafeCanopy</span>
                <div className="kds-brand-sub">KDS Console</div>
              </div>
            </div>

            <div className="kds-center-controls">
              {/* Stage Tabs */}
              <div className="kds-tabs">
                {[
                  { key: 'all', label: 'All', count: (tickets || []).length },
                  { key: 'to_cook', label: 'To Cook', count: (tickets || []).filter(t => t && t.stage === 'to_cook').length },
                  { key: 'preparing', label: 'Preparing', count: (tickets || []).filter(t => t && t.stage === 'preparing').length },
                  { key: 'completed', label: 'Completed', count: (tickets || []).filter(t => t && t.stage === 'completed').length }
                ].map(tab => (
                  <button
                     key={tab.key}
                     className={`kds-tab ${activeTab === tab.key ? 'active' : ''}`}
                     onClick={() => setActiveTab(tab.key as any)}
                  >
                    {tab.label}
                    <span className="kds-tab-badge">{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="kds-search-wrapper">
                <Search size={14} className="kds-search-icon" />
                <input
                  className="kds-search-input"
                  placeholder="Search order or item..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Clock */}
              <div className="kds-clock">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#27272a', color: '#a1a1aa' }}
                onClick={load}
                title="Refresh queue"
              >
                <RefreshCw size={14} />
              </button>
              <button
                className="btn btn-sm btn-danger"
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleLogout}
              >
                <LogOut size={14} /> Exit
              </button>
            </div>
          </header>

          {/* Tickets Area */}
          <div className="kds-content">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <div className="spinner spinner-lg" style={{ borderTopColor: '#8b5a2b' }} />
              </div>
            ) : (
              <div className="kds-grid">
                {filteredTickets.map(ticket => {
                  if (!ticket) return null;
                  const mins = getTimeMins(ticket.created_at);
                  const isLate = mins >= 10;
                  const orderNumDisplay = (ticket.order_number || '').replace('C-', '#').replace('CC-', '#');

                  return (
                    <div
                      key={ticket.id}
                      className={`kds-card ${ticket.stage}`}
                      onClick={() => advanceTicket(ticket)}
                    >
                      <div className="kds-card-header">
                        <div>
                          <div className="kds-order-number">{orderNumDisplay}</div>
                          <div className="kds-time-elapsed">
                            <Clock size={11} />
                            <span style={{ color: isLate ? '#ef4444' : '#a1a1aa', fontWeight: isLate ? 700 : 500 }}>
                              {mins}m ago
                            </span>
                          </div>
                        </div>
                        {ticket.table_number && (
                          <span className="kds-table-badge">
                            Table {String(ticket.table_number).replace('Table ', '')}
                          </span>
                        )}
                      </div>

                      <div className="kds-card-items">
                        {(ticket.items || []).map(item => {
                          if (!item) return null;
                          return (
                            <div
                              key={item.id}
                              className={`kds-item-row ${item.kitchen_status === 'completed' ? 'done' : ''}`}
                              onClick={(e) => toggleItem(e, item.id, item.kitchen_status)}
                            >
                              <div className="kds-item-details">
                                <div className="kds-item-name">
                                  <span className="kds-item-qty">{item.quantity} ×</span>
                                  {item.name}
                                </div>
                                {item.notes && (
                                  <div className="kds-item-notes">
                                    <FileText size={10} />
                                    <span>{item.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="kds-card-footer">
                        {ticket.stage === 'to_cook' && (
                          <>
                            <span>Start Cooking</span>
                            <ArrowRight size={12} />
                          </>
                        )}
                        {ticket.stage === 'preparing' && (
                          <>
                            <span>Mark Ready</span>
                            <ArrowRight size={12} />
                          </>
                        )}
                        {ticket.stage === 'completed' && (
                          <>
                            <span>Serve & Remove</span>
                            <ArrowRight size={12} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <div style={{
                    gridColumn: '1/-1',
                    textAlign: 'center',
                    padding: '80px 20px',
                    color: '#71717a'
                  }}>
                    <CheckCircle size={48} style={{ color: '#27272a', marginBottom: 16 }} />
                    <h3>No tickets found</h3>
                    <p style={{ fontSize: 13, color: '#52525b', marginTop: 4 }}>
                      All orders in this filter category have been served!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
