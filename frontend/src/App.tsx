import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import AppShell from './layout/AppShell';
import Dashboard from './pages/Dashboard';
import Exploration from './pages/Exploration';
import Targets from './pages/Targets';
import Subsurface from './pages/Subsurface';
import FieldValidation from './pages/FieldValidation';
import SupplyIntelligence from './pages/SupplyIntelligence';
import ModelPage from './pages/ModelPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exploration" element={<Exploration />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/subsurface" element={<Subsurface />} />
          <Route path="/validation" element={<FieldValidation />} />
          <Route path="/supply" element={<SupplyIntelligence />} />
          <Route path="/model" element={<ModelPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
