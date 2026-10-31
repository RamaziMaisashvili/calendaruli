import React,{useEffect,useRef,useState} from 'react';
import {api} from '../api';
import {dateText} from '../dateText';
import '../import.css';
import '../days-off.css';
const empty=()=>({title:'',start_date:'',end_date:'',annual:false});
export default function Holidays(){
 const [items,setItems]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[several,setSeveral]=useState(false),[removing,setRemoving]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const lock=useRef(false),nameInput=useRef(null),formArea=useRef(null);
 async function load(){const r=await api('/api/days-off/list',{method:'POST'});if(r.authenticated)setItems((r.entries||[]).filter(p=>p.kind==='holiday'&&p.scope==='all'));}
 async function work(fn){if(lock.current)return;lock.current=true;setBusy(true);setError('');setNotice('');try{await fn();}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{work(load);},[]);
 function reset(){setForm(empty());setEditing(null);setSeveral(false);}
 function edit(item){setForm({title:item.title,start_date:item.start_date,end_date:item.end_date,annual:Boolean(item.annual)});setEditing(item.id);setSeveral(item.start_date!==item.end_date);setNotice('');setError('');formArea.current?.scrollIntoView?.({behavior:'smooth',block:'start'});nameInput.current?.focus();}
 async function save(e){e.preventDefault();await work(async()=>{const body={...form,title:form.title.trim(),kind:'holiday',scope:'all',end_date:several?form.end_date:form.start_date};if(!body.title)throw Error('მიუთითეთ უქმე დღის დასახელება.');const r=await api(editing?`/api/days-off/entries/${editing}`:'/api/days-off/entries',{method:editing?'PUT':'POST',body:JSON.stringify(body)});if(!r.ok)return;reset();await load();setNotice('შენახულია. ეს უქმე ყველა თქვენს სასწავლო გეგმაში ავტომატურად იქნება გათვალისწინებული.');});}
 async function remove(){await work(async()=>{const id=removing.id;const r=await api(`/api/days-off/entries/${id}`,{method:'DELETE'});if(!r.ok)return;if(editing===id)reset();setRemoving(null);await load();setNotice('უქმე დღე წაშლილია. კალენდრის ხელახლა ნახვისას ეს ცვლილება გათვალისწინებული იქნება.');});}
 return <section className="import-panel days-off easy-days holidays-page" aria-busy={busy}>
 <h2>უქმე დღეები</h2><p>აქ დაამატეთ ან შეცვალეთ საერთო უქმე. ის ავტომატურად იმოქმედებს ყველა თქვენს ინტეგრირებულ და არაინტეგრირებულ სასწავლო გეგმაზე — გეგმაში ხელახლა მონიშვნა საჭირო არ არის.</p>
 {error&&<p className="import-error" role="alert">{error}</p>}{notice&&<p className="days-notice" role="status">{notice}</p>}{busy&&<p role="status">გთხოვთ, მოიცადოთ…</p>}
 <div className="holiday-layout"><section ref={formArea} className="holiday-form"><h3>{editing?'უქმე დღის შეცვლა':'ახალი უქმე დღის დამატება'}</h3><form onSubmit={save}><fieldset disabled={busy} className="easy-section">
 <label>დასახელება<input ref={nameInput} aria-label="უქმე დღის დასახელება" placeholder="მაგალითად, ნათლისღება" value={form.title} required maxLength={200} onChange={e=>setForm({...form,title:e.target.value})}/></label>
 <label>{several?'პირველი დღე':'თარიღი'}<input aria-label="უქმე დღის თარიღი" type="date" required value={form.start_date} onChange={e=>setForm(old=>({...old,start_date:e.target.value,end_date:!several||!old.end_date?e.target.value:old.end_date}))}/></label>
 <label>ყოველ წელს განმეორდეს?<select value={form.annual?'yes':'no'} disabled={several} onChange={e=>setForm({...form,annual:e.target.value==='yes'})}><option value="no">არა — მხოლოდ მითითებულ თარიღზე</option><option value="yes">კი — ყოველ წელს იმავე დღეს</option></select></label>
 <details className="easy-extra" open={several||undefined}><summary>თუ რამდენიმე დღეა გამოცხადებული უქმედ</summary><label className="holiday-checkbox"><input type="checkbox" checked={several} onChange={e=>{setSeveral(e.target.checked);setForm(old=>({...old,annual:false,end_date:old.start_date}));}}/>უქმე რამდენიმე დღე გრძელდება</label>{several&&<label>ბოლო დღე — ჩათვლით<input aria-label="უქმე დღის დასრულება" type="date" required min={form.start_date} value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/></label>}<small>რამდენიმედღიანი პერიოდი ემატება მხოლოდ მითითებული წლისთვის.</small></details>
 <div className="easy-actions"><button>{editing?'ცვლილების შენახვა':'უქმე დღის დამატება'}</button>{editing&&<button type="button" className="secondary" onClick={reset}>შეცვლის გაუქმება</button>}</div></fieldset></form></section>
 <section className="holiday-list"><h3>დამატებული უქმეები <span className="easy-tag">{items.length}</span></h3>{!items.length&&!busy?<p className="easy-help">უქმე დღე ჯერ არ არის დამატებული. შეავსეთ ფორმა და დააჭირეთ „უქმე დღის დამატება“.</p>:<div className="easy-event-list">{items.map(p=><article className={'easy-event '+(editing===p.id?'holiday-editing':'')} key={p.id}><div><h4>{p.title}</h4><p>{dateText(p.start_date,Boolean(p.annual))}{p.start_date!==p.end_date?' — '+dateText(p.end_date,Boolean(p.annual)):''}</p><small>{p.annual?'ყოველწლიური':'მხოლოდ მითითებული თარიღი'} · ყველა თქვენი სასწავლო გეგმისთვის</small></div><div className="easy-event-actions"><button className="secondary" disabled={busy} onClick={()=>edit(p)}>შეცვლა</button><button className="delete-row" disabled={busy} onClick={()=>setRemoving(p)}>წაშლა</button></div></article>)}</div>}</section></div>
 {removing&&<div className="days-confirm" role="alertdialog" aria-label="უქმე დღის წაშლა"><h3>წავშალოთ „{removing.title}“?</h3><p>ეს უქმე აღარ იმოქმედებს თქვენს სასწავლო გეგმებზე. თავად გეგმები არ წაიშლება.</p><button disabled={busy} onClick={remove}>დიახ, წაშლა</button><button className="secondary" disabled={busy} onClick={()=>setRemoving(null)}>არა, დატოვება</button></div>}
 <p className="easy-help">არდადეგები ცალკეა: <a href="#/days-off">კალენდარი და არდადეგები</a>. კონკრეტული გეგმის სპეციალური უქმეები აქ არ ივსება.</p>
 </section>;
}
