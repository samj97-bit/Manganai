import React, { useEffect, useState } from 'react';
import { getModelStatus } from '../services/api';

interface Props {
  studyArea: string;
  modelVersion: string;
}

export default function TopBar({ studyArea }: Props) {
  const [modelVer, setModelVer] = useState('v1.0');
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    getModelStatus()
      .then(s => { setModelVer(s.version); setApiOk(true); })
      .catch(() => setApiOk(false));
  }, []);

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="topbar-brand">
        <span className="topbar-brand-name">MANGANAI</span>
        <span className="topbar-brand-subtitle">Manganese Exploration Intelligence</span>
      </div>

      <div className="topbar-divider" />

      {/* Study Area */}
      <div className="topbar-meta">
        <span className="topbar-meta-label">Study Area</span>
        <span className="topbar-meta-value">{studyArea}</span>
      </div>

      <div className="topbar-divider" />

      {/* Model */}
      <div className="topbar-meta">
        <span className="topbar-meta-label">Model</span>
        <span className="topbar-meta-value">Mn Prospectivity {modelVer}</span>
      </div>

      <div className="topbar-spacer" />

      {/* Demo badge */}
      <div className="demo-badge">
        <span>⚠</span>
        DEMO DATA ACTIVE
      </div>

      {/* Status */}
      <div className="status-pill">
        <span className={`status-dot ${apiOk === false ? 'amber' : 'green'}`} />
        <span className="status-text">
          {apiOk === null ? 'Connecting...' : apiOk ? 'Operational' : 'API Offline — Demo Mode'}
        </span>
      </div>
    </header>
  );
}
