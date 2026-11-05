import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="fade-in">
      <div className="upload-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <LayoutDashboard size={24} color="var(--primary)" />
          <h3 className="upload-card-title" style={{ margin: 0 }}>დაშბორდი</h3>
        </div>
        <p className="upload-card-sub" style={{ margin: 0 }}>
          მოგესალმებით, <strong>{user?.name || user?.username}</strong>. მართვის პანელი მზადაა.
        </p>
      </div>
    </div>
  );
}

