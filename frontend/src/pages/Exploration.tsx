import React, { useEffect, useState, useCallback } from 'react';
import MapContainer from '../map/MapContainer';
import LayerPanel from '../map/LayerPanel';
import TargetDrawer from '../map/TargetDrawer';
import { getTargets, getLayers, runPrediction, getProspectivityGrid } from '../services/api';
import type { Target, Layer } from '../services/api';

const DEMO_GRID = Array.from({ length: 50 }, (_, i) => ({
  lat: 18 + Math.random() * 6,
  lng: 77 + Math.random() * 8,
  prospectivity: Math.random(),
}));

export default function Exploration() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [opacity, setOpacity] = useState<Record<string, number>>({});
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [prospGrid, setProspGrid] = useState<any[]>([]);
  const [coords, setCoords] = useState('20.5000°N, 80.5000°E');
  const [predRunning, setPredRunning] = useState(false);
  const [predStatus, setPredStatus] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([getTargets(), getLayers()])
      .then(([t, l]) => {
        setTargets(t.targets);
        setLayers(l.layers);
        const vis: Record<string, boolean> = {};
        const op: Record<string, number> = {};
        l.layers.forEach(layer => {
          vis[layer.id] = layer.default_visible;
          op[layer.id] = layer.opacity;
        });
        setVisibility(vis);
        setOpacity(op);
      })
      .catch(() => setLoadError('API offline — using demo data'));
  }, []);

  const handleRunPrediction = async () => {
    setPredRunning(true);
    const steps = [
      'Processing geospatial layers…',
      'Extracting spectral features…',
      'Running Random Forest model…',
      'Generating prospectivity surface…',
      'Clustering high-potential zones…',
      'Prediction complete.',
    ];

    for (let i = 0; i < steps.length; i++) {
      setPredStatus(steps[i]);
      await new Promise(r => setTimeout(r, 700));
    }

    try {
      const result = await runPrediction();
      setTargets(result.targets || targets);
      const gridData = result.prospectivity_grid || DEMO_GRID;
      setProspGrid(gridData);
      setVisibility(v => ({ ...v, prospectivity: true }));
    } catch {
      setProspGrid(DEMO_GRID);
      setVisibility(v => ({ ...v, prospectivity: true }));
    }

    setPredRunning(false);
    setPredStatus('');
  };

  const handleSearch = (val: string) => {
    setSearchVal(val);
    const found = targets.find(t =>
      t.target_id.toLowerCase() === val.toLowerCase() ||
      t.name.toLowerCase().includes(val.toLowerCase())
    );
    if (found) setSelectedTarget(found);
  };

  const toggleLayer = useCallback((id: string) => {
    setVisibility(v => ({ ...v, [id]: !v[id] }));
  }, []);

  const changeOpacity = useCallback((id: string, val: number) => {
    setOpacity(v => ({ ...v, [id]: val }));
  }, []);

  return (
    <div className="exploration-layout">
      {/* Map Area */}
      <div className="map-area">
        <MapContainer
          targets={targets}
          layers={visibility}
          onTargetClick={setSelectedTarget}
          selectedTarget={selectedTarget}
          prospectivityGrid={prospGrid}
          onCoordsChange={setCoords}
        />

        {/* Bottom bar */}
        <div className="map-bottombar">
          {/* Search */}
          <div className="search-box">
            <svg className="search-icon" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
            </svg>
            <input
              className="search-input"
              placeholder="Search target, coordinates…"
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          <div className="topbar-divider" />

          {/* Run Prediction */}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleRunPrediction}
            disabled={predRunning}
          >
            {predRunning ? (
              <>
                <span className="spinner" />
                <span>Running…</span>
              </>
            ) : (
              <>⬡ Run AI Prediction</>
            )}
          </button>

          {predStatus && (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {predStatus}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Coordinates */}
          <span className="map-coords">{coords}</span>
          <div className="topbar-divider" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            India Manganese Belt · {targets.length} targets · Scale ~1:500,000
          </span>

          {loadError && (
            <span style={{ fontSize: 11, color: 'var(--amber)', marginLeft: 8 }}>⚠ {loadError}</span>
          )}
        </div>

        {/* Target Drawer */}
        <TargetDrawer target={selectedTarget} onClose={() => setSelectedTarget(null)} />
      </div>

      {/* Layer Panel */}
      <LayerPanel
        layers={layers}
        visibility={visibility}
        opacity={opacity}
        onToggle={toggleLayer}
        onOpacity={changeOpacity}
      />
    </div>
  );
}
