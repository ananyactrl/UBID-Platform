import { useState } from 'react';
import {
  LayoutDashboard,
  Network,
  UserCheck,
  Search,
  Settings,
  Bell,
  Activity,
  AlertCircle,
  CheckCircle2,
  GitMerge,
  GitPullRequest,
  Building2,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
  SkipForward
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import {
  dashboardStats,
  activityData,
  entityResolutionExamples,
  reviewerQueueItems,
  portalLookupData
} from './data';
import './index.css';

// --- Subcomponents ---

const Overview = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="dashboard-grid"
  >
    <div className="card stat-card">
      <div className="stat-title">Total Raw Records</div>
      <div className="stat-value">{dashboardStats.totalRecords}</div>
      <div className="stat-change neutral">From 40+ departments</div>
    </div>
    <div className="card stat-card">
      <div className="stat-title">Resolved UBIDs</div>
      <div className="stat-value">{dashboardStats.resolvedUBIDs}</div>
      <div className="stat-change positive">~71% compression rate</div>
    </div>
    <div className="card stat-card">
      <div className="stat-title">Pending Reviews</div>
      <div className="stat-value">{dashboardStats.pendingReviews}</div>
      <div className="stat-change negative">High Priority (70-95% Conf)</div>
    </div>

    <div className="card chart-card">
      <div className="header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Inspection Activity Trends</h2>
        <div className="badge badge-active">Live Stream</div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorShops" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFactories" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPollution" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Area type="monotone" dataKey="Shops"     stroke="#3b82f6" fillOpacity={1} fill="url(#colorShops)" />
          <Area type="monotone" dataKey="Factories" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorFactories)" />
          <Area type="monotone" dataKey="Pollution" stroke="#10b981" fillOpacity={1} fill="url(#colorPollution)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div className="card status-card">
      <div className="header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Global Status Distribution</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[
          { label: 'Active Businesses',  value: dashboardStats.active,   color: '#10b981' },
          { label: 'Dormant Businesses', value: dashboardStats.dormant,  color: '#f59e0b' },
          { label: 'Closed Entities',    value: dashboardStats.closed,   color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>{label}</span>
              <span style={{ fontWeight: 'bold', color }}>{value}</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}>
              <div style={{ width: value, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const statusColor = (s) =>
  s === 'ACTIVE' ? '#10b981' : s === 'DORMANT' ? '#f59e0b' : '#ef4444';

const Visualizer = () => {
  const [idx, setIdx] = useState(0);
  const ex = entityResolutionExamples[idx];
  const total = entityResolutionExamples.length;

  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card visualizer-container"
    >
      {/* Header */}
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Entity Resolution Graph</h2>
          <p>
            Confidence:{' '}
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{ex.confidenceScore}%</span>
            {' '}•{' '}
            <span style={{ color: statusColor(ex.status), fontWeight: 'bold' }}>{ex.status}</span>
            {' '}•{' '}
            <span style={{ color: '#94a3b8' }}>{ex.ubid}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge badge-active">Auto-Linked (≥ 95%)</div>
          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.6rem' }}
              onClick={() => setIdx((idx - 1 + total) % total)}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem', minWidth: '60px', textAlign: 'center' }}>
              {idx + 1} / {total}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.6rem' }}
              onClick={() => setIdx((idx + 1) % total)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Entity selector tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {entityResolutionExamples.map((e, i) => (
          <button
            key={e.ubid}
            onClick={() => setIdx(i)}
            className={`btn ${i === idx ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            {e.ubid}
          </button>
        ))}
      </div>

      {/* Node Graph */}
      <div className="node-graph">
        <svg className="svg-lines">
          <line x1="25%" y1="20%" x2="75%" y2="50%" stroke="#3b82f6" strokeWidth="2" className="animated-line" />
          <circle cx="50%" cy="35%" r="15" fill="#1e293b" stroke="#334155" />
          <text x="50%" y="35%" fill="#10b981" fontSize="10" textAnchor="middle" dominantBaseline="central">{ex.scores[0]}%</text>

          <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#3b82f6" strokeWidth="2" className="animated-line" />
          <circle cx="50%" cy="50%" r="15" fill="#1e293b" stroke="#334155" />
          <text x="50%" y="50%" fill="#10b981" fontSize="10" textAnchor="middle" dominantBaseline="central">{ex.scores[1]}%</text>

          <line x1="25%" y1="80%" x2="75%" y2="50%" stroke="#3b82f6" strokeWidth="2" className="animated-line" />
          <circle cx="50%" cy="65%" r="15" fill="#1e293b" stroke="#334155" />
          <text x="50%" y="65%" fill="#10b981" fontSize="10" textAnchor="middle" dominantBaseline="central">{ex.scores[2]}%</text>
        </svg>

        <div className="node source-1">
          <div className="node-title">{ex.nodes[0].label}</div>
          <div className="node-dept">{ex.nodes[0].dept}</div>
        </div>
        <div className="node source-2">
          <div className="node-title">{ex.nodes[1].label}</div>
          <div className="node-dept">{ex.nodes[1].dept}</div>
        </div>
        <div className="node source-3">
          <div className="node-title">{ex.nodes[2].label}</div>
          <div className="node-dept">{ex.nodes[2].dept}</div>
        </div>

        <div className="node target">
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Unified Business ID</div>
          <div className="node-target-id">{ex.nodes[3].label}</div>
          <div style={{ marginTop: '0.4rem' }}>
            <span className={`badge ${ex.status === 'ACTIVE' ? 'badge-active' : ex.status === 'DORMANT' ? 'badge-warning' : 'badge-danger'}`}>
              {ex.status}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#94a3b8' }}>
          Behavioural Fingerprint Timeline
        </h3>
        {ex.timeline.map((event, i) => (
          <div className="timeline-event" key={i}>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div>
                <span style={{ fontWeight: 'bold', marginRight: '1rem' }}>{event.date}</span>
                <span style={{ color: '#e2e8f0' }}>{event.event}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.5rem' }}>via {event.source}</span>
              </div>
              <div className="timeline-boost">{event.impact}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} />
          <span>{ex.insight}</span>
        </div>
      </div>
    </motion.div>
  );
};

const ReviewerQueue = () => {
  const [queue, setQueue] = useState(reviewerQueueItems);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const handleDecision = (action) => {
    const item = queue[currentIdx];
    const label = action === 'merge' ? 'Merged ✓' : action === 'reject' ? 'Kept Separate ✗' : 'Skipped →';
    const color = action === 'merge' ? '#10b981' : action === 'reject' ? '#ef4444' : '#f59e0b';
    setDecisions(prev => [...prev, { id: item.id, action, label }]);
    showToast(`${item.id}: ${label}`, color);

    const newQueue = queue.filter((_, i) => i !== currentIdx);
    setQueue(newQueue);
    setCurrentIdx(prev => Math.min(prev, newQueue.length - 1));
  };

  if (queue.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card reviewer-card">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: '#10b981' }}>Queue Cleared!</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>All {decisions.length} cases have been reviewed.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
            {decisions.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8' }}>{d.id}</span>
                <span style={{ color: d.action === 'merge' ? '#10b981' : d.action === 'reject' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{d.label}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => { setQueue(reviewerQueueItems); setCurrentIdx(0); setDecisions([]); }}>
            Reset Queue
          </button>
        </div>
      </motion.div>
    );
  }

  const item = queue[currentIdx];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card reviewer-card">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '1.5rem', right: '2rem', padding: '0.75rem 1.5rem', backgroundColor: '#1e293b', border: `1px solid ${toast.color}`, borderRadius: '0.5rem', color: toast.color, fontWeight: 600, zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Human-in-the-Loop Review</h2>
          <p>Task ID: <strong>{item.id}</strong> • Active Learning Priority Queue</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge badge-warning">Ambiguous Match ({item.confidence}%)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem', minWidth: '70px', textAlign: 'center' }}>
              {currentIdx + 1} / {queue.length}
            </span>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setCurrentIdx(Math.min(queue.length - 1, currentIdx + 1))} disabled={currentIdx === queue.length - 1}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
          <span>{decisions.length} reviewed</span>
          <span>{queue.length} remaining</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: '#334155', borderRadius: '2px' }}>
          <div style={{ width: `${(decisions.length / (decisions.length + queue.length)) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Issues */}
      {item.issues.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {item.issues.map((issue, i) => (
            <span key={i} style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '1rem', fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertCircle size={11} /> {issue}
            </span>
          ))}
        </div>
      )}

      {/* Side-by-side comparison */}
      <div className="comparison-view">
        <div className="record-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            <h3 style={{ color: '#3b82f6' }}>Record A</h3>
            <span className="badge" style={{ backgroundColor: '#1e293b' }}>{item.recordA.source}</span>
          </div>
          {[['Business Name', item.recordA.name, false], ['Address', item.recordA.address, false], ['PAN', item.recordA.pan, false], ['Last Activity', item.recordA.lastEvent, false]].map(([label, val]) => (
            <div className="record-field" key={label}>
              <div className="field-label">{label}</div>
              <div className="field-value">{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitPullRequest size={32} color="#94a3b8" />
        </div>

        <div className="record-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            <h3 style={{ color: '#8b5cf6' }}>Record B</h3>
            <span className="badge" style={{ backgroundColor: '#1e293b' }}>{item.recordB.source}</span>
          </div>
          {[
            ['Business Name', item.recordB.name,      item.recordA.name !== item.recordB.name],
            ['Address',       item.recordB.address,   item.recordA.address !== item.recordB.address],
            ['PAN',           item.recordB.pan,       item.recordB.pan === 'Missing'],
            ['Last Activity', item.recordB.lastEvent, false],
          ].map(([label, val, mismatch]) => (
            <div className="record-field" key={label}>
              <div className="field-label">{label}</div>
              <div className={`field-value ${mismatch ? 'mismatch' : ''}`}>
                {val} {mismatch && <AlertCircle size={14} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
        <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} /> AI Recommendation
        </h4>
        <p style={{ color: '#e2e8f0' }}>
          <strong>{item.recommendation}</strong>. Strong temporal correlation offsets the Jaro-Winkler string distance drop.
        </p>
      </div>

      {/* Actions */}
      <div className="action-bar">
        <button className="btn btn-secondary" onClick={() => handleDecision('skip')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SkipForward size={16} /> Skip / Escalate
        </button>
        <button className="btn btn-danger" onClick={() => handleDecision('reject')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={16} /> Keep Separate
        </button>
        <button className="btn btn-primary" onClick={() => handleDecision('merge')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitMerge size={16} /> Merge to UBID
        </button>
      </div>
    </motion.div>
  );
};

const PortalLookup = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(undefined); // undefined = not searched yet
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackDone, setFeedbackDone] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const result = portalLookupData[searchQuery.trim().toUpperCase()];
    setLookupResult(result ?? null);
    setFeedbackType('');
    setFeedbackDone(false);
  };

  const handleFeedback = () => {
    setFeedbackDone(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="portal-container"
    >
      <div className="card">
        <div className="header">
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Business Self-Service Portal</h2>
            <p>Lookup your unified business profile by PAN or GSTIN</p>
          </div>
          <div className="badge badge-active">Public Access</div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Enter PAN or GSTIN (e.g., ABCDE1234F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handleSearch}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Search size={16} /> Search
          </button>
        </div>

        {/* Quick-fill sample PANs */}
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Try:</span>
          {Object.keys(portalLookupData).map(pan => (
            <button key={pan} onClick={() => { setSearchQuery(pan); setLookupResult(portalLookupData[pan]); setFeedbackType(''); setFeedbackDone(false); }}
              className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
              {pan}
            </button>
          ))}
        </div>

        {lookupResult === null && searchQuery && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
            <AlertCircle size={24} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
            <p style={{ color: '#ef4444', fontWeight: 600 }}>No records found for "{searchQuery}"</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Try: ABCDE1234F · XYZPQ9876G · FGHIJ5678K · WXYZA7890B</p>
          </div>
        )}

        {lookupResult && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Unified Business ID</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{lookupResult.ubid}</div>
              </div>
              <div className={`badge ${lookupResult.status === 'ACTIVE' ? 'badge-active' : 'badge-warning'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                {lookupResult.status}
              </div>
            </div>

            <div className="portal-info-grid">
              <div className="portal-info-card">
                <Building2 size={20} color="#3b82f6" />
                <div>
                  <div className="field-label">Business Name</div>
                  <div className="field-value">{lookupResult.businessName}</div>
                </div>
              </div>
              <div className="portal-info-card">
                <ShieldCheck size={20} color="#10b981" />
                <div>
                  <div className="field-label">PAN / GSTIN</div>
                  <div className="field-value">{lookupResult.pan} / {lookupResult.gstin}</div>
                </div>
              </div>
              <div className="portal-info-card">
                <UserCheck size={20} color="#8b5cf6" />
                <div>
                  <div className="field-label">Owner Name</div>
                  <div className="field-value">{lookupResult.owner}</div>
                </div>
              </div>
              <div className="portal-info-card">
                <Clock size={20} color="#f59e0b" />
                <div>
                  <div className="field-label">Last Updated</div>
                  <div className="field-value">{lookupResult.lastUpdated}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#e2e8f0' }}>Linked Department Records</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lookupResult.linkedRecords.map((record, idx) => (
                  <div key={idx} style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{record.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{record.source} • ID: {record.id}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Last Event: {record.lastEvent}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h4 style={{ color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> Classification Reason
              </h4>
              <p style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{lookupResult.classificationReason}</p>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid #334155' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#e2e8f0' }}>Report an Issue</h3>
              {feedbackDone ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}>
                  <CheckCircle2 size={20} />
                  <span style={{ fontWeight: 600 }}>Feedback submitted! Our team will review within 48 hours.</span>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>Help us improve data accuracy by reporting incorrect merges or status changes.</p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[['wrong-merge', 'Wrong Merge'], ['closure', 'Business Closed'], ['status-change', 'Status Incorrect']].map(([val, label]) => (
                      <button key={val} onClick={() => setFeedbackType(val)} className={`btn ${feedbackType === val ? 'btn-primary' : 'btn-secondary'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {feedbackType && (
                    <button onClick={handleFeedback} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                      Submit Feedback
                    </button>
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

// --- Main App Component ---

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return <Overview />;
      case 'visualizer': return <Visualizer />;
      case 'reviewer': return <ReviewerQueue />;
      case 'portal': return <PortalLookup />;
      default: return <Overview />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <Network color="#3b82f6" />
          UBID Platform
        </div>
        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard className="nav-icon" />
            Command Center
          </li>
          <li className={`nav-item ${activeTab === 'visualizer' ? 'active' : ''}`} onClick={() => setActiveTab('visualizer')}>
            <Search className="nav-icon" />
            Entity Visualizer
          </li>
          <li className={`nav-item ${activeTab === 'reviewer' ? 'active' : ''}`} onClick={() => setActiveTab('reviewer')}>
            <UserCheck className="nav-icon" />
            Reviewer Queue
            <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem' }}>12k</span>
          </li>
          <li className={`nav-item ${activeTab === 'portal' ? 'active' : ''}`} onClick={() => setActiveTab('portal')}>
            <Building2 className="nav-icon" />
            Business Portal
          </li>
          <li style={{ marginTop: 'auto' }} className="nav-item">
            <Settings className="nav-icon" />
            System Config
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>{activeTab === 'overview' ? 'Global Dashboard' : activeTab === 'visualizer' ? 'Graph Resolution' : activeTab === 'reviewer' ? 'Manual Review' : 'Business Portal'}</h1>
            <p>Unified Business Identifier System • Karnataka Commerce & Industry</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell color="#94a3b8" />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
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
