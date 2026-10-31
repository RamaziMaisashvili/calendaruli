const BASE = (import.meta.env.VITE_API_URL || 'https://api.learn.net.ge').replace(/\/$/, '');
const KEY = 'calendar.auth.v2';
let queue = Promise.resolve();
let lastInput = Date.now();
let lastActivityCall = 0;
let idleTimer, refreshTimer;
let stopped = false;
export function credentials() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } }
function store(value) { sessionStorage.setItem(KEY, JSON.stringify(value)); }
export function clearSession(notify=true) {
  sessionStorage.removeItem(KEY); clearTimeout(idleTimer); clearTimeout(refreshTimer);
  if (notify) window.dispatchEvent(new Event('auth-expired'));
}
function scheduleRotation(seconds) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { if (!stopped && credentials()) api('/api/auth/refresh', {method:'POST'}).catch(() => {}); }, Math.max(1,seconds)*1000+100);
}
async function perform(path,options={},isLogin=false) {
  const saved=credentials();
  const headers={...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}),...options.headers};
  if (!isLogin) {
    if (!saved?.token || !saved?.username) return {authenticated:false};
    headers.Authorization='Bearer '+saved.token; headers['X-Username']=encodeURIComponent(saved.username);
  }
  let response;
  try { response=await fetch(BASE+path,{...options,headers,credentials:'omit',cache:'no-store'}); }
  catch { throw new Error('კავშირი ვერ დამყარდა. სცადეთ ხელახლა.'); }
  const data=await response.json().catch(()=>null);
  if (!response.ok) throw new Error(data?.message || 'მოთხოვნა ვერ შესრულდა. სცადეთ ხელახლა.');
  if (!data || typeof data.authenticated!=='boolean') throw new Error('მოთხოვნა ვერ შესრულდა. სცადეთ ხელახლა.');
  if (data.authenticated) {
    if(data.token) {
      const username=isLogin ? JSON.parse(options.body).username : saved.username;
      store({username,token:data.token});
    }
    if (data.rotate_after_seconds) scheduleRotation(data.rotate_after_seconds);
  } else if(!isLogin) clearSession();
  return data;
}
// Serialize calls so a token rotation cannot race another request from this tab.
export function api(path,options={},isLogin=false) {
  const run=()=>perform(path,options,isLogin);
  const result=queue.then(run,run); queue=result.catch(()=>{}); return result;
}
export const getSession=()=>api('/api/auth/me',{method:'POST'});
export const login=(username,password)=>api('/api/auth/login',{method:'POST',body:JSON.stringify({username,password})},true);
export async function logout() {
  try { return await api('/api/auth/logout',{method:'POST'}); }
  finally { clearSession(false); }
}
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer=setTimeout(()=>{ logout().catch(()=>{}).finally(()=>clearSession()); },900000);
}
export function startActivityTracking() {
  stopped=false;lastInput=Date.now();lastActivityCall=0;resetIdle();
  const touch=()=>{
    const now=Date.now();
    if(now-lastInput>=900000){logout().catch(()=>{}).finally(()=>clearSession());return;}
    lastInput=now;resetIdle();
    if(now-lastActivityCall>=30000 && credentials()) {
      lastActivityCall=now;
      api('/api/auth/activity',{method:'POST'}).catch(()=>{});
    }
  };
  const events=['pointerdown','keydown','wheel','touchstart'];
  events.forEach(name=>window.addEventListener(name,touch,{passive:true}));
  // A real page visit is activity; background refresh never extends last_activity_at.
  if(credentials()) api('/api/auth/activity',{method:'POST'}).catch(()=>{});
  return ()=>{stopped=true;clearTimeout(idleTimer);clearTimeout(refreshTimer);events.forEach(name=>window.removeEventListener(name,touch));};
}
