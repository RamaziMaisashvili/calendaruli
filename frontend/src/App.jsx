import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import TeachersCRUD from './components/TeachersCRUD';
import StudentsCRUD from './components/StudentsCRUD';
import CalendarGenerator from './components/CalendarGenerator';
import AcademicScheduleManager from './components/AcademicScheduleManager';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>იტვირთება სისტემა...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'academic-schedule' && <AcademicScheduleManager />}
      {activeTab === 'calendar' && <CalendarGenerator />}
      {activeTab === 'teachers' && <TeachersCRUD />}
      {activeTab === 'students' && <StudentsCRUD />}
      {activeTab === 'resources' && <FileUpload />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
