import React, { useState, useRef, useEffect } from 'react';

const DEPTH_LEVELS = [
  { depth: '0–25 m',    label: 'Surface / Near-surface',  color: '#2D6A4F', note: 'Supergene enrichment zone — laterite-hosted Mn', icon: '🌿' },
  { depth: '25–50 m',   label: 'Shallow subsurface',      color: '#40916C', note: 'Primary ore zone — Mn-phyllite contact', icon: '⛏' },
  { depth: '50–100 m',  label: 'Intermediate depth',      color: '#B45309', note: 'Requires drilling confirmation', icon: '🔩' },
  { depth: '100–150 m', label: 'Deep zone',               color: '#92522E', note: 'Limited evidence — geophysical inference', icon: '📡' },
  { depth: '150+ m',    label: 'Very deep',               color: '#6B7280', note: 'Geophysical inference only', icon: '❓' },
];

const TARGETS = [
  { id: 'M-001', name: 'Balaghat North Extension',   state: 'Madhya Pradesh',  lat: 22.18, lng: 80.32, depth_min: 25,  depth_max: 75,  priority: 'HIGH',     prosp: 0.91 },
  { id: 'M-002', name: 'Sausar Valley Deep',         state: 'Maharashtra',     lat: 21.72, lng: 79.38, depth_min: 50,  depth_max: 100, priority: 'HIGH',     prosp: 0.87 },
  { id: 'M-003', name: 'Eastern Ghats Corridor',     state: 'Andhra Pradesh',  lat: 18.45, lng: 83.55, depth_min: 25,  depth_max: 75,  priority: 'HIGH',     prosp: 0.85 },
  { id: 'M-004', name: 'Sandur Extension South',     state: 'Karnataka',       lat: 14.82, lng: 76.48, depth_min: 0,   depth_max: 50,  priority: 'HIGH',     prosp: 0.83 },
  { id: 'M-005', name: 'Joda Belt Extension',        state: 'Odisha',          lat: 21.95, lng: 85.48, depth_min: 50,  depth_max: 100, priority: 'HIGH',     prosp: 0.82 },
  { id: 'M-006', name: 'Koraput Alkaline Zone',      state: 'Odisha',          lat: 18.95, lng: 82.88, depth_min: 75,  depth_max: 150, priority: 'MODERATE', prosp: 0.78 },
  { id: 'M-007', name: 'Nagpur Belt North',          state: 'Maharashtra',     lat: 21.45, lng: 79.18, depth_min: 25,  depth_max: 75,  priority: 'MODERATE', prosp: 0.76 },
];

// Per-target prospectivity at depth
const DEPTH_DATA: Record<string, { depth: string; prosp: number; conf: number }[]> = {
  'M-001': [
    { depth: '0–25 m',    prosp: 0.61, conf: 0.72 },
    { depth: '25–50 m',   prosp: 0.91, conf: 0.84 },
    { depth: '50–100 m',  prosp: 0.78, conf: 0.68 },
    { depth: '100–150 m', prosp: 0.42, conf: 0.38 },
    { depth: '150+ m',    prosp: 0.22, conf: 0.19 },
  ],
  'M-002': [
    { depth: '0–25 m',    prosp: 0.45, conf: 0.52 },
    { depth: '25–50 m',   prosp: 0.70, conf: 0.65 },
    { depth: '50–100 m',  prosp: 0.87, conf: 0.79 },
    { depth: '100–150 m', prosp: 0.61, conf: 0.55 },
    { depth: '150+ m',    prosp: 0.31, conf: 0.27 },
  ],
  'M-003': [
    { depth: '0–25 m',    prosp: 0.55, conf: 0.61 },
    { depth: '25–50 m',   prosp: 0.85, conf: 0.77 },
    { depth: '50–100 m',  prosp: 0.72, conf: 0.64 },
    { depth: '100–150 m', prosp: 0.48, conf: 0.42 },
    { depth: '150+ m',    prosp: 0.25, conf: 0.21 },
  ],
  'M-004': [
    { depth: '0–25 m',    prosp: 0.83, conf: 0.76 },
    { depth: '25–50 m',   prosp: 0.68, conf: 0.61 },
    { depth: '50–100 m',  prosp: 0.44, conf: 0.39 },
    { depth: '100–150 m', prosp: 0.27, conf: 0.23 },
    { depth: '150+ m',    prosp: 0.14, conf: 0.11 },
  ],
  'M-005': [
    { depth: '0–25 m',    prosp: 0.48, conf: 0.55 },
    { depth: '25–50 m',   prosp: 0.65, conf: 0.59 },
    { depth: '50–100 m',  prosp: 0.82, conf: 0.75 },
    { depth: '100–150 m', prosp: 0.66, conf: 0.60 },
    { depth: '150+ m',    prosp: 0.38, conf: 0.34 },
  ],
  'M-006': [
    { depth: '0–25 m',    prosp: 0.35, conf: 0.40 },
    { depth: '25–50 m',   prosp: 0.52, conf: 0.48 },
    { depth: '50–100 m',  prosp: 0.67, conf: 0.61 },
    { depth: '100–150 m', prosp: 0.78, conf: 0.71 },
    { depth: '150+ m',    prosp: 0.50, conf: 0.45 },
  ],
  'M-007': [
    { depth: '0–25 m',    prosp: 0.58, conf: 0.63 },
    { depth: '25–50 m',   prosp: 0.76, conf: 0.70 },
    { depth: '50–100 m',  prosp: 0.64, conf: 0.58 },
    { depth: '100–150 m', prosp: 0.41, conf: 0.37 },
    { depth: '150+ m',    prosp: 0.23, conf: 0.19 },
  ],
};

