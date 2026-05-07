import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Network, UserCheck, Search, Settings,
  Bell, Activity, AlertCircle, CheckCircle2, GitMerge,
  GitPullRequest, Building2, ShieldCheck, Clock,
  ChevronLeft, ChevronRight, XCircle, CheckCircle,
  SkipForward, Loader2, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from './data';
import './index.css';

// ── Shared helpers ────────────────────────────────────────────────────────────
const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = () => {
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [url]);
  return { data, loading, error, reload: load };
};

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
    <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
  </div>
);

const statusColor = s =>
  s === 'ACTIVE' ? '#10b981' : s === 'DORMANT' ? '#f59e0b' : '#ef4444';

const fmt = n => (n == null ? '—' : Number(n).toLocaleString());

// ── Overview ──────────────────────────────────────────────────────────────────
const Overview = () => {
  const { data: stats, loading: sl } = useFetch(`${API_BASE}/api/stats`);
  const { data: trend, loading: tl } = useFetch(`${API_BASE}/api/activity-trend`);

  if (sl || tl) return <Spinner />;
  if (!stats || stats.error) return (
    <div className="card" style={{ padding: '2rem', color: '#ef4444' }}>
      {stats?.error || 'Failed to load stats. Is the API running?'}
    </div>
  );

  const statusCounts = stats.statusCounts || {};
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dashboard-grid">
      {[
        { title: 'Source Records',  value: fmt(stats.sourceRecords),  sub: 'From 40+ departments',          cls: 'neutral' },
        { title: 'Resolved UBIDs',  value: fmt(stats.resolvedUBIDs),  sub: 'Unique businesses identified',  cls: 'positive' },
        { title: 'Auto Links',      value: fmt(stats.autoLinks),      sub: 'Confidence ≥ 95%',              cls: 'positive' },
        { title: 'Review Pairs',    value: fmt(stats.reviewPairs),    sub: 'Confidence 70–95%',             cls: 'negative' },
        { title: 'Veto Flags',      value: fmt(stats.vetoFlags),      sub: 'Temporal safety checks',        cls: 'negative' },
      ].map(({ title, value, sub, cls }) => (
        <div key={title} className="card stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          <div className={`stat-change ${cls}`}>{sub}</div>
        </div>
      ))}

      <div className="card chart-card">
        <div className="header" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Inspection Activity by Department</h2>
          <div className="badge badge-active">Real Pipeline Data</div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {[['Shops','#3b82f6'],['Factories','#8b5cf6'],['Pollution','#10b981'],['Electricity','#f59e0b']].map(([k,c]) => (
                <linearGradient key={k} id={`color${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={c} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
            {['Shops','Factories','Pollution','Electricity'].map((k,i) => {
              const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b'];
              return <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fillOpacity={1} fill={`url(#color${k})`} />;
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card status-card">
        <div className="header" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Activity Classification</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[['ACTIVE','#10b981'],['DORMANT','#f59e0b'],['CLOSED','#ef4444']].map(([status, color]) => {
            const count = statusCounts[status] || 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8' }}>{status}</span>
                  <span style={{ fontWeight: 'bold', color }}>{fmt(count)} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ── Resolution Table ──────────────────────────────────────────────────────────
const Resolution = () => {
  const [dept, setDept] = useState('All');
  const [city, setCity] = useState('All');
  const [veto, setVeto] = useState('All');
  const [page, setPage] = useState(1);

  const url = `${API_BASE}/api/linked-records?department=${encodeURIComponent(dept)}&city=${encodeURIComponent(city)}&veto=${encodeURIComponent(veto)}&page=${page}&page_size=50`;
  const { data, loading, reload } = useFetch(url);

  const records = data?.records || [];
  const total = data?.total || 0;
  const departments = ['All', ...(data?.departments || [])];
  const cities = ['All', ...(data?.cities || [])];
  const totalPages = Math.ceil(total / 50);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ gridColumn: 'span 12' }}>
      <div className="header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Resolved Business Records</h2>
          <p style={{ color: '#94a3b8' }}>{fmt(total)} records matching filters</p>
        </div>
        <button className="btn btn-secondary" onClick={reload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['Department', departments, dept, setDept], ['City', cities, city, setCity], ['Veto', ['All','Vetoed','Clean'], veto, setVeto]].map(([label, opts, val, setter]) => (
          <div key={label}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{label}</div>
            <select value={val} onChange={e => { setter(e.target.value); setPage(1); }}
              style={{ padding: '0.5rem 0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '0.875rem' }}>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['UBID','Department','Source ID','Name','Pincode','City','Confidence','Veto'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(51,65,85,0.5)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '0.75rem 1rem', color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.ubid}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><span className="badge" style={{ backgroundColor: '#1e293b' }}>{r.source_department}</span></td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.source_id}</td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{r.pincode}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{r.city}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ color: r.link_confidence >= 0.95 ? '#10b981' : r.link_confidence >= 0.70 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                      {r.link_confidence != null ? `${(r.link_confidence * 100).toFixed(0)}%` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {r.veto_applied ? <span className="badge badge-warning">⚠ {r.veto_reason || 'Vetoed'}</span> : <span style={{ color: '#10b981' }}>✓ Clean</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
          <span style={{ color: '#94a3b8' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={16} /></button>
        </div>
      )}
    </motion.div>
  );
};

// ── Reviewer Queue ────────────────────────────────────────────────────────────
const ReviewerQueue = () => {
  const { data: allItems, loading } = useFetch(`${API_BASE}/api/reviewer-queue`);
  const [queue, setQueue] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (allItems) setQueue(allItems); }, [allItems]);

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const handleDecision = (action) => {
    const item = queue[currentIdx];
    const label = action === 'merge' ? 'Merged ✓' : action === 'reject' ? 'Kept Separate ✗' : 'Skipped →';
    const color = action === 'merge' ? '#10b981' : action === 'reject' ? '#ef4444' : '#f59e0b';
    setDecisions(prev => [...prev, { id: item.left_id, action, label }]);
    showToast(`${item.left_id}: ${label}`, color);
    const newQueue = queue.filter((_, i) => i !== currentIdx);
    setQueue(newQueue);
    setCurrentIdx(prev => Math.min(prev, newQueue.length - 1));
  };

  if (loading || !queue) return <Spinner />;

  if (queue.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card reviewer-card">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: '#10b981' }}>Queue Cleared!</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>All {decisions.length} cases reviewed this session.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
            {decisions.slice(-10).map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.id}</span>
                <span style={{ color: d.action === 'merge' ? '#10b981' : d.action === 'reject' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{d.label}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => { setQueue(allItems); setCurrentIdx(0); setDecisions([]); }}>
            Reset Queue
          </button>
        </div>
      </motion.div>
    );
  }

  const item = queue[currentIdx];
  const conf = item.confidence != null ? Math.round(item.confidence * 100) : '?';

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card reviewer-card">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '1.5rem', right: '2rem', padding: '0.75rem 1.5rem', backgroundColor: '#1e293b', border: `1px solid ${toast.color}`, borderRadius: '0.5rem', color: toast.color, fontWeight: 600, zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Human-in-the-Loop Review</h2>
          <p style={{ color: '#94a3b8' }}>
            <strong style={{ color: '#f8fafc' }}>{item.left_id}</strong> vs <strong style={{ color: '#f8fafc' }}>{item.right_id}</strong>
            {' '}• Priority: <strong style={{ color: '#f59e0b' }}>{item.priority_score?.toFixed(3)}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge badge-warning">Ambiguous Match ({conf}%)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}><ChevronLeft size={16} /></button>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem', minWidth: '80px', textAlign: 'center' }}>{currentIdx + 1} / {queue.length}</span>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setCurrentIdx(Math.min(queue.length - 1, currentIdx + 1))} disabled={currentIdx === queue.length - 1}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
          <span>{decisions.length} reviewed</span><span>{queue.length} remaining</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: '#334155', borderRadius: '2px' }}>
          <div style={{ width: `${(decisions.length / (decisions.length + queue.length)) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {item.why_uncertain && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '1rem', fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertCircle size={11} /> {item.why_uncertain}
          </span>
        </div>
      )}

      <div className="comparison-view">
        <div className="record-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            <h3 style={{ color: '#3b82f6' }}>Record A</h3>
            <span className="badge" style={{ backgroundColor: '#1e293b' }}>{item.left_department}</span>
          </div>
          {[['Source ID', item.left_id], ['Business Name', item.left_name], ['Department', item.left_department]].map(([label, val]) => (
            <div className="record-field" key={label}>
              <div className="field-label">{label}</div>
              <div className="field-value">{val || '—'}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitPullRequest size={32} color="#94a3b8" />
        </div>

        <div className="record-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            <h3 style={{ color: '#8b5cf6' }}>Record B</h3>
            <span className="badge" style={{ backgroundColor: '#1e293b' }}>{item.right_department}</span>
          </div>
          {[['Source ID', item.right_id, false], ['Business Name', item.right_name, item.left_name !== item.right_name], ['Department', item.right_department, item.left_department !== item.right_department]].map(([label, val, mismatch]) => (
            <div className="record-field" key={label}>
              <div className="field-label">{label}</div>
              <div className={`field-value ${mismatch ? 'mismatch' : ''}`}>{val || '—'} {mismatch && <AlertCircle size={14} />}</div>
            </div>
          ))}
        </div>
      </div>

      {item.match_summary && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
          <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} /> Match Summary
          </h4>
          <p style={{ color: '#e2e8f0', fontSize: '0.875rem', fontFamily: 'monospace' }}>{item.match_summary}</p>
          {item.reason && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>{item.reason}</p>}
        </div>
      )}

      <div className="action-bar">
        <button className="btn btn-secondary" onClick={() => handleDecision('skip')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><SkipForward size={16} /> Skip</button>
        <button className="btn btn-danger" onClick={() => handleDecision('reject')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={16} /> Keep Separate</button>
        <button className="btn btn-primary" onClick={() => handleDecision('merge')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GitMerge size={16} /> Merge to UBID</button>
      </div>
    </motion.div>
  );
};

// ── Confidence ────────────────────────────────────────────────────────────────
const Confidence = () => {
  const { data, loading } = useFetch(`${API_BASE}/api/confidence`);
  if (loading || !data) return <Spinner />;

  const bucketData = Object.entries(data.buckets || {}).map(([name, value]) => ({ name, value }));
  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dashboard-grid">
      <div className="card" style={{ gridColumn: 'span 5' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Confidence Distribution</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bucketData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {bucketData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          {bucketData.map(({ name, value }, i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid #334155' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{name}</span>
              <span style={{ fontWeight: 700, color: COLORS[i] }}>{fmt(value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 7', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Top Pair Decisions</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Left','Right','Left Dept','Right Dept','Confidence','Decision'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.records || []).map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                <td style={{ padding: '0.6rem 0.75rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.left_name}</td>
                <td style={{ padding: '0.6rem 0.75rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.right_name}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8' }}>{r.left_department}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8' }}>{r.right_department}</td>
                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: r.confidence >= 0.95 ? '#10b981' : r.confidence >= 0.70 ? '#f59e0b' : '#ef4444' }}>
                  {r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '—'}
                </td>
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  <span className={`badge ${r.decision === 'AUTO_LINK' ? 'badge-active' : r.decision === 'REVIEW' ? 'badge-warning' : ''}`}
                    style={r.decision === 'SEPARATE' ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 } : {}}>
                    {r.decision}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// ── Lineage ───────────────────────────────────────────────────────────────────
const Lineage = () => {
  const { data: ubids, loading: ul } = useFetch(`${API_BASE}/api/ubids`);
  const [selectedUBID, setSelectedUBID] = useState('');

  useEffect(() => { if (ubids && ubids.length > 0 && !selectedUBID) setSelectedUBID(ubids[0]); }, [ubids]);

  const { data: lineage, loading: ll } = useFetch(selectedUBID ? `${API_BASE}/api/lineage?ubid=${encodeURIComponent(selectedUBID)}` : null);

  if (ul) return <Spinner />;

  const cls = lineage?.classification || {};
  const records = lineage?.records || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ gridColumn: 'span 12' }}>
      <div className="header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>UBID Lineage / Audit Trail</h2>
          <p style={{ color: '#94a3b8' }}>All source records grouped under one Unified Business ID</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Select UBID</div>
        <select value={selectedUBID} onChange={e => setSelectedUBID(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '0.875rem', minWidth: '220px' }}>
          {(ubids || []).map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {cls.classification && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Classification</div>
            <span className={`badge ${cls.classification === 'ACTIVE' ? 'badge-active' : cls.classification === 'DORMANT' ? 'badge-warning' : 'badge-danger'}`} style={{ marginTop: '0.25rem', display: 'inline-block' }}>{cls.classification}</span></div>
          <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Recency Score</div><div style={{ fontWeight: 700, color: '#3b82f6' }}>{cls.recency_score?.toFixed(4)}</div></div>
          <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Events This Year</div><div style={{ fontWeight: 700 }}>{cls.events_this_year}</div></div>
          <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cohort Median</div><div style={{ fontWeight: 700 }}>{cls.cohort_median}</div></div>
          <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Last Event</div><div style={{ fontWeight: 700 }}>{cls.last_event_date}</div></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Reason</div><div style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{cls.classification_reason}</div></div>
        </div>
      )}

      {ll ? <Spinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Department','Source ID','Name','Address','PAN','GSTIN','Owner','Confidence','Veto'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}><span className="badge" style={{ backgroundColor: '#1e293b' }}>{r.source_department}</span></td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>{r.source_id}</td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8', fontSize: '0.8rem' }}>{r.address}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.pan || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.gstin || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{r.owner_name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: r.link_confidence >= 0.95 ? '#10b981' : '#f59e0b' }}>
                    {r.link_confidence != null ? `${(r.link_confidence * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {r.veto_applied ? <span className="badge badge-warning">⚠</span> : <span style={{ color: '#10b981' }}>✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

// ── Activity ──────────────────────────────────────────────────────────────────
const ActivityView = () => {
  const { data, loading } = useFetch(`${API_BASE}/api/activity`);
  const [filter, setFilter] = useState('All');
  if (loading || !data) return <Spinner />;

  const records = (data.records || []).filter(r => filter === 'All' || r.classification === filter);
  const statusCounts = data.statusCounts || {};

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dashboard-grid">
      <div className="card" style={{ gridColumn: 'span 4' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Status Summary</h2>
        {[['ACTIVE','#10b981'],['DORMANT','#f59e0b'],['CLOSED','#ef4444']].map(([s, c]) => (
          <div key={s} style={{ marginBottom: '1.25rem', cursor: 'pointer' }} onClick={() => setFilter(filter === s ? 'All' : s)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: filter === s ? c : '#94a3b8', fontWeight: filter === s ? 700 : 400 }}>{s}</span>
              <span style={{ fontWeight: 700, color: c }}>{fmt(statusCounts[s] || 0)}</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#334155', borderRadius: '3px' }}>
              <div style={{ width: `${((statusCounts[s] || 0) / Math.max(...Object.values(statusCounts))) * 100}%`, height: '100%', backgroundColor: c, borderRadius: '3px' }} />
            </div>
          </div>
        ))}
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setFilter('All')}>Show All</button>
      </div>

      <div className="card" style={{ gridColumn: 'span 8', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
          Classification Evidence
          {filter !== 'All' && <span style={{ marginLeft: '0.75rem' }} className={`badge ${filter === 'ACTIVE' ? 'badge-active' : filter === 'DORMANT' ? 'badge-warning' : 'badge-danger'}`}>{filter}</span>}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['UBID','Status','Recency','Events','Cohort Median','Last Event','Reason'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 100).map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#3b82f6' }}>{r.ubid}</td>
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  <span className={`badge ${r.classification === 'ACTIVE' ? 'badge-active' : r.classification === 'DORMANT' ? 'badge-warning' : 'badge-danger'}`}>{r.classification}</span>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: r.recency_score >= 0.5 ? '#10b981' : '#f59e0b' }}>{r.recency_score?.toFixed(3)}</td>
                <td style={{ padding: '0.6rem 0.75rem' }}>{r.events_this_year}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8' }}>{r.cohort_median}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.last_event_date}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.classification_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length > 100 && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.75rem' }}>Showing 100 of {records.length} records</p>}
      </div>
    </motion.div>
  );
};

// ── Portal ────────────────────────────────────────────────────────────────────
const PortalLookup = () => {
  const [lookupType, setLookupType] = useState('PAN');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(undefined);
  const [searching, setSearching] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [contact, setContact] = useState('');
  const [details, setDetails] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(`${API_BASE}/api/portal/lookup?key=${encodeURIComponent(query.trim())}&type=${lookupType}`);
      const d = await r.json();
      setResult(d.found ? d : null);
    } catch { setResult(null); }
    setSearching(false);
    setFeedbackType(''); setFeedbackDone(false);
  };

  const handleFeedback = async () => {
    await fetch(`${API_BASE}/api/portal/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_type: feedbackType, ubid: result?.ubid, business_name: result?.records?.[0]?.name, contact, details }),
    });
    setFeedbackDone(true);
  };

  const cls = result?.classification || {};

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="portal-container">
      <div className="card">
        <div className="header">
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Business Self-Service Portal</h2>
            <p style={{ color: '#94a3b8' }}>Lookup your unified business profile using real pipeline data</p>
          </div>
          <div className="badge badge-active">Live Data</div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Lookup by</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['PAN','GSTIN'].map(t => (
                <button key={t} onClick={() => setLookupType(t)} className={`btn ${lookupType === t ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{t}</button>
              ))}
            </div>
          </div>
          <input type="text" placeholder={`Enter ${lookupType} (e.g. ABCDE0001F)`} value={query}
            onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1, minWidth: '220px', padding: '0.875rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '1rem' }} />
          <button onClick={handleSearch} className="btn btn-primary" disabled={searching} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {searching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />} Search
          </button>
        </div>

        {result === null && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
            <AlertCircle size={24} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
            <p style={{ color: '#ef4444', fontWeight: 600 }}>No records found for "{query}"</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Try a PAN from the pipeline, e.g. ABCDE0001F, ABCDE0002F, ABCDE0005F</p>
          </div>
        )}

        {result && result.found && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Unified Business ID</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{result.ubid}</div>
              </div>
              {cls.classification && (
                <span className={`badge ${cls.classification === 'ACTIVE' ? 'badge-active' : cls.classification === 'DORMANT' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  {cls.classification}
                </span>
              )}
            </div>

            {cls.classification_reason && (
              <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  <CheckCircle2 size={14} /> Classification Reason
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{cls.classification_reason}</p>
              </div>
            )}

            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#e2e8f0' }}>Linked Department Records ({result.records?.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(result.records || []).map((r, i) => (
                <div key={i} style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{r.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{r.source_department} • {r.source_id} • {r.city}</div>
                    {r.address && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{r.address}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {r.pan && <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#94a3b8' }}>PAN: {r.pan}</div>}
                    {r.owner_name && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Owner: {r.owner_name}</div>}
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: r.link_confidence >= 0.95 ? '#10b981' : '#f59e0b', marginTop: '0.2rem' }}>
                      Confidence: {r.link_confidence != null ? `${(r.link_confidence * 100).toFixed(0)}%` : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid #334155' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#e2e8f0' }}>Report an Issue</h3>
              {feedbackDone ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}>
                  <CheckCircle2 size={20} /><span style={{ fontWeight: 600 }}>Feedback submitted! Saved to portal_feedback.csv.</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[['wrong-merge','Wrong Merge'],['closure','Business Closed'],['status-change','Status Incorrect'],['claim','Claim UBID']].map(([val, label]) => (
                      <button key={val} onClick={() => setFeedbackType(val)} className={`btn ${feedbackType === val ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>
                    ))}
                  </div>
                  {feedbackType && (
                    <>
                      <input type="text" placeholder="Contact phone/email" value={contact} onChange={e => setContact(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '0.875rem', marginBottom: '0.75rem' }} />
                      <textarea placeholder="Details..." value={details} onChange={e => setDetails(e.target.value)} rows={3}
                        style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '0.875rem', resize: 'vertical', marginBottom: '0.75rem' }} />
                      <button onClick={handleFeedback} className="btn btn-primary" style={{ width: '100%' }}>Submit Feedback</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Command Center',   icon: LayoutDashboard },
  { id: 'resolution',  label: 'Resolution',        icon: Network },
  { id: 'reviewer',    label: 'Reviewer Queue',    icon: UserCheck,  badge: true },
  { id: 'confidence',  label: 'Confidence',        icon: Activity },
  { id: 'lineage',     label: 'Lineage',           icon: GitMerge },
  { id: 'activity',    label: 'Activity',          icon: CheckCircle2 },
  { id: 'portal',      label: 'Business Portal',   icon: Building2 },
];

const TITLES = {
  overview: 'Global Dashboard',
  resolution: 'Resolved Records',
  reviewer: 'Manual Review',
  confidence: 'Confidence Calibration',
  lineage: 'UBID Lineage',
  activity: 'Activity Classification',
  portal: 'Business Portal',
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stats } = useFetch(`${API_BASE}/api/stats`);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':   return <Overview />;
      case 'resolution': return <Resolution />;
      case 'reviewer':   return <ReviewerQueue />;
      case 'confidence': return <Confidence />;
      case 'lineage':    return <Lineage />;
      case 'activity':   return <ActivityView />;
      case 'portal':     return <PortalLookup />;
      default:           return <Overview />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand"><Network color="#3b82f6" />UBID Platform</div>
        <ul className="nav-menu">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <li key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
              <Icon className="nav-icon" />
              {label}
              {badge && stats?.reviewPairs > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem' }}>
                  {fmt(stats.reviewPairs)}
                </span>
              )}
            </li>
          ))}
          <li style={{ marginTop: 'auto' }} className="nav-item"><Settings className="nav-icon" />System Config</li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1>{TITLES[activeTab]}</h1>
            <p style={{ color: '#94a3b8' }}>Unified Business Identifier System • Karnataka Commerce & Industry</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell color="#94a3b8" />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
            </div>
            <div className="user-profile">
              <div className="avatar">A</div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Admin User</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Super Reviewer</div>
              </div>
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
