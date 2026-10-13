import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api";
const REFRESH_INTERVAL = 5000;

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const ticks = Number(value);

  if (!Number.isFinite(ticks)) {
    return "—";
  }

  const rupees = ticks / 100;

  return rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value) {
if (!Number.isFinite(Number(value))) return "₹0.00";

return Number(value).toLocaleString("en-IN", {
style: "currency",
currency: "INR",
minimumFractionDigits: 2,
maximumFractionDigits: 2,
});
}

function formatDate(value) {
if (!value) return "—";

const date = new Date(value);

if (Number.isNaN(date.getTime())) return String(value);

return date.toLocaleString("en-IN", {
day: "2-digit",
month: "short",
hour: "2-digit",
minute: "2-digit",
});
}

function normalizeSide(value) {
return String(value || "").toUpperCase();
}

function normalizeStatus(value) {
return String(value || "UNKNOWN").toUpperCase();
}

function getErrorMessage(error) {
return error instanceof Error ? error.message : "Unexpected error occurred.";
}

/*

* This chart groups actual recorded executions into illustrative candles.
* It is not historical exchange OHLC data.
  */
  function buildCandles(trades, symbol) {
  const matchingTrades = trades
  .filter(
  (trade) =>
  String(trade.symbol || "").toUpperCase() ===
  symbol.toUpperCase() &&
  Number.isFinite(Number(trade.priceTicks)) &&
  Number(trade.priceTicks) > 0,
  )
  .map((trade) => ({
  price: Number(trade.priceTicks) / 100,
  quantity: Number(trade.quantity) || 0,
  timestamp: trade.timestamp ? new Date(trade.timestamp).getTime() : 0,
  }))
  .filter((trade) => Number.isFinite(trade.price))
  .sort((a, b) => a.timestamp - b.timestamp);

if (matchingTrades.length === 0) return [];

const candles = [];
const bucketSize = 2;

for (let i = 0; i < matchingTrades.length; i += bucketSize) {
const group = matchingTrades.slice(i, i + bucketSize);
const prices = group.map((trade) => trade.price);

candles.push({
  open: prices[0],
  high: Math.max(...prices),
  low: Math.min(...prices),
  close: prices[prices.length - 1],
  volume: group.reduce((sum, trade) => sum + trade.quantity, 0),
  timestamp: group[group.length - 1].timestamp,
});



}

return candles;
}