export default function Subsurface() {
  const [selectedTarget, setSelectedTarget] = useState(TARGETS[0]);
  const [selectedDepthIdx, setSelectedDepthIdx] = useState(1);
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const depthData = DEPTH_DATA[selectedTarget.id] || DEPTH_DATA['M-001'];
  const current = depthData[selectedDepthIdx];
  const dl = DEPTH_LEVELS[selectedDepthIdx];

  const handleTargetChange = (id: string) => {
    const t = TARGETS.find(t => t.id === id) || TARGETS[0];
    setSelectedTarget(t);
    setAnimating(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAnimating(false), 500);
  };

  // Auto-cycle animation on depth select
  const selectDepth = (i: number) => {
    setSelectedDepthIdx(i);
    setAnimating(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAnimating(false), 400);
  };

  const priorityColor = selectedTarget.priority === 'HIGH' ? 'var(--green)' : 'var(--amber)';

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Subsurface Data Cube</h1>
            <p className="page-subtitle">Depth-stratified prospectivity estimates — Integrated geological + geophysical evidence</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ fontSize: 12 }}
              value={selectedTarget.id}
              onChange={e => handleTargetChange(e.target.value)}
            >
              {TARGETS.map(t => (
                <option key={t.id} value={t.id}>{t.id} — {t.name}</option>
              ))}
            </select>
            <div className="demo-banner">
              <span>⚠</span>
              DEMO DATA
            </div>
          </div>
        </div>

        {/* Target overview */}
        <div className="stats-row" style={{ flexWrap: 'wrap' }}>
          {[
            { l: 'Target', v: selectedTarget.id, sub: selectedTarget.name },
            { l: 'Priority', v: selectedTarget.priority, sub: selectedTarget.state, color: priorityColor },
            { l: 'Est. Prospectivity', v: `${(selectedTarget.prosp * 100).toFixed(0)}%`, sub: 'Surface model', color: priorityColor },
            { l: 'Depth Range', v: `${selectedTarget.depth_min}–${selectedTarget.depth_max}m`, sub: 'Estimated ore zone' },
            { l: 'Location', v: `${selectedTarget.lat.toFixed(2)}°N`, sub: `${selectedTarget.lng.toFixed(2)}°E` },
          ].map(s => (
            <div key={s.l} className="stat-box" style={{ flex: '1 1 110px' }}>
              <div className="stat-label">{s.l}</div>
              <div className="stat-value" style={{ fontSize: 16, color: s.color || 'var(--text-primary)' }}>{s.v}</div>
              {s.sub && <div className="stat-sub">{s.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: 3D Cube + depth selector */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Manganese Data Cube — {selectedTarget.id}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click layer to select depth</span>
            </div>

            <div className="card-body" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 32, flexWrap: 'wrap', padding: 24
            }}>
              {/* 3D Cube SVG */}
              <svg width={200} height={260} viewBox="-30 -15 230 275" style={{ overflow: 'visible' }}>
                {/* Top face */}
                <polygon
                  points="80,0 190,0 220,30 110,30"
                  fill="#E7E8EA" stroke="#C8CDD4" strokeWidth={1}
                />
                {/* Right face */}
                <polygon
                  points="190,0 220,30 220,200 190,170"
                  fill="#DDDFE2" stroke="#C8CDD4" strokeWidth={1}
                />

                {/* Front face — divided by depth */}
                {DEPTH_LEVELS.map((dl, i) => {
                  const yStart = 30 + i * 34;
                  const yEnd = yStart + 34;
                  const isSelected = i === selectedDepthIdx;
                  const alpha = isSelected ? 0.80 : 0.22;
                  const isOreZone = yStart / 170 * 150 >= selectedTarget.depth_min &&
                                    yEnd / 170 * 150 <= selectedTarget.depth_max + 30;
                  return (
                    <g key={i} onClick={() => selectDepth(i)} style={{ cursor: 'pointer' }}>
                      <rect
                        x={0} y={yStart} width={190} height={34}
                        fill={dl.color} fillOpacity={alpha}
                        stroke={isSelected ? dl.color : '#D4D7DA'}
                        strokeWidth={isSelected ? 2 : 0.5}
                      />
                      {isOreZone && !isSelected && (
                        <rect x={0} y={yStart} width={190} height={34}
                          fill="none" stroke={dl.color} strokeWidth={1} strokeDasharray="3,2" />
                      )}
                      {/* Depth label on left */}
                      <text
                        x={-28} y={yStart + 20}
                        fontSize={8.5} fill="var(--text-secondary)"
                        textAnchor="end"
                        fontFamily="IBM Plex Mono, monospace"
                      >
                        {i === 0 ? '0m' : `${i * 30}m`}
                      </text>
                      {/* Prospectivity mini-bar inside cube */}
                      {isSelected && (
                        <>
                          <rect
                            x={4} y={yStart + 10} width={182} height={6}
                            fill="rgba(0,0,0,0.1)" rx={3}
                          />
                          <rect
                            x={4} y={yStart + 10}
                            width={Math.round(depthData[i].prosp * 182)} height={6}
                            fill="white" fillOpacity={0.7} rx={3}
                          />
                        </>
                      )}
                    </g>
                  );
                })}
                {/* Bottom depth label */}
                <text x={-28} y={30 + 5 * 34 + 4} fontSize={8.5} fill="var(--text-muted)" textAnchor="end" fontFamily="IBM Plex Mono, monospace">150m</text>

                {/* Vertical axis */}
                <line x1={0} y1={30} x2={0} y2={200} stroke="var(--border-dark)" strokeWidth={1.5} />

                {/* Coordinate labels */}
                <text x={95} y={245} fontSize={8} fill="var(--text-muted)" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">
                  X → {selectedTarget.lng.toFixed(2)}°E
                </text>
                <text x={-28} y={16} fontSize={8} fill="var(--text-muted)" textAnchor="end" fontFamily="IBM Plex Mono, monospace">Z↑</text>

                {/* Ore zone bracket */}
                {selectedTarget.depth_min < 150 && (
                  <>
                    <line
                      x1={195} y1={30 + (selectedTarget.depth_min / 150) * 170}
                      x2={205} y2={30 + (selectedTarget.depth_min / 150) * 170}
                      stroke={priorityColor} strokeWidth={1.5}
                    />
                    <line
                      x1={200} y1={30 + (selectedTarget.depth_min / 150) * 170}
                      x2={200} y2={30 + (Math.min(selectedTarget.depth_max, 150) / 150) * 170}
                      stroke={priorityColor} strokeWidth={1.5}
                    />
                    <line
                      x1={195} y1={30 + (Math.min(selectedTarget.depth_max, 150) / 150) * 170}
                      x2={205} y2={30 + (Math.min(selectedTarget.depth_max, 150) / 150) * 170}
                      stroke={priorityColor} strokeWidth={1.5}
                    />
                    <text
                      x={210} y={30 + ((selectedTarget.depth_min + Math.min(selectedTarget.depth_max, 150)) / 2 / 150) * 170}
                      fontSize={7.5} fill={priorityColor} fontWeight={600} fontFamily="IBM Plex Mono, monospace"
                    >Ore</text>
                  </>
                )}
              </svg>

              {/* Depth selector list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Depth Interval
                </div>
                {DEPTH_LEVELS.map((dl, i) => (
                  <div
                    key={i}
                    onClick={() => selectDepth(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '6px 12px', borderRadius: 4, border: '1px solid',
                      borderColor: selectedDepthIdx === i ? dl.color : 'var(--border)',
                      background: selectedDepthIdx === i ? `${dl.color}18` : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: dl.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: selectedDepthIdx === i ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: selectedDepthIdx === i ? 600 : 400 }}>
                        {dl.depth}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dl.icon} {dl.label}</div>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: dl.color, fontWeight: 600 }}>
                      {(depthData[i].prosp * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Properties + cross-section chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Selected depth details */}
            <div className="card" style={{ transition: 'opacity 0.3s', opacity: animating ? 0.5 : 1 }}>
              <div className="card-header">
                <span className="card-title">Selected Interval — {dl.depth}</span>
                <span style={{ fontSize: 12, color: dl.color }}>{dl.icon} {dl.label}</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="metric-item">
                    <div className="metric-label">Prospectivity</div>
                    <div className="metric-value" style={{ color: dl.color }}>{(current.prosp * 100).toFixed(0)}%</div>
                    <div className="metric-sub">Model estimate</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Confidence</div>
                    <div className="metric-value">{(current.conf * 100).toFixed(0)}%</div>
                    <div className="metric-sub">Prediction CI</div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, padding: '10px 14px', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Geological note:</strong> {dl.note}
                </div>

                {/* Ore zone indicator */}
                {selectedTarget.depth_min <= (selectedDepthIdx * 30) && selectedTarget.depth_max >= (selectedDepthIdx * 30) && (
                  <div style={{ marginTop: 10, padding: '6px 12px', background: 'var(--green-bg)', borderRadius: 4, border: '1px solid #95D5B2', fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✓</span>
                    Within estimated ore zone ({selectedTarget.depth_min}–{selectedTarget.depth_max} m)
                  </div>
                )}
              </div>
            </div>

            {/* Depth profile bar chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Prospectivity Profile</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedTarget.id}</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {depthData.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => selectDepth(i)}
                    style={{ cursor: 'pointer', padding: '4px 0', borderRadius: 3 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11,
                        color: i === selectedDepthIdx ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: i === selectedDepthIdx ? 600 : 400,
                        fontFamily: 'IBM Plex Mono, monospace',
                      }}>
                        {p.depth}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: DEPTH_LEVELS[i].color, fontWeight: 600 }}>
                        {(p.prosp * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="score-bar-track" style={{ height: 8, borderRadius: 4 }}>
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${p.prosp * 100}%`,
                          background: DEPTH_LEVELS[i].color,
                          opacity: i === selectedDepthIdx ? 1 : 0.45,
                          transition: 'width 0.5s ease',
                          height: '100%',
                        }}
                      />
                    </div>
                    {/* Confidence underlay */}
                    <div className="score-bar-track" style={{ height: 3, borderRadius: 2, marginTop: 2 }}>
                      <div
                        style={{
                          width: `${p.conf * 100}%`,
                          background: '#9AA0A8',
                          height: '100%',
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Dark bars = Prospectivity · Light bars = Confidence
                </div>
              </div>
            </div>

            {/* Location + terrain */}
            <div className="card">
              <div className="card-header"><span className="card-title">Site Context</span></div>
              <div className="card-body">
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, marginBottom: 10, color: 'var(--text-primary)' }}>
                  {selectedTarget.lat.toFixed(4)}°N, {selectedTarget.lng.toFixed(4)}°E
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'State', v: selectedTarget.state },
                    { l: 'Priority', v: selectedTarget.priority },
                    { l: 'Ore Depth', v: `${selectedTarget.depth_min}–${selectedTarget.depth_max} m` },
                    { l: 'Formation', v: 'Sausar Group' },
                  ].map(m => (
                    <div key={m.l}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{m.l}</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-banner">
          <span>ℹ</span>
          Subsurface Prospectivity Estimate — Based on integrated geological, geophysical and available evidence. Not satellite-detected subsurface manganese. Not certified reserve estimates.
        </div>
      </div>
    </div>
  );
}
