import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  Copy,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

// ოფიციალური უქმე დღეები საქართველოში (2026-2027)
const DEFAULT_HOLIDAYS_MAP = {
  '2026-10-14': 'სვეტიცხოვლობა',
  '2026-11-23': 'გიორგობა',
  '2026-12-30': 'ზამთრის არდადეგები',
  '2026-12-31': 'ზამთრის არდადეგები',
  '2027-01-01': 'ახალი წელი',
  '2027-01-02': 'ბედობა',
  '2027-01-04': 'ზამთრის არდადეგები',
  '2027-01-05': 'ზამთრის არდადეგები',
  '2027-01-06': 'ზამთრის არდადეგები',
  '2027-01-07': 'შობა',
  '2027-01-08': 'ზამთრის არდადეგები',
  '2027-01-11': 'ზამთრის არდადეგები',
  '2027-01-12': 'ზამთრის არდადეგები',
  '2027-01-13': 'ზამთრის არდადეგები',
  '2027-01-14': 'ზამთრის არდადეგები',
  '2027-01-15': 'ზამთრის არდადეგები',
  '2027-01-19': 'ნათლისღება',
  '2027-03-03': 'დედის დღე',
  '2027-03-08': 'ქალთა საერთაშორისო დღე',
  '2027-04-09': 'ეროვნული ერთიანობის დღე',
  '2027-04-30': 'წითელი პარასკევი',
  '2027-05-03': 'აღდგომის ორშაბათი',
  '2027-05-09': 'ფაშიზმზე გამარჯვების დღე',
  '2027-05-12': 'ანდრია პირველწოდებულის ხსენების დღე',
  '2027-05-26': 'დამოუკიდებლობის დღე',
};

const WEEKDAY_NAMES = [
  { key: 'mon', label: 'ორშ', fullName: 'ორშაბათი', offset: 0 },
  { key: 'tue', label: 'სამ', fullName: 'სამშაბათი', offset: 1 },
  { key: 'wed', label: 'ოთხ', fullName: 'ოთხშაბათი', offset: 2 },
  { key: 'thu', label: 'ხუთ', fullName: 'ხუთშაბათი', offset: 3 },
  { key: 'fri', label: 'პარ', fullName: 'პარასკევი', offset: 4 },
  { key: 'sat', label: 'შაბ', fullName: 'შაბათი', offset: 5 },
];

