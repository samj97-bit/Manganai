import React, { useEffect, useState } from 'react';
import { getModelStatus, getModelVersions, trainModel } from '../services/api';
import type { ModelStatus, ModelVersion } from '../services/api';

const FEATURE_LABELS: Record<string, string> = {
  geology_score: 'Geology',
  spectral_fe_mn_ratio: 'Spectral Response',
  dist_to_occurrence_km: 'Known Occurrence',
  dist_to_fault_km: 'Distance to Fault',
  terrain_roughness: 'Terrain',
  elevation: 'Elevation',
  slope: 'Slope',
  spectral_clay_index: 'Clay Index',
  magnetic_anomaly: 'Magnetic Anomaly',
  em_response: 'EM Response',
  spectral_ndvi: 'NDVI',
  drilling_evidence: 'Drilling Evidence',
};

type TrainStep = 'idle' | 'loading' | 'training' | 'evaluating' | 'comparing' | 'done' | 'rejected';

export default function ModelPage() {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [trainStep, setTrainStep] = useState<TrainStep>('idle');
  const [trainResult, setTrainResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'versions' | 'features'>('overview');

  const load = () => {
    Promise.all([getModelStatus(), getModelVersions()])
      .then(([s, v]) => { setStatus(s); setVersions(v.versions); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTrain = async () => {
    setTrainStep('loading');
    setTrainResult(null);

    const steps: [TrainStep, number][] = [
      ['loading', 800],
      ['training', 2200],
      ['evaluating', 1200],
      ['comparing', 900],
    ];

    for (const [step, delay] of steps) {
      setTrainStep(step);
      await new Promise(r => setTimeout(r, delay));
    }

    try {
      const result = await trainModel();
      setTrainResult(result);
      setTrainStep(result.deployed ? 'done' : 'rejected');
      load(); // refresh
    } catch (err: any) {
      setTrainResult({ error: 'Training failed. Previous model retained.' });
      setTrainStep('rejected');
    }
  };

  const stepLabels: Record<TrainStep, string> = {
    idle: '',
    loading: 'Loading validated samples…',
    training: 'Training Random Forest model…',
    evaluating: 'Evaluating on validation set…',
    comparing: 'Comparing against current model…',
    done: 'New model deployed.',
    rejected: 'Model update rejected — previous model retained.',
  };

  const isRunning = ['loading', 'training', 'evaluating', 'comparing'].includes(trainStep);

  const fiSorted = status?.feature_importance
    ? Object.entries(status.feature_importance).sort(([, a], [, b]) => b - a)
    : [];
  const maxFI = fiSorted[0]?.[1] || 1;

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
      <span className="spinner" /> Loading model status…
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">ML Model</h1>
            <p className="page-subtitle">Prospectivity model lifecycle — Training, versioning and adaptive learning</p>
          </div>
          <div className="status-pill">
            <span className="status-dot green" />
            <span className="status-text">{status?.status || 'Operational'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ background: 'var(--bg-white)', borderRadius: 4, border: '1px solid var(--border)' }}>
          {(['overview', 'versions', 'features'] as const).map(t => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}
              style={{ textTransform: 'capitalize' }}>{t === 'features' ? 'Feature Importance' : t.charAt(0).toUpperCase() + t.slice(1)}</div>
          ))}
        </div>

        {tab === 'overview' && status && (
          <>
            {/* Key metrics */}
            <div className="stats-row">
              {[
                { l: 'Current Version', v: status.version, sub: status.algorithm },
                { l: 'F1 Score', v: status.f1_score.toFixed(3), sub: 'Validation set' },
                { l: 'Recall', v: status.recall.toFixed(3), sub: '' },
                { l: 'Precision', v: status.precision.toFixed(3), sub: '' },
                { l: 'Training Samples', v: status.training_samples.toLocaleString(), sub: '' },
                { l: 'Validated Samples', v: status.validated_samples.toString(), sub: 'Field records' },
              ].map(m => (
                <div key={m.l} className="stat-box">
                  <div className="stat-label">{m.l}</div>
                  <div className="stat-value" style={{ fontSize: 20 }}>{m.v}</div>
                  {m.sub && <div className="stat-sub">{m.sub}</div>}
                </div>
              ))}
            </div>

            {/* Adaptive learning loop */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Adaptive Learning Loop</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Field validation → Model update → New prediction</span>
              </div>
              <div className="card-body">
                {/* Flow diagram */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'center' }}>
                  {['Field Result', 'Quality Check', 'Training Data Update', 'Model Retraining', 'Model Comparison', 'New Prospectivity Map'].map((s, i, arr) => (
                    <React.Fragment key={s}>
                      <div style={{
                        padding: '5px 12px', border: '1px solid var(--border)',
                        borderRadius: 4, fontSize: 11, fontWeight: 500,
                        background: i === 0 ? 'var(--green-bg)' : i === arr.length - 1 ? 'var(--blue-bg)' : 'var(--bg-secondary)',
                        color: i === 0 ? 'var(--green)' : i === arr.length - 1 ? 'var(--blue)' : 'var(--text-secondary)',
                      }}>{s}</div>
                      {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>→</span>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Process steps */}
                <div className="process-steps">
                  {[
                    { key: 'loading', label: 'Load validated samples from field records' },
                    { key: 'training', label: 'Combine with base training data and retrain model' },
                    { key: 'evaluating', label: 'Evaluate new model on held-out validation set' },
                    { key: 'comparing', label: 'Compare metrics against active model version' },
                    { key: 'done', label: 'Deploy if improved; reject if performance declines' },
                  ].map(step => {
                    const stepOrder = ['idle', 'loading', 'training', 'evaluating', 'comparing', 'done', 'rejected'];
                    const idx = stepOrder.indexOf(trainStep);
                    const stepIdx = stepOrder.indexOf(step.key);
                    const stepClass = trainStep === 'idle' ? '' : idx > stepIdx ? 'done' : idx === stepIdx ? 'active' : '';
                    return (
                      <div key={step.key} className={`process-step ${stepClass}`}>
                        <div className="step-dot" />
                        <span>{step.label}</span>
                        {trainStep === step.key && <span className="spinner" style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Train button */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn btn-primary" onClick={handleTrain} disabled={isRunning}
                    style={{ padding: '8px 24px' }}>
                    {isRunning ? <><span className="spinner" /> {stepLabels[trainStep]}</> : '⬆ UPDATE MODEL'}
                  </button>
                  {(trainStep === 'done' || trainStep === 'rejected') && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: trainStep === 'done' ? 'var(--green)' : 'var(--amber)',
                    }}>
                      {trainStep === 'done' ? '✓' : '△'} {stepLabels[trainStep]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Comparison result */}
            {trainResult && trainResult.comparison && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Model Comparison</span>
                  <span className={`badge ${trainResult.deployed ? 'badge-high' : 'badge-moderate'}`}>
                    {trainResult.status}
                  </span>
                </div>
                <div className="card-body">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>{trainResult.previous_version || 'Previous'}</th>
                        <th>{trainResult.new_version || 'New'}</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(trainResult.comparison).map(([metric, vals]: [string, any]) => {
                        const improved = vals.new > vals.previous;
                        const diff = (vals.new - vals.previous).toFixed(3);
                        return (
                          <tr key={metric}>
                            <td>{metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                            <td>{vals.previous.toFixed(3)}</td>
                            <td className={improved ? 'metric-improved' : 'metric-worse'}>{vals.new.toFixed(3)}</td>
                            <td className={improved ? 'metric-improved' : 'metric-worse'}>
                              {improved ? '+' : ''}{diff}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {!trainResult.deployed && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--amber-bg)', borderRadius: 4, border: '1px solid #FCD34D', fontSize: 12, color: 'var(--amber)' }}>
                      ⚠ New model rejected. Performance did not improve sufficiently. Previous model remains active.
                    </div>
                  )}
                  {trainResult.deployed && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--green-bg)', borderRadius: 4, border: '1px solid #95D5B2', fontSize: 12, color: 'var(--green)' }}>
                      ✓ {trainResult.new_version} deployed. Prospectivity map updated. Target ranking refreshed.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'versions' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Model Version History</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Algorithm</th>
                    <th>Training Samples</th>
                    <th>Validated Samples</th>
                    <th>F1 Score</th>
                    <th>Recall</th>
                    <th>Precision</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map(v => (
                    <tr key={v.version} style={{ background: v.is_active ? 'var(--green-bg)' : '' }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v.version}</td>
                      <td>{v.algorithm}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{v.training_samples.toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{v.validated_samples}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{v.f1_score.toFixed(3)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{v.recall.toFixed(3)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{v.precision.toFixed(3)}</td>
                      <td>
                        {v.is_active
                          ? <span className="badge badge-high">Active</span>
                          : <span className="badge badge-low">Retired</span>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(v.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'features' && status && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Feature Importance ({status.version})</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fiSorted.map(([feat, val]) => (
                  <div key={feat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {FEATURE_LABELS[feat] || feat.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {(val * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="score-bar-track" style={{ height: 7 }}>
                      <div className="score-bar-fill green" style={{ width: `${(val / maxFI) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header"><span className="card-title">Model Architecture</span></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { l: 'Primary Model', v: 'Random Forest' },
                    { l: 'Estimators', v: '200 trees' },
                    { l: 'Max Depth', v: '12' },
                    { l: 'Features', v: `${status.feature_count} input features` },
                    { l: 'Class Balance', v: 'Balanced weights' },
                    { l: 'Validation', v: '80/20 stratified split' },
                  ].map(m => (
                    <div key={m.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{m.l}</span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{m.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">Data Pipeline</span></div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {['SPACE', 'GEOLOGY', 'AI', 'TARGET', 'FIELD', 'EVIDENCE', 'MODEL', 'NEXT TARGET'].map((step, i, arr) => (
                      <React.Fragment key={step}>
                        <div style={{
                          padding: '4px 10px', background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)', borderRadius: 3, fontSize: 11,
                          fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-primary)',
                          textAlign: 'center'
                        }}>{step}</div>
                        {i < arr.length - 1 && (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, lineHeight: 0.8 }}>↓</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="demo-banner">
          <span>ℹ</span>
          DEMO DATA — Training uses synthetic demonstration dataset. Connect real geological survey data for production use.
        </div>
      </div>
    </div>
  );
}