function CandlestickChart({ candles }) {
const width = 1200;
const height = 440;
const padding = { top: 22, right: 62, bottom: 34, left: 18 };
const plotWidth = width - padding.left - padding.right;
const plotHeight = height - padding.top - padding.bottom;

const minimum = candles.length
? Math.min(...candles.map((candle) => candle.low))
: 0;

const maximum = candles.length
? Math.max(...candles.map((candle) => candle.high))
: 1;

const range = maximum - minimum || Math.max(maximum * 0.02, 1);

const y = (price) =>
padding.top + ((maximum - price) / range) * plotHeight;

const slotWidth = plotWidth / Math.max(candles.length, 1);
const bodyWidth = Math.max(4, Math.min(18, slotWidth * 0.55));

const gridValues = Array.from({ length: 5 }, (_, index) => {
return maximum - (range * index) / 4;
});

if (candles.length === 0) {
return ( <div className="chart-empty"> <div className="chart-empty-icon">⌁</div> <strong>No execution history available</strong> <p>
Submit matching orders for this symbol to create recorded trades.
Candles will appear when executions are available. </p> </div>
);
}

return ( <div className="chart-canvas">
<svg
viewBox={`0 0 ${width} ${height}`}
role="img"
aria-label="Illustrative candlestick chart based on recorded executions"
preserveAspectRatio="xMidYMid meet"
>
{gridValues.map((price, index) => {
const gridY = y(price);


      return (
        <g key={`grid-${index}`}>
          <line
            x1={padding.left}
            y1={gridY}
            x2={width - padding.right}
            y2={gridY}
            stroke="#292e40"
            strokeDasharray="4 5"
          />
          <text
            x={width - padding.right + 8}
            y={gridY + 4}
            fill="#9097ad"
            fontSize="10"
          >
            {formatPrice(price)}
          </text>
        </g>
      );
    })}

    {candles.map((candle, index) => {
      const centerX = padding.left + slotWidth * (index + 0.5);
      const bullish = candle.close >= candle.open;
      const candleColor = bullish ? "#39c99b" : "#f06b7b";

      const bodyTop = y(Math.max(candle.open, candle.close));
      const bodyBottom = y(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(bodyBottom - bodyTop, 2);

      return (
        <g key={`candle-${index}`}>
          <line
            x1={centerX}
            y1={y(candle.high)}
            x2={centerX}
            y2={y(candle.low)}
            stroke={candleColor}
            strokeWidth="1.5"
          />

          <rect
            x={centerX - bodyWidth / 2}
            y={bodyTop}
            width={bodyWidth}
            height={bodyHeight}
            rx="1"
            fill={candleColor}
          />

          <text
            x={centerX}
            y={height - 12}
            fill="#858da5"
            fontSize="9"
            textAnchor="middle"
          >
            {index + 1}
          </text>
        </g>
      );
    })}
  </svg>
</div>



);
}

function PriceLineChart({ trades }) {
  const width = 1400;
  const height = 560;
  const padding = { top: 34, right: 96, bottom: 58, left: 28 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const points = [...trades]
    .filter((trade) => Number(trade.priceTicks) > 0)
    .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
    .map((trade) => ({
      price: Number(trade.priceTicks) / 100,
      quantity: Number(trade.quantity) || 0,
      timestamp: trade.timestamp ? new Date(trade.timestamp) : null,
      id: trade.tradeID || `${trade.timestamp}-${trade.priceTicks}`,
    }));

  if (points.length === 0) {
    return <div className="chart-empty"><div className="chart-empty-icon">⌁</div><strong>No execution history available</strong><p>Submit matching orders for this symbol to plot actual recorded execution prices.</p></div>;
  }

  const prices = points.map((point) => point.price);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const spread = rawMax - rawMin;
  const pad = spread === 0 ? Math.max(rawMax * 0.02, 1) : spread * 0.12;
  const minimum = Math.max(0, rawMin - pad);
  const maximum = rawMax + pad;
  const range = maximum - minimum || 1;
  const x = (index) => padding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (price) => padding.top + ((maximum - price) / range) * plotHeight;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.price)}`).join(" ");
  const areaPath = `${path} L ${x(points.length - 1)} ${padding.top + plotHeight} L ${x(0)} ${padding.top + plotHeight} Z`;
  const gridValues = Array.from({ length: 5 }, (_, index) => maximum - (range * index) / 4);
  const firstTimestamp = points[0].timestamp;
  const lastTimestamp = points[points.length - 1].timestamp;
  const timeLabel = (date) => date && !Number.isNaN(date.getTime()) ? date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Execution";

  return <div className="chart-canvas large-line-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Line chart of ${points.length} recorded ${"execution prices"}`} preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="price-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#63a8ff" stopOpacity="0.25"/><stop offset="100%" stopColor="#63a8ff" stopOpacity="0.01"/></linearGradient></defs>
    {gridValues.map((price, index) => { const gridY = y(price); return <g key={`line-grid-${index}`}><line x1={padding.left} y1={gridY} x2={width - padding.right} y2={gridY} stroke="#292e40" strokeDasharray="5 7"/><text x={width - padding.right + 12} y={gridY + 5} fill="#9aa6c0" fontSize="13">₹{formatPrice(price * 100)}</text></g>; })}
    <path d={areaPath} fill="url(#price-area-gradient)"/>
    <path d={path} fill="none" stroke="#70b2ff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    {points.map((point, index) => <circle key={point.id} cx={x(index)} cy={y(point.price)} r={points.length > 70 ? 2.6 : 4.2} fill="#a8d4ff" stroke="#101827" strokeWidth="1.5"><title>{`Price: ₹${formatPrice(point.price * 100)}\nQuantity: ${point.quantity}\nTime: ${timeLabel(point.timestamp)}\nTrade: ${point.id}`}</title></circle>)}
    <text x={padding.left} y={height - 20} fill="#909ab2" fontSize="12">{timeLabel(firstTimestamp)}</text>
    <text x={width - padding.right} y={height - 20} fill="#909ab2" fontSize="12" textAnchor="end">{timeLabel(lastTimestamp)}</text>
  </svg></div>;
}

