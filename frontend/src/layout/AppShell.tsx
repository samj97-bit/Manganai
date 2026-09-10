import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

interface Props { children: React.ReactNode; }

export default function AppShell({ children }: Props) {
  const [studyArea, setStudyArea] = useState('India Manganese Belt');
  const [modelVersion, setModelVersion] = useState('v1.0');

  return (
    <div className="app-shell">
      <TopBar studyArea={studyArea} modelVersion={modelVersion} />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
