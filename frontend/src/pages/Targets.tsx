import React, { useEffect, useState } from 'react';
import { getTargets } from '../services/api';
import type { Target } from '../services/api';

export default function Targets() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Target | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [sortBy, setSortBy] = useState<'prospectivity' | 'confidence' | 'area_km2'>('prospectivity');

  useEffect(() => {
    getTargets().then(d => { setTargets(d.targets); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = targets
    .filter(t => filter === 'ALL' || t.priority === filter)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const countByPriority = (p: string) => targets.filter(t => t.priority === p).length;

  if (loading) return <div style={{ padding: 32, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}><span className="spinner" />Loading targets…</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%', overflow: 'hidden' }}>
      {/* Left: target list */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-white)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h1 className="page-title">Exploration Targets</h1>
              <p className="page-subtitle">AI-generated from prospectivity model</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ fontSize: 12 }}>
                <option value="prospectivity">Sort: Prospectivity</option>
                <option value="confidence">Sort: Confidence</option>
                <option value="area_km2">Sort: Area</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row" style={{ gap: 8 }}>
            {[
              { label: 'Total', val: targets.length, color: 'var(--text-primary)' },
              { label: 'High', val: countByPriority('HIGH'), color: 'var(--green)' },
              { label: 'Moderate', val: countByPriority('MODERATE'), color: 'var(--amber)' },
              { label: 'Low', val: countByPriority('LOW'), color: 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} className="stat-box" style={{ padding: '8px 12px' }}>
                <div className="stat-label" style={{ marginBottom: 2 }}>{s.label}</div>
                <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="tabs" style={{ marginTop: 12 }}>
            {(['ALL', 'HIGH', 'MODERATE', 'LOW'] as const).map(f => (
              <div key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Target</th>
                <th>State</th>
                <th>Priority</th>
                <th>Prospectivity</th>
                <th>Confidence</th>
                <th>Depth (m)</th>
                <th>Area km²</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.target_id} onClick={() => setSelected(t)}
                  style={{ background: selected?.target_id === t.target_id ? 'var(--green-bg)' : '' }}>
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
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.depth_min}–{t.depth_max}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.area_km2.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)' }}>
          DEMO DATA — For system demonstration only. Not certified geological reserve estimates.
        </div>
      </div>

      {/* Right: selected target detail */}
      <div style={{ borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-white)' }}>
        {selected ? (
          <TargetDetail target={selected} />
        ) : (
          <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
            Select a target to view details
          </div>
        )}
      </div>
    </div>
  );
}

function TargetDetail({ target }: { target: Target }) {
  const fc = target.feature_contributions || {};
  const sorted = Object.entries(fc).sort(([, a], [, b]) => b - a);
  const maxVal = sorted[0]?.[1] || 1;

  const LABELS: Record<string, string> = {
    geology_score: 'Geology', spectral_fe_mn_ratio: 'Spectral Response',
    dist_to_occurrence_km: 'Known Occurrence', dist_to_fault_km: 'Dist to Fault',
    terrain_roughness: 'Terrain', elevation: 'Elevation',
    magnetic_anomaly: 'Magnetic', em_response: 'EM Response',
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>{target.target_id}</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{target.name}</div>
        <div style={{ marginTop: 6 }}><span className={`badge badge-${target.priority.toLowerCase()}`}>{target.priority} PRIORITY</span></div>
      </div>

      <div className="metric-grid">
        {[
          { l: 'Prospectivity', v: `${(target.prospectivity * 100).toFixed(0)}%` },
          { l: 'Confidence', v: `${(target.confidence * 100).toFixed(0)}%` },
          { l: 'Est. Depth', v: `${target.depth_min}–${target.depth_max} m` },
          { l: 'Area', v: `${target.area_km2.toFixed(1)} km²` },
        ].map(m => (
          <div key={m.l} className="metric-item">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize: 18 }}>{m.v}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="section-label">Geology</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 4, padding: '8px 12px' }}>
          {target.geology}<br />
          <span style={{ color: 'var(--text-muted)' }}>{target.state} · {target.lat.toFixed(4)}°N, {target.lng.toFixed(4)}°E</span>
        </div>
      </div>

      <div>
        <div className="section-label">Feature Contribution</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(([feat, val]) => (
            <div key={feat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{LABELS[feat] || feat}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{(val * 100).toFixed(0)}%</span>
              </div>
              <div className="score-bar-track" style={{ height: 5 }}>
                <div className="score-bar-fill green" style={{ width: `${(val / maxVal) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="section-label">Evidence</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(target.evidence || []).map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--green-muted)', flexShrink: 0 }}>✓</span>
              <span style={{ color: 'var(--text-primary)' }}>{e}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 12px', background: 'var(--amber-bg)', borderRadius: 4, border: '1px solid #FCD34D', fontSize: 11, color: 'var(--amber)' }}>
        Recommended: {target.recommended_action || 'FIELD VALIDATION'}
      </div>
    </div>
  );
}
