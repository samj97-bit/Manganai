import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTargets, getModelStatus, getValidations, getHealth } from '../services/api';
import type { Target, ModelStatus } from '../services/api';

interface QuickStat {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const NAV_CARDS = [
  {
    path: '/exploration',
    icon: '◎',
    title: 'Exploration Map',
    desc: 'Interactive prospectivity map with AI-predicted manganese targets across India.',
    color: '#2D6A4F',
    bg: '#D8F3DC',
  },
  {
    path: '/targets',
    icon: '⊕',
    title: 'Target Registry',
    desc: 'Ranked exploration targets with feature contribution analysis and evidence trails.',
    color: '#1D4E89',
    bg: '#DBEAFE',
  },
  {
    path: '/subsurface',
    icon: '▤',
    title: 'Subsurface Cube',
    desc: 'Depth-stratified prospectivity estimates from integrated geological evidence.',
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    path: '/validation',
    icon: '✓',
    title: 'Field Validation',
    desc: 'Submit field results to close the loop — every sample updates the model.',
    color: '#B45309',
    bg: '#FEF3C7',
  },
  {
    path: '/supply',
    icon: '⟳',
    title: 'Supply Intelligence',
    desc: 'India manganese supply-demand outlook with scenario impact modelling.',
    color: '#6B4226',
    bg: '#F5E6D3',
  },
  {
    path: '/model',
    icon: '⬡',
    title: 'ML Model',
    desc: 'Model lifecycle management — training, versioning and adaptive learning.',
    color: '#374151',
    bg: '#F3F4F6',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<Target[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [validationCount, setValidationCount] = useState(0);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getTargets(),
      getModelStatus(),
      getValidations(),
      getHealth(),
    ]).then(([t, m, v, h]) => {
      if (t.status === 'fulfilled' && t.value?.targets) setTargets(t.value.targets);
      if (m.status === 'fulfilled' && m.value) setModelStatus(m.value);
      if (v.status === 'fulfilled' && v.value) setValidationCount(v.value.count || 0);
      setApiOnline(h.status === 'fulfilled');
      setLoading(false);
    });
  }, []);

  const highPriority = targets.filter(t => t.priority === 'HIGH').length;
  const totalAreaKm2 = targets.reduce((s, t) => s + t.area_km2, 0);
  const avgProspectivity = targets.length > 0
    ? (targets.reduce((s, t) => s + t.prospectivity, 0) / targets.length * 100).toFixed(0)
    : '--';

  const stats: QuickStat[] = [
    { label: 'AI Targets', value: targets.length || '--', sub: 'Exploration targets', color: 'var(--green)', trend: 'up' },
    { label: 'High Priority', value: highPriority || '--', sub: 'Prospectivity > 80%', color: 'var(--green)', trend: 'up' },
    { label: 'Study Area', value: '480,000', sub: 'km² · India Mn Belt', color: 'var(--text-primary)' },
    { label: 'Model F1', value: modelStatus ? modelStatus.f1_score.toFixed(3) : '--', sub: modelStatus?.version || 'Loading...', color: 'var(--blue)' },
    { label: 'Avg Prospectivity', value: `${avgProspectivity}%`, sub: 'Across all targets', color: 'var(--text-primary)' },
    { label: 'Field Records', value: validationCount, sub: 'Validation samples', color: 'var(--amber)', trend: validationCount > 0 ? 'up' : 'neutral' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page" style={{ gap: 28 }}>

        {/* Hero header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a4731 0%, #2D6A4F 60%, #40916C 100%)',
          borderRadius: 8,
          padding: '28px 32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)',
            backgroundSize: '16px 16px',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.75, marginBottom: 6 }}>
                  SIH 2026 · Intelligent Mining
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: '-0.5px' }}>
                  MANGANAI
                </h1>
                <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6, fontWeight: 400, maxWidth: 520 }}>
                  AI-powered Manganese Exploration &amp; Supply Intelligence for India's Critical Mineral Future
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: apiOnline ? '#52B788' : '#F59E0B', flexShrink: 0 }} />
                  {apiOnline === null ? 'Connecting…' : apiOnline ? 'API Operational' : 'Demo Mode Active'}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 10,
                  opacity: 0.8,
                }}>
                  ⚠ DEMO DATA ACTIVE — Not certified geological estimates
                </div>
              </div>
            </div>

            {/* Pipeline steps */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              {['Satellite / Remote Sensing', 'Geology Integration', 'AI Prospectivity', 'Exploration Targets', 'Field Validation', 'Model Update'].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <div style={{
                    padding: '4px 12px',
                    background: i === 2 || i === 3 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: i === 2 || i === 3 ? 700 : 500,
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                  }}>
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <span style={{ fontSize: 12, opacity: 0.5, padding: '0 4px' }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Key stats */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            <span className="spinner" />Loading system status…
          </div>
        ) : (
          <div className="stats-row" style={{ flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} className="stat-box" style={{ minWidth: 100, flex: '1 1 120px' }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color || 'var(--text-primary)', fontSize: 24 }}>{s.value}</div>
                {s.sub && <div className="stat-sub">{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Module cards */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14 }}>
            Platform Modules
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {NAV_CARDS.map(card => (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 18,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: 'var(--shadow-xs)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = card.color;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `var(--shadow-md), 0 0 0 1px ${card.color}22`;
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-xs)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: card.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: card.color, flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {card.title}
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--text-muted)' }}>›</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {card.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top targets preview */}
        {targets.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top AI-Ranked Targets</span>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/targets')}>
                View All {targets.length} →
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Target</th>
                    <th>State</th>
                    <th>Priority</th>
                    <th>Prospectivity</th>
                    <th>Confidence</th>
                    <th>Area km²</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.slice(0, 5).map((t, i) => (
                    <tr key={t.target_id} onClick={() => navigate('/targets')} style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{t.target_id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.name}</div>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.state}</td>
                      <td><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar-track">
                            <div className="score-bar-fill green" style={{ width: `${t.prospectivity * 100}%` }} />
                          </div>
                          <span className="score-bar-label">{(t.prospectivity * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar-track">
                            <div className="score-bar-fill blue" style={{ width: `${t.confidence * 100}%` }} />
                          </div>
                          <span className="score-bar-label">{(t.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.area_km2.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Closed loop diagram card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">MANGANAI Closed-Loop System</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Every field result updates the next prediction</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', padding: '8px 0' }}>
              {[
                { icon: '🛰', label: 'Space', sub: 'Sentinel-2 / SRTM' },
                { icon: '🗺', label: 'Geology', sub: 'GSI Formation maps' },
                { icon: '🤖', label: 'AI Model', sub: 'Random Forest' },
                { icon: '📍', label: 'Targets', sub: 'Ranked zones' },
                { icon: '🧪', label: 'Field', sub: 'Sample & drill' },
                { icon: '🔄', label: 'Feedback', sub: 'Model update' },
              ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 16px' }}>
                    <div style={{ fontSize: 24 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{s.sub}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <span style={{ fontSize: 20, color: 'var(--border-dark)', flexShrink: 0 }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              "Every field result becomes new evidence for the next exploration decision." — MANGANAI System Design
            </div>
          </div>
        </div>

        <div className="demo-banner">
          <span>ℹ</span>
          All data shown is for system demonstration only. Not certified geological reserve or production estimates. Prospectivity scores are AI-generated from synthetic training data.
        </div>

      </div>
    </div>
  );
}