function VolumeChart({ candles }) {
const width = 1200;
const height = 150;
const padding = { top: 8, right: 62, bottom: 12, left: 18 };
const plotWidth = width - padding.left - padding.right;
const plotHeight = height - padding.top - padding.bottom;

const maxVolume = Math.max(
...candles.map((candle) => candle.volume),
1,
);

const slotWidth = plotWidth / Math.max(candles.length, 1);
const barWidth = Math.max(4, Math.min(18, slotWidth * 0.55));

if (candles.length === 0) {
return <div className="volume-empty">Volume appears after executions.</div>;
}

return ( <div className="chart-canvas volume-canvas">
<svg
viewBox={`0 0 ${width} ${height}`}
role="img"
aria-label="Trade quantity by illustrative candle group"
preserveAspectRatio="xMidYMid meet"
>
{candles.map((candle, index) => {
const centerX = padding.left + slotWidth * (index + 0.5);
const barHeight = (candle.volume / maxVolume) * plotHeight;


      return (
        <rect
          key={`volume-${index}`}
          x={centerX - barWidth / 2}
          y={height - padding.bottom - barHeight}
          width={barWidth}
          height={Math.max(barHeight, 1)}
          rx="1"
          fill={
            candle.close >= candle.open ? "#39c99b" : "#f06b7b"
          }
          opacity="0.8"
        />
      );
    })}
  </svg>
</div>



);
}

