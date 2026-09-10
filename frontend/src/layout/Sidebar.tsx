import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/dashboard',   label: 'Overview',           icon: '⌂' },
  { path: '/exploration', label: 'Exploration',        icon: '◎' },
  { path: '/targets',     label: 'Targets',            icon: '⊕' },
  { path: '/subsurface',  label: 'Subsurface',         icon: '▤' },
  { path: '/validation',  label: 'Field Validation',   icon: '✓' },
  { path: '/supply',      label: 'Supply Intelligence',icon: '⟳' },
  { path: '/model',       label: 'Model',              icon: '⬡' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sidebar">
      <div className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(item.path)}
          >
            <span className="nav-item-icon" style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-tagline">
          "Every field result becomes new evidence for the next exploration decision."
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
          SIH 2026 Prototype
        </div>
      </div>
    </nav>
  );
}
