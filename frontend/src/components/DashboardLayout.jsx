import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, UploadCloud, LogOut, BookOpen, FolderOpen, Users, GraduationCap } from 'lucide-react';

export default function DashboardLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'ადმინისტრატორი';
      case 'teacher':
        return 'მასწავლებელი';
      case 'student':
        return 'სტუდენტი';
      default:
        return '';
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'dashboard') return 'დაშბორდი';
    if (activeTab === 'teachers') return 'მასწავლებლების მართვა';
    if (activeTab === 'students') return 'სტუდენტების მართვა';
    if (activeTab === 'resources') {
      if (isAdmin) return 'ფაილების ატვირთვა და მართვა';
      if (isTeacher) return 'ჩემი სასწავლო რესურსები';
      return 'სასწავლო რესურსები';
    }
    return '';
  };

  return (
    <div className="app-container">
      {/* გვერდითი მენიუ */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="brand-title">სასწავლო რესურსები</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {/* 1. დაშბორდი */}
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>დაშბორდი</span>
          </button>

          {/* 2. მასწავლებლები */}
          <button
            className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <Users size={18} />
            <span>მასწავლებლები</span>
          </button>

          {/* 3. სტუდენტები */}
          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <GraduationCap size={18} />
            <span>სტუდენტები</span>
          </button>

          {/* 4. რესურსები / ატვირთვა */}
          {isAdmin ? (
            <button
              className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              <UploadCloud size={18} />
              <span>ფაილების ატვირთვა</span>
            </button>
          ) : (
            <button
              className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              <FolderOpen size={18} />
              <span>{isTeacher ? 'ჩემი რესურსები' : 'სასწავლო რესურსები'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* ძირითადი სამუშაო არე */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            <h2 className="page-title">{getPageTitle()}</h2>
          </div>

          <div className="header-right">
            <div className="user-profile">
              <div className="user-info" style={{ textAlign: 'right' }}>
                <span className="user-name">{user?.name || user?.username}</span>
                <span className="user-role">{getRoleLabel(user?.role)}</span>
              </div>
            </div>

            <button className="btn-logout" onClick={logout}>
              <LogOut size={16} />
              <span>გამოსვლა</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          <div className="content-max fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