function App() {
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [notice, setNotice] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState("TEST1");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [chartType, setChartType] = useState("LINE");
  const [chartRange, setChartRange] = useState("ALL");
  const [form, setForm] = useState({ symbol: "TEST1", side: "BUY", quantity: "5", price: "100.00" });

  const refreshDashboard = useCallback(async () => {
    try {
      const [ordersResponse, tradesResponse] = await Promise.all([
        fetch(`${API_URL}/orders`),
        fetch(`${API_URL}/trades`),
      ]);
      if (!ordersResponse.ok) throw new Error(`Orders API returned HTTP ${ordersResponse.status}.`);
      if (!tradesResponse.ok) throw new Error(`Trades API returned HTTP ${tradesResponse.status}.`);
      const [ordersData, tradesData] = await Promise.all([ordersResponse.json(), tradesResponse.json()]);
      if (!Array.isArray(ordersData) || !Array.isArray(tradesData)) throw new Error("The backend returned an unexpected data format.");
      setOrders(ordersData);
      setTrades(tradesData);
      setBackendOnline(true);
      setLastUpdated(new Date());
    } catch (error) {
      setBackendOnline(false);
      console.error("Dashboard refresh failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
    const timer = window.setInterval(refreshDashboard, REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [refreshDashboard]);

  const symbols = useMemo(() => {
    const available = new Set([...orders, ...trades].map((item) => String(item.symbol || "").toUpperCase()).filter(Boolean));
    ["TEST1", "TEST2", "TEST3", "DEMO1", "DEMO2"].forEach((symbol) => available.add(symbol));
    return [...available].sort();
  }, [orders, trades]);

  const filteredOrders = useMemo(() => orders.filter((order) => String(order.symbol || "").toUpperCase() === selectedSymbol.toUpperCase()), [orders, selectedSymbol]);
  const activeOrders = orders.filter((order) => ["OPEN", "PARTIALLY_FILLED"].includes(normalizeStatus(order.status)));
  const filledOrders = orders.filter((order) => normalizeStatus(order.status) === "FILLED");
  const filteredTrades = useMemo(() => trades.filter((trade) => String(trade.symbol || "").toUpperCase() === selectedSymbol.toUpperCase()).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()), [trades, selectedSymbol]);
  const chartTrades = useMemo(() => {
    const now = Date.now();
    const windows = { "1H": 60 * 60 * 1000, "6H": 6 * 60 * 60 * 1000, "1D": 24 * 60 * 60 * 1000, "1W": 7 * 24 * 60 * 60 * 1000 };
    const cutoff = windows[chartRange] ? now - windows[chartRange] : null;
    return filteredTrades.filter((trade) => {
      const timestamp = new Date(trade.timestamp || 0).getTime();
      return Number.isFinite(timestamp) && timestamp > 0 && (cutoff === null || timestamp >= cutoff);
    }).sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  }, [filteredTrades, chartRange]);
  const candles = useMemo(() => buildCandles(chartTrades, selectedSymbol), [chartTrades, selectedSymbol]);
  const latestPrice = filteredTrades.length ? Number(filteredTrades[0].priceTicks) / 100 : null;
  const totalTradedQuantity = filteredTrades.reduce((sum, trade) => sum + (Number(trade.quantity) || 0), 0);
  const openBuys = filteredOrders.filter((order) => normalizeSide(order.side) === "BUY" && ["OPEN", "PARTIALLY_FILLED"].includes(normalizeStatus(order.status))).sort((a, b) => Number(b.priceTicks) - Number(a.priceTicks));
  const openSells = filteredOrders.filter((order) => normalizeSide(order.side) === "SELL" && ["OPEN", "PARTIALLY_FILLED"].includes(normalizeStatus(order.status))).sort((a, b) => Number(a.priceTicks) - Number(b.priceTicks));

  const pages = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "market", label: "Market chart", icon: "⌁" },
    { id: "place-order", label: "Place an order", icon: "↗" },
    { id: "order-book", label: "Order book", icon: "☷" },
    { id: "order-management", label: "Order management", icon: "≡" },
    { id: "trade-history", label: "Trade history", icon: "↔" },
  ];
  const pageTitle = pages.find((page) => page.id === activePage)?.label || "Dashboard";

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    if (name === "symbol") setSelectedSymbol(value.trim().toUpperCase());
  }

  async function submitOrder(event) {
    event.preventDefault();
    setNotice(null);
    const symbol = form.symbol.trim().toUpperCase();
    const quantity = Number(form.quantity);
    const price = Number(form.price);
    if (!symbol) return setNotice({ type: "error", text: "Please enter a stock symbol." });
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return setNotice({ type: "error", text: "Quantity must be a positive whole number." });
    if (!Number.isFinite(price) || price <= 0) return setNotice({ type: "error", text: "Limit price must be greater than zero." });
    if (!backendOnline) return setNotice({ type: "error", text: "Backend is offline. Start PostgreSQL and Spring Boot first." });
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: Math.floor(100000 + Math.random() * 900000), symbol, side: form.side, quantity, price }),
      });
      const responseText = await response.text();
      let result = {};
      try { result = responseText ? JSON.parse(responseText) : {}; } catch { result = { rawResponse: responseText }; }
      if (!response.ok) {
        const validationDetails = Array.isArray(result.errors) ? result.errors.map((item) => item.defaultMessage || item.message).filter(Boolean).join(" ") : "";
        throw new Error(result.message || result.detail || validationDetails || result.rawResponse || `The server rejected the order (HTTP ${response.status}).`);
      }
      setSelectedSymbol(symbol);
      setNotice({ type: "success", text: result.message || `${form.side} order for ${symbol} accepted by the matching engine.` });
      await refreshDashboard();
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally { setSubmitting(false); }
  }

  async function generateDemoData() {
    const symbol = selectedSymbol.trim().toUpperCase();
    if (!backendOnline) {
      setNotice({ type: "error", text: "Connect the backend before generating demo data." });
      return;
    }
    const confirmed = window.confirm(
      `Add 56 DEMO orders for ${symbol} to PostgreSQL? This will create 20 matched trades plus 16 resting orders. These records will remain in your database.`
    );
    if (!confirmed) return;

    setSeedingDemo(true);
    setNotice(null);
    const usedIds = new Set(orders.map((order) => String(order.orderID)));
    function nextOrderId() {
      let id;
      do {
        id = Math.floor(100000 + Math.random() * 900000);
      } while (usedIds.has(String(id)));
      usedIds.add(String(id));
      return id;
    }

    const demoOrders = [];
    // Each BUY is followed by a matching SELL at the same limit price.
    for (let i = 0; i < 20; i += 1) {
      const price = Number((100 + i * 0.25).toFixed(2));
      const quantity = 2 + (i % 7);
      demoOrders.push({ orderID: nextOrderId(), symbol, side: "BUY", quantity, price });
      demoOrders.push({ orderID: nextOrderId(), symbol, side: "SELL", quantity, price });
    }
    // These bids and asks stay away from the execution range to create market depth.
    for (let i = 0; i < 8; i += 1) {
      demoOrders.push({ orderID: nextOrderId(), symbol, side: "BUY", quantity: 5 + i, price: Number((92 + i * 0.25).toFixed(2)) });
    }
    for (let i = 0; i < 8; i += 1) {
      demoOrders.push({ orderID: nextOrderId(), symbol, side: "SELL", quantity: 4 + i, price: Number((108 + i * 0.25).toFixed(2)) });
    }

    let created = 0;
    try {
      for (const order of demoOrders) {
        const response = await fetch(`${API_URL}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });
        if (!response.ok) {
          const details = await response.text();
          throw new Error(`Order ${created + 1} failed (HTTP ${response.status}). ${details}`);
        }
        created += 1;
      }
      await refreshDashboard();
      setNotice({ type: "success", text: `Added ${created} demo orders to ${symbol}; matched trades and order-book depth should now be visible.` });
    } catch (error) {
      await refreshDashboard();
      setNotice({ type: "error", text: `Created ${created} of ${demoOrders.length} demo orders. ${getErrorMessage(error)}` });
    } finally {
      setSeedingDemo(false);
    }
  }

  function PriceCell({ value }) { return <span className="mono">₹{formatPrice(value)}</span>; }
  function StatusBadge({ status }) {
    const normalized = normalizeStatus(status);
    return <span className={`status-tag ${normalized.toLowerCase()}`}>{normalized.replaceAll("_", " ")}</span>;
  }
  function OrderTable({ rows, management = false }) {
    return <div className="table-scroll"><table><thead><tr><th>Order ID</th><th>Symbol</th><th>Side</th><th>Limit price</th><th>Quantity</th><th>Remaining</th><th>Status</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="7" className="empty-state">Loading orders…</td></tr> : rows.length === 0 ? <tr><td colSpan="7" className="empty-state">No orders match this view.</td></tr> : rows.map((order, index) => <tr key={`${order.orderID}-${index}`}><td className="mono">#{order.orderID}</td><td>{order.symbol}</td><td><span className={`side-tag ${normalizeSide(order.side).toLowerCase()}`}>{normalizeSide(order.side)}</span></td><td><PriceCell value={order.priceTicks} /></td><td>{order.quantity ?? "—"}</td><td>{order.remainingQuantity ?? "—"}</td><td><StatusBadge status={order.status} /></td></tr>)}
    </tbody></table></div>;
  }
  function TradeTable({ rows, limit }) {
    const visible = limit ? rows.slice(0, limit) : rows;
    return <div className="table-scroll"><table><thead><tr><th>Trade ID</th><th>Buy order</th><th>Sell order</th><th>Execution price</th><th>Quantity</th><th>Executed at</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="6" className="empty-state">Loading trades…</td></tr> : visible.length === 0 ? <tr><td colSpan="6" className="empty-state">No recorded executions for {selectedSymbol}.</td></tr> : visible.map((trade, index) => <tr key={`${trade.tradeID}-${index}`}><td className="mono trade-id">{trade.tradeID}</td><td className="mono">#{trade.buyOrderID}</td><td className="mono">#{trade.sellOrderID}</td><td className="price-cell">₹{formatPrice(trade.priceTicks)}</td><td>{trade.quantity}</td><td className="date-cell">{formatDate(trade.timestamp)}</td></tr>)}
    </tbody></table></div>;
  }
  function renderOrderForm() {
    return <form onSubmit={submitOrder} className="terminal-order-form">
      <div className="form-two-columns"><div><label htmlFor="symbol">Symbol</label><input id="symbol" name="symbol" value={form.symbol} onChange={updateForm} maxLength={20} placeholder="e.g. TEST1" required /></div><div><label htmlFor="order-side">Side</label><select id="order-side" value={form.side} onChange={(event) => setForm((previous) => ({ ...previous, side: event.target.value }))}><option value="BUY">BUY</option><option value="SELL">SELL</option></select></div></div>
      <div className="form-two-columns"><div><label htmlFor="quantity">Quantity</label><input id="quantity" name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={updateForm} required /></div><div><label htmlFor="price">Limit price (₹)</label><input id="price" name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={updateForm} required /></div></div>
      <div className="order-estimate"><span>Estimated order value</span><strong>{formatCurrency(Math.max(0, Number(form.quantity) || 0) * Math.max(0, Number(form.price) || 0))}</strong></div>
      <button type="submit" className={`submit-button ${form.side === "SELL" ? "sell-submit" : ""}`} disabled={submitting || !backendOnline}>{submitting ? "Submitting…" : `Submit ${form.side} order →`}</button>
      {notice && <div className={`notice ${notice.type}`} role="status" aria-live="polite">{notice.text}</div>}
    </form>;
  }

  return <div className="app-shell terminal-app">
    <aside className="sidebar">
      <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); setActivePage("dashboard"); }}><div className="brand-mark">S</div><div><h1>StockFlow</h1><span>EXCHANGE TERMINAL</span></div></a>
      <div className="sidebar-label">TRADING WORKSPACE</div>
      {pages.map((page) => <button key={page.id} type="button" className={`nav-item ${activePage === page.id ? "active" : ""}`} onClick={() => setActivePage(page.id)}><span className="nav-icon">{page.icon}</span>{page.label}</button>)}
      <div className="sidebar-bottom"><div className="engine-card"><span className={`status-dot ${backendOnline ? "online" : ""}`} /><div><strong>Matching engine</strong><p>{backendOnline ? "Connected · API polling" : "Disconnected"}</p></div></div><p className="sidebar-footer">Java · React · PostgreSQL</p></div>
    </aside>

    <main className="main-content terminal-main">
      <header className="topbar"><div><p className="eyebrow">STOCKFLOW / EXCHANGE</p><h2>{pageTitle}</h2></div><div className="topbar-right"><span className={`connection-pill ${backendOnline ? "connected" : ""}`}><span className="status-dot" />{backendOnline ? "Engine connected" : "Backend offline"}</span><button className="refresh-button" onClick={refreshDashboard} type="button">↻ Refresh</button></div></header>
      {!backendOnline && <div className="offline-banner"><strong>Backend unavailable.</strong> Start PostgreSQL and Spring Boot to load orders and trades.</div>}

      <div className="terminal-toolbar"><div className="market-symbol"><span className="symbol-mark">{selectedSymbol.slice(0, 1)}</span><div><strong>{selectedSymbol}</strong><span>DEMO MARKET · LIMIT ORDER BOOK</span></div></div><div className="symbol-picker"><label htmlFor="terminal-symbol">Market</label><select id="terminal-symbol" value={selectedSymbol} onChange={(event) => { setSelectedSymbol(event.target.value); setForm((previous) => ({ ...previous, symbol: event.target.value })); }}>{symbols.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}</select></div><span className="updated-at">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for API…"}</span></div>

      {activePage === "dashboard" && <>
        <section className="stats-grid terminal-stats"><article className="stat-card"><div className="stat-heading"><span>Active orders</span><span className="stat-icon purple">◷</span></div><strong className="stat-value">{activeOrders.length}</strong><span className="stat-caption">Open or partially filled</span></article><article className="stat-card"><div className="stat-heading"><span>Recorded trades</span><span className="stat-icon green">↔</span></div><strong className="stat-value">{trades.length}</strong><span className="stat-caption">Persisted executions</span></article><article className="stat-card"><div className="stat-heading"><span>Filled orders</span><span className="stat-icon blue">✓</span></div><strong className="stat-value">{filledOrders.length}</strong><span className="stat-caption">Fully executed orders</span></article><article className="stat-card"><div className="stat-heading"><span>Last execution</span><span className="stat-icon orange">₹</span></div><strong className="stat-value stat-price">{latestPrice === null ? "—" : formatCurrency(latestPrice)}</strong><span className="stat-caption">{totalTradedQuantity} units traded in {selectedSymbol}</span></article></section>
        <section className="terminal-grid dashboard-terminal-grid"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">MARKET ACTIVITY</p><h3>{selectedSymbol} price chart</h3><p className="panel-subtitle">Execution chart preview from recorded trades</p></div><div className="chart-actions"><button className="text-action" onClick={() => setActivePage("market")} type="button">Open full chart ↗</button><button className="text-action demo-data-button" onClick={generateDemoData} type="button" disabled={seedingDemo || !backendOnline}>{seedingDemo ? "Generating demo data…" : "＋ Generate demo data"}</button></div></div><CandlestickChart candles={candles} /><div className="chart-disclaimer">Chart is built from recorded executions. Generate demo data to populate it; this does not represent live market prices.</div>{notice && <div className={`notice ${notice.type}`} role="status" aria-live="polite">{notice.text}</div>}</article><article className="panel dashboard-book"><div className="panel-heading"><div><p className="eyebrow">LIVE BOOK</p><h3>Top of book</h3></div><button className="text-action" onClick={() => setActivePage("order-book")} type="button">Full order book ↗</button></div><div className="mini-book-heading"><span>BUY / BID</span><span>SELL / ASK</span></div><div className="mini-book-columns"><div>{openBuys.slice(0, 5).length ? openBuys.slice(0, 5).map((order) => <div className="mini-book-row bid-row" key={order.orderID}><span>₹{formatPrice(order.priceTicks)}</span><strong>{order.remainingQuantity}</strong></div>) : <p className="mini-empty">No open bids</p>}</div><div>{openSells.slice(0, 5).length ? openSells.slice(0, 5).map((order) => <div className="mini-book-row ask-row" key={order.orderID}><span>₹{formatPrice(order.priceTicks)}</span><strong>{order.remainingQuantity}</strong></div>) : <p className="mini-empty">No open asks</p>}</div></div><div className="book-footnote">Order data from your matching-engine API</div></article></section>
        <section className="panel"><div className="panel-heading"><div><p className="eyebrow">RECENT EXECUTIONS</p><h3>Latest trades</h3></div><button className="text-action" onClick={() => setActivePage("trade-history")} type="button">All trades ↗</button></div><TradeTable rows={filteredTrades} limit={5} /></section>
      </>}

      {activePage === "market" && <section className="panel market-panel market-page-panel">
        <div className="market-chart-header">
          <div><p className="eyebrow">MARKET ANALYTICS</p><h3>{selectedSymbol} · Execution price</h3><p className="panel-subtitle">Interactive view of recorded trades for the selected symbol.</p></div>
          <button className="text-action demo-data-button" onClick={generateDemoData} type="button" disabled={seedingDemo || !backendOnline}>{seedingDemo ? "Generating demo data…" : "＋ Generate demo data"}</button>
        </div>
        {notice && <div className={`notice ${notice.type}`} role="status" aria-live="polite">{notice.text}</div>}
        <div className="market-metrics-row">
          <div className="market-metric"><span>LAST EXECUTION</span><strong>{chartTrades.length ? formatCurrency(Number(chartTrades[chartTrades.length - 1].priceTicks) / 100) : "—"}</strong></div>
          <div className="market-metric"><span>HIGH IN RANGE</span><strong>{chartTrades.length ? formatCurrency(Math.max(...chartTrades.map((trade) => Number(trade.priceTicks) / 100))) : "—"}</strong></div>
          <div className="market-metric"><span>LOW IN RANGE</span><strong>{chartTrades.length ? formatCurrency(Math.min(...chartTrades.map((trade) => Number(trade.priceTicks) / 100))) : "—"}</strong></div>
          <div className="market-metric"><span>EXECUTIONS</span><strong>{chartTrades.length}</strong></div>
          <div className="market-metric"><span>TRADED QUANTITY</span><strong>{chartTrades.reduce((sum, trade) => sum + (Number(trade.quantity) || 0), 0)}</strong></div>
        </div>
        <div className="chart-control-row">
          <div className="chart-type-toggle" role="group" aria-label="Chart type"><button type="button" className={chartType === "LINE" ? "selected" : ""} onClick={() => setChartType("LINE")}>⌁ Line</button><button type="button" className={chartType === "CANDLE" ? "selected" : ""} onClick={() => setChartType("CANDLE")}>▥ Candlestick</button></div>
          <div className="chart-range-toggle" role="group" aria-label="Chart time range">{["1H", "6H", "1D", "1W", "ALL"].map((range) => <button type="button" key={range} className={chartRange === range ? "selected" : ""} onClick={() => setChartRange(range)}>{range}</button>)}</div>
        </div>
        <div className="chart-legend"><span><i className={chartType === "LINE" ? "legend-blue" : "legend-green"} /> {chartType === "LINE" ? "Recorded execution price" : "Price closed higher"}</span>{chartType === "CANDLE" && <span><i className="legend-red" /> Price closed lower</span>}<span className="chart-unit">Price in ₹ · {chartTrades.length} executions</span></div>
        {chartType === "LINE" ? <PriceLineChart trades={chartTrades} /> : <CandlestickChart candles={candles} />}
        <div className="volume-heading"><span>TRADED QUANTITY</span><span>Grouped recorded executions</span></div>
        <VolumeChart candles={candles} />
        <p className="chart-disclaimer">Charts use persisted execution data from your local matching engine. Time filters use the stored execution timestamps. Hover over a point on the line chart to inspect its execution details. This is simulated exchange data, not a live market feed.</p>
      </section>}

      {activePage === "place-order" && <section className="panel order-entry-panel"><div className="panel-heading"><div><p className="eyebrow">ORDER TICKET</p><h3>Place a limit order</h3><p className="panel-subtitle">Submit a BUY or SELL request to the Java matching engine.</p></div><span className="heading-icon">↗</span></div>{renderOrderForm()}</section>}

      {activePage === "order-book" && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">MARKET DEPTH</p><h3>{selectedSymbol} order book</h3><p className="panel-subtitle">Open orders ranked by price; BUY bids highest-first and SELL asks lowest-first.</p></div><span className="live-label"><span className={`status-dot ${backendOnline ? "online" : ""}`} />{backendOnline ? "CONNECTED" : "OFFLINE"}</span></div><div className="depth-summary"><div><span>Open bids</span><strong className="buy-text">{openBuys.length}</strong></div><div><span>Open asks</span><strong className="sell-text">{openSells.length}</strong></div><div><span>All symbol orders</span><strong>{filteredOrders.length}</strong></div></div><div className="depth-grid"><div className="depth-panel"><h4 className="buy-text">BUY ORDERS <span>Highest price first</span></h4><div className="table-scroll"><table><thead><tr><th>Order ID</th><th>Bid price</th><th>Remaining</th><th>Status</th></tr></thead><tbody>{openBuys.length ? openBuys.map((order) => <tr key={order.orderID}><td className="mono">#{order.orderID}</td><td className="bid-price">₹{formatPrice(order.priceTicks)}</td><td>{order.remainingQuantity}</td><td><StatusBadge status={order.status} /></td></tr>) : <tr><td colSpan="4" className="empty-state">No open BUY orders</td></tr>}</tbody></table></div></div><div className="depth-panel"><h4 className="sell-text">SELL ORDERS <span>Lowest price first</span></h4><div className="table-scroll"><table><thead><tr><th>Order ID</th><th>Ask price</th><th>Remaining</th><th>Status</th></tr></thead><tbody>{openSells.length ? openSells.map((order) => <tr key={order.orderID}><td className="mono">#{order.orderID}</td><td className="ask-price">₹{formatPrice(order.priceTicks)}</td><td>{order.remainingQuantity}</td><td><StatusBadge status={order.status} /></td></tr>) : <tr><td colSpan="4" className="empty-state">No open SELL orders</td></tr>}</tbody></table></div></div></div></section>}

      {activePage === "order-management" && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">ORDER LIFECYCLE</p><h3>Order management</h3><p className="panel-subtitle">Review submitted orders and their remaining quantities. Cancel/modify controls will be added after the backend endpoints are implemented.</p></div><div className="symbol-picker"><label htmlFor="order-filter">Status</label><select id="order-filter" value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="PARTIALLY_FILLED">Partially filled</option><option value="FILLED">Filled</option><option value="CANCELLED">Cancelled</option></select></div></div><OrderTable rows={orders.filter((order) => (orderFilter === "ALL" || normalizeStatus(order.status) === orderFilter)).slice().reverse()} management /></section>}

      {activePage === "trade-history" && <section className="panel trades-panel"><div className="panel-heading"><div><p className="eyebrow">EXECUTION LOG</p><h3>Trade history</h3><p className="panel-subtitle">Completed matches recorded by the matching engine.</p></div><span className="trade-count">{filteredTrades.length} {selectedSymbol} trades</span></div><TradeTable rows={filteredTrades} /></section>}

      <footer className="page-footer"><span>StockFlow · Stock Exchange &amp; Order Matching Engine</span><span>React · Spring Boot · PostgreSQL</span></footer>
    </main>
  </div>;
}

export default App;
