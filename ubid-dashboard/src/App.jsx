import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

import { dashboardStats, activityData, entityResolutionExample, reviewerQueueExample, portalLookupData } from './data';
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
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFactories" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Area type="monotone" dataKey="Shops" stroke="#3b82f6" fillOpacity={1} fill="url(#colorShops)" />
          <Area type="monotone" dataKey="Factories" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorFactories)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div className="card status-card">
      <div className="header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Global Status Distribution</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#94a3b8' }}>Active Businesses</span>
            <span style={{ fontWeight: 'bold', color: '#10b981' }}>{dashboardStats.active}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}>
            <div style={{ width: dashboardStats.active, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#94a3b8' }}>Dormant Businesses</span>
            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{dashboardStats.dormant}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}>
            <div style={{ width: dashboardStats.dormant, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#94a3b8' }}>Closed Entities</span>
            <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{dashboardStats.closed}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}>
            <div style={{ width: dashboardStats.closed, height: '100%', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const Visualizer = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card visualizer-container"
    >
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Entity Resolution Graph</h2>
          <p>Confidence Score: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{entityResolutionExample.confidenceScore}%</span></p>
        </div>
        <div className="badge badge-active">Auto-Linked (≥ 95%)</div>
      </div>

      <div className="node-graph">
        {/* Connection SVG Lines */}
        <svg className="svg-lines">
          {/* 1 to UBID */}
          <line x1="25%" y1="20%" x2="75%" y2="50%" stroke="#3b82f6" strokeWidth="2" className="animated-line" />
          <circle cx="50%" cy="35%" r="15" fill="#1e293b" stroke="#334155" />
          <text x="50%" y="35%" fill="#10b981" fontSize="10" textAnchor="middle" dominantBaseline="central">95%</text>
          
          {/* 2 to UBID */}
          <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#3b82f6" strokeWidth="2" className="animated-line" />
          <circle cx="50%" cy="50%" r="15" fill="#1e293b" stroke="#334155" />
          <text x="50%" y="50%" fill="#10b981" fontSize="10" textAnchor="middle" dominantBaseline="central">96%</text>
          
          {/* 3 to UBID */}
          <line x1="25%" y1="80%" x2="75%" y2="50%" stroke="#3b82f6" strokeWidth="2" className="animated-line" />
          <circle cx="50%" cy="65%" r="15" fill="#1e293b" stroke="#334155" />
          <text x="50%" y="65%" fill="#10b981" fontSize="10" textAnchor="middle" dominantBaseline="central">92%</text>
        </svg>

        <div className="node source-1">
          <div className="node-title">{entityResolutionExample.nodes[0].label}</div>
          <div className="node-dept">{entityResolutionExample.nodes[0].dept}</div>
        </div>
        <div className="node source-2">
          <div className="node-title">{entityResolutionExample.nodes[1].label}</div>
          <div className="node-dept">{entityResolutionExample.nodes[1].dept}</div>
        </div>
        <div className="node source-3">
          <div className="node-title">{entityResolutionExample.nodes[2].label}</div>
          <div className="node-dept">{entityResolutionExample.nodes[2].dept}</div>
        </div>

        <div className="node target">
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Unified Business ID</div>
          <div className="node-target-id">{entityResolutionExample.nodes[3].label}</div>
        </div>
      </div>

      <div className="timeline">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#94a3b8' }}>Behavioural Fingerprint Timeline (May 2024)</h3>
        {entityResolutionExample.timeline.map((event, idx) => (
          <div className="timeline-event" key={idx}>
            <div className="timeline-dot"></div>
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
          <span>Consistent 2-day lag pattern detected across departments. Similarity score boosted!</span>
        </div>
      </div>
    </motion.div>
  );
};

const ReviewerQueue = () => {
  const item = reviewerQueueExample[0];
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="card reviewer-card"
    >
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Human-in-the-Loop Review</h2>
          <p>Task ID: {item.id} • Active Learning Priority Queue</p>
        </div>
        <div className="badge badge-warning">Ambiguous Match ({item.confidence}%)</div>
      </div>

      <div className="comparison-view">
        {/* Record A */}
        <div className="record-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            <h3 style={{ color: '#3b82f6' }}>Record A</h3>
            <span className="badge" style={{ backgroundColor: '#1e293b' }}>{item.recordA.source}</span>
          </div>
          
          <div className="record-field">
            <div className="field-label">Business Name</div>
            <div className="field-value">{item.recordA.name}</div>
          </div>
          <div className="record-field">
            <div className="field-label">Registered Address</div>
            <div className="field-value">{item.recordA.address}</div>
          </div>
          <div className="record-field">
            <div className="field-label">PAN Number</div>
            <div className="field-value">{item.recordA.pan}</div>
          </div>
          <div className="record-field">
            <div className="field-label">Last Activity</div>
            <div className="field-value">{item.recordA.lastEvent}</div>
          </div>
        </div>

        {/* Sync Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitPullRequest size={32} color="#94a3b8" />
        </div>

        {/* Record B */}
        <div className="record-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            <h3 style={{ color: '#8b5cf6' }}>Record B</h3>
            <span className="badge" style={{ backgroundColor: '#1e293b' }}>{item.recordB.source}</span>
          </div>
          
          <div className="record-field">
            <div className="field-label">Business Name</div>
            <div className="field-value mismatch">
              {item.recordB.name}
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="record-field">
            <div className="field-label">Registered Address</div>
            <div className="field-value mismatch">
              {item.recordB.address}
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="record-field">
            <div className="field-label">PAN Number</div>
            <div className="field-value mismatch">
              {item.recordB.pan}
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="record-field">
            <div className="field-label">Last Activity</div>
            <div className="field-value">{item.recordB.lastEvent}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} /> AI Recommendation
        </h4>
        <p style={{ color: '#e2e8f0' }}><strong>{item.recommendation}</strong>. Strong temporal correlation offsets the Jaro-Winkler string distance drop.</p>
      </div>

      <div className="action-bar">
        <button className="btn btn-secondary">Skip / Escalate</button>
        <button className="btn btn-danger">Keep Separate (Reject)</button>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitMerge size={16} /> Merge to UBID
        </button>
      </div>
    </motion.div>
  );
};

const PortalLookup = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [feedbackType, setFeedbackType] = useState('');

  const handleSearch = () => {
    const result = portalLookupData[searchQuery.toUpperCase()];
    setLookupResult(result || null);
    setFeedbackType('');
  };

  const handleFeedback = () => {
    alert(`Feedback submitted: ${feedbackType} for UBID ${lookupResult.ubid}`);
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

        {lookupResult === null && searchQuery && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
            <AlertCircle size={24} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
            <p style={{ color: '#ef4444', fontWeight: 600 }}>No records found for "{searchQuery}"</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Try: ABCDE1234F or XYZPQ9876G</p>
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
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>Help us improve data accuracy by reporting incorrect merges or status changes.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setFeedbackType('wrong-merge')}
                  className={`btn ${feedbackType === 'wrong-merge' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Wrong Merge
                </button>
                <button 
                  onClick={() => setFeedbackType('closure')}
                  className={`btn ${feedbackType === 'closure' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Business Closed
                </button>
                <button 
                  onClick={() => setFeedbackType('status-change')}
                  className={`btn ${feedbackType === 'status-change' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Status Incorrect
                </button>
              </div>
              {feedbackType && (
                <button 
                  onClick={handleFeedback}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  Submit Feedback
                </button>
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