function formatDateGeo(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getIsoWeekday(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  return day === 0 ? 7 : day; // 1 = Monday ... 7 = Sunday
}

function getMondayOfIsoDate(isoDate) {
  const wd = getIsoWeekday(isoDate);
  return addDays(isoDate, -(wd - 1));
}

// კვირების ავტომატური გენერატორი დაწყების თარიღიდან
function generateWeeksStructure(startDateIso, totalWeeksCount = 42, customHolidays = DEFAULT_HOLIDAYS_MAP) {
  const startMonday = getMondayOfIsoDate(startDateIso);
  const result = [];
  let currMonday = startMonday;
  let academicWeekCounter = 1;

  for (let w = 1; w <= totalWeeksCount; w++) {
    const days = WEEKDAY_NAMES.map((wd) => {
      const dateIso = addDays(currMonday, wd.offset);
      const isDefaultActive = wd.key !== 'sat'; // ორშაბათი-პარასკევი აქტიურია, შაბათი არააქტიური
      const holidayName = customHolidays[dateIso] || '';
      return {
        key: wd.key,
        label: wd.label,
        fullName: wd.fullName,
        date: dateIso,
        isActive: isDefaultActive && !holidayName,
        isHoliday: Boolean(holidayName),
        holidayName: holidayName,
      };
    });

    const workdays = days.slice(0, 5); // ორშ-პარ
    const allWorkdaysAreHolidays = workdays.every((d) => d.isHoliday);

    let weekType = 'study';
    let note = '';

    if (allWorkdaysAreHolidays) {
      weekType = 'winter_vacation';
      note = 'ზამთრის არდადეგები';
    } else {
      const foundHolidays = workdays.filter((d) => d.isHoliday).map((d) => d.holidayName);
      if (foundHolidays.length > 0) {
        note = foundHolidays.join('; ');
      }
    }

    const isVacationWeek = ['winter_vacation', 'spring_vacation', 'summer_vacation', 'holiday'].includes(weekType);
    let assignedAcadWeek = null;

    if (!isVacationWeek) {
      assignedAcadWeek = academicWeekCounter;
      academicWeekCounter += 1;
    }

    const fridayDate = addDays(currMonday, 4);

    result.push({
      calendarWeekNumber: w,
      academicWeekNumber: assignedAcadWeek,
      mondayDate: currMonday,
      fridayDate: fridayDate,
      weekType: weekType,
      days: days,
      note: note,
    });

    currMonday = addDays(currMonday, 7);
  }

  return result;
}

// ხელახალი გადათვლა: თუ რომელიმე კვირა არდადეგებია, მისი ნომერი იხსნება და მომდევნოები გადაინომრება
function recalculateAcademicWeeks(weeksList) {
  let counter = 1;
  return weeksList.map((wk, idx) => {
    const isVacation = ['winter_vacation', 'spring_vacation', 'summer_vacation', 'holiday'].includes(wk.weekType);
    if (isVacation) {
      return {
        ...wk,
        calendarWeekNumber: idx + 1,
        academicWeekNumber: null,
      };
    }
    const currentNum = counter;
    counter += 1;
    return {
      ...wk,
      calendarWeekNumber: idx + 1,
      academicWeekNumber: currentNum,
    };
  });
}

export default function AcademicScheduleManager() {
  const [loading, setLoading] = useState(true);
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  
  // კალენდრის მეტამონაცემები
  const [currentId, setCurrentId] = useState(null);
  const [title, setTitle] = useState('2026-2027 სასწავლო წლის კალენდარი');
  const [programName, setProgramName] = useState('კომპიუტერული ქსელი და სისტემები');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [startDate, setStartDate] = useState('2026-09-15');
  const [totalWeeks, setTotalWeeks] = useState(42);
  const [isTemplate, setIsTemplate] = useState(false);
  const [weeks, setWeeks] = useState([]);
  
  // შეტყობინებები
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // არდადეგების სწრაფი მონიშვნის დიალოგი
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacationStart, setVacationStart] = useState('2026-12-30');
  const [vacationEnd, setVacationEnd] = useState('2027-01-16');
  const [vacationTitle, setVacationTitle] = useState('ზამთრის არდადეგები');
  const [vacationType, setVacationType] = useState('winter_vacation');

  useEffect(() => {
    loadSavedSchedules();
    // საწყისი გენერირება
    const initialWeeks = generateWeeksStructure('2026-09-15', 42);
    setWeeks(initialWeeks);
  }, []);

  const loadSavedSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.getAcademicSchedules().catch(() => ({ schedules: [] }));
      setSavedSchedules(res.schedules || []);
    } catch (err) {
      setErrorMsg('შენახული კალენდრების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  // შაბლონის ან შენახული კალენდრის არჩევა
  const handleSelectSchedule = async (scheduleIdStr) => {
    setSelectedScheduleId(scheduleIdStr);
    if (!scheduleIdStr) return;

    if (scheduleIdStr === 'default_template') {
      // სტანდარტული შაბლონი
      setCurrentId(null);
      setTitle('2026-2027 საბაზო სასწავლო კალენდარი');
      setProgramName('საერთო სასწავლო კალენდარი');
      setAcademicYear('2026-2027');
      setStartDate('2026-09-15');
      setTotalWeeks(42);
      setIsTemplate(false);
      const generated = generateWeeksStructure('2026-09-15', 42);
      setWeeks(generated);
      setSuccessMsg('ჩაიტვირთა 2026-2027 საბაზო შაბლონი');
      return;
    }

    try {
      const res = await api.getAcademicSchedule(Number(scheduleIdStr));
      const sch = res.schedule;
      if (sch) {
        setCurrentId(sch.id);
        setTitle(sch.title || '');
        setProgramName(sch.program_name || '');
        setAcademicYear(sch.academic_year || '2026-2027');
        setStartDate(sch.start_date || '2026-09-15');
        setTotalWeeks(sch.total_weeks || 42);
        setIsTemplate(Boolean(sch.is_template));

        if (Array.isArray(sch.weeks_json) && sch.weeks_json.length > 0) {
          setWeeks(sch.weeks_json);
        } else {
          setWeeks(generateWeeksStructure(sch.start_date || '2026-09-15', sch.total_weeks || 42));
        }
        setSuccessMsg(`ჩაიტვირთა: ${sch.title}`);
      }
    } catch (err) {
      setErrorMsg('კალენდრის ჩატვირთვა ვერ მოხერხდა');
    }
  };

  // შაბლონის ბაზაზე ახლის შექმნა (დუბლირება)
  const handleCloneAsNew = () => {
    setCurrentId(null);
    setTitle(`${title} (ასლი)`);
    setIsTemplate(false);
    setSelectedScheduleId('');
    setSuccessMsg('შეიქმნა ახალი კალენდარი არჩეული შაბლონის ბაზაზე. შეგიძლიათ შეცვალოთ და შეინახოთ.');
  };

  // ახალი სუფთა კალენდრის გენერირება
  const handleRegenerateFromStart = () => {
    const generated = generateWeeksStructure(startDate, Number(totalWeeks) || 42);
    setWeeks(generated);
    setSuccessMsg(`კვირეები ხელახლა დაითვალა ${formatDateGeo(startDate)}-დან (${totalWeeks} კვირა)`);
  };

  // კვირის ველის შეცვლა (სტატუსი, შენიშვნა, სასწავლო კვირის ნომერი)
  const handleWeekChange = (weekIdx, field, value) => {
    const updated = [...weeks];
    const target = { ...updated[weekIdx], [field]: value };

    // თუ ტიპი შეიცვალა, ხელახლა გადავთვალოთ სასწავლო კვირის ნომრები
    if (field === 'weekType') {
      const isVacation = ['winter_vacation', 'spring_vacation', 'summer_vacation', 'holiday'].includes(value);
      if (isVacation) {
        target.academicWeekNumber = null;
      }
      updated[weekIdx] = target;
      const renumbered = recalculateAcademicWeeks(updated);
      setWeeks(renumbered);
      return;
    }

    if (field === 'academicWeekNumber') {
      target.academicWeekNumber = value ? Math.max(1, Math.round(Number(value) || 1)) : null;
    }

    updated[weekIdx] = target;
    setWeeks(updated);
  };

  // კონკრეტული დღის ჩართვა/გამორთვა
  const handleToggleDay = (weekIdx, dayKey) => {
    const updated = [...weeks];
    const week = { ...updated[weekIdx] };
    const days = week.days.map((d) => (d.key === dayKey ? { ...d, isActive: !d.isActive } : d));
    week.days = days;
    updated[weekIdx] = week;
    setWeeks(updated);
  };

  // ახალი კვირის ჩამატება ბოლოში
  const handleAddWeekAtEnd = () => {
    const lastWeek = weeks[weeks.length - 1];
    const nextMonday = lastWeek ? addDays(lastWeek.mondayDate, 7) : addDays(startDate, 7);
    const nextFriday = addDays(nextMonday, 4);

    const newDays = WEEKDAY_NAMES.map((wd) => {
      const dIso = addDays(nextMonday, wd.offset);
      return {
        key: wd.key,
        label: wd.label,
        fullName: wd.fullName,
        date: dIso,
        isActive: wd.key !== 'sat',
        isHoliday: Boolean(DEFAULT_HOLIDAYS_MAP[dIso]),
        holidayName: DEFAULT_HOLIDAYS_MAP[dIso] || '',
      };
    });

    const newWeek = {
      calendarWeekNumber: weeks.length + 1,
      academicWeekNumber: null,
      mondayDate: nextMonday,
      fridayDate: nextFriday,
      weekType: 'study',
      days: newDays,
      note: '',
    };

    const updated = recalculateAcademicWeeks([...weeks, newWeek]);
    setWeeks(updated);
    setTotalWeeks(updated.length);
  };

  // კვირის წაშლა
  const handleDeleteWeek = (weekIdx) => {
    if (weeks.length <= 1) return;
    const filtered = weeks.filter((_, idx) => idx !== weekIdx);
    const renumbered = recalculateAcademicWeeks(filtered);
    setWeeks(renumbered);
    setTotalWeeks(renumbered.length);
  };

  // არდადეგების დიაპაზონით სწრაფი მონიშვნა (მაგ. 30.12 - 16.01)
  const handleApplyVacationRange = () => {
    if (!vacationStart || !vacationEnd) {
      setErrorMsg('მიუთითეთ არდადეგების საწყისი და საბოლოო თარიღი');
      return;
    }

    const updated = weeks.map((wk) => {
      // თუ კვირის რომელიმე დღე ხვდება დიაპაზონში
      const touchesRange = wk.days.some((d) => d.date >= vacationStart && d.date <= vacationEnd && d.key !== 'sat');
      if (touchesRange) {
        return {
          ...wk,
          weekType: vacationType,
          note: vacationTitle || wk.note,
          days: wk.days.map((d) => {
            const inRange = d.date >= vacationStart && d.date <= vacationEnd;
            return {
              ...d,
              isActive: inRange ? false : d.isActive,
              isHoliday: inRange ? true : d.isHoliday,
              holidayName: inRange ? vacationTitle : d.holidayName,
            };
          }),
        };
      }
      return wk;
    });

    const renumbered = recalculateAcademicWeeks(updated);
    setWeeks(renumbered);
    setShowVacationModal(false);
    setSuccessMsg(`არდადეგები წარმატებით მოინიშნა: ${formatDateGeo(vacationStart)} – ${formatDateGeo(vacationEnd)}`);
  };

  // კალენდრის შენახვა ბაზაში
  const handleSave = async (saveAsTpl = false) => {
    if (!title.trim()) {
      setErrorMsg('გთხოვთ მიუთითოთ კალენდრის სათაური');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        id: currentId,
        title: title.trim(),
        program_name: programName.trim(),
        academic_year: academicYear.trim(),
        start_date: startDate,
        total_weeks: weeks.length,
        is_template: saveAsTpl ? true : isTemplate,
        weeks_json: weeks,
        holidays_json: DEFAULT_HOLIDAYS_MAP,
      };

      const res = await api.saveAcademicSchedule(payload);
      if (res.success) {
        setCurrentId(res.id);
        setSuccessMsg(saveAsTpl ? 'კალენდარი წარმატებით შეინახა როგორც შაბლონი!' : 'სასწავლო კალენდარი წარმატებით შეინახა ბაზაში!');
        loadSavedSchedules();
      } else {
        setErrorMsg(res.message || 'შენახვა ვერ მოხერხდა');
      }
    } catch (err) {
      setErrorMsg(err.message || 'სერვერთან კავშირის შეცდომა');
    } finally {
      setSaving(false);
    }
  };

  // სტატისტიკა
  const totalCalWeeks = weeks.length;
  const totalAcadWeeks = weeks.filter((w) => w.academicWeekNumber !== null && w.academicWeekNumber !== undefined).length;
  const totalVacationWeeks = totalCalWeeks - totalAcadWeeks;
  const totalActiveDays = weeks.reduce((sum, w) => sum + w.days.filter((d) => d.isActive).length, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1480px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* სათაური და აღწერა */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={26} color="#2563eb" />
            სასწავლო კვირებისა და აკადემიური კალენდრის მართვა
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            პროგრამის ოფიციალური სასწავლო კვირეებისა და დასვენების დღეების რედაქტირებადი ბადე. სწავლა იწყება 15.09-დან, სრული არდადეგები არ ითვლება სასწავლო კვირად.
          </p>
        </div>

        {/* მოქმედების მთავარი ღილაკები */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowVacationModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #f59e0b',
              background: '#fffbeb',
              color: '#b45309',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>🏖️ არდადეგების მონიშვნა (დიაპაზონით)</span>
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Layers size={16} />
            <span>შაბლონად შენახვა</span>
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            }}
          >
            <Save size={16} />
            <span>{saving ? 'ინახება...' : 'კალენდრის შენახვა'}</span>
          </button>
        </div>
      </div>

      {/* შეტყობინებები */}
      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: '13.5px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '13.5px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* შაბლონისა და საბაზისო პარამეტრების ბარათი */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'end' }}>
          {/* შაბლონის ან შენახული კალენდრის არჩევა */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              აირჩიეთ შაბლონი / შენახული კალენდარი:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedScheduleId}
                onChange={(e) => handleSelectSchedule(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#f8fafc' }}
              >
                <option value="">-- აირჩიეთ ან შექმენით ახალი --</option>
                <option value="default_template">🌟 [სტანდარტული შაბლონი] 2026-2027 საბაზო კალენდარი</option>
                {savedSchedules.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.is_template ? '📑 [შაბლონი] ' : '📅 '} {s.title} ({s.academic_year || '-'})
                  </option>
                ))}
              </select>
              {selectedScheduleId && (
                <button
                  type="button"
                  onClick={handleCloneAsNew}
                  title="შაბლონის ბაზაზე ახლის შექმნა"
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                >
                  <Copy size={14} />
                  <span>დუბლირება</span>
                </button>
              )}
            </div>
          </div>

          {/* კალენდრის დასახელება */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              კალენდრის დასახელება:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="მაგ. 2026-2027 სასწავლო კალენდარი"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            />
          </div>

          {/* პროგრამის დასახელება */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              პროგრამა:
            </label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="მაგ. კომპიუტერული ქსელი და სისტემები"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            />
          </div>

          {/* სწავლის დასაწყისი */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              სასწავლო წლის დაწყება:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '2px solid #2563eb', fontSize: '13.5px', fontWeight: 700, color: '#1e3a8a' }}
            />
          </div>

          {/* კვირების რაოდენობა და ხელახლა დათვლა */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                კვირების რაოდ.:
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
            </div>
            <button
              type="button"
              onClick={handleRegenerateFromStart}
              title="ამ თარიღიდან კვირების ხელახლა დაგენერირება"
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #2563eb',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <RotateCcw size={14} />
              <span>გადათვლა</span>
            </button>
          </div>
        </div>
      </div>

      {/* სტატისტიკის ზოლი */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '14px 18px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>კალენდარული კვირები</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{totalCalWeeks} კვირა</div>
        </div>
        <div style={{ borderRadius: '12px', padding: '14px 18px', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
          <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>სასწავლო კვირები</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>{totalAcadWeeks} კვირა</div>
        </div>
        <div style={{ borderRadius: '12px', padding: '14px 18px', border: '1px solid #fde68a', background: '#fffbeb' }}>
          <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>არდადეგები / დასვენება</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>{totalVacationWeeks} კვირა</div>
        </div>
        <div style={{ borderRadius: '12px', padding: '14px 18px', border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>სამუშაო სასწავლო დღეები</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>{totalActiveDays} დღე</div>
        </div>
      </div>

      {/* რედაქტირებადი ცხრილი */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
            სასწავლო კვირებისა და დღეების ჩაშლილი ცხრილი (რედაქტირებადი):
          </div>
          <button
            type="button"
            onClick={handleAddWeekAtEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#fff',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>+ კვირის დამატება ბოლოში</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: 700 }}>
                <th style={{ padding: '10px 12px', width: '50px', textAlign: 'center' }}>№</th>
                <th style={{ padding: '10px 12px', width: '130px', textAlign: 'center' }}>სასწავლო კვირა №</th>
                <th style={{ padding: '10px 12px', width: '170px' }}>პერიოდი (თარიღები)</th>
                <th style={{ padding: '10px 12px', width: '180px' }}>კვირის ტიპი / სტატუსი</th>
                <th style={{ padding: '10px 12px' }}>სასწავლო დღეები (ორშ - შაბ)</th>
                <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>დღეები</th>
                <th style={{ padding: '10px 12px', width: '180px' }}>შენიშვნა</th>
                <th style={{ padding: '10px 12px', width: '60px', textAlign: 'center' }}>წაშლა</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((wk, idx) => {
                const isVacation = ['winter_vacation', 'spring_vacation', 'summer_vacation', 'holiday'].includes(wk.weekType);
                const activeDaysCount = wk.days.filter((d) => d.isActive).length;

                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: isVacation ? '#fffbeb' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* კალენდარული კვირის ნომერი */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                      {idx + 1}
                    </td>

                    {/* სასწავლო კვირა № (რედაქტირებადი) */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {isVacation ? (
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700 }}>
                          🏖️ არდადეგები
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          value={wk.academicWeekNumber || ''}
                          onChange={(e) => handleWeekChange(idx, 'academicWeekNumber', e.target.value)}
                          style={{
                            width: '65px',
                            padding: '6px',
                            textAlign: 'center',
                            borderRadius: '6px',
                            border: '2px solid #2563eb',
                            fontWeight: 800,
                            color: '#1d4ed8',
                            fontSize: '14px',
                          }}
                        />
                      )}
                    </td>

                    {/* პერიოდი */}
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>
                      {formatDateGeo(wk.mondayDate)} – {formatDateGeo(wk.fridayDate)}
                    </td>

                    {/* კვირის ტიპი */}
                    <td style={{ padding: '10px 12px' }}>
                      <select
                        value={wk.weekType}
                        onChange={(e) => handleWeekChange(idx, 'weekType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          background: isVacation ? '#fef3c7' : '#ffffff',
                          color: isVacation ? '#92400e' : '#1e293b',
                        }}
                      >
                        <option value="study">🟢 სასწავლო კვირა</option>
                        <option value="winter_vacation">🏖️ ზამთრის არდადეგები</option>
                        <option value="spring_vacation">🌸 საგაზაფხულო არდადეგები</option>
                        <option value="summer_vacation">☀️ საზაფხულო არდადეგები</option>
                        <option value="exam">📝 საგამოცდო / შეფასება</option>
                        <option value="holiday">⏸️ დასვენება / სხვა</option>
                      </select>
                    </td>

                    {/* დღეების ბადე (ორშ - შაბ) */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {wk.days.map((d) => {
                          const [y, m, dayNum] = d.date.split('-');
                          const shortDisplay = `${dayNum}.${m}`;

                          return (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => handleToggleDay(idx, d.key)}
                              title={`${d.fullName} (${formatDateGeo(d.date)})${d.holidayName ? ` - ${d.holidayName}` : ''}${d.isActive ? ' [აქტიური]' : ' [გამორთული]'}`}
                              style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '4px 6px',
                                minWidth: '42px',
                                borderRadius: '6px',
                                border: d.isHoliday
                                  ? '1px solid #f59e0b'
                                  : d.isActive
                                  ? '1px solid #2563eb'
                                  : '1px solid #cbd5e1',
                                background: d.isHoliday
                                  ? '#fef3c7'
                                  : d.isActive
                                  ? '#eff6ff'
                                  : '#f1f5f9',
                                color: d.isHoliday
                                  ? '#b45309'
                                  : d.isActive
                                  ? '#1d4ed8'
                                  : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <span>{d.label}</span>
                              <span style={{ fontSize: '10px', fontWeight: 500 }}>{shortDisplay}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* სამუშაო დღეების ჯამი */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: activeDaysCount > 0 ? '#15803d' : '#94a3b8' }}>
                      {activeDaysCount} დღე
                    </td>

                    {/* შენიშვნა */}
                    <td style={{ padding: '10px 12px' }}>
                      <input
                        type="text"
                        value={wk.note || ''}
                        onChange={(e) => handleWeekChange(idx, 'note', e.target.value)}
                        placeholder="შენიშვნა..."
                        style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </td>

                    {/* წაშლა */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteWeek(idx)}
                        title="კვირის წაშლა"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* არდადეგების სწრაფი მონიშვნის მოდალი */}
      {showVacationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '17px', color: '#0f172a', fontWeight: 800 }}>
              🏖️ არდადეგების დიაპაზონით მონიშვნა
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              მიუთითეთ თარიღების ინტერვალი. სისტემა ყველა მოხვედრილ კვირას ავტომატურად მონიშნავს არდადეგებად და მომდევნო კვირებს სწორად გადაანომრავს.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  დასახელება:
                </label>
                <input
                  type="text"
                  value={vacationTitle}
                  onChange={(e) => setVacationTitle(e.target.value)}
                  placeholder="მაგ. ზამთრის არდადეგები"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  კვირის ტიპი:
                </label>
                <select
                  value={vacationType}
                  onChange={(e) => setVacationType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="winter_vacation">🏖️ ზამთრის არდადეგები</option>
                  <option value="spring_vacation">🌸 საგაზაფხულო არდადეგები</option>
                  <option value="summer_vacation">☀️ საზაფხულო არდადეგები</option>
                  <option value="holiday">⏸️ სხვა დასვენება</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    დაწყება:
                  </label>
                  <input
                    type="date"
                    value={vacationStart}
                    onChange={(e) => setVacationStart(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    დასრულება:
                  </label>
                  <input
                    type="date"
                    value={vacationEnd}
                    onChange={(e) => setVacationEnd(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowVacationModal(false)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={handleApplyVacationRange}
                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                მონიშვნა და გადათვლა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
