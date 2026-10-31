import React,{useEffect,useState} from 'react';
import {api} from '../api';
import '../import.css';
import ProgramImport from './ProgramImport';
export default function Programs(){
 const [editing,setEditing]=useState(null),[removing,setRemoving]=useState(null);
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 async function load(){setBusy(true);setError('');try{const res=await api('/api/program-import/list',{method:'POST'});if(res.authenticated)setItems(res.items||[]);}catch(e){setError(e.message);}finally{setBusy(false);}}
 useEffect(()=>{load();},[]);
 async function remove(){setBusy(true);setError('');try{const r=await api(`/api/program-import/${removing.id}`,{method:'DELETE'});if(r.ok){setRemoving(null);await load();}}catch(e){setError(e.message);}finally{setBusy(false);}}
 if(editing)return <ProgramImport key={editing} editId={editing} onClose={()=>{setEditing(null);load();}}/>;
 return <section className="import-panel"><div className="import-actions"><a href="#/import" className="import-link">პროგრამის იმპორტი</a><button className="secondary" disabled={busy} onClick={load}>განახლება</button></div>{removing&&<div role="alertdialog" aria-label="წაშლის დადასტურება"><p>წაიშალოს „{removing.program_name}“ ({removing.academic_year})? წაიშლება ამ გეგმის მოდულები და კვირის საათებიც. აღდგენა შეუძლებელია.</p><button disabled={busy} onClick={remove}>დიახ, წაშლა</button><button disabled={busy} className="secondary" onClick={()=>setRemoving(null)}>გაუქმება</button></div>}{error&&<p className="import-error" role="alert">{error}</p>}{busy?<p role="status">იტვირთება…</p>:items.length===0?<p>შენახული სასწავლო გეგმები ჯერ არ გაქვთ.</p>:<><p>თქვენი ბოლო 100 სასწავლო გეგმა.</p><div className="import-table-wrap"><table><thead><tr><th>პროგრამა</th><th>სასწავლო წელი</th><th>ტიპი</th><th>დაწყება</th><th>მოდულები</th><th>მოქმედებები</th></tr></thead><tbody>{items.map(p=><tr key={p.id}><td>{p.program_name}</td><td>{p.academic_year}</td><td>{p.program_type==='integrated'?'ინტეგრირებული':'არაინტეგრირებული'}</td><td>{p.start_date}</td><td>{p.module_count}</td><td><button disabled={busy} onClick={()=>setEditing(p.id)}>რედაქტირება</button><button className="delete-row" disabled={busy} onClick={()=>setRemoving(p)}>წაშლა</button></td></tr>)}</tbody></table></div></>}</section>;
}
