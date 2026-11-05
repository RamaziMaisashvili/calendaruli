import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, Download, X, FileText, Maximize2, Minimize2, 
  ZoomIn, ZoomOut, Layout, BookOpen, Layers, FileSpreadsheet,
  Package, Calendar, Clock, Search, Award, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import Document from './Document';
import { LETTERHEAD_BASE64 } from './letterhead';

export default function DocumentReader({ file, moduleData, onClose }) {
  const overlayRef = useRef(null);
  const paperRef = useRef(null);

  // მართვის მდგომარეობები
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWideView, setIsWideView] = useState(true); // ნაგულისხმევად გაშლილი ხედი, რათა ცხრილები ლამაზად დაეტიოს
  const [zoomLevel, setZoomLevel] = useState(100);
  const [resourceSearch, setResourceSearch] = useState('');

  // Body Scroll-ის დაბლოკვა მოდალის გახსნისას და მრავალგვერდიანი ბეჭდვის მხარდაჭერა
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.classList.add('document-reader-open');
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleBeforePrint = () => {
      document.body.style.overflow = 'visible';
    };

    const handleAfterPrint = () => {
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.body.classList.remove('document-reader-open');
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  // სრულ ეკრანზე გადართვა (Browser Fullscreen)
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (overlayRef.current?.requestFullscreen) {
          await overlayRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen შეცდომა:', err);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 75));
  const handleZoomReset = () => setZoomLevel(100);

  const handlePrint = () => {
    document.body.style.overflow = 'visible';
    window.print();
  };

  const handleDownload = () => {
    api.downloadFile(file.id, file.original_name).catch((err) => {
      alert('ჩამოტვირთვა ვერ მოხერხდა: ' + (err.message || err));
    });
  };

  const handleOpenNewWindow = () => {
    const win = window.open('', '_blank');
    if (!win) {
      alert('გთხოვთ დაუშვათ pop-up ფანჯრები ბრაუზერში');
      return;
    }
    const contentHtml = paperRef.current ? paperRef.current.innerHTML : '';
    win.document.write(`<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="utf-8">
  <title>${file.original_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #d9d9d9; font-family: 'Calibri', 'Sylfaen', 'Noto Sans Georgian', 'DejaVu Sans', sans-serif; font-size: 11pt; color: #000; }
    .wrap { padding: 24px; overflow: auto; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
    .sheet { background: #fff; width: 792pt; min-height: 612pt; margin: 0 auto 24px; padding: 0 0 0 72pt; box-shadow: 0 1px 6px rgba(0,0,0,.35); position: relative; }
    .frame { border-collapse: collapse; table-layout: fixed; width: 648pt; }
    .frame>thead>tr>td, .frame>tbody>tr>td, .frame>tfoot>tr>td { padding: 0; border: 0; vertical-align: top; }
    .hdr { width: 648pt; min-height: 40.5pt; padding-top: 27pt; }
    .ftr { width: 648pt; min-height: 58.5pt; }
    p { margin: 0; white-space: pre-wrap; overflow-wrap: break-word; }
    td p { overflow-wrap: anywhere; }
    img { max-width: none; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 0.5pt solid #BFBFBF; padding: 3pt 5.4pt; font-size: 9pt; }
    @page { size: 792pt 612pt; margin: 0; }
    @media print {
      body { background: #fff; }
      .wrap { padding: 0; overflow: visible; }
      .sheet { box-shadow: none; margin: 0; width: auto; min-height: 0; padding: 0 0 0 72pt; }
      tr { break-inside: avoid; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`);
    win.document.close();
  };

  const isCurriculumPlan = moduleData?.is_curriculum_plan;
  const isMaterialResources = moduleData?.is_material_resources;
  const mod = moduleData?.module;
  const outcomes = moduleData?.outcomes || [];
  const hasModule = moduleData?.has_module;
  const docElements = moduleData?.doc_elements || [];

  // ორგანიზაციის იდენტიფიკაცია: 22-ე საჯარო სკოლა vs WEA აკადემია
  const is22School = useMemo(() => {
    if (moduleData?.organization_code === '22_skola' || file?.organization_code === '22_skola') return true;
    const name = (file?.original_name || '').toLowerCase();
    if (name.includes('22') || name.includes('ქსელ') || name.includes('ქუთაის') || name.includes('გოქაძ')) return true;
    if (docElements && docElements.some(el => {
      const txt = (el.text || '').toLowerCase();
      return txt.includes('22') || txt.includes('გოქაძ') || txt.includes('ქუთაის');
    })) return true;
    return false;
  }, [moduleData, file, docElements]);

  const hasWeaBanner = useMemo(() => {
    if (is22School) return false;
    if (moduleData?.has_wea_banner === true || file?.has_wea_banner === true) return true;
    if (moduleData?.organization_code === 'wea' || file?.organization_code === 'wea') return true;
    const name = (file?.original_name || '').toLowerCase();
    if (name.includes('wea') || name.includes('front-end') || name.includes('frontend') || name.includes('აკადემი')) return true;
    return false;
  }, [is22School, moduleData, file]);

  const isMarkupModule = Boolean(
    file?.original_name?.includes('მარკირება') || 
    file?.original_name?.includes('დანართი 1') ||
    file?.original_name?.includes('დანართი_1')
  );

  // მოდულის ტიპის განსაზღვრა (1=პროფესიული, 2=ზოგადი, 3=ინტეგრირებული -> სიტყვებით გამოტანა)
  const resolveTypeName = (val) => {
    if (val === 1 || val === '1' || val === 'პროფესიული') return 'პროფესიული';
    if (val === 2 || val === '2' || val === 'ზოგადი') return 'ზოგადი';
    if (val === 3 || val === '3' || val === 'ინტეგრირებული') return 'ინტეგრირებული';
    return null;
  };

  const rawType = resolveTypeName(moduleData?.module_type) || resolveTypeName(moduleData?.module?.module_type);
  const docType = rawType || (
    file.original_name?.includes('მათემატიკ') ||
    file.original_name?.includes('მეცნიერ') ||
    file.original_name?.includes('მოქალაქ') ||
    file.original_name?.includes('სპორტ') ||
    JSON.stringify(docElements).includes('ინტეგრირებული')
      ? 'ინტეგრირებული'
      : (file.original_name?.includes('(ზოგადი)') || 
         file.original_name?.includes('ზოგადი') ||
         JSON.stringify(docElements).includes('სტატუსი - ზოგადი'))
      ? 'ზოგადი'
      : 'პროფესიული'
  );

  const isIntegrated = docType === 'ინტეგრირებული';

  const typeConfig = {
    'ინტეგრირებული': {
      title: '★ ინტეგრირებული საგანმანათლებლო მოდული',
      tagClass: 'integrated-tag',
      badgeClass: 'integrated'
    },
    'ზოგადი': {
      title: '★ ზოგადი საგანმანათლებლო მოდული',
      tagClass: 'general-tag',
      badgeClass: 'general'
    },
    'პროფესიული': {
      title: '★ პროფესიული საგანმანათლებლო მოდული',
      tagClass: 'vocational-tag',
      badgeClass: 'vocational'
    }
  }[docType];

  // სასწავლო გეგმის სტატისტიკის დათვლა
  const planStats = useMemo(() => {
    if (!isCurriculumPlan || !moduleData?.plans) return null;
    const plans = moduleData.plans;
    let totalCredits = 0;
    let totalHours = 0;
    let contactHours = 0;
    let indepHours = 0;
    let evalHours = 0;

    plans.forEach(p => {
      const cr = parseFloat(p.credits) || 0;
      totalCredits += cr;
      totalHours += (p.hours_total || 0);
      contactHours += (p.hours_contact || 0);
      indepHours += (p.hours_independent || 0);
      evalHours += (p.hours_evaluation || 0);
    });

    return {
      moduleCount: plans.length,
      totalCredits,
      totalHours,
      contactHours,
      indepHours,
      evalHours
    };
  }, [isCurriculumPlan, moduleData]);

  // მატერიალური რესურსების სტატისტიკა და ფილტრაცია
  const resourceStats = useMemo(() => {
    if (!isMaterialResources || !moduleData?.modules) return null;
    const mods = moduleData.modules;
    let totalEquipment = 0;
    let totalMaterials = 0;

    mods.forEach(m => {
      totalEquipment += (m.equipment?.length || 0);
      totalMaterials += (m.materials?.length || 0);
    });

    return {
      moduleCount: mods.length,
      totalEquipment,
      totalMaterials
    };
  }, [isMaterialResources, moduleData]);

  const filteredResourceModules = useMemo(() => {
    if (!isMaterialResources || !moduleData?.modules) return [];
    if (!resourceSearch.trim()) return moduleData.modules;
    const q = resourceSearch.toLowerCase().trim();
    return moduleData.modules.filter(m => 
      m.module_name?.toLowerCase().includes(q) ||
      m.learning_environment?.toLowerCase().includes(q) ||
      m.equipment?.some(it => it.name?.toLowerCase().includes(q)) ||
      m.materials?.some(it => it.name?.toLowerCase().includes(q))
    );
  }, [isMaterialResources, moduleData, resourceSearch]);

  const modalContent = (
    <div className="word-viewer-overlay" ref={overlayRef}>
      {/* ზედა ხელსაწყოების ზოლი (Toolbar) */}
      <header className="word-viewer-toolbar no-print">
        <div className="word-toolbar-left">
          <div className="word-icon-pill" style={{ background: isCurriculumPlan || isMaterialResources ? 'linear-gradient(135deg, #059669, #10b981)' : undefined }}>
            {isCurriculumPlan || isMaterialResources ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
          </div>
          <div className="word-header-text">
            <span className="word-doc-title" title={file.original_name}>
              {file.original_name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
              {is22School ? (
                <span className="org-badge org-22" title="სსიპ - ნესტორ გოქაძის სახელობის ქალაქ ქუთაისის N 22 საჯარო სკოლა">
                  🏫 22-ე საჯარო სკოლა
                </span>
              ) : hasWeaBanner ? (
                <span className="org-badge org-wea" title="შპს მსოფლიო განათლების აკადემია (WEA)">
                  🌐 WEA აკადემია
                </span>
              ) : null}

              {isCurriculumPlan ? (
                <>
                  <span className="module-badge-tag integrated-tag">
                    სასწავლო გეგმა (Excel)
                  </span>
                  <span className="word-header-badge">
                    {moduleData.plans?.length || 0} მოდული
                  </span>
                </>
              ) : isMaterialResources ? (
                <>
                  <span className="module-badge-tag general-tag">
                    მატერიალური რესურსები (Excel)
                  </span>
                  <span className="word-header-badge">
                    {moduleData.modules?.length || 0} მოდული
                  </span>
                </>
              ) : (
                <>
                  <span className={`module-badge-tag ${typeConfig.tagClass}`}>
                    {docType} მოდული
                  </span>
                  {mod?.credits && (
                    <span className="word-header-badge">
                      {mod.credits} კრედიტი
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ცენტრალური მართვის პანელი (View Mode & Zoom) */}
        <div className="word-toolbar-center">
          <div className="viewer-btn-group">
            <button 
              className={`viewer-toggle-btn ${!isWideView ? 'active' : ''}`}
              onClick={() => setIsWideView(false)}
              title="A4 ფურცლის ფორმატი (დაბეჭდვის რეჟიმი)"
            >
              A4 ხედი
            </button>
            <button 
              className={`viewer-toggle-btn ${isWideView ? 'active' : ''}`}
              onClick={() => setIsWideView(true)}
              title="ეკრანის სრულ სიგანეზე გაშლა ცხრილებისთვის"
            >
              <Layout size={13} style={{ marginRight: '4px' }} />
              გაშლილი ხედი
            </button>
          </div>

          <div className="viewer-btn-group zoom-controls">
            <button 
              className="viewer-icon-btn" 
              onClick={handleZoomOut} 
              disabled={zoomLevel <= 75}
              title="დაპატარავება"
            >
              <ZoomOut size={15} />
            </button>
            <span className="zoom-label" onClick={handleZoomReset} title="საწყის ზომაზე დაბრუნება (100%)">
              {zoomLevel}%
            </span>
            <button 
              className="viewer-icon-btn" 
              onClick={handleZoomIn} 
              disabled={zoomLevel >= 150}
              title="გადიდება"
            >
              <ZoomIn size={15} />
            </button>
          </div>
        </div>

        {/* მარჯვენა მოქმედებების ღილაკები */}
        <div className="word-toolbar-actions">
          <button 
            className="word-btn icon-only-btn" 
            onClick={toggleFullscreen} 
            title={isFullscreen ? "სრული ეკრანიდან გამოსვლა" : "სრულ ეკრანზე გაშლა"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button className="word-btn" onClick={handleOpenNewWindow} title="ცალკე სრულ გვერდზე / ახალ ტაბში გახსნა">
            <ExternalLink size={16} />
            <span>ახალ ტაბში</span>
          </button>

          <button className="word-btn print-btn" onClick={handlePrint} title="ბეჭდვა / PDF">
            <Printer size={16} />
            <span>ბეჭდვა</span>
          </button>

          <button className="word-btn download-btn" onClick={handleDownload} title="ორიგინალი ფაილის ჩამოტვირთვა">
            <Download size={16} />
            <span>ჩამოტვირთვა</span>
          </button>

          <button className="word-btn close-btn" onClick={onClose} title="დახურვა (Esc)">
            <X size={18} />
            <span>დახურვა</span>
          </button>
        </div>
      </header>

      {/* დოკუმენტის სამუშაო სივრცე (გამართული სქროლით) */}
      <main className="word-viewer-body">
        {isCurriculumPlan && moduleData?.plans ? (
          /* ==============================================================
             1. სასწავლო გეგმა (Curriculum Plan Excel)
             ============================================================== */
          <div 
            className={`word-paper-sheet ${isWideView ? 'wide-mode' : 'a4-mode'}`} 
            ref={paperRef}
            style={{
              zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined
            }}
          >
            <div className="curriculum-document excel-curriculum-view">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span className="doc-type-badge general" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                  ★ საგანმანათლებლო პროგრამის სასწავლო გეგმა (კურიკულუმი)
                </span>
                <h1 className="doc-title" style={{ marginTop: '14px', fontSize: '20px' }}>
                  {moduleData.title || file.original_name}
                </h1>
              </div>

              {/* სტატისტიკური ბარათები */}
              {planStats && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>სულ მოდულები</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{planStats.moduleCount}</div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600' }}>სულ კრედიტები</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1d4ed8', marginTop: '2px' }}>{planStats.totalCredits}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>საკონტაქტო სთ</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#15803d', marginTop: '2px' }}>{planStats.contactHours}</div>
                  </div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '600' }}>დამოუკიდებელი სთ</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#b45309', marginTop: '2px' }}>{planStats.indepHours}</div>
                  </div>
                  <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#9d174d', fontWeight: '600' }}>შეფასება სთ</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#be185d', marginTop: '2px' }}>{planStats.evalHours}</div>
                  </div>
                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: '600' }}>ჯამური საათები</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#7e22ce', marginTop: '2px' }}>{planStats.totalHours} სთ</div>
                  </div>
                </div>
              )}

              {/* სასწავლო გეგმის ცხრილი */}
              <div className="table-responsive-box">
                <table className="word-exact-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>№</th>
                      <th style={{ minWidth: '220px', textAlign: 'left' }}>მოდულის დასახელება</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>კოდი</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>კრედიტი</th>
                      <th style={{ width: '105px', textAlign: 'center' }}>სტატუსი</th>
                      <th style={{ width: '65px', textAlign: 'center' }}>სულ</th>
                      <th style={{ width: '65px', textAlign: 'center' }}>საკონტ.</th>
                      <th style={{ width: '65px', textAlign: 'center' }}>დამოუკ.</th>
                      <th style={{ width: '65px', textAlign: 'center' }}>შეფას.</th>
                      <th style={{ minWidth: '200px', textAlign: 'left' }}>კვირეული განაწილება (საათები)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleData.plans.map((p, idx) => {
                      const st = resolveTypeName(p.status) || 'ზოგადი';
                      const stBadge = st === 'პროფესიული' 
                        ? { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
                        : st === 'ინტეგრირებული'
                        ? { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
                        : { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };

                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center', fontWeight: '700' }}>{p.module_order || (idx + 1)}</td>
                          <td style={{ fontWeight: '600', color: '#0f172a' }}>{p.module_name}</td>
                          <td style={{ textAlign: 'center', fontSize: '11px', fontFamily: 'monospace' }}>{p.registration_number || '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: '700' }}>{p.credits || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: stBadge.bg,
                              color: stBadge.color,
                              border: `1px solid ${stBadge.border}`
                            }}>
                              {st}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '700' }}>{p.hours_total || 0}</td>
                          <td style={{ textAlign: 'center' }}>{p.hours_contact || 0}</td>
                          <td style={{ textAlign: 'center' }}>{p.hours_independent || 0}</td>
                          <td style={{ textAlign: 'center' }}>{p.hours_evaluation || 0}</td>
                          <td>
                            {p.weekly_schedule && p.weekly_schedule.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {p.weekly_schedule.slice(0, 15).map((w, wIdx) => (
                                  <span key={wIdx} style={{
                                    fontSize: '10.5px',
                                    padding: '1px 5px',
                                    background: '#f1f5f9',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    whiteSpace: 'nowrap'
                                  }} title={`კვირა ${w.week}: ${w.hours} სთ`}>
                                    კვ.{w.week}: <strong>{w.hours}</strong>
                                  </span>
                                ))}
                                {p.weekly_schedule.length > 15 && (
                                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                    +{p.weekly_schedule.length - 15} კვირა
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : isMaterialResources && moduleData?.modules ? (
          /* ==============================================================
             2. მატერიალური რესურსები (Material Resources Excel)
             ============================================================== */
          <div 
            className={`word-paper-sheet ${isWideView ? 'wide-mode' : 'a4-mode'}`} 
            ref={paperRef}
            style={{
              zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined
            }}
          >
            <div className="curriculum-document excel-resources-view">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span className="doc-type-badge general" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                  ★ საგანმანათლებლო პროგრამის მატერიალური რესურსები
                </span>
                <h1 className="doc-title" style={{ marginTop: '14px', fontSize: '20px' }}>
                  {moduleData.title || file.original_name}
                </h1>
              </div>

              {/* რესურსების სტატისტიკა */}
              {resourceStats && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>მოდულების რაოდენობა</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{resourceStats.moduleCount}</div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600' }}>ინვენტარი და აღჭურვილობა</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#1d4ed8', marginTop: '2px' }}>{resourceStats.totalEquipment} ერთეული</div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>მასალა და ნედლეული</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#15803d', marginTop: '2px' }}>{resourceStats.totalMaterials} ერთეული</div>
                  </div>
                </div>
              )}

              {/* ძებნის ველი მატერიალურ რესურსებში */}
              <div style={{ marginBottom: '20px' }} className="no-print">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  maxWidth: '400px'
                }}>
                  <Search size={16} style={{ color: '#64748b', marginRight: '8px' }} />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="რესურსის ან მოდულის ძებნა..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontSize: '13px'
                    }}
                  />
                  {resourceSearch && (
                    <button 
                      onClick={() => setResourceSearch('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* მოდულების მიხედვით დაჯგუფებული რესურსები */}
              {filteredResourceModules.map((m, mIdx) => (
                <div key={mIdx} style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {mIdx + 1}. {m.module_name}
                      </h3>
                      {m.learning_environment && (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#f1f5f9',
                            color: '#475569',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            სასწავლო გარემო: {m.learning_environment}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {(m.equipment?.length || 0) + (m.materials?.length || 0)} რესურსი
                    </div>
                  </div>

                  {/* ინვენტარი / აღჭურვილობა */}
                  {m.equipment && m.equipment.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>
                        📦 ინვენტარი და აღჭურვილობა ({m.equipment.length})
                      </div>
                      <table className="word-exact-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>№</th>
                            <th>დასახელება</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>რაოდენობა</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>ერთეული</th>
                            <th style={{ width: '150px' }}>შენიშვნა</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.equipment.map((it, iIdx) => (
                            <tr key={iIdx}>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{it.number || (iIdx + 1)}</td>
                              <td>{it.name}</td>
                              <td style={{ textAlign: 'center', fontWeight: '600' }}>{it.quantity || '—'}</td>
                              <td style={{ textAlign: 'center' }}>{it.unit || '—'}</td>
                              <td style={{ color: '#64748b', fontSize: '11px' }}>{it.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* მასალა / ნედლეული */}
                  {m.materials && m.materials.length > 0 && (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '6px' }}>
                        🧪 მასალა და ნედლეული ({m.materials.length})
                      </div>
                      <table className="word-exact-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>№</th>
                            <th>დასახელება</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>რაოდენობა</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>ერთეული</th>
                            <th style={{ width: '150px' }}>შენიშვნა</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.materials.map((it, iIdx) => (
                            <tr key={iIdx}>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{it.number || (iIdx + 1)}</td>
                              <td>{it.name}</td>
                              <td style={{ textAlign: 'center', fontWeight: '600' }}>{it.quantity || '—'}</td>
                              <td style={{ textAlign: 'center' }}>{it.unit || '—'}</td>
                              <td style={{ color: '#64748b', fontSize: '11px' }}>{it.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : isMarkupModule ? (
          /* ==============================================================
             3. დანართი 1 (ვებ გვერდის მარკირება - ზუსტი ასლი React კომპონენტი)
             ============================================================== */
          <div 
            ref={paperRef}
            style={{
              zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Document />
          </div>
        ) : (
          /* ==============================================================
             4. 1:1 Word დოკუმენტის ზუსტი ასლი (დანართი 1-ის შაბლონით)
             ============================================================== */
          <div 
            ref={paperRef}
            style={{
              zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <div className="wrap">
              <div className="sheet">
                <table className="frame">
                  <thead>
                    <tr>
                      <td>
                        <div className="hdr">
                          {hasWeaBanner ? (
                            <p style={{ textAlign: "left", lineHeight: "normal", margin: 0 }}>
                              <img
                                src={LETTERHEAD_BASE64}
                                alt="WEA Letterhead"
                                style={{ width: "648pt", height: "62.2pt", verticalAlign: "baseline" }}
                              />
                            </p>
                          ) : is22School ? (
                            <div style={{
                              paddingTop: "20pt",
                              paddingBottom: "10pt",
                              marginBottom: "12pt",
                              borderBottom: "2px solid #1e3a8a",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
                                <div style={{ fontSize: "20pt", lineHeight: 1 }}>🏫</div>
                                <div>
                                  <div style={{ fontSize: "11pt", fontWeight: "bold", color: "#0f172a", fontFamily: "'Calibri','Sylfaen',sans-serif" }}>
                                    სსიპ - ნესტორ გოქაძის სახელობის ქალაქ ქუთაისის N 22 საჯარო სკოლა
                                  </div>
                                  <div style={{ fontSize: "8.5pt", color: "#64748b", marginTop: "2pt", fontFamily: "'Calibri','Sylfaen',sans-serif" }}>
                                    პროფესიული საგანმანათლებლო პროგრამა — კომპიუტერული ქსელი და სისტემები
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: "right", fontSize: "9pt", color: "#334155", fontWeight: 600, fontFamily: "'Calibri','Sylfaen',sans-serif" }}>
                                {mod?.registration_number ? `სარეგ. № ${mod.registration_number}` : 'ქუთაისი'}
                              </div>
                            </div>
                          ) : (
                            <div style={{ minHeight: "20pt", paddingTop: "14pt" }} />
                          )}
                        </div>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {docElements && docElements.length > 0 ? (
                          /* 1:1 ასლი docElements-დან (Word-ის ყველა ორიგინალი აბზაცი და ცხრილი) */
                          <>
                            {docElements.map((el, elIdx) => {
                              if (el.type === 'p') {
                                const isTitle = el.is_bold && (el.align === 'center' || el.text.includes('მოდული') || el.text.includes('სსიპ') || el.text.includes('დანართი'));
                                return (
                                  <p
                                    key={elIdx}
                                    style={{
                                      textAlign: el.align || 'left',
                                      paddingBottom: isTitle ? '6pt' : '4pt',
                                      lineHeight: 1.25,
                                      fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif",
                                      fontSize: isTitle ? '10pt' : '9pt',
                                      fontWeight: el.is_bold ? 'bold' : 'normal',
                                      color: el.is_bold && el.align === 'center' ? '#595959' : '#000000',
                                      marginBottom: isTitle ? '6pt' : '3pt'
                                    }}
                                  >
                                    {el.text}
                                  </p>
                                );
                              }
                              if (el.type === 'table') {
                                return (
                                  <table
                                    key={elIdx}
                                    style={{
                                      borderCollapse: 'collapse',
                                      width: '100%',
                                      tableLayout: 'auto',
                                      marginBottom: '14pt',
                                      fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif"
                                    }}
                                  >
                                    <tbody>
                                      {el.rows.map((row, rIdx) => {
                                        const isHeader = rIdx === 0 && el.rows.length > 1;
                                        return (
                                          <tr key={rIdx}>
                                            {row.map((cell, cIdx) => (
                                              <td
                                                key={cIdx}
                                                colSpan={cell.col_span || 1}
                                                style={{
                                                  border: '0.5pt solid #BFBFBF',
                                                  verticalAlign: 'top',
                                                  padding: '3pt 5.4pt',
                                                  backgroundColor: isHeader ? '#f8fafc' : '#ffffff',
                                                  fontWeight: isHeader ? 'bold' : 'normal',
                                                  textAlign: isHeader ? 'center' : 'left'
                                                }}
                                              >
                                                <p style={{
                                                  margin: 0,
                                                  whiteSpace: 'pre-wrap',
                                                  lineHeight: 1.24,
                                                  fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif",
                                                  fontSize: '9pt',
                                                  color: '#000'
                                                }}>
                                                  {cell.text}
                                                </p>
                                              </td>
                                            ))}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                );
                              }
                              return null;
                            })}
                          </>
                        ) : hasModule && mod ? (
                          /* სტანდარტული Word შაბლონი ბაზიდან (ზოგადი + სტანდარტული + თემატიკა + საათები) */
                          <>
                            <p style={{ textAlign: "center", paddingBottom: "8pt", marginRight: "-72pt", lineHeight: 1.24, fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif", fontSize: "9pt", fontWeight: "bold", color: "#595959" }}>
                              <span>მოდული</span>
                            </p>
                            
                            <p style={{ textAlign: "left", paddingBottom: "10pt", marginLeft: "18pt", textIndent: "-9pt", lineHeight: 1.32, fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif", fontSize: "9pt" }}>
                              <span style={{ fontWeight: "bold" }}>ზოგადი ჩანაწერები</span>
                            </p>
                            
                            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "auto", marginBottom: "16pt", fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif" }}>
                              <colgroup>
                                <col style={{ width: "121.2pt" }} />
                                <col style={{ width: "526.3pt" }} />
                              </colgroup>
                              <tbody>
                                <tr>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt", background: "#fafafa" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>მოდულის სახელწოდება</p>
                                  </td>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt" }}>{mod.module_name || file.original_name.replace(/\.[^/.]+$/, '')}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt", background: "#fafafa" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სარეგისტრაციო ნომერი</p>
                                  </td>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt" }}>{mod.registration_number || '—'}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt", background: "#fafafa" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>ვერსია № და თარიღი</p>
                                  </td>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt" }}>{mod.version_date || '—'}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt", background: "#fafafa" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>მოცულობა კრედიტებში</p>
                                  </td>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt" }}>{mod.credits || '—'}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt", background: "#fafafa" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>მოდულის განხორციელების წინაპირობა</p>
                                  </td>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt" }}>{mod.prerequisites || 'წინაპირობის გარეშე'}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt", background: "#fafafa" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>მოდულის მიზანი</p>
                                  </td>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt" }}>{mod.aim || '—'}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt", background: "#fafafa" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სწავლის შედეგები</p>
                                  </td>
                                  <td style={{ border: "0.5pt solid #BFBFBF", verticalAlign: "top", padding: "3pt 5.4pt" }}>
                                    {outcomes.length > 0 ? (
                                      <ol style={{ margin: 0, paddingLeft: "18px" }}>
                                        {outcomes.map((o, oi) => (
                                          <li key={oi} style={{ fontSize: "9pt", marginBottom: "3pt" }}>
                                            {o.outcome_name || `სწავლის შედეგი ${o.outcome_number}`}
                                          </li>
                                        ))}
                                      </ol>
                                    ) : (
                                      <p style={{ fontSize: "9pt" }}>—</p>
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            {/* სტანდარტული ჩანაწერები */}
                            <p style={{ textAlign: "left", paddingBottom: "10pt", marginLeft: "18pt", textIndent: "-9pt", lineHeight: 1.32, fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif", fontSize: "9pt", marginTop: "14pt" }}>
                              <span style={{ fontWeight: "bold" }}>სტანდარტული ჩანაწერები</span>
                            </p>

                            <table style={{ borderCollapse: "collapse", width: "647.5pt", tableLayout: "auto", marginBottom: "16pt", fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif" }}>
                              <thead>
                                <tr style={{ background: "#f8fafc" }}>
                                  <th style={{ width: "25pt", textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>№</p>
                                  </th>
                                  <th style={{ width: "140pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სწავლის შედეგები</p>
                                  </th>
                                  <th style={{ width: "200pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>შესრულების კრიტერიუმები</p>
                                  </th>
                                  <th style={{ width: "160pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>კომპეტენციის პარამეტრების ფარგლები</p>
                                  </th>
                                  <th style={{ width: "85pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>შეფასების მიმართულება</p>
                                  </th>
                                  <th style={{ width: "35pt", textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                    <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სწავლის შედეგის მოცულობა კრედიტებში</p>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {outcomes.map((item, idx) => (
                                  <tr key={idx}>
                                    <td style={{ textAlign: "center", fontWeight: "bold", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                      <p style={{ fontSize: "9pt" }}>{item.outcome_number || (idx + 1)}</p>
                                    </td>
                                    <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                      <p style={{ fontSize: "9pt", fontWeight: "bold" }}>{item.outcome_name}</p>
                                    </td>
                                    <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                      <p style={{ fontSize: "9pt", whiteSpace: "pre-wrap" }}>{item.criteria}</p>
                                    </td>
                                    <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                      <p style={{ fontSize: "9pt", whiteSpace: "pre-wrap" }}>{item.parameters || item.scope || '—'}</p>
                                    </td>
                                    <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                      <p style={{ fontSize: "9pt" }}>{item.assessment_direction || '—'}</p>
                                    </td>
                                    <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                      <p style={{ fontSize: "9pt" }}>{item.credits || item.outcome_credits || '—'}</p>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* თემატიკა და შეფასების მეთოდები (თუ არსებობს topics ან assessment_methods) */}
                            {outcomes.some(o => o.topics || o.assessment_methods) && (
                              <>
                                <p style={{ textAlign: "left", paddingBottom: "10pt", marginLeft: "18pt", textIndent: "-9pt", lineHeight: 1.32, fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif", fontSize: "9pt", marginTop: "14pt" }}>
                                  <span style={{ fontWeight: "bold" }}>თემატიკა და შეფასების მეთოდები</span>
                                </p>
                                <table style={{ borderCollapse: "collapse", width: "647.75pt", tableLayout: "fixed", marginBottom: "16pt", fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif" }}>
                                  <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                      <th style={{ width: "40pt", textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სწავლის შედეგები №</p>
                                      </th>
                                      <th style={{ width: "220pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>თემატიკა</p>
                                      </th>
                                      <th style={{ width: "130pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სწავლების ფორმა</p>
                                      </th>
                                      <th style={{ width: "130pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>შეფასების მეთოდები</p>
                                      </th>
                                      <th style={{ width: "127pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>მტკიცებულებები პროფესიული სტუდენტის პორტფოლიოსთვის</p>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {outcomes.map((item, idx) => (
                                      <tr key={idx}>
                                        <td style={{ textAlign: "center", fontWeight: "bold", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                          <p style={{ fontSize: "9pt" }}>{item.outcome_number || (idx + 1)}</p>
                                        </td>
                                        <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                          <p style={{ fontSize: "9pt", whiteSpace: "pre-wrap" }}>{item.topics || '—'}</p>
                                        </td>
                                        <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                          <p style={{ fontSize: "9pt" }}>ლექცია, ინტერაქტიული ლექცია, დემონსტრირება, პრაქტიკული მეცადინეობა, სამუშაო ჯგუფში მუშაობა.</p>
                                        </td>
                                        <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                          <p style={{ fontSize: "9pt", whiteSpace: "pre-wrap" }}>{item.assessment_methods || 'პრაქტიკული დავალება'}</p>
                                        </td>
                                        <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                          <p style={{ fontSize: "9pt" }}>პრაქტიკული დავალება - პროფესიული სტუდენტის მიერ შესრულებული პრაქტიკული დავალება.</p>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </>
                            )}

                            {/* საათების განაწილება სწავლის შედეგების მიხედვით */}
                            {(mod.hours_total || mod.hours_contact || outcomes.some(o => o.hours_contact || o.hours_total)) && (
                              <>
                                <p style={{ textAlign: "left", paddingBottom: "10pt", marginLeft: "18pt", textIndent: "-9pt", lineHeight: 1.32, fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif", fontSize: "9pt", marginTop: "14pt" }}>
                                  <span style={{ fontWeight: "bold" }}>საათების განაწილება სწავლის შედეგების მიხედვით</span>
                                </p>
                                <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "auto", marginBottom: "16pt", fontFamily: "'Calibri','Sylfaen','Noto Sans Georgian','DejaVu Sans',sans-serif" }}>
                                  <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                      <th style={{ width: "250pt", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სწავლის შედეგები</p>
                                      </th>
                                      <th style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>საკონტაქტო</p>
                                      </th>
                                      <th style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>დამოუკიდებელი</p>
                                      </th>
                                      <th style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>შეფასება</p>
                                      </th>
                                      <th style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                        <p style={{ fontSize: "9pt", fontWeight: "bold" }}>სულ</p>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {outcomes.map((item, idx) => (
                                      <tr key={idx}>
                                        <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}>
                                          <p style={{ fontSize: "9pt" }}><strong>შედეგი {item.outcome_number || (idx + 1)}:</strong> {item.outcome_name}</p>
                                        </td>
                                        <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt" }}>{item.hours_contact || '—'}</p></td>
                                        <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt" }}>{item.hours_independent || '—'}</p></td>
                                        <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt" }}>{item.hours_evaluation || '—'}</p></td>
                                        <td style={{ textAlign: "center", fontWeight: "bold", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt" }}>{item.hours_total || '—'}</p></td>
                                      </tr>
                                    ))}
                                    {mod.hours_total && (
                                      <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                                        <td style={{ border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt", fontWeight: "bold" }}>სულ ჯამი</p></td>
                                        <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt", fontWeight: "bold" }}>{mod.hours_total} სთ</p></td>
                                        <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt" }}>—</p></td>
                                        <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt" }}>—</p></td>
                                        <td style={{ textAlign: "center", border: "0.5pt solid #BFBFBF", padding: "3pt 5.4pt" }}><p style={{ fontSize: "9pt", fontWeight: "bold" }}>{mod.hours_total} სთ</p></td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="empty-doc-box">
                            <p className="empty-doc-text">
                              დოკუმენტის შიგთავსი ცარიელია ან დამუშავების პროცესშია.
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <div className="ftr">
                          <p style={{ textAlign: "right", fontSize: "8pt", color: "#888", paddingTop: "10pt" }}>
                            გვერდი 1
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
