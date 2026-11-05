import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, X, Edit, Trash2, Phone, Mail, 
  CheckCircle, AlertCircle, RefreshCw, Lock, Shield, User,
  Check, XCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeachersCRUD() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  // ფილტრაცია და ძებნა
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive

  // მოდალის მდგომარეობა
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // წაშლის დადასტურების მოდალი
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ფორმის ველები
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    is_active: true
  });

  // მონაცემების ჩატვირთვა
  const fetchTeachers = async (term = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTeachers(term);
      if (res.success) {
        setTeachers(res.teachers || []);
      }
    } catch (err) {
      setError(err.message || 'მასწავლებლების სიის ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // ავტო-შეტყობინების გაქრობა 4 წამში
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ძებნა და ფილტრაცია
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      // სტატუსის ფილტრი
      if (statusFilter === 'active' && !t.is_active) return false;
      if (statusFilter === 'inactive' && t.is_active) return false;

      // ტექსტური ძებნა
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nMatch = (t.name || '').toLowerCase().includes(q);
        const uMatch = (t.username || '').toLowerCase().includes(q);
        const pMatch = (t.phone || '').includes(q);
        const eMatch = (t.email || '').toLowerCase().includes(q);
        return nMatch || uMatch || pMatch || eMatch;
      }
      return true;
    });
  }, [teachers, searchTerm, statusFilter]);

  // სტატისტიკა
  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => t.is_active).length;
    return { total, active, inactive: total - active };
  }, [teachers]);

  // მოდალის გახსნა შექმნისთვის
  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      username: '',
      phone: '',
      email: '',
      password: '1234',
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
  };

  // მოდალის გახსნა რედაქტირებისთვის
  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name || '',
      username: t.username || '',
      phone: t.phone || '',
      email: t.email || '',
      password: '', // რედაქტირებისას ცარიელია, თუ არ შეცვლის
      is_active: t.is_active
    });
    setFormError('');
    setModalOpen(true);
  };

  // სახელის აკრეფისას იუზერნეიმის ავტო-გენერაცია (ტრანსლიტერაცია)
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, name: newName };
      // თუ ახალია და იუზერნეიმი ჯერ ცარიელია ან ავტოგენერირებულია
      if (!editingTeacher && (!prev.username || prev.username === transliterate(prev.name))) {
        updated.username = transliterate(newName);
      }
      return updated;
    });
  };

  // მარტივი ქართულ-ლათინური ტრანსლიტერაცია იუზერნეიმისთვის
  const transliterate = (text) => {
    const map = {
      'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
      'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
      'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'y',
      'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
    };
    return text.trim().toLowerCase()
      .split('')
      .map(char => map[char] || (/[a-z0-9_]/.test(char) ? char : (char === ' ' ? '_' : '')))
      .join('')
      .replace(/_+/g, '_')
      .slice(0, 30);
  };

  // ფორმის გაგზავნა (შექმნა / რედაქტირება)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('გთხოვთ მიუთითოთ მასწავლებლის სახელი და გვარი');
      return;
    }
    if (!formData.username.trim()) {
      setFormError('გთხოვთ მიუთითოთ მომხმარებლის სახელი (Username)');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingTeacher) {
        // რედაქტირება
        const payload = {
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          is_active: formData.is_active
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await api.updateTeacher(editingTeacher.id, payload);
        setSuccessMsg(`მასწავლებელი „${formData.name}“ წარმატებით განახლდა`);
      } else {
        // შექმნა
        const payload = {
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          password: formData.password.trim() || '1234',
          is_active: formData.is_active
        };
        await api.createTeacher(payload);
        setSuccessMsg(`ახალი მასწავლებელი „${formData.name}“ წარმატებით დაემატა`);
      }

      setModalOpen(false);
      fetchTeachers();
    } catch (err) {
      setFormError(err.message || 'ოპერაციის შესრულება ვერ მოხერხდა');
    } finally {
      setSaving(false);
    }
  };

  // წაშლის შესრულება
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await api.deleteTeacher(deleteCandidate.id);
      setSuccessMsg(`მასწავლებელი „${deleteCandidate.name}“ წარმატებით წაიშალა`);
      setDeleteCandidate(null);
      fetchTeachers();
    } catch (err) {
      alert('წაშლა ვერ მოხერხდა: ' + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  // ინიციალები ავატარისთვის
  const getInitials = (fullName) => {
    if (!fullName) return 'M';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="teachers-crud-container">
      {/* ზედა ზოლი: სათაური და ღილაკები */}
      <div className="crud-header">
        <div>
          <div className="crud-title-group">
            <div className="crud-title-icon">
              <Users size={22} />
            </div>
            <div>
              <h1 className="crud-main-title">მასწავლებლების მართვა</h1>
              <p className="crud-subtitle">პედაგოგების სია, საკონტაქტო მონაცემები და ავტორიზაციის ანგარიშები</p>
            </div>
          </div>
        </div>

        <div className="crud-top-actions">
          <button 
            className="action-btn-refresh" 
            onClick={() => fetchTeachers(searchTerm)}
            title="სიის განახლება"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>განახლება</span>
          </button>

          {isAdmin && (
            <button className="btn-primary-add" onClick={handleOpenCreate}>
              <UserPlus size={17} />
              <span>ახალი მასწავლებელი</span>
            </button>
          )}
        </div>
      </div>

      {/* სტატისტიკის პანელები */}
      <div className="crud-stats-row">
        <div className="crud-stat-pill">
          <span className="stat-label">სულ მასწავლებელი:</span>
          <strong className="stat-value">{stats.total}</strong>
        </div>
        <div className="crud-stat-pill stat-active">
          <span className="stat-label">აქტიური:</span>
          <strong className="stat-value">{stats.active}</strong>
        </div>
        {stats.inactive > 0 && (
          <div className="crud-stat-pill stat-inactive">
            <span className="stat-label">არააქტიური:</span>
            <strong className="stat-value">{stats.inactive}</strong>
          </div>
        )}
      </div>

      {/* შეტყობინებები */}
      {successMsg && (
        <div className="crud-alert alert-success fade-in">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="crud-alert alert-danger fade-in">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ფილტრები და ძებნა */}
      <div className="crud-filter-bar">
        <div className="crud-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="crud-search-input"
            placeholder="ძებნა სახელით, username-ით, ტელეფონით, მეილით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="crud-clear-btn" onClick={() => setSearchTerm('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="crud-status-select-wrap">
          <select 
            className="crud-select" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="active">მხოლოდ აქტიური</option>
            <option value="inactive">მხოლოდ არააქტიური</option>
          </select>
        </div>
      </div>

      {/* მონაცემთა ცხრილი */}
      <div className="crud-table-card">
        {loading ? (
          <div className="crud-loading">
            <RefreshCw size={24} className="spin" />
            <p>იტვირთება მასწავლებლების მონაცემები...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="crud-empty">
            <Users size={40} className="empty-icon" />
            <h3>მასწავლებლები ვერ მოიძებნა</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'მითითებული საძიებო პარამეტრებით მასწავლებელი ვერ მოიძებნა.' 
                : 'ბაზაში მასწავლებლები ჯერჯერობით შეყვანილი არ არის.'}
            </p>
            {isAdmin && !searchTerm && (
              <button className="btn-primary-add" onClick={handleOpenCreate} style={{ marginTop: '12px' }}>
                <UserPlus size={16} />
                <span>პირველი მასწავლებლის დამატება</span>
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="crud-data-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>სახელი და გვარი</th>
                  <th>მომხმარებელი (Username)</th>
                  <th>ტელეფონი</th>
                  <th>ელ.ფოსტა</th>
                  <th>სტატუსი</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>მოქმედება</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t, index) => (
                  <tr key={t.id}>
                    <td className="row-number">{index + 1}</td>
                    <td>
                      <div className="teacher-name-cell">
                        <div className="teacher-avatar">
                          {getInitials(t.name)}
                        </div>
                        <div>
                          <div className="teacher-name-text">{t.name}</div>
                          <div className="teacher-role-tag">პროფესიული მასწავლებელი</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="username-badge">
                        @{t.username}
                      </span>
                    </td>
                    <td>
                      {t.phone ? (
                        <a href={`tel:${t.phone}`} className="contact-link" title="დარეკვა">
                          <Phone size={14} className="contact-icon" />
                          <span>{t.phone}</span>
                        </a>
                      ) : (
                        <span className="text-empty">—</span>
                      )}
                    </td>
                    <td>
                      {t.email ? (
                        <a href={`mailto:${t.email}`} className="contact-link" title="წერილის მიწერა">
                          <Mail size={14} className="contact-icon" />
                          <span>{t.email}</span>
                        </a>
                      ) : (
                        <span className="text-empty">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${t.is_active ? 'pill-active' : 'pill-inactive'}`}>
                        {t.is_active ? (
                          <>
                            <Check size={12} />
                            <span>აქტიური</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>არააქტიური</span>
                          </>
                        )}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="action-btn edit-btn"
                            title="რედაქტირება"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            title="წაშლა"
                            onClick={() => setDeleteCandidate(t)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==============================================================
          მოდალი: დამატება / რედაქტირება
         ============================================================== */}
      {modalOpen && (
        <div className="crud-modal-backdrop">
          <div className="crud-modal-card fade-in">
            <div className="crud-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-wrap">
                  {editingTeacher ? <Edit size={18} /> : <UserPlus size={18} />}
                </div>
                <h3>{editingTeacher ? 'მასწავლებლის რედაქტირება' : 'ახალი მასწავლებლის დამატება'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="crud-modal-body">
                {formError && (
                  <div className="modal-error-alert">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>სახელი და გვარი *</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="მაგ. ლუდვიგი ხუხუნაიშვილი"
                      value={formData.name}
                      onChange={handleNameChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>მომხმარებელი (Username) *</label>
                  <div className="input-with-icon">
                    <span className="input-prefix">@</span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="მაგ. ludvigi"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <span className="form-hint">გამოიყენება სისტემაში შესვლისთვის</span>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>ტელეფონი</label>
                    <div className="input-with-icon">
                      <Phone size={16} className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="მაგ. 577 67 58 12"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>ელ.ფოსტა</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="მაგ. teacher@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {editingTeacher ? 'ახალი პაროლი (სურვილისამებრ)' : 'პაროლი (დეფოლტად 1234)'}
                  </label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder={editingTeacher ? 'დატოვეთ ცარიელი უცვლელად დასატოვებლად' : '1234'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>აქტიური ანგარიში (შეუძლია სისტემაში ავტორიზაცია)</span>
                  </label>
                </div>
              </div>

              <div className="crud-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>ინახება...</span>
                    </>
                  ) : (
                    <span>{editingTeacher ? 'განახლება' : 'დამატება'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          მოდალი: წაშლის დადასტურება
         ============================================================== */}
      {deleteCandidate && (
        <div className="crud-modal-backdrop">
          <div className="crud-modal-card modal-confirm fade-in">
            <div className="confirm-icon-wrap">
              <Trash2 size={28} />
            </div>
            <h3>მასწავლებლის წაშლა</h3>
            <p>
              ნამდვილად გსურთ მასწავლებელ <strong>„{deleteCandidate.name}“</strong> (@{deleteCandidate.username})-ის წაშლა?
            </p>
            <div className="confirm-modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
              >
                გაუქმება
              </button>
              <button
                className="btn-danger-confirm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'იშლება...' : 'დიახ, წაშლა'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
