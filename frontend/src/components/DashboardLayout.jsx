import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UploadCloud,
  LogOut,
  BookOpen,
  FolderOpen,
  Users,
  GraduationCap,
  Calendar,
  CalendarDays,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

export default function DashboardLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [sidebarSide, setSidebarSide] = useState(() => {
    try {
      return localStorage.getItem('sidebar_side') || 'left';
    } catch {
      return 'left';
    }
  });

  const toggleSidebarSide = () => {
    const next = sidebarSide === 'left' ? 'right' : 'left';
    setSidebarSide(next);
    try {
      localStorage.setItem('sidebar_side', next);
    } catch {}
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

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
    if (activeTab === 'academic-schedule') return 'სასწავლო კვირებისა და კალენდრის განრიგი';
    if (activeTab === 'calendar') return 'მოდულის კალენდარული გეგმა';
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
    <div className={`app-container ${sidebarSide === 'right' ? 'sidebar-right' : ''}`}>
      {/* მობილურის ფონი (Backdrop) */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 999,
          }}
        />
      )}

      {/* გვერდითი მენიუ */}
      <aside className={`sidebar ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="brand-title">სასწავლო რესურსები</div>
            </div>
          </div>

          {/* მობილურზე დახურვის ღილაკი */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="მენიუს დახურვა"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-nav">
          {/* 1. დაშბორდი */}
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>დაშბორდი</span>
          </button>

          {/* 2. სასწავლო კვირების განრიგი */}
          <button
            className={`nav-item ${activeTab === 'academic-schedule' ? 'active' : ''}`}
            onClick={() => handleNavClick('academic-schedule')}
          >
            <CalendarDays size={18} />
            <span>სასწავლო კვირების განრიგი</span>
          </button>

          {/* 3. მოდულის კალენდარული გეგმა */}
          <button
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => handleNavClick('calendar')}
          >
            <Calendar size={18} />
            <span>მოდულის კალენდარული გეგმა</span>
          </button>

          {/* 4. მასწავლებლები */}
          <button
            className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => handleNavClick('teachers')}
          >
            <Users size={18} />
            <span>მასწავლებლები</span>
          </button>

          {/* 5. სტუდენტები */}
          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleNavClick('students')}
          >
            <GraduationCap size={18} />
            <span>სტუდენტები</span>
          </button>

          {/* 6. რესურსები / ატვირთვა */}
          {isAdmin ? (
            <button
              className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => handleNavClick('resources')}
            >
              <UploadCloud size={18} />
              <span>ფაილების ატვირთვა</span>
            </button>
          ) : (
            <button
              className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => handleNavClick('resources')}
            >
              <FolderOpen size={18} />
              <span>{isTeacher ? 'ჩემი რესურსები' : 'სასწავლო რესურსები'}</span>
            </button>
          )}
        </div>

        {/* მენიუს ქვედა პანელი: მხარის გადამრთველი */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>მენიუს მდებარეობა:</span>
            <button
              type="button"
              onClick={toggleSidebarSide}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="მენიუს მხარის შეცვლა (მარცხნივ ან მარჯვნივ)"
            >
              {sidebarSide === 'right' ? '👉 მარჯვნივ' : '👈 მარცხნივ'}
            </button>
          </div>
        </div>
      </aside>

      {/* ძირითადი სამუშაო არე */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            {/* მენიუს დამალვა / გამოჩენის ღილაკი */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title={isSidebarOpen ? 'მენიუს დამალვა' : 'მენიუს გამოჩენა'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: isSidebarOpen ? '#f1f5f9' : '#2563eb',
                color: isSidebarOpen ? '#334155' : '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.15s',
              }}
            >
              <Menu size={18} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>
                {isSidebarOpen ? 'მენიუს დამალვა' : 'მენიუ'}
              </span>
            </button>

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
