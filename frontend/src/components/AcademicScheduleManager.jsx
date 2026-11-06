import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  Copy,
  Layers,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  CalendarDays
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'academic_schedules_cache_v1';

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
  { key: 'mon', label: 'ორ', fullName: 'ორშაბათი', offset: 0 },
  { key: 'tue', label: 'სა', fullName: 'სამშაბათი', offset: 1 },
  { key: 'wed', label: 'ოთ', fullName: 'ოთხშაბათი', offset: 2 },
  { key: 'thu', label: 'ხუ', fullName: 'ხუთშაბათი', offset: 3 },
  { key: 'fri', label: 'პა', fullName: 'პარასკევი', offset: 4 },
  { key: 'sat', label: 'შა', fullName: 'შაბათი', offset: 5 },
];

function formatShortDate(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}.${parts[1]}`;
}

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
  return day === 0 ? 7 : day;
}

function getMondayOfIsoDate(isoDate) {
  const wd = getIsoWeekday(isoDate);
  return addDays(isoDate, -(wd - 1));
}

function generateWeeksStructure(startDateIso, totalWeeksCount = 42, customHolidays = DEFAULT_HOLIDAYS_MAP) {
  const startMonday = getMondayOfIsoDate(startDateIso);
  const result = [];
  let currMonday = startMonday;
  let academicWeekCounter = 1;

  for (let w = 1; w <= totalWeeksCount; w++) {
    const days = WEEKDAY_NAMES.map((wd) => {
      const dateIso = addDays(currMonday, wd.offset);
      const isDefaultActive = wd.key !== 'sat';
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

    const workdays = days.slice(0, 5);
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
  const [loading, setLoading] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');

  // კალენდრის პარამეტრები
  const [currentId, setCurrentId] = useState(null);
  const [title, setTitle] = useState('2026-2027 სასწავლო კალენდარი');
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

  // არდადეგების მოდალი
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacationStart, setVacationStart] = useState('2026-12-30');
  const [vacationEnd, setVacationEnd] = useState('2027-01-16');
  const [vacationTitle, setVacationTitle] = useState('ზამთრის არდადეგები');
  const [vacationType, setVacationType] = useState('winter_vacation');

  useEffect(() => {
    loadSavedSchedules();
    const initialWeeks = generateWeeksStructure('2026-09-15', 42);
    setWeeks(initialWeeks);
  }, []);

  const getLocalCache = () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalCache = (list) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  };

  const loadSavedSchedules = async () => {
    setLoading(true);
    let serverList = [];
    try {
      const res = await api.getAcademicSchedules();
      if (res && res.schedules) {
        serverList = res.schedules;
      }
    } catch {
      // ignore
    }

    const localList = getLocalCache();
    // გავაერთიანოთ სერვერისა და ლოკალური შაბლონები
    const combined = [...serverList];
    for (const loc of localList) {
      if (!combined.some((s) => String(s.id) === String(loc.id))) {
        combined.push(loc);
      }
    }

    setSavedSchedules(combined);
    setLoading(false);
  };

  const handleSelectSchedule = async (scheduleIdStr) => {
    setSelectedScheduleId(scheduleIdStr);
    if (!scheduleIdStr) return;

    if (scheduleIdStr === 'default_template') {
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

    // ჯერ ლოკალურ კეშში შევამოწმოთ
    const localList = getLocalCache();
    const cached = localList.find((item) => String(item.id) === String(scheduleIdStr));
    if (cached) {
      applyScheduleData(cached);
      setSuccessMsg(`ჩაიტვირთა: ${cached.title}`);
      return;
    }

    try {
      const res = await api.getAcademicSchedule(Number(scheduleIdStr));
      if (res && res.schedule) {
        applyScheduleData(res.schedule);
        setSuccessMsg(`ჩაიტვირთა: ${res.schedule.title}`);
      }
    } catch (err) {
      setErrorMsg('კალენდრის ჩატვირთვა ვერ მოხერხდა');
    }
  };

  const applyScheduleData = (sch) => {
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
  };

  const handleCloneAsNew = () => {
    setCurrentId(null);
    setTitle(`${title} (ასლი)`);
    setIsTemplate(false);
    setSelectedScheduleId('');
    setSuccessMsg('შეიქმნა ახალი კალენდარი არჩეული შაბლონის ბაზაზე.');
  };

  const handleRegenerateFromStart = () => {
    const generated = generateWeeksStructure(startDate, Number(totalWeeks) || 42);
    setWeeks(generated);
    setSuccessMsg(`კვირეები გადაითვალა ${formatDateGeo(startDate)}-დან (${totalWeeks} კვირა)`);
  };

  const handleWeekChange = (weekIdx, field, value) => {
    const updated = [...weeks];
    const target = { ...updated[weekIdx], [field]: value };

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

  const handleToggleDay = (weekIdx, dayKey) => {
    const updated = [...weeks];
    const week = { ...updated[weekIdx] };
    week.days = week.days.map((d) => (d.key === dayKey ? { ...d, isActive: !d.isActive } : d));
    updated[weekIdx] = week;
    setWeeks(updated);
  };

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

  const handleDeleteWeek = (weekIdx) => {
    if (weeks.length <= 1) return;
    const filtered = weeks.filter((_, idx) => idx !== weekIdx);
    const renumbered = recalculateAcademicWeeks(filtered);
    setWeeks(renumbered);
    setTotalWeeks(renumbered.length);
  };

  const handleApplyVacationRange = () => {
    if (!vacationStart || !vacationEnd) {
      setErrorMsg('მიუთითეთ თარიღების ინტერვალი');
      return;
    }

    const updated = weeks.map((wk) => {
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
    setSuccessMsg(`არდადეგები მოინიშნა: ${formatDateGeo(vacationStart)} – ${formatDateGeo(vacationEnd)}`);
  };

  // შენახვა (API + ლოკალური კეში როგორც საიმედო გარანტია)
  const handleSave = async (saveAsTpl = false) => {
    if (!title.trim()) {
      setErrorMsg('მიუთითეთ კალენდრის სათაური');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetIsTpl = saveAsTpl ? true : isTemplate;
    const scheduleId = currentId || `local_${Date.now()}`;

    const payload = {
      id: typeof currentId === 'number' ? currentId : null,
      title: title.trim(),
      program_name: programName.trim(),
      academic_year: academicYear.trim(),
      start_date: startDate,
      total_weeks: weeks.length,
      is_template: targetIsTpl,
      weeks_json: weeks,
      holidays_json: DEFAULT_HOLIDAYS_MAP,
    };

    // 1. ყოველთვის შევინახოთ ლოკალურ ბრაუზერშიც
    const localRecord = { ...payload, id: scheduleId, updated_at: new Date().toISOString() };
    const localList = getLocalCache().filter((x) => String(x.id) !== String(scheduleId));
    localList.unshift(localRecord);
    saveLocalCache(localList);

    // 2. სერვერზე გაგზავნა
    let serverSuccess = false;
    try {
      const res = await api.saveAcademicSchedule(payload);
      if (res && res.success) {
        setCurrentId(res.id);
        serverSuccess = true;
      }
    } catch (e) {
      // სერვერის API შესაძლოა გადატვირთვას ელოდებოდეს
    }

    setSaving(false);
    loadSavedSchedules();

    if (serverSuccess) {
      setSuccessMsg(saveAsTpl ? 'შაბლონი წარმატებით შეინახა!' : 'კალენდარი წარმატებით შეინახა!');
    } else {
      setSuccessMsg(
        saveAsTpl
          ? 'შაბლონი შენახულია ბრაუზერში! (სერვერზე შესანახად საჭიროა sudo systemctl restart api_site)'
          : 'კალენდარი შენახულია ბრაუზერში! (სერვერზე შესანახად საჭიროა sudo systemctl restart api_site)'
      );
    }
  };

  const totalCalWeeks = weeks.length;
  const totalAcadWeeks = weeks.filter((w) => w.academicWeekNumber !== null && w.academicWeekNumber !== undefined).length;
  const totalVacationWeeks = totalCalWeeks - totalAcadWeeks;
  const totalActiveDays = weeks.reduce((sum, w) => sum + w.days.filter((d) => d.isActive).length, 0);

  return (
    <div style={{ padding: '12px 16px', maxWidth: '100%', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* კომპაქტური ზედა პანელი */}
      <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '10px 14px', marginBottom: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        {/* სტრიქონი 1: სათაური და ღილაკები */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} color="#2563eb" />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>სასწავლო კვირებისა და კალენდრის განრიგი</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setShowVacationModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #f59e0b',
                background: '#fffbeb',
                color: '#b45309',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🏖️ არდადეგების მონიშვნა
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Layers size={13} />
              <span>შაბლონად შენახვა</span>
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={13} />
              <span>{saving ? 'ინახება...' : 'შენახვა'}</span>
            </button>
          </div>
        </div>

        {/* სტრიქონი 2: კომპაქტური კონფიგურაციის ველები */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
          {/* შაბლონის არჩევა */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>შაბლონი:</span>
            <select
              value={selectedScheduleId}
              onChange={(e) => handleSelectSchedule(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px', maxWidth: '210px' }}
            >
              <option value="">-- აირჩიეთ შაბლონი --</option>
              <option value="default_template">🌟 2026-2027 საბაზო შაბლონი</option>
              {savedSchedules.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.is_template ? '📑 ' : '📅 '} {s.title}
                </option>
              ))}
            </select>
            {selectedScheduleId && (
              <button
                type="button"
                onClick={handleCloneAsNew}
                title="შაბლონის ბაზაზე ახლის შექმნა"
                style={{ padding: '4px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              >
                <Copy size={12} />
              </button>
            )}
          </div>

          {/* დასახელება */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 180px' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>სახელი:</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px' }}
            />
          </div>

          {/* პროგრამა */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 180px' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>პროგრამა:</span>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px' }}
            />
          </div>

          {/* სწავლის დასაწყისი */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 700, color: '#1e3a8a' }}>დაწყება:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '3px 6px', borderRadius: '5px', border: '1.5px solid #2563eb', fontSize: '11.5px', fontWeight: 700 }}
            />
          </div>

          {/* კვირები და გადათვლა */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>კვირა:</span>
            <input
              type="number"
              min="10"
              max="60"
              value={totalWeeks}
              onChange={(e) => setTotalWeeks(Number(e.target.value))}
              style={{ width: '48px', padding: '3px 5px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px', textAlign: 'center' }}
            />
            <button
              type="button"
              onClick={handleRegenerateFromStart}
              title="კვირების ხელახლა გადათვლა"
              style={{
                padding: '4px 8px',
                borderRadius: '5px',
                border: '1px solid #2563eb',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <RotateCcw size={12} />
              <span>გადათვლა</span>
            </button>
          </div>
        </div>

        {/* სტრიქონი 3: კომპაქტური სტატისტიკა (Inline pills) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '11.5px', flexWrap: 'wrap' }}>
          <span style={{ color: '#475569' }}>
            კალენდარული კვირები: <strong>{totalCalWeeks}</strong>
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#15803d' }}>
            სასწავლო კვირები: <strong>{totalAcadWeeks}</strong>
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#b45309' }}>
            არდადეგები: <strong>{totalVacationWeeks}</strong>
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#1d4ed8' }}>
            სამუშაო სასწავლო დღეები: <strong>{totalActiveDays}</strong>
          </span>
        </div>
      </div>

      {/* შეტყობინებები */}
      {successMsg && (
        <div style={{ padding: '6px 12px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={15} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '6px 12px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ულტრა-კომპაქტური ცხრილი */}
      <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <div style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
            სასწავლო კვირების ბადე (ორშ–შაბ):
          </span>
          <button
            type="button"
            onClick={handleAddWeekAtEnd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '5px',
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={12} />
            <span>+ კვირის დამატება</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 10 }}>
              <tr style={{ borderBottom: '1.5px solid #cbd5e1', color: '#334155', fontWeight: 700 }}>
                <th style={{ padding: '5px 6px', width: '32px', textAlign: 'center' }}>№</th>
                <th style={{ padding: '5px 6px', width: '68px', textAlign: 'center' }}>სასწ. კვ.</th>
                <th style={{ padding: '5px 6px', width: '105px' }}>პერიოდი</th>
                <th style={{ padding: '5px 6px', width: '135px' }}>კვირის ტიპი</th>
                <th style={{ padding: '5px 6px' }}>დღეები (ორშ–შაბ)</th>
                <th style={{ padding: '5px 6px', width: '42px', textAlign: 'center' }}>დღე</th>
                <th style={{ padding: '5px 6px', width: '170px' }}>შენიშვნა</th>
                <th style={{ padding: '5px 6px', width: '30px', textAlign: 'center' }}></th>
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
                      background: isVacation ? '#fffbeb' : idx % 2 === 0 ? '#ffffff' : '#fcfcfc',
                    }}
                  >
                    {/* № */}
                    <td style={{ padding: '3px 6px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                      {idx + 1}
                    </td>

                    {/* სასწავლო კვირა № */}
                    <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                      {isVacation ? (
                        <span style={{ padding: '1px 4px', borderRadius: '3px', background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 700 }}>
                          🏖️
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          value={wk.academicWeekNumber || ''}
                          onChange={(e) => handleWeekChange(idx, 'academicWeekNumber', e.target.value)}
                          style={{
                            width: '42px',
                            padding: '2px 4px',
                            textAlign: 'center',
                            borderRadius: '4px',
                            border: '1.5px solid #2563eb',
                            fontWeight: 800,
                            color: '#1d4ed8',
                            fontSize: '11.5px',
                          }}
                        />
                      )}
                    </td>

                    {/* პერიოდი (მოკლედ) */}
                    <td style={{ padding: '3px 6px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                      {formatShortDate(wk.mondayDate)} – {formatShortDate(wk.fridayDate)}
                    </td>

                    {/* კვირის ტიპი */}
                    <td style={{ padding: '3px 6px' }}>
                      <select
                        value={wk.weekType}
                        onChange={(e) => handleWeekChange(idx, 'weekType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: isVacation ? '#fef3c7' : '#ffffff',
                          color: isVacation ? '#92400e' : '#1e293b',
                        }}
                      >
                        <option value="study">🟢 სასწავლო კვირა</option>
                        <option value="winter_vacation">🏖️ ზამთრის არდადეგები</option>
                        <option value="spring_vacation">🌸 საგაზაფხულო არდადეგები</option>
                        <option value="summer_vacation">☀️ საზაფხულო არდადეგები</option>
                        <option value="exam">📝 საგამოცდო კვირა</option>
                        <option value="holiday">⏸️ დასვენება / სხვა</option>
                      </select>
                    </td>

                    {/* კომპაქტური დღეების ბეიჯები (ორშ–შაბ) */}
                    <td style={{ padding: '3px 6px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {wk.days.map((d) => {
                          const [, , dayNum] = d.date.split('-');
                          return (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => handleToggleDay(idx, d.key)}
                              title={`${d.fullName} (${formatDateGeo(d.date)})${d.holidayName ? ` — ${d.holidayName}` : ''}${d.isActive ? ' [აქტიური]' : ' [გამორთული]'}`}
                              style={{
                                padding: '1px 3px',
                                minWidth: '32px',
                                height: '22px',
                                borderRadius: '4px',
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
                                fontSize: '10.5px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                              }}
                            >
                              <span>{d.label}</span>
                              <span style={{ fontWeight: 500 }}>{dayNum}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* სამუშაო დღეების ჯამი */}
                    <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 700, color: activeDaysCount > 0 ? '#15803d' : '#94a3b8' }}>
                      {activeDaysCount}
                    </td>

                    {/* შენიშვნა */}
                    <td style={{ padding: '3px 6px' }}>
                      <input
                        type="text"
                        value={wk.note || ''}
                        onChange={(e) => handleWeekChange(idx, 'note', e.target.value)}
                        placeholder="შენიშვნა..."
                        style={{ width: '100%', padding: '2px 5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                    </td>

                    {/* წაშლა */}
                    <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteWeek(idx)}
                        title="კვირის წაშლა"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* არდადეგების დიაპაზონით მონიშვნის მოდალი */}
      {showVacationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>
              🏖️ არდადეგების მონიშვნა
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
              მიუთითეთ თარიღები. მოხვედრილი კვირები მოინიშნება არდადეგებად და სასწავლო კვირები გადაინომრება.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>დასახელება:</label>
                <input
                  type="text"
                  value={vacationTitle}
                  onChange={(e) => setVacationTitle(e.target.value)}
                  placeholder="მაგ. ზამთრის არდადეგები"
                  style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>ტიპი:</label>
                <select
                  value={vacationType}
                  onChange={(e) => setVacationType(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value="winter_vacation">🏖️ ზამთრის არდადეგები</option>
                  <option value="spring_vacation">🌸 საგაზაფხულო არდადეგები</option>
                  <option value="summer_vacation">☀️ საზაფხულო არდადეგები</option>
                  <option value="holiday">⏸️ სხვა დასვენება</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>დაწყება:</label>
                  <input
                    type="date"
                    value={vacationStart}
                    onChange={(e) => setVacationStart(e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>დასრულება:</label>
                  <input
                    type="date"
                    value={vacationEnd}
                    onChange={(e) => setVacationEnd(e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowVacationModal(false)}
                style={{ padding: '6px 12px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={handleApplyVacationRange}
                style={{ padding: '6px 14px', borderRadius: '5px', border: 'none', background: '#f59e0b', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                მონიშვნა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
