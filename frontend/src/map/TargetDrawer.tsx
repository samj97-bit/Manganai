import React, { useState } from 'react';
import type { Target } from '../services/api';

interface Props {
  target: Target | null;
  onClose: () => void;
}

const FEATURE_LABELS: Record<string, string> = {
  geology_score:         'Geology',
  spectral_fe_mn_ratio:  'Spectral Response',
  dist_to_occurrence_km: 'Known Occurrence',
  dist_to_fault_km:      'Distance to Fault',
  terrain_roughness:     'Terrain',
  elevation:             'Elevation',
  magnetic_anomaly:      'Magnetic Anomaly',
  em_response:           'EM Response',
};

export default function TargetDrawer({ target, onClose }: Props) {
  const [showWhy, setShowWhy] = useState(false);

  const priorityColor = target
    ? (target.priority === 'HIGH' ? 'var(--green)' :
       target.priority === 'MODERATE' ? 'var(--amber)' : 'var(--text-secondary)')
    : 'var(--text-secondary)';

  const fc = target?.feature_contributions || {};
  const sorted = Object.entries(fc).sort(([, a], [, b]) => b - a);
  const maxVal = sorted[0]?.[1] || 1;


  return (
    <div className={`target-drawer${!target ? ' hidden' : ''}`}>
      {target && (<>
      <div className="drawer-header">
        <div>
          <div className="drawer-target-id">{target.target_id}</div>
          <div className="drawer-target-name">{target.name}</div>
          <div style={{ marginTop: 6 }}>
            <span className={`badge badge-${target.priority.toLowerCase()}`}>{target.priority} PRIORITY</span>
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}>✕</button>
      </div>

      <div className="drawer-body">
        {/* Key Metrics */}
        <div className="metric-grid">
          <div className="metric-item">
            <div className="metric-label">Prospectivity</div>
            <div className="metric-value" style={{ color: priorityColor }}>
              {(target.prospectivity * 100).toFixed(0)}%
            </div>
            <div className="metric-sub">Model score</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Confidence</div>
            <div className="metric-value">{(target.confidence * 100).toFixed(0)}%</div>
            <div className="metric-sub">Prediction CI</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Est. Depth</div>
            <div className="metric-value" style={{ fontSize: 'var(--text-lg)' }}>
              {target.depth_min}–{target.depth_max} m
            </div>
            <div className="metric-sub">Subsurface estimate</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Area</div>
            <div className="metric-value" style={{ fontSize: 'var(--text-lg)' }}>
              {target.area_km2.toFixed(1)} km²
            </div>
            <div className="metric-sub">{target.state}</div>
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="section-label">Location</div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, padding: '8px 12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>
              {target.lat.toFixed(4)}°N, {target.lng.toFixed(4)}°E
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{target.geology}</div>
          </div>
        </div>

        {/* Evidence */}
        <div>
          <div className="section-label">Evidence</div>
          <div className="evidence-list">
            {(target.evidence || []).map((e, i) => (
              <div key={i} className="evidence-item">
                <span className="evidence-icon pos" style={{ fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 12 }}>{e}</span>
              </div>
            ))}
            {target.priority === 'LOW' && (
              <div className="evidence-item">
                <span className="evidence-icon neg" style={{ fontSize: 12 }}>−</span>
                <span style={{ fontSize: 12 }}>Limited subsurface evidence</span>
              </div>
            )}
          </div>
        </div>

        {/* Why This Target? */}
        <div className="why-panel">
          <div className="why-header" onClick={() => setShowWhy(v => !v)}>
            <span>Why {target.target_id}?</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{showWhy ? '▲' : '▼'} Feature Contribution</span>
          </div>
          {showWhy && (
            <div className="why-body">
              {sorted.map(([feat, val]) => {
                const label = FEATURE_LABELS[feat] || feat.replace(/_/g, ' ');
                const pct = Math.round((val / maxVal) * 100);
                const barColor = val > 0.20 ? 'var(--green-muted)' : val > 0.10 ? 'var(--amber-light)' : 'var(--border-dark)';
                return (
                  <div key={feat} className="feature-bar-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="feature-bar-label">{label}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {(val * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="score-bar-track">
                      <div className="score-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                Feature importance from Random Forest model
              </div>
            </div>
          )}
        </div>

        {/* Depth disclaimer */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4, padding: '8px 0', borderTop: '1px solid var(--border-light)' }}>
          Depth estimate: {target.depth_estimate_note || 'Estimated from integrated geological, geophysical and available subsurface evidence.'}
        </div>
      </div>

      <div className="drawer-footer">
        <div className="action-label">Recommended Action</div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          {target.recommended_action || 'FIELD VALIDATION'}
        </button>
      </div>
      </>)}
    </div>
  );
}
