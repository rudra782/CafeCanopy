const metrics = [
  { label: 'Orders today', value: '184', micro: 'Live orders' },
  { label: 'Avg. prep time', value: '06:42', micro: 'Kitchen queue' },
  { label: 'Low stock alerts', value: '3', micro: 'Inventory pulse' },
  { label: 'Revenue', value: '₹42,860', micro: 'Revenue today' },
];

const orders = [
  { id: '#1842', table: 'Table 7', item: 'Cardamom latte · 2', time: '2m', status: 'Brewing' },
  { id: '#1841', table: 'Takeaway', item: 'Cold brew · Almond croissant', time: '4m', status: 'Packing' },
  { id: '#1840', table: 'Patio 3', item: 'Filter coffee · Banana bread', time: '6m', status: 'Ready' },
];

const kitchen = [
  { station: 'Espresso bar', value: '12 active', tone: 'warm' },
  { station: 'Pastry pass', value: '5 plating', tone: 'sage' },
  { station: 'Pickup shelf', value: '8 ready', tone: 'cream' },
];

export default function DashboardReveal() {
  return (
    <section className="dashboard-reveal" aria-label="CafeCanopy product dashboard preview">
      <div className="dashboard-reveal__chrome" aria-hidden="true"><span /><span /><span /></div>
      <div className="dashboard-reveal__header">
        <div>
          <p>Morning service</p>
          <h3>Flagship Café</h3>
        </div>
        <span className="dashboard-reveal__live">Live floor</span>
      </div>

      <div className="dashboard-reveal__metrics">
        {metrics.map((metric) => (
          <article className="dashboard-card" key={metric.label}>
            <span>{metric.micro}</span>
            <strong aria-label={`${metric.label}: ${metric.value}`}>{metric.value}</strong>
            <p>{metric.label}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-reveal__grid">
        <article className="dashboard-panel dashboard-panel--orders">
          <div className="dashboard-panel__title"><h4>Live orders</h4><span>Now</span></div>
          <ul>
            {orders.map((order) => (
              <li className="dashboard-row" key={order.id}>
                <span className="dashboard-row__id">{order.id}</span>
                <span><strong>{order.table}</strong>{order.item}</span>
                <em>{order.time}</em>
                <b>{order.status}</b>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard-panel dashboard-panel--kitchen">
          <div className="dashboard-panel__title"><h4>Kitchen queue</h4><span>Synced</span></div>
          {kitchen.map((item) => (
            <div className={`kitchen-status kitchen-status--${item.tone}`} key={item.station}>
              <span>{item.station}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
          <div className="inventory-alert"><span aria-hidden="true">●</span> Inventory pulse: 3 low-stock alerts need review.</div>
        </article>

        <article className="dashboard-panel dashboard-panel--revenue">
          <div className="dashboard-panel__title"><h4>Revenue today</h4><span>₹42,860</span></div>
          <svg className="revenue-chart" viewBox="0 0 220 90" role="img" aria-label="Revenue trend rising through the day">
            <defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#C9F27B" stopOpacity="0.28" /><stop offset="1" stopColor="#9A6035" stopOpacity="0" /></linearGradient></defs>
            <path d="M8 78 C42 66 48 54 76 58 C105 62 112 31 140 38 C164 44 177 22 212 16" fill="none" stroke="#C9F27B" strokeWidth="4" strokeLinecap="round" />
            <path d="M8 78 C42 66 48 54 76 58 C105 62 112 31 140 38 C164 44 177 22 212 16 L212 90 L8 90 Z" fill="url(#revenueFill)" />
          </svg>
        </article>
      </div>
    </section>
  );
}
