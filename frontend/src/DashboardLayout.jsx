import React, {useEffect, useState} from 'react';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import ProgramImport from './pages/ProgramImport';
import Groups from './pages/Groups';
import Teachers from './pages/Teachers';
import Buildings from './pages/Buildings';
import Shifts from './pages/Shifts';
import DaysOff from './pages/DaysOff';
import Holidays from './pages/Holidays';
import ScheduleBuilder from './pages/ScheduleBuilder';
import Calendar from './pages/Calendar';

export const menuItems = [
  {id: 'dashboard', title: 'მთავარი', component: Dashboard},
  {id: 'programs', title: 'სასწავლო პროგრამები', component: Programs},
  {id: 'import', title: 'პროგრამის დამატება', component: ProgramImport},
  {id: 'groups', title: 'ჯგუფები', component: Groups},
  {id: 'teachers', title: 'მასწავლებლები', component: Teachers},
  {id: 'buildings', title: 'შენობები და ოთახები', component: Buildings},
  {id: 'shifts', title: 'ცვლები და გაკვეთილების დროები', component: Shifts},
  {id: 'holidays', title: 'უქმე დღეები', component: Holidays},
  {id: 'days-off', title: 'კალენდარი და არდადეგები', component: DaysOff},
  {id: 'schedule-builder', title: 'განრიგის შედგენა', component: ScheduleBuilder},
  {id: 'calendar', title: 'განრიგის კალენდარი', component: Calendar},
];
function currentPage() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return menuItems.some(item => item.id === id) ? id : 'dashboard';
}
export default function DashboardLayout({onLogout, busy, error,role='manager'}) {
  const [active, setActive] = useState(currentPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('calendar.sidebar.collapsed') === 'true'; }
    catch { return false; }
  });
  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const change = event => { setIsMobile(event.matches); setMenuOpen(false); };
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('calendar.sidebar.collapsed', String(collapsed)); }
    catch { /* Navigation remains usable if browser storage is unavailable. */ }
  }, [collapsed]);
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const sidebarVisible = isMobile ? menuOpen : !collapsed;
  function toggleSidebar() {
    if (isMobile) setMenuOpen(open => !open);
    else setCollapsed(value => !value);
  }
  useEffect(() => {
    const handle = () => { setActive(currentPage()); setMenuOpen(false); };
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);
  const visibleItems=role==='teacher'?menuItems.filter(e=>e.id==='calendar').map(e=>({...e,title:'ჩემი კალენდარი'})):menuItems;
  const item = visibleItems.find(item => item.id === active)||visibleItems[0];
  const Page = item.component;
  useEffect(() => { document.title = item.title + ' — სასწავლო კალენდარი'; }, [active]);
  return <div className={'dashboard-layout' + (collapsed ? ' sidebar-collapsed' : '')}>
    <a className="skip-link" href="#main-content" onClick={event => {event.preventDefault(); document.getElementById('main-content')?.focus();}}>ძირითად შინაარსზე გადასვლა</a>
    {isMobile && menuOpen && <button className="sidebar-backdrop" aria-label="მენიუს დახურვა" onClick={() => setMenuOpen(false)}/>}
    <aside id="sidebar" inert={!sidebarVisible} aria-hidden={!sidebarVisible} className={'sidebar' + (menuOpen ? ' is-open' : '')}>
      <a className="sidebar-brand" href="#/dashboard"><span className="mark" aria-hidden="true">▦</span><span>სასწავლო<br/>კალენდარი</span></a>
      <span className="navigation-label">სამუშაო სივრცე</span>
      <nav aria-label="მთავარი მენიუ">
        {visibleItems.map((entry, index) => <a key={entry.id} href={'#/' + entry.id} className={'nav-item' + (active === entry.id ? ' active' : '')} aria-current={active === entry.id ? 'page' : undefined}>
          <span className="nav-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{entry.title}</span>
        </a>)}
      </nav>
      <div className="sidebar-bottom"><button className="logout-button" onClick={onLogout} disabled={busy}><span aria-hidden="true">↪</span>{busy ? 'მიმდინარეობს…' : 'გამოსვლა'}</button><small>calendar.learn.net.ge</small></div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-topbar"><button className="menu-toggle" aria-label={sidebarVisible ? 'მენიუს ჩაკეცვა' : 'მენიუს გახსნა'} title={sidebarVisible ? 'მენიუს ჩაკეცვა' : 'მენიუს გახსნა'} aria-controls="sidebar" aria-expanded={sidebarVisible} onClick={toggleSidebar}>☰</button><span>მომხმარებლის სივრცე</span><span className="status-indicator"><i aria-hidden="true"/>ავტორიზებული</span></header>
      <main id="main-content" className="page-content" tabIndex={-1}>
        <div className="page-heading"><span className="page-kicker">სასწავლო განრიგის მართვა</span><h1>{item.title}</h1></div>
        {error && <p className="error" role="alert">{error}</p>}
        <Page readOnly={role==='teacher'}/>
      </main>
    </div>
  </div>;
}
