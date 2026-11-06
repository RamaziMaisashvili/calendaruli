import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  UploadCloud, FileText, Download, Trash2, 
  Eye, X, RefreshCw, FileSpreadsheet, FileCode,
  Search, Filter, Building2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import DocumentReader from './DocumentReader';
import { SCHOOL22_LOGO_BASE64 } from './school22_logo';

// Microsoft Word-ის საკუთარი გამორჩეული იკონკა (ლურჯი W ბეიჯით)
const WordIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M7 3C5.89543 3 5 3.89543 5 5V27C5 28.1046 5.89543 29 7 29H25C26.1046 29 27 28.1046 27 27V11L19 3H7Z" fill="#185ABD" />
    <path d="M19 3V9C19 10.1046 19.8954 11 21 11H27L19 3Z" fill="#2877E9" />
    <rect x="9" y="15" width="14" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.85" />
    <rect x="9" y="19" width="14" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.85" />
    <rect x="9" y="23" width="9" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.85" />
    <rect x="3" y="10" width="13" height="13" rx="2.5" fill="#103F91" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
    <text x="9.5" y="19.5" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="Segoe UI, -apple-system, Arial, sans-serif" textAnchor="middle">W</text>
  </svg>
);

// Microsoft Excel-ის საკუთარი გამორჩეული იკონკა (მწვანე X ბეიჯით)
const ExcelIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M7 3C5.89543 3 5 3.89543 5 5V27C5 28.1046 5.89543 29 7 29H25C26.1046 29 27 28.1046 27 27V11L19 3H7Z" fill="#107C41" />
    <path d="M19 3V9C19 10.1046 19.8954 11 21 11H27L19 3Z" fill="#1F9A55" />
    <rect x="9" y="14" width="14" height="11" rx="1" fill="#FFFFFF" fillOpacity="0.2" />
    <path d="M9 17.5H23M9 21H23M16 14V25" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85" />
    <rect x="3" y="10" width="13" height="13" rx="2.5" fill="#0B552C" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
    <text x="9.5" y="19.5" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="Segoe UI, -apple-system, Arial, sans-serif" textAnchor="middle">X</text>
  </svg>
);

export default function FileUpload() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeReaderDoc, setActiveReaderDoc] = useState(null);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  // ძებნა, ფილტრაცია და პაგინაცია
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  const loadFiles = async () => {
    try {
      setLoading(true);
      const res = await api.getFiles();
      setFiles(res.files || []);
    } catch (err) {
      console.error('ფაილების სიის ჩატვირთვის შეცდომა:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleViewDetails = async (file) => {
    try {
      const res = await api.getFileModule(file.id);
      setActiveReaderDoc({ file, moduleData: res });
    } catch (err) {
      setActiveReaderDoc({ file, moduleData: null });
    }
  };

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!isAdmin) {
      setMessage({ type: 'error', text: 'ფაილის ატვირთვის უფლება აქვს მხოლოდ ადმინისტრატორს!' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);
      let res = await api.uploadFiles(selectedFiles, false);

      if (res && res.conflict) {
        const conflictsStr = res.conflicts ? res.conflicts.join(', ') : 'ფაილები';
        const confirmOverwrite = window.confirm(
          `გაფრთხილება: შემდეგი ფაილი(ები) უკვე არსებობს სერვერზე:\n\n${conflictsStr}\n\nგსურთ მათი გადაწერა?`
        );
        if (confirmOverwrite) {
          res = await api.uploadFiles(selectedFiles, true);
          setMessage({ type: 'success', text: `წარმატებით აიტვირთა/გადაეწერა ${res.count || selectedFiles.length} ფაილი!` });
          await loadFiles();
        } else {
          setMessage({ type: 'warning', text: 'ფაილების ატვირთვა გაუქმდა.' });
        }
      } else {
        setMessage({ type: 'success', text: res.message || `წარმატებით აიტვირთა ${res.count || selectedFiles.length} ფაილი!` });
        await loadFiles();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'ფაილების ატვირთვა ვერ მოხერხდა' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (isStudent) {
      alert('სტუდენტს არ აქვს ფაილის წაშლის უფლება');
      return;
    }

    if (!window.confirm(`ნამდვილად გსურთ ფაილის "${fileName}" წაშლა?`)) return;

    try {
      await api.deleteFile(fileId);
      setMessage({ type: 'success', text: 'ფაილი წაიშალა' });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'ფაილის წაშლა ვერ მოხერხდა' });
    }
  };

  const handleDownload = (fileId, fileName) => {
    api.downloadFile(fileId, fileName).catch((err) => {
      setMessage({ type: 'error', text: err.message || 'ჩამოტვირთვა ვერ მოხერხდა' });
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIconMeta = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return {
        icon: <ExcelIcon size={26} />,
        bg: '#ecfdf5',
        border: '#a7f3d0',
        title: 'Excel ცხრილი',
      };
    }
    if (['docx', 'doc'].includes(ext)) {
      return {
        icon: <WordIcon size={26} />,
        bg: '#eff6ff',
        border: '#bfdbfe',
        title: 'Word დოკუმენტი',
      };
    }
    if (['json', 'py', 'js', 'html'].includes(ext)) {
      return {
        icon: <FileCode size={22} color="#0284c7" />,
        bg: '#f0f9ff',
        border: '#bae6fd',
        title: 'კოდის ფაილი',
      };
    }
    return {
      icon: <FileText size={22} color="#64748b" />,
      bg: '#f8fafc',
      border: '#e2e8f0',
      title: 'დოკუმენტი',
    };
  };

  const getFileIcon = (fileName) => {
    return getFileIconMeta(fileName).icon;
  };

  // -------------------------------------------------------------
  // ფაილის ორგანიზაციისა და მოდულის ტიპის განსაზღვრა (1=პროფესიული, 2=ზოგადი, 3=ინტეგრირებული)
  // -------------------------------------------------------------
  const resolveFileClassification = (f) => {
    const name = (f.original_name || '').toLowerCase();
    const ext = name.split('.').pop();
    const summary = f.summary || {};
    const details = summary.details || {};
    const sumType = (details.type || '').toLowerCase();

    // 1. ორგანიზაცია (22-ე სკოლა vs WEA)
    let orgCode = f.organization_code;
    let orgName = f.organization_name;
    let orgShort = f.organization_short;

    if (!orgCode || orgCode === 'other') {
      const weaKws = [
        'დანართი', 'wea', 'front-end', 'frontend', 'აკადემი', 'მსოფლიო განათლებ',
        'მარკირება', 'სტილიზაცია', 'javascript', 'typescript', 'react',
        'ოპტიმიზაცია', 'ხელოვნური ინტელექტ', 'ბაღდათი'
      ];
      const school22Kws = [
        '22', 'ქსელ', 'ქუთაის', 'გოქაძ', 'კომპიუტერ', 'პერიფერი', 'აპარატურ',
        'მარშუტიზაც', 'კომუტაც', 'სერვერ', 'ლიტერატურა-ქსელი', 'წიგნიერება',
        'მეცნიერება და ტექნოლოგი', 'მოქალაქეობა', 'სპორტი', 'ესთეტიკა', 'დამისამართება'
      ];

      const is22 = school22Kws.some(k => name.includes(k)) || /^\d+[\.\s\-]/.test(name.trim());
      const isWea = !is22 && weaKws.some(k => name.includes(k));

      if (is22) {
        orgCode = '22_skola';
        orgName = 'სსიპ - ნესტორ გოქაძის სახელობის ქალაქ ქუთაისის N 22 საჯარო სკოლა';
        orgShort = '22 სკოლა';
      } else if (isWea) {
        orgCode = 'wea';
        orgName = 'შპს მსოფლიო განათლების აკადემია (WEA)';
        orgShort = 'WEA';
      } else {
        orgCode = 'other';
        orgName = 'საგანმანათლებლო დაწესებულება';
        orgShort = 'სხვა';
      }
    }

    // 2. მოდულის ტიპი და კატეგორია
    let moduleTypeId = f.module_type_id != null ? Number(f.module_type_id) : (details.module_type_id != null ? Number(details.module_type_id) : null);
    let category = f.resource_category;
    let categoryLabel = f.resource_category_label || '';
    let badgeClass = 'vocational-tag';

    const isExcel = ['xlsx', 'xls', 'csv'].includes(ext);
    const isWord = ['docx', 'doc'].includes(ext);

    if (isExcel) {
      if (category === 'resources' || sumType.includes('რესურს') || name.includes('რესურს') || name.includes('resource')) {
        category = 'resources';
        categoryLabel = 'მატერიალური რესურსები (Excel)';
        badgeClass = 'resources-tag';
      } else if (category === 'plan' || sumType.includes('გეგმა') || name.includes('გეგმა') || name.includes('plan')) {
        category = 'plan';
        categoryLabel = 'სასწავლო გეგმა (Excel)';
        badgeClass = 'plan-tag';
      } else {
        category = 'xlsx';
        categoryLabel = 'Excel ცხრილი';
        badgeClass = 'sheet-tag';
      }
    } else if (isWord) {
      const isIntegrated = (
        moduleTypeId === 3 ||
        sumType.includes('ინტეგრირებულ') ||
        name.includes('ინტეგრირებულ') ||
        name.includes('მათემატიკ') ||
        name.includes('მეცნიერ') ||
        name.includes('მოქალაქ') ||
        name.includes('სპორტ') ||
        name.includes('ესთეტიკ') ||
        name.includes('კომუნიკაცია')
      );

      const isGeneral = !isIntegrated && (
        moduleTypeId === 2 ||
        sumType.includes('ზოგად') ||
        name.includes('(ზოგადი)') ||
        name.includes('ზოგადი') ||
        name.includes('მეწარმეობ') ||
        name.includes('უცხოური ენა') ||
        name.includes('პიროვნული უნარებ')
      );

      if (isIntegrated) {
        moduleTypeId = 3;
        category = 'integrated_module';
        categoryLabel = 'ინტეგრირებული მოდული';
        badgeClass = 'integrated-tag';
      } else if (isGeneral) {
        moduleTypeId = 2;
        category = 'general_module';
        categoryLabel = 'ზოგადი მოდული';
        badgeClass = 'general-tag';
      } else {
        moduleTypeId = 1;
        category = 'vocational_module';
        categoryLabel = 'პროფესიული მოდული';
        badgeClass = 'vocational-tag';
      }
    } else {
      category = 'other';
      categoryLabel = `ფაილი (${ext.toUpperCase()})`;
      badgeClass = 'doc-tag';
    }

    return {
      orgCode,
      orgName,
      orgShort,
      moduleTypeId,
      category,
      categoryLabel,
      badgeClass
    };
  };

  // -------------------------------------------------------------
  // ფილტრაცია და ძებნა
  // -------------------------------------------------------------
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const classification = resolveFileClassification(f);

      // ორგანიზაციის ფილტრი
      if (orgFilter !== 'all' && classification.orgCode !== orgFilter) {
        return false;
      }

      // ტიპის ფილტრი
      if (typeFilter !== 'all') {
        const ext = (f.original_name || '').split('.').pop().toLowerCase();
        if (typeFilter === 'vocational') {
          if (classification.category !== 'vocational_module' && classification.moduleTypeId !== 1) return false;
        } else if (typeFilter === 'general') {
          if (classification.category !== 'general_module' && classification.moduleTypeId !== 2) return false;
        } else if (typeFilter === 'integrated') {
          if (classification.category !== 'integrated_module' && classification.moduleTypeId !== 3) return false;
        } else if (typeFilter === 'plan') {
          if (classification.category !== 'plan') return false;
        } else if (typeFilter === 'resources') {
          if (classification.category !== 'resources') return false;
        } else if (typeFilter === 'docx') {
          if (!['docx', 'doc'].includes(ext)) return false;
        } else if (typeFilter === 'xlsx') {
          if (!['xlsx', 'xls', 'csv'].includes(ext)) return false;
        }
      }

      // ძებნის ტექსტი
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const name = (f.original_name || '').toLowerCase();
        const author = (f.uploader_name || '').toLowerCase();
        const type = (f.summary?.details?.type || '').toLowerCase();
        const modName = (f.summary?.details?.module_name || '').toLowerCase();
        const orgInfo = (classification.orgName || '').toLowerCase() + ' ' + (classification.orgShort || '').toLowerCase();
        const catLabel = (classification.categoryLabel || '').toLowerCase();

        if (
          !name.includes(q) && 
          !author.includes(q) && 
          !type.includes(q) && 
          !modName.includes(q) && 
          !orgInfo.includes(q) && 
          !catLabel.includes(q)
        ) {
          return false;
        }
      }

      // სტატუსის ფილტრი
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && f.status !== 'completed') return false;
        if (statusFilter === 'warning' && f.status === 'completed') return false;
      }

      return true;
    });
  }, [files, searchTerm, orgFilter, typeFilter, statusFilter]);

  // პაგინაციის გამოთვლა
  const totalPages = Math.ceil(filteredFiles.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedFiles = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, safeCurrentPage, pageSize]);

  // ძებნის/ფილტრის ცვლილებისას გვერდის დაბრუნება 1-ზე
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOrgChange = (e) => {
    setOrgFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* შეტყობინების ბარი */}
      {message && (
        <div className={`message-banner ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="btn-close-msg">
            <X size={16} />
          </button>
        </div>
      )}

      {/* მხოლოდ ადმინისტრატორს აქვს ატვირთვის უფლება */}
      {isAdmin && (
        <div className="upload-card">
          <div className="upload-card-title">სასწავლო რესურსების ატვირთვა</div>
          <div className="upload-card-sub">
            ატვირთეთ პროფესიული ან ინტეგრირებული მოდულები (.docx), Excel ცხრილები ან სხვა სასწავლო მასალები.
          </div>

          <div
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
              disabled={uploading}
            />

            <div className="dropzone-icon">
              <UploadCloud size={48} />
            </div>

            <div className="dropzone-text">
              {uploading ? 'მიმდინარეობს ატვირთვა და დამუშავება...' : 'ჩააგდეთ ფაილები აქ ან დააჭირეთ ასარჩევად'}
            </div>
            <div className="dropzone-hint">
              მხარდაჭერილია მრავალჯერადი ატვირთვა (DOCX, XLSX, TXT, JSON, PDF)
            </div>
          </div>
        </div>
      )}

      {/* ფაილების სია, ძებნა, ფილტრაცია და პაგინაცია */}
      <div className="table-card">
        {/* სათაური და განახლების ღილაკი */}
        <div className="table-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 className="table-title">
              {isTeacher ? 'ჩემი სასწავლო რესურსები' : 'სასწავლო რესურსების სია'}
            </h3>
            <span className="table-count-badge">
              {filteredFiles.length} {filteredFiles.length !== files.length ? `(სულ ${files.length}-დან)` : 'ფაილი'}
            </span>
          </div>

          <button 
            onClick={loadFiles} 
            disabled={loading}
            className="btn-refresh"
            title="სიის განახლება"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>განახლება</span>
          </button>
        </div>

        {/* ძებნისა და ფილტრების პანელი */}
        <div className="filters-toolbar">
          {/* ძებნის ველი */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="მოძებნეთ ფაილის სახელით, ავტორით..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                className="search-clear-btn"
                title="გასუფთავება"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* ფილტრები */}
          <div className="filter-controls">
            <div className="filter-select-wrapper">
              <Building2 size={14} className="filter-icon" />
              <select 
                value={orgFilter} 
                onChange={handleOrgChange}
                className="filter-select"
                title="ორგანიზაციის ფილტრი"
              >
                <option value="all">ყველა ორგანიზაცია</option>
                <option value="22_skola">22-ე სკოლა (ქუთაისის N 22 საჯარო სკოლა)</option>
                <option value="wea">WEA (მსოფლიო განათლების აკადემია)</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <Filter size={14} className="filter-icon" />
              <select 
                value={typeFilter} 
                onChange={handleTypeChange}
                className="filter-select"
                title="ტიპის ფილტრი"
              >
                <option value="all">ყველა ტიპი</option>
                <option value="vocational">პროფესიული მოდულები</option>
                <option value="general">ზოგადი მოდულები</option>
                <option value="integrated">ინტეგრირებული მოდულები</option>
                <option value="plan">სასწავლო გეგმები (Excel)</option>
                <option value="resources">მატერიალური რესურსები (Excel)</option>
                <option value="docx">Word დოკუმენტები (.docx)</option>
                <option value="xlsx">Excel ცხრილები (.xlsx)</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <select 
                value={statusFilter} 
                onChange={handleStatusChange}
                className="filter-select"
                title="სტატუსის ფილტრი"
              >
                <option value="all">ყველა სტატუსი</option>
                <option value="completed">დამუშავებულია</option>
                <option value="warning">გაფრთხილებით</option>
              </select>
            </div>
          </div>
        </div>

        {/* მონაცემთა ცხრილი */}
        {filteredFiles.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-icon" />
            <p>
              {searchTerm || orgFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'მითითებული ფილტრით რესურსები ვერ მოიძებნა.'
                : isTeacher 
                  ? 'თქვენ ჯერჯერობით არ გაქვთ ატვირთული არცერთი სასწავლო რესურსი.' 
                  : 'რესურსები ვერ მოიძებნა.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ფაილის სახელი</th>
                    <th>ზომა</th>
                    <th>ავტორი</th>
                    <th>თარიღი</th>
                    <th>სტატუსი</th>
                    <th style={{ textAlign: 'right' }}>მოქმედება</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFiles.map((file) => {
                    const cls = resolveFileClassification(file);
                    const iconMeta = getFileIconMeta(file.original_name);
                    return (
                      <tr key={file.id}>
                        <td>
                          <div className="file-name-cell">
                            <div
                              className="file-icon-box"
                              style={{
                                background: iconMeta.bg,
                                border: `1px solid ${iconMeta.border}`,
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                              title={iconMeta.title}
                            >
                              {iconMeta.icon}
                            </div>
                            <div>
                              <div className="file-title" title={file.original_name}>
                                {file.original_name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span className={`org-badge ${cls.orgCode === '22_skola' ? 'org-22' : cls.orgCode === 'wea' ? 'org-wea' : 'org-other'}`}>
                                  {cls.orgCode === '22_skola' && (
                                    <img 
                                      src={SCHOOL22_LOGO_BASE64} 
                                      alt="22 სკოლა" 
                                      style={{ width: '13px', height: '13px', objectFit: 'contain', verticalAlign: 'middle', marginRight: '4px' }} 
                                    />
                                  )}
                                  {cls.orgShort}
                                </span>
                                <span className={`module-badge-tag ${cls.badgeClass}`}>
                                  {cls.categoryLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      <td>{formatFileSize(file.file_size)}</td>
                      <td>{file.uploader_name || 'ადმინისტრატორი'}</td>
                      <td>{file.created_at ? new Date(file.created_at).toLocaleString('ka-GE') : '-'}</td>
                      <td>
                        <span 
                          className={`status-badge ${file.status === 'completed' ? 'status-completed' : 'status-pending'}`}
                          title={file.summary?.details?.error || file.status}
                        >
                          {file.status === 'completed' ? 'დამუშავებულია' : 'გაფრთხილებით'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="action-btn view-btn"
                            title="მოდულის დათვალიერება"
                            onClick={() => handleViewDetails(file)}
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            className="action-btn download-btn-table"
                            title="ჩამოტვირთვა"
                            onClick={() => handleDownload(file.id, file.original_name)}
                          >
                            <Download size={17} />
                          </button>
                          {isAdmin && (
                            <button
                              className="action-btn delete-btn-table"
                              title="წაშლა"
                              onClick={() => handleDelete(file.id, file.original_name)}
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* პაგინაციის ზოლი */}
            <div className="pagination-bar">
              <div className="pagination-info">
                ნაჩვენებია <strong>{(safeCurrentPage - 1) * pageSize + 1}</strong>-დან <strong>{Math.min(safeCurrentPage * pageSize, filteredFiles.length)}</strong>-მდე (სულ {filteredFiles.length} რესურსი)
              </div>

              <div className="pagination-controls">
                {/* გვერდის ზომის არჩევა */}
                <div className="page-size-selector">
                  <span style={{ fontSize: '12px', color: '#64748b' }}>გვერდზე:</span>
                  <select 
                    value={pageSize} 
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="page-size-select"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* წინა / შემდეგი ღილაკები */}
                <div className="page-buttons">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                    className="page-nav-btn"
                    title="პირველი გვერდი"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="page-nav-btn"
                    title="წინა გვერდი"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="page-number-display">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={safeCurrentPage === totalPages}
                    className="page-nav-btn"
                    title="შემდეგი გვერდი"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    className="page-nav-btn"
                    title="ბოლო გვერდი"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* სრულეკრანიანი Word-ის წამკითხველი (ბეჭდვა, ჩამოტვირთვა, დახურვა) */}
      {activeReaderDoc && (
        <DocumentReader
          file={activeReaderDoc.file}
          moduleData={activeReaderDoc.moduleData}
          onClose={() => setActiveReaderDoc(null)}
        />
      )}
    </div>
  );
}
