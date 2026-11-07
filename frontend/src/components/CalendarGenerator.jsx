import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { SCHOOL22_LOGO_BASE64 } from './school22_logo';
import {
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Merge,
  RefreshCw,
  Printer,
  Save,
  FolderOpen,
  Sparkles,
  Clock,
  BookOpen,
  HelpCircle,
  Edit3,
  FileSpreadsheet
} from 'lucide-react';

// საქართველოს ოფიციალური უქმე დღეები და სასწავლო არდადეგები (2025-2026)
const DEFAULT_HOLIDAYS = [
  { date: '2025-01-01', name: 'ახალი წელი' },
  { date: '2025-01-02', name: 'ბედობა' },
  { date: '2025-01-07', name: 'შობა' },
  { date: '2025-01-19', name: 'ნათლისღება' },
  { date: '2025-03-03', name: 'დედის დღე' },
  { date: '2025-03-08', name: 'ქალთა საერთაშორისო დღე' },
  { date: '2025-04-09', name: 'ეროვნული ერთიანობის დღე' },
  { date: '2025-04-18', name: 'წითელი პარასკევი' },
  { date: '2025-04-21', name: 'მიცვალებულთა მოხსენიების დღე' },
  { date: '2025-05-09', name: 'ფაშიზმზე გამარჯვების დღე' },
  { date: '2025-05-12', name: 'ანდრია პირველწოდებულის ხსენების დღე' },
  { date: '2025-05-26', name: 'დამოუკიდებლობის დღე' },
  { date: '2025-08-28', name: 'მარიამობა' },
  { date: '2025-10-14', name: 'სვეტიცხოვლობა' },
  { date: '2025-11-23', name: 'გიორგობა' },
  { date: '2025-12-30', name: 'ზამთრის არდადეგები' },
  { date: '2025-12-31', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-01', name: 'ახალი წელი / არდადეგები' },
  { date: '2026-01-02', name: 'ბედობა / არდადეგები' },
  { date: '2026-01-05', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-06', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-07', name: 'შობა / არდადეგები' },
  { date: '2026-01-08', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-09', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-12', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-13', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-14', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-15', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-16', name: 'ზამთრის არდადეგები' },
  { date: '2026-01-19', name: 'ნათლისღება' },
  { date: '2026-03-03', name: 'დედის დღე' },
  { date: '2026-03-08', name: 'ქალთა საერთაშორისო დღე' },
  { date: '2026-04-09', name: 'ეროვნული ერთიანობის დღე' },
  { date: '2026-04-10', name: 'წითელი პარასკევი' },
  { date: '2026-04-13', name: 'აღდგომის ორშაბათი' },
  { date: '2026-05-09', name: 'ფაშიზმზე გამარჯვების დღე' },
  { date: '2026-05-12', name: 'ანდრია პირველწოდებულის ხსენების დღე' },
  { date: '2026-05-26', name: 'დამოუკიდებლობის დღე' },
  { date: '2026-08-28', name: 'მარიამობა' },
  { date: '2026-10-14', name: 'სვეტიცხოვლობა' },
  { date: '2026-11-23', name: 'გიორგობა' },
  // 2026-2027 სასწავლო წლის არდადეგები და უქმეები
  { date: '2026-12-30', name: 'ზამთრის არდადეგები' },
  { date: '2026-12-31', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-01', name: 'ახალი წელი / არდადეგები' },
  { date: '2027-01-02', name: 'ბედობა / არდადეგები' },
  // ზამთრის არდადეგების სრული კვირა 1 (არ ითვლება სასწავლო კვირად)
  { date: '2027-01-04', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-05', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-06', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-07', name: 'შობა / არდადეგები' },
  { date: '2027-01-08', name: 'ზამთრის არდადეგები' },
  // ზამთრის არდადეგების სრული კვირა 2 (არ ითვლება სასწავლო კვირად)
  { date: '2027-01-11', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-12', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-13', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-14', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-15', name: 'ზამთრის არდადეგები' },
  { date: '2027-01-19', name: 'ნათლისღება' },
  { date: '2027-03-03', name: 'დედის დღე' },
  { date: '2027-03-08', name: 'ქალთა საერთაშორისო დღე' },
  { date: '2027-04-09', name: 'ეროვნული ერთიანობის დღე' },
  { date: '2027-04-30', name: 'წითელი პარასკევი' },
  { date: '2027-05-03', name: 'აღდგომის ორშაბათი' },
  { date: '2027-05-09', name: 'ფაშიზმზე გამარჯვების დღე' },
  { date: '2027-05-12', name: 'ანდრია პირველწოდებულის ხსენების დღე' },
  { date: '2027-05-26', name: 'დამოუკიდებლობის დღე' },
];

const WEEKDAYS = [
  { id: 1, short: 'ორშ', label: 'ორშაბათი' },
  { id: 2, short: 'სამ', label: 'სამშაბათი' },
  { id: 3, short: 'ოთხ', label: 'ოთხშაბათი' },
  { id: 4, short: 'ხუთ', label: 'ხუთშაბათი' },
  { id: 5, short: 'პარ', label: 'პარასკევი' },
  { id: 6, short: 'შაბ', label: 'შაბათი' },
];

const GEORGIAN_ORDINAL = ['პირველი', 'მეორე', 'მესამე', 'მეოთხე', 'მეხუთე', 'მეექვსე', 'მეშვიდე', 'მერვე', 'მეცხრე', 'მეათე'];

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

function getSaturdayOfSameWeek(isoDate) {
  const wd = getIsoWeekday(isoDate);
  const diff = 6 - wd;
  return addDays(isoDate, diff >= 0 ? diff : 0);
}

function getMondayOfIsoDate(isoDate) {
  const wd = getIsoWeekday(isoDate);
  return addDays(isoDate, -(wd - 1));
}

// სასწავლო კვირების გამოთვლა 15.09-დან. თუ მთელი კვირა (ორშ-პარ) დასვენებაა, ის არ ითვლება სასწავლო კვირად!
function computeAcademicWeeksMap(academicYearStartIso = '2026-09-15', holidaysList = [], totalWeeks = 70) {
  const weekMap = new Map(); // mondayIso -> academicWeekNumber (int)
  const vacationWeeksSet = new Set(); // mondayIso of full vacation weeks
  const holidayDateSet = new Set(holidaysList.map((h) => h.date));

  const startMonday = getMondayOfIsoDate(academicYearStartIso);
  let currMonday = startMonday;
  let acadWeekCounter = 1;

  for (let w = 0; w < totalWeeks; w++) {
    // 5 სამუშაო დღე: ორშაბათი..პარასკევი
    const workdays = [0, 1, 2, 3, 4].map((offset) => addDays(currMonday, offset));
    const isFullVacation = workdays.every((d) => holidayDateSet.has(d));

    if (isFullVacation) {
      vacationWeeksSet.add(currMonday);
      weekMap.set(currMonday, null);
    } else {
      weekMap.set(currMonday, acadWeekCounter);
      acadWeekCounter += 1;
    }
    currMonday = addDays(currMonday, 7);
  }

  return { weekMap, vacationWeeksSet, startMonday };
}

function getAcademicWeekForIsoDate(targetDateIso, academicYearStartIso = '2026-09-15', holidaysList = []) {
  if (!targetDateIso) return 1;
  const { weekMap, startMonday } = computeAcademicWeeksMap(academicYearStartIso, holidaysList);
  const targetMonday = getMondayOfIsoDate(targetDateIso);

  if (targetMonday < startMonday) {
    return 1;
  }
  const assigned = weekMap.get(targetMonday);
  if (assigned !== undefined && assigned !== null) {
    return assigned;
  }
  let testMon = targetMonday;
  while (testMon >= startMonday) {
    const val = weekMap.get(testMon);
    if (val) return val;
    testMon = addDays(testMon, -7);
  }
  return 1;
}

// სასწავლო კვირის ნომრის მიხედვით მოდულის საწყისი თარიღის ავტომატური გამოთვლა
function getStartDateForAcademicWeek(targetWeekNum, academicYearStartIso = '2026-09-15', holidaysList = [], selectedDays = [1, 3, 5]) {
  const targetWeek = Math.max(1, Math.round(Number(targetWeekNum) || 1));
  const { weekMap, startMonday } = computeAcademicWeeksMap(academicYearStartIso, holidaysList, 120);

  let matchedMonday = null;
  for (const [monIso, wNum] of weekMap.entries()) {
    if (wNum === targetWeek) {
      matchedMonday = monIso;
      break;
    }
  }
  if (!matchedMonday) {
    matchedMonday = addDays(startMonday, (targetWeek - 1) * 7);
  }

  const holidayDateSet = new Set(holidaysList.map((h) => h.date));
  const activeDays = [...(selectedDays && selectedDays.length > 0 ? selectedDays : [1, 3, 5])].sort((a, b) => a - b);

  // ვიპოვოთ პირველი სასწავლო დღე, რომელიც >= academicYearStartIso და არ არის დასვენება
  for (const dayOfWeek of activeDays) {
    const candidateDate = addDays(matchedMonday, dayOfWeek - 1);
    if (candidateDate >= academicYearStartIso && !holidayDateSet.has(candidateDate)) {
      return candidateDate;
    }
  }

  if (targetWeek === 1) {
    return academicYearStartIso;
  }

  return addDays(matchedMonday, (activeDays[0] || 1) - 1);
}

// სასწავლო კვირის პერიოდის ტექსტი (მაგ. 15.09 – 19.09.26)
function getWeekPeriodString(targetWeekNum, academicYearStartIso = '2026-09-15', holidaysList = []) {
  const targetWeek = Math.max(1, Math.round(Number(targetWeekNum) || 1));
  const { weekMap, startMonday } = computeAcademicWeeksMap(academicYearStartIso, holidaysList, 120);

  let matchedMonday = null;
  for (const [monIso, wNum] of weekMap.entries()) {
    if (wNum === targetWeek) {
      matchedMonday = monIso;
      break;
    }
  }
  if (!matchedMonday) {
    matchedMonday = addDays(startMonday, (targetWeek - 1) * 7);
  }
  const fridayIso = addDays(matchedMonday, 4);
  const fD = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y.slice(-2)}`;
  };
  return `${fD(matchedMonday)} – ${fD(fridayIso)}`;
}

function splitTopicsText(rawText) {
  if (!rawText) return [];
  return rawText
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^\s*[\d•\-*.)]+\s*/, '').trim())
    .filter(Boolean);
}

// Word-ის doc_elements-იდან დამატებითი ველების ამოღება (წინაპირობა, სწავლების მეთოდები, გარემო)
function extractMetaFromDocElements(docElements = []) {
  let prerequisite = '';
  let teachingMethods = '';
  let envResources = '';

  for (const el of docElements) {
    if (el.type === 'table' && Array.isArray(el.rows)) {
      for (const row of el.rows) {
        if (!Array.isArray(row) || row.length < 2) continue;
        const left = (row[0]?.text || '').trim().toLowerCase();
        const right = (row[1]?.text || '').trim();
        if (!right) continue;

        if (left.includes('წინაპირობა') && !prerequisite) {
          prerequisite = right;
        }
        if ((left.includes('სწავლების მეთოდ') || left.includes('მეთოდი')) && !teachingMethods && right.length < 400) {
          teachingMethods = right;
        }
        if ((left.includes('გარემო') || left.includes('რესურს')) && !envResources && right.length < 500) {
          envResources = right;
        }
      }
    }
  }
  return { prerequisite, teachingMethods, envResources };
}

export default function CalendarGenerator() {
  const [loading, setLoading] = useState(true);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ბაზიდან წამოღებული რეალური ფაილები, გეგმები, რესურსები და მასწავლებლები
  const [wordModuleFiles, setWordModuleFiles] = useState([]);
  const [planFilesList, setPlanFilesList] = useState([]);
  const [dbPlans, setDbPlans] = useState([]);
  const [dbResources, setDbResources] = useState([]);
  const [dbTeachers, setDbTeachers] = useState([]);
  const [savedCalendars, setSavedCalendars] = useState([]);

  // ინტერაქტიული 5 ნაბიჯი (1..5)
  const [step, setStep] = useState(1);

  // ნაბიჯი 1: ბაზიდან ამოღებული რეალური მონაცემები
  const [selectedPlanFileId, setSelectedPlanFileId] = useState('');
  const [selectedPlanKey, setSelectedPlanKey] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [programName, setProgramName] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [moduleStatus, setModuleStatus] = useState('');
  const [prerequisite, setPrerequisite] = useState('');
  const [credits, setCredits] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [location, setLocation] = useState('');
  const [groupNumber, setGroupNumber] = useState('4/2026');
  const [selectedTemplate, setSelectedTemplate] = useState('template1'); // 'template1' (12-სვეტიანი) | 'template2' (10-სვეტიანი აკადემია)

  // თარიღისა და საათების განაწილების პარამეტრები (Schedule Engine)
  const [academicYearStartDate, setAcademicYearStartDate] = useState('2026-09-15');
  const [startDate, setStartDate] = useState('2026-09-15');
  const [startAcademicWeek, setStartAcademicWeek] = useState(1);
  const [distributionMethod, setDistributionMethod] = useState(1); // 1, 2, ან 3
  const [selectedDays, setSelectedDays] = useState([1, 3, 5]);
  const [dailyHourLimit, setDailyHourLimit] = useState(6);
  // თითოეული დღის საათების განსაზღვრა (კვირის რომელ დღეს რამდენი სთ გაწეროს)
  const [weekdayHours, setWeekdayHours] = useState({
    1: 6, // ორშაბათი
    2: 6, // სამშაბათი
    3: 6, // ოთხშაბათი
    4: 6, // ხუთშაბათი
    5: 6, // პარასკევი
    6: 6, // შაბათი
  });
  const [customDateHours, setCustomDateHours] = useState({});
  const [deductEvalFromContact, setDeductEvalFromContact] = useState(false);
  const [hideIndependentInRows, setHideIndependentInRows] = useState(true);

  const handleWeekdayHoursChange = (dayId, hours) => {
    const val = Math.max(1, Math.min(10, Math.round(Number(hours) || 6)));
    setWeekdayHours((prev) => ({
      ...prev,
      [dayId]: val,
    }));
  };

  const handleSetAllWeekdayHours = (hours) => {
    setWeekdayHours({
      1: hours,
      2: hours,
      3: hours,
      4: hours,
      5: hours,
      6: hours,
    });
    setDailyHourLimit(hours);
    setCustomDateHours({});
  };

  const handleCustomDateHourChange = (dateIso, val) => {
    const num = Math.max(1, Math.min(12, Math.round(Number(val) || 1)));
    setCustomDateHours((prev) => ({
      ...prev,
      [dateIso]: num,
    }));
  };

  // სწავლის შედეგები ბაზიდან (curriculum_outcomes)
  const [outcomesConfig, setOutcomesConfig] = useState([]);

  // ნაბიჯი 2: დასვენების დღეები და კომპენსაციის გადაწყვეტილებები
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [holidayResolutions, setHolidayResolutions] = useState({});
  const [holidayCollisions, setHolidayCollisions] = useState([]);

  // ნაბიჯი 3: დაგენერირებული სესიები/თემები
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // ნაბიჯი 4: შეფასებების გაერთიანების კონფიგურაცია
  const [evaluationMode, setEvaluationMode] = useState('merge_matching_pairs');
  const [pairMerges, setPairMerges] = useState({});

  // ნაბიჯი 5: შენახვა / მასშტაბი
  const [currentSavedId, setCurrentSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(95);

  useEffect(() => {
    loadAllFromDatabase();
  }, []);

  // ბაზიდან რეალური ფაილების, სასწავლო გეგმების, რესურსებისა და მასწავლებლების წამოღება
  const loadAllFromDatabase = async () => {
    setLoading(true);
    setError('');
    try {
      const [filesRes, teachersRes] = await Promise.all([
        api.getFiles().catch(() => ({ files: [] })),
        api.getTeachers().catch(() => ({ teachers: [] })),
      ]);

      // სურვილისამებრ შენახული კალენდრების წამოღებაც
      api.getCalendarInitData()
        .then((calRes) => {
          if (calRes?.saved_calendars) setSavedCalendars(calRes.saved_calendars);
        })
        .catch(() => {});

      const allFiles = filesRes.files || [];
      // მასწავლებლები (გამოვრიცხოთ სახელი 'ადმინისტრატორი' და დეფაულტად 'რამაზი მაისაშვილი')
      const rawTeachers = teachersRes.teachers || teachersRes.users || [];
      const teachersList = rawTeachers.filter((t) => {
        const n = (t.name || t.username || '').toLowerCase();
        return !n.includes('ადმინისტრატორ');
      });
      setDbTeachers(teachersList);

      const ramazi = teachersList.find(
        (t) => (t.name || '').includes('რამაზი') || (t.name || '').includes('მაისაშვილი')
      );
      const defaultTeacherName = ramazi
        ? (ramazi.name || ramazi.username)
        : (teachersList[0]?.name || 'რამაზი მაისაშვილი');
      setTeacherName(defaultTeacherName);

      // 1. გამოვყოთ Word-ის მოდულის ფაილები
      const wordFiles = allFiles.filter((f) => {
        const ext = (f.original_name || '').split('.').pop().toLowerCase();
        return ['docx', 'doc'].includes(ext) || ['vocational_module', 'general_module', 'integrated_module'].includes(f.resource_category);
      });
      setWordModuleFiles(wordFiles);

      // 2. გამოვყოთ მხოლოდ Excel-ის სასწავლო გეგმები (plan)
      const planFiles = allFiles.filter((f) => {
        const ext = (f.original_name || '').split('.').pop().toLowerCase();
        const isXls = ['xlsx', 'xls', 'csv'].includes(ext);
        return isXls && (f.resource_category === 'plan' || f.file_type === 'curriculum_plan' || (f.original_name || '').toLowerCase().includes('გეგმ'));
      });
      setPlanFilesList(planFiles);
      const resourceFiles = allFiles.filter((f) => f.resource_category === 'resources');

      const [loadedPlansArr, loadedResourcesArr] = await Promise.all([
        Promise.all(
          planFiles.map(async (pf) => {
            try {
              const res = await api.getFileModule(pf.id);
              if (res && res.plans) {
                return res.plans.map((p, idx) => ({
                  ...p,
                  _key: `${pf.id}_${p.id || idx}`,
                  file_id: pf.id,
                  file_name: pf.original_name,
                  organization_code: pf.organization_code,
                  organization_name: pf.organization_name,
                  weekly_schedule_parsed: Array.isArray(p.weekly_schedule) ? p.weekly_schedule : [],
                }));
              }
            } catch (e) {
              // ignore
            }
            return [];
          })
        ),
        Promise.all(
          resourceFiles.map(async (rf) => {
            try {
              const res = await api.getFileModule(rf.id);
              if (res && res.modules) {
                return res.modules.map((m) => ({
                  ...m,
                  file_id: rf.id,
                  file_name: rf.original_name,
                  organization_code: rf.organization_code,
                }));
              }
            } catch (e) {
              // ignore
            }
            return [];
          })
        ),
      ]);

      const flatPlans = loadedPlansArr.flat();
      const flatResources = loadedResourcesArr.flat();
      setDbPlans(flatPlans);
      setDbResources(flatResources);

      // პირველი სასწავლო გეგმისა და მისი პირველი მოდულის არჩევა
      if (planFiles.length > 0) {
        const firstPf = planFiles[0];
        setSelectedPlanFileId(String(firstPf.id));
        const firstPlanModules = flatPlans.filter((p) => String(p.file_id) === String(firstPf.id));
        if (firstPlanModules.length > 0) {
          await handleSelectPlanModule(firstPlanModules[0]._key, flatPlans, wordFiles, flatResources, defaultTeacherName);
        }
      } else if (wordFiles.length > 0) {
        await handleSelectWordFile(String(wordFiles[0].id), wordFiles, flatPlans, flatResources, teachersList);
      }
    } catch (err) {
      setError(err.message || 'ბაზიდან მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  // როდესაც მომხმარებელი ირჩევს სასწავლო გეგმას (Excel ფაილს)
  const handleSelectPlanFile = async (planFileIdStr) => {
    setSelectedPlanFileId(planFileIdStr);
    const modulesInPlan = dbPlans.filter((p) => String(p.file_id) === String(planFileIdStr));
    if (modulesInPlan.length > 0) {
      await handleSelectPlanModule(modulesInPlan[0]._key, dbPlans, wordModuleFiles, dbResources);
    } else {
      setSelectedPlanKey('');
      setModuleTitle('');
      setRegistrationNumber('');
      setCredits('');
      setOutcomesConfig([]);
    }
  };

  // როდესაც მომხმარებელი ირჩევს კონკრეტულ მოდულს ამ სასწავლო გეგმიდან
  const handleSelectPlanModule = async (
    planKey,
    plansList = dbPlans,
    wordFilesList = wordModuleFiles,
    resourcesList = dbResources,
    curTeacherName = teacherName
  ) => {
    setSelectedPlanKey(planKey);
    const p = plansList.find((item) => item._key === planKey);
    if (!p) return;

    setModuleLoading(true);
    setError('');

    try {
      const orgName = p.organization_name || organizationName || 'საგანმანათლებლო დაწესებულება';
      const orgCode = p.organization_code || organizationCode || '';
      setOrganizationName(orgName);
      setOrganizationCode(orgCode);

      const mTitle = p.module_name || '';
      const regNum = (p.registration_number || '').trim();
      const mType = p.status || 'პროფესიული';
      const mCredits = p.credits || '';

      setModuleTitle(mTitle);
      setRegistrationNumber(regNum);
      setModuleStatus(mType);
      setCredits(mCredits);

      if (orgCode === '22_skola') {
        setProgramName('კომპიუტერული ქსელი და სისტემები');
        setLocation('ქ. ქუთაისი, განათლების ქუჩა 64');
      } else if (orgCode === 'wea') {
        setProgramName('Front-end დეველოპმენტი');
        setLocation(orgName);
      } else {
        setProgramName(p.file_name?.replace(/\.[^/.]+$/, '') || '');
        setLocation(orgName);
      }

      // კვირეული დატვირთვა გეგმიდან
      const ws = p.weekly_schedule_parsed || [];
      if (ws.length > 0) {
        const firstWeekNum = Number(ws[0].week || 1);
        setStartAcademicWeek(firstWeekNum);
        const autoStartDate = getStartDateForAcademicWeek(firstWeekNum, academicYearStartDate, holidays, selectedDays);
        setStartDate(autoStartDate);

        const firstWeekHours = Number(ws[0].hours || 6);
        if (firstWeekHours > 0) {
          // თუ კვირის დატვირთვაა (> 8 სთ, მაგ. 15 ან 20 სთ), გავყოთ კვირის დღეებზე
          let calcDaily = firstWeekHours > 8
            ? Math.max(1, Math.round(firstWeekHours / (selectedDays.length || 3)))
            : firstWeekHours;
          // დღიური საათების ლიმიტი ყოველთვის 6-დან 8 სთ-მდე (დეფაულტად 6 სთ)
          if (calcDaily < 6) calcDaily = 6;
          if (calcDaily > 8) calcDaily = 8;
          setDailyHourLimit(calcDaily);
        }
      }

      const planEval = Number(p.hours_evaluation || 0);
      if (planEval === 0) {
        setDeductEvalFromContact(true);
      } else {
        setDeductEvalFromContact(false);
      }

      // მოვძებნოთ შესაბამისი Word მოდულის აღწერა ბაზიდან სწავლის შედეგების წამოსაღებად
      const normStr = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const targetName = normStr(mTitle);
      const targetReg = normStr(regNum);

      const matchedWord = wordFilesList.find((wf) => {
        const wName = normStr(wf.original_name);
        if (targetReg && targetReg.length > 3 && wName.includes(targetReg)) return true;
        if (targetName && targetName.length > 3 && (wName.includes(targetName) || targetName.includes(wName))) return true;
        const words = targetName.split(' ').filter((w) => w.length > 4);
        if (words.length > 0 && words.filter((w) => wName.includes(w)).length >= 2) return true;
        return false;
      });

      let loadedOutcomes = [];
      let extractedMeta = {};

      if (matchedWord) {
        setSelectedFileId(String(matchedWord.id));
        const modData = await api.getFileModule(Number(matchedWord.id));
        loadedOutcomes = modData?.outcomes || [];
        const docElements = modData?.doc_elements || [];
        extractedMeta = extractMetaFromDocElements(docElements);
        setPrerequisite(extractedMeta.prerequisite || '');
      } else {
        setSelectedFileId('');
      }

      // გარემო რესურსებიდან
      const matchedRes = resourcesList.find((r) => {
        const rName = normStr(r.module_name || '');
        return targetName && (rName.includes(targetName) || targetName.includes(rName));
      });
      const envFromDb = matchedRes?.learning_environment || extractedMeta.envResources || '';

      const planContactTotal = Number(p.hours_contact || 0);
      const planEvalTotal = Number(p.hours_evaluation || 0);

      if (loadedOutcomes.length > 0) {
        const sumWordContact = loadedOutcomes.reduce((acc, oc) => acc + Number(oc.hours_contact || 0), 0);
        const sumWordEval = loadedOutcomes.reduce((acc, oc) => acc + Number(oc.hours_evaluation || 0), 0);

        const mappedOutcomes = loadedOutcomes.map((oc, idx) => {
          const parsedTopics = splitTopicsText(oc.topics);
          let rawContact = Number(oc.hours_contact || 0);
          let rawEval = Number(oc.hours_evaluation || 0);

          // თუ Word-ის ფაილში სწავლის შედეგებზე საათები არ იყო გაწერილი (0 იყო),
          // სასწავლო გეგმის (Excel) მთლიანი საკონტაქტო საათები გავანაწილოთ შედეგებზე:
          if (sumWordContact === 0 && planContactTotal > 0) {
            const basePerOc = Math.floor(planContactTotal / loadedOutcomes.length);
            const rem = planContactTotal % loadedOutcomes.length;
            rawContact = basePerOc + (idx < rem ? 1 : 0);
          }
          if (sumWordEval === 0 && planEvalTotal > 0) {
            const baseEval = Math.floor(planEvalTotal / loadedOutcomes.length);
            const remE = planEvalTotal % loadedOutcomes.length;
            rawEval = baseEval + (idx < remE ? 1 : 0);
          }

          return {
            id: oc.id || idx + 1,
            outcome_number: oc.outcome_number || String(idx + 1),
            outcome_name: oc.outcome_name || `სწავლის შედეგი ${idx + 1}`,
            raw_hours_contact: rawContact,
            hours_contact: rawContact,
            hours_independent: Number(oc.hours_independent || 0),
            hours_evaluation: rawEval,
            topicsList: parsedTopics.length > 0 ? parsedTopics : (oc.topics ? [oc.topics] : [oc.outcome_name || `თემა ${idx + 1}`]),
            criteria: oc.criteria || '',
            teaching_methods: extractedMeta.teachingMethods || 'ლექცია დემონსტრირებით;\nპრაქტიკული სამუშაო;\nდისკუსია/დებატები;\nჯგუფური მუშაობა.',
            environment_resources: envFromDb,
            summative_assessment: oc.assessment_direction || 'პრაქტიკული დავალება',
          };
        });

        setOutcomesConfig(mappedOutcomes);

        const initialMerges = {};
        for (let i = 0; i < mappedOutcomes.length - 1; i++) {
          const a = (mappedOutcomes[i].summative_assessment || '').trim().toLowerCase();
          const b = (mappedOutcomes[i + 1].summative_assessment || '').trim().toLowerCase();
          if (a && b && a === b) {
            initialMerges[`${i}-${i + 1}`] = true;
          }
        }
        setPairMerges(initialMerges);
      } else {
        setOutcomesConfig([
          {
            id: 1,
            outcome_number: '1',
            outcome_name: mTitle || 'სწავლის შედეგი 1',
            raw_hours_contact: Number(p.hours_contact || 20),
            hours_contact: Number(p.hours_contact || 20),
            hours_evaluation: Number(p.hours_evaluation || 0),
            topicsList: [mTitle || 'მოდულის თემატიკა'],
            criteria: '',
            teaching_methods: 'ლექცია დემონსტრირებით;\nპრაქტიკული სამუშაო.',
            environment_resources: envFromDb,
            summative_assessment: 'პრაქტიკული დავალება',
          },
        ]);
        setPairMerges({});
      }
    } catch (err) {
      setError(err.message || 'მოდულის მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setModuleLoading(false);
    }
  };

  // როდესაც მომხმარებელი ირჩევს კონკრეტულ Word მოდულს ბაზიდან
  const handleSelectWordFile = async (
    fileIdStr,
    wordFilesList = wordModuleFiles,
    plansList = dbPlans,
    resourcesList = dbResources,
    teachersList = dbTeachers
  ) => {
    setSelectedFileId(fileIdStr);
    if (!fileIdStr) return;

    const fileMeta = wordFilesList.find((f) => String(f.id) === String(fileIdStr));
    setModuleLoading(true);
    setError('');

    try {
      const modData = await api.getFileModule(Number(fileIdStr));
      const mod = modData?.module || {};
      const outcomes = modData?.outcomes || [];
      const docElements = modData?.doc_elements || [];

      const orgName = modData?.organization_name || fileMeta?.organization_name || 'საგანმანათლებლო დაწესებულება';
      const orgCode = modData?.organization_code || fileMeta?.organization_code || '';
      setOrganizationName(orgName);
      setOrganizationCode(orgCode);

      const mTitle = mod.module_name || fileMeta?.original_name?.replace(/\.[^/.]+$/, '') || '';
      const regNum = (mod.registration_number || '').trim();
      const mType = modData?.module_type || mod.module_type || fileMeta?.module_type_name || 'პროფესიული';
      const mCredits = mod.credits || '';

      setModuleTitle(mTitle);
      setRegistrationNumber(regNum);
      setModuleStatus(mType);
      setCredits(mCredits);

      // პროგრამის სახელწოდება და მისამართი ორგანიზაციის მიხედვით (ბაზიდან)
      if (orgCode === '22_skola') {
        setProgramName('კომპიუტერული ქსელი და სისტემები');
        setLocation('ქ. ქუთაისი, განათლების ქუჩა 64');
      } else if (orgCode === 'wea') {
        setProgramName('Front-end დეველოპმენტი');
        setLocation(orgName);
      } else {
        setProgramName('');
        setLocation(orgName);
      }

      // ამოვიღოთ წინაპირობა და სწავლების მეთოდები რეალური Word-ის ცხრილებიდან (doc_elements)
      const extractedMeta = extractMetaFromDocElements(docElements);
      setPrerequisite(extractedMeta.prerequisite || '');

      // 1. მოვძებნოთ შესაბამისი ჩანაწერი Excel-ის სასწავლო გეგმაში (curriculum_plans)
      const normStr = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const matchedPlan = plansList.find((p) => {
        if (regNum && p.registration_number && normStr(p.registration_number) === normStr(regNum)) {
          return true;
        }
        if (mTitle && p.module_name && (normStr(p.module_name).includes(normStr(mTitle)) || normStr(mTitle).includes(normStr(p.module_name)))) {
          return true;
        }
        return false;
      });

      if (matchedPlan) {
        setSelectedPlanKey(matchedPlan._key);
        if (matchedPlan.credits) setCredits(matchedPlan.credits);
        if (matchedPlan.status) setModuleStatus(matchedPlan.status);

        // შევამოწმოთ შეფასების საათები ცალკეა თუ საკონტაქტოში შედის
        const planEval = Number(matchedPlan.hours_evaluation || 0);
        const modEval = Number(mod.hours_evaluation || 0);
        if (planEval === 0 && modEval > 0) {
          setDeductEvalFromContact(true);
        } else {
          setDeductEvalFromContact(false);
        }

        const ws = matchedPlan.weekly_schedule_parsed || [];
        if (ws.length > 0) {
          const firstWeekNum = Number(ws[0].week || 1);
          setStartAcademicWeek(firstWeekNum);
          const firstWeekHours = Number(ws[0].hours || 6);
          if (firstWeekHours > 0) {
            let calcDaily = firstWeekHours > 8
              ? Math.max(1, Math.round(firstWeekHours / (selectedDays.length || 3)))
              : firstWeekHours;
            if (calcDaily < 6) calcDaily = 6;
            if (calcDaily > 8) calcDaily = 8;
            setDailyHourLimit(calcDaily);
          }
        }
      } else {
        setSelectedPlanKey('');
      }

      // 2. მოვძებნოთ შესაბამისი მასწავლებელი ბაზის მასწავლებლებიდან (api_users)
      const matchedTeacher = teachersList.find((t) => {
        const tMods = Array.isArray(t.modules)
          ? t.modules.join(' ').toLowerCase()
          : String(t.modules || '').toLowerCase();
        const tSubj = String(t.subject || '').toLowerCase();
        const target = normStr(mTitle);
        return target && (tMods.includes(target) || target.includes(tSubj && tSubj.length > 4 ? tSubj : '___'));
      });

      if (matchedTeacher) {
        setTeacherName(matchedTeacher.name || matchedTeacher.username || '');
      } else if (teachersList.length > 0 && !teacherName) {
        setTeacherName(teachersList[0].name || teachersList[0].username || '');
      }

      // 3. მოვძებნოთ შესაბამისი მატერიალური რესურსი / გარემო ბაზიდან (material_resources)
      const matchedRes = resourcesList.find(
        (r) => mTitle && r.module_name && (normStr(r.module_name).includes(normStr(mTitle)) || normStr(mTitle).includes(normStr(r.module_name)))
      );
      const envFromDb = matchedRes?.learning_environment || extractedMeta.envResources || '';

      // 4. მოვამზადოთ სწავლის შედეგები ბაზიდან (curriculum_outcomes)
      const mappedOutcomes = outcomes.map((oc, idx) => {
        const parsedTopics = splitTopicsText(oc.topics);
        const rawContact = Number(oc.hours_contact || 0);
        const rawEval = Number(oc.hours_evaluation || 0);
        return {
          id: `oc_${fileIdStr}_${idx + 1}`,
          outcome_number: oc.outcome_number || String(idx + 1),
          outcome_name: oc.outcome_name || `სწავლის შედეგი ${idx + 1}`,
          raw_hours_contact: rawContact,
          hours_contact: rawContact,
          hours_independent: Number(oc.hours_independent || 0),
          hours_evaluation: rawEval,
          topicsList: parsedTopics.length > 0 ? parsedTopics : [oc.topics || oc.outcome_name || `თემა ${idx + 1}`],
          criteria: oc.criteria || '',
          teaching_methods: extractedMeta.teachingMethods || 'ლექცია დემონსტრირებით;\nპრაქტიკული სამუშაო;\nდისკუსია/დებატები;\nჯგუფური მუშაობა.',
          formative_assessment: oc.assessment_methods || '',
          summative_assessment: oc.assessment_direction
            ? `${oc.assessment_direction}${oc.assessment_methods ? ' / ' + oc.assessment_methods : ''}`
            : oc.assessment_methods || '',
          environment_resources: envFromDb,
        };
      });

      setOutcomesConfig(mappedOutcomes);

      // შევამოწმოთ მეზობელი სწავლის შედეგების შეფასების ტიპები (თუ ემთხვევა)
      const initialMerges = {};
      for (let i = 0; i < mappedOutcomes.length - 1; i++) {
        const a = (mappedOutcomes[i].summative_assessment || '').trim().toLowerCase();
        const b = (mappedOutcomes[i + 1].summative_assessment || '').trim().toLowerCase();
        if (a && b && a === b) {
          initialMerges[`${i}-${i + 1}`] = true;
        }
      }
      setPairMerges(initialMerges);
    } catch (err) {
      setError(err.message || 'მოდულის მონაცემების წაკითხვა ვერ მოხერხდა');
    } finally {
      setModuleLoading(false);
    }
  };

  const handlePlanChange = (planKey) => {
    setSelectedPlanKey(planKey);
    const p = dbPlans.find((item) => item._key === planKey);
    if (!p) return;
    if (p.credits) setCredits(p.credits);
    if (p.status) setModuleStatus(p.status);
    const ws = p.weekly_schedule_parsed || [];
    if (ws.length > 0) {
      if (ws[0].week) {
        const w = Number(ws[0].week);
        setStartAcademicWeek(w);
        const autoDate = getStartDateForAcademicWeek(w, academicYearStartDate, holidays, selectedDays);
        setStartDate(autoDate);
      }
      if (ws[0].hours) {
        const h = Number(ws[0].hours);
        let calcDaily = h > 8 ? Math.max(1, Math.round(h / (selectedDays.length || 3))) : h;
        if (calcDaily < 6) calcDaily = 6;
        if (calcDaily > 8) calcDaily = 8;
        setDailyHourLimit(calcDaily);
      }
    }
  };

  const handleStartAcademicWeekChange = (newWeekNum) => {
    const w = Math.max(1, Math.round(Number(newWeekNum) || 1));
    setStartAcademicWeek(w);
    const autoDate = getStartDateForAcademicWeek(w, academicYearStartDate, holidays, selectedDays);
    setStartDate(autoDate);
  };

  const handleAcademicYearStartChange = (val) => {
    setAcademicYearStartDate(val);
    const autoDate = getStartDateForAcademicWeek(startAcademicWeek, val, holidays, selectedDays);
    setStartDate(autoDate);
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    const calcWeek = getAcademicWeekForIsoDate(val, academicYearStartDate, holidays);
    setStartAcademicWeek(calcWeek);
  };

  const toggleWeekday = (dayId) => {
    setSelectedDays((prev) => {
      let nextDays;
      if (prev.includes(dayId)) {
        if (prev.length === 1) return prev;
        nextDays = prev.filter((d) => d !== dayId).sort((a, b) => a - b);
      } else {
        nextDays = [...prev, dayId].sort((a, b) => a - b);
      }
      const autoDate = getStartDateForAcademicWeek(startAcademicWeek, academicYearStartDate, holidays, nextDays);
      setStartDate(autoDate);
      return nextDays;
    });
  };

  const getEffectiveContactHours = (oc) => {
    const base = Math.round(Number(oc.raw_hours_contact ?? oc.hours_contact ?? 0));
    const evalH = Math.round(Number(oc.hours_evaluation || 0));
    if (deductEvalFromContact) {
      return Math.max(0, base - evalH);
    }
    return base;
  };

  const totalModuleContactHours = useMemo(() => {
    const sum = outcomesConfig.reduce((acc, oc) => acc + Math.round(getEffectiveContactHours(oc)), 0);
    return sum > 0 ? sum : 20;
  }, [outcomesConfig, deductEvalFromContact]);

  const grandTotalContact = useMemo(() => {
    return sessions.reduce((acc, s) => acc + Number(s.hoursContact || 0), 0);
  }, [sessions]);

  const grandTotalEvaluation = useMemo(() => {
    return outcomesConfig.reduce((acc, oc) => acc + Math.round(Number(oc.hours_evaluation || 0)), 0);
  }, [outcomesConfig]);

  const grandTotalIndependent = useMemo(() => {
    return outcomesConfig.reduce((acc, oc) => acc + Math.round(Number(oc.hours_independent || 0)), 0);
  }, [outcomesConfig]);

  const hourOptionsSummary = useMemo(() => {
    const total = totalModuleContactHours;
    const calcFor = (h) => {
      const fullDays = Math.floor(total / h);
      const remainder = total % h;
      const totalDays = Math.ceil(total / h);
      const remainingOnLastDay = remainder === 0 ? h : remainder;
      return {
        hoursPerDay: h,
        totalDays,
        fullDays,
        remainder,
        remainingOnLastDay,
        isExact: remainder === 0,
      };
    };
    return {
      opt6: calcFor(6),
      opt7: calcFor(7),
      opt8: calcFor(8),
    };
  }, [totalModuleContactHours]);

  // კალენდარული დღეებისა და საათების ბადის გამოთვლა
  const buildDaySlots = (customResolutions = holidayResolutions, customHours = customDateHours) => {
    if (!startDate || selectedDays.length === 0 || totalModuleContactHours <= 0) return { slots: [], collisions: [] };
    const slots = [];
    const collisions = [];
    let remaining = totalModuleContactHours;
    let curDate = startDate;
    const sortedWd = [...selectedDays].sort((a, b) => a - b);
    const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));
    const { weekMap, vacationWeeksSet } = computeAcademicWeeksMap(academicYearStartDate, holidays);

    const getWeek = (iso) => {
      const mon = getMondayOfIsoDate(iso);
      return weekMap.get(mon) ?? getAcademicWeekForIsoDate(iso, academicYearStartDate, holidays);
    };

    let safety = 0;
    while (remaining > 0 && safety < 800) {
      safety++;
      const wd = getIsoWeekday(curDate);
      if (sortedWd.includes(wd)) {
        const monIso = getMondayOfIsoDate(curDate);
        const isVacationWeek = vacationWeeksSet.has(monIso);

        if (holidayMap.has(curDate)) {
          const hName = holidayMap.get(curDate);
          const res = customResolutions[curDate] || 'next_week';
          if (res === 'saturday') {
            const satDate = getSaturdayOfSameWeek(curDate);
            if (!holidayMap.has(satDate)) {
              const standardH = weekdayHours[wd] ?? 6;
              const plannedH = customHours[satDate] !== undefined ? Number(customHours[satDate]) : standardH;
              const actualH = Math.min(remaining, Math.max(1, plannedH));
              remaining -= actualH;
              slots.push({
                index: slots.length + 1,
                date: satDate,
                weekday: 6,
                weekdayLabel: 'შაბათი (კომპენსაცია)',
                academicWeek: getWeek(satDate),
                hours: actualH,
                remainingAfter: remaining,
                isComp: true,
                holidayName: hName,
              });
            }
          } else {
            collisions.push({
              date: curDate,
              holidayName: hName,
              missedHours: weekdayHours[wd] ?? 6,
              remainingOutcomeHours: remaining,
              resolution: res,
              isVacationWeek,
            });
          }
        } else {
          const standardH = weekdayHours[wd] ?? 6;
          const plannedH = customHours[curDate] !== undefined ? Number(customHours[curDate]) : standardH;
          const actualH = Math.min(remaining, Math.max(1, plannedH));
          remaining -= actualH;
          const wdObj = WEEKDAYS.find((d) => d.id === wd);
          slots.push({
            index: slots.length + 1,
            date: curDate,
            weekday: wd,
            weekdayLabel: wdObj ? wdObj.label : `დღე ${wd}`,
            academicWeek: getWeek(curDate),
            hours: actualH,
            remainingAfter: remaining,
            isComp: false,
          });
        }
      }
      curDate = addDays(curDate, 1);
    }
    return { slots, collisions };
  };

  const previewDaySlots = useMemo(() => {
    return buildDaySlots(holidayResolutions, customDateHours).slots;
  }, [startDate, selectedDays, totalModuleContactHours, weekdayHours, customDateHours, holidays, holidayResolutions, academicYearStartDate]);

  // ============================================================================
  // SCHEDULE ENGINE: უკვე განსაზღვრულ დღეებზე თემებისა და შეფასების გადანაწილება
  // ============================================================================
  const runScheduleEngine = (customResolutions = holidayResolutions) => {
    const { slots, collisions } = buildDaySlots(customResolutions, customDateHours);
    const generatedSessions = [];

    // თემების მომზადება თითოეული სწავლის შედეგისთვის:
    const outcomeTopicsMap = outcomesConfig.map((oc, ocIdx) => {
      const targetContact = Math.round(getEffectiveContactHours(oc));
      const rawTopics = oc.topicsList && oc.topicsList.length > 0 ? oc.topicsList : [oc.outcome_name || `თემა ${ocIdx + 1}`];
      let topicItems = [];
      const numT = rawTopics.length;
      if (targetContact >= numT && numT > 0) {
        const baseH = Math.floor(targetContact / numT);
        const extraH = targetContact % numT;
        topicItems = rawTopics.map((t, i) => ({
          topic: t,
          hours: i < extraH ? baseH + 1 : baseH,
          ocIdx,
          oc,
        }));
      } else if (targetContact > 0 && numT > 0) {
        for (let h = 0; h < targetContact; h++) {
          const s = Math.floor((h * numT) / targetContact);
          const e = Math.floor(((h + 1) * numT) / targetContact);
          topicItems.push({
            topic: rawTopics.slice(s, e).join('; '),
            hours: 1,
            ocIdx,
            oc,
          });
        }
      } else {
        topicItems = [{ topic: oc.outcome_name || `თემა ${ocIdx + 1}`, hours: Math.max(1, targetContact), ocIdx, oc }];
      }
      return topicItems;
    });

    const allTopicItems = outcomeTopicsMap.flat();
    let topicIdx = 0;
    let topicRemaining = allTopicItems[0]?.hours || 0;

    slots.forEach((slot) => {
      let slotCapRemaining = slot.hours;
      while (slotCapRemaining > 0 && topicIdx < allTopicItems.length) {
        const curTopic = allTopicItems[topicIdx];
        const hrsToTake = Math.min(slotCapRemaining, topicRemaining);

        generatedSessions.push({
          id: `sess_${curTopic.ocIdx}_${generatedSessions.length + 1}`,
          outcomeIndex: curTopic.ocIdx,
          outcomeNumber: curTopic.oc.outcome_number,
          outcomeName: curTopic.oc.outcome_name,
          date: slot.date,
          academicWeek: slot.academicWeek,
          topic: curTopic.topic,
          hoursContact: hrsToTake,
          hoursIndependent: 0,
          hoursEvaluation: 0,
          isSaturdayCompensation: Boolean(slot.isComp),
          note: slot.isComp ? `შაბათის კომპენსაცია` : '',
        });

        slotCapRemaining -= hrsToTake;
        topicRemaining -= hrsToTake;

        if (topicRemaining <= 0) {
          topicIdx++;
          if (topicIdx < allTopicItems.length) {
            topicRemaining = allTopicItems[topicIdx].hours;
          }
        }
      }
    });

    generatedSessions.sort((a, b) => a.date.localeCompare(b.date));
    setHolidayCollisions(collisions);
    setSessions(generatedSessions);
  };

  const handleProceedToStep2 = () => {
    runScheduleEngine(holidayResolutions);
    setStep(2);
  };

  const handleHolidayResolutionChange = (holidayDate, newRes) => {
    const updated = { ...holidayResolutions, [holidayDate]: newRes };
    setHolidayResolutions(updated);
    runScheduleEngine(updated);
  };

  const handleApplyAllHolidaysResolution = (resType) => {
    const updated = { ...holidayResolutions };
    holidayCollisions.forEach((c) => {
      updated[c.date] = resType;
    });
    setHolidayResolutions(updated);
    runScheduleEngine(updated);
  };

  const handleAddCustomHoliday = (e) => {
    e.preventDefault();
    if (!newHolidayDate) return;
    const exists = holidays.some((h) => h.date === newHolidayDate);
    const nextHolidays = exists
      ? holidays.map((h) => (h.date === newHolidayDate ? { ...h, name: newHolidayName || 'დასვენების დღე' } : h))
      : [...holidays, { date: newHolidayDate, name: newHolidayName || 'დასვენების დღე' }].sort((a, b) => a.date.localeCompare(b.date));
    setHolidays(nextHolidays);
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  // ნაბიჯი 3: თემებისა და საათების ინტერაქტიული მართვა (მხოლოდ მთელი რიცხვები!)
  const handleSessionChange = (sessId, field, value) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessId ? {
        ...s,
        [field]: field === 'hoursContact'
          ? Math.max(1, Math.round(Number(value) || 1))
          : field === 'academicWeek'
          ? Math.max(1, Math.round(Number(value) || 1))
          : value
      } : s))
    );
  };

  const handleMergeWithNextSession = (idx) => {
    if (idx < 0 || idx >= sessions.length - 1) return;
    const current = sessions[idx];
    const next = sessions[idx + 1];
    if (current.outcomeIndex !== next.outcomeIndex) {
      alert('გაერთიანება შესაძლებელია ერთი და იმავე სწავლის შედეგის შიგნით არსებულ თემებზე.');
      return;
    }
    const mergedTopic = current.topic === next.topic ? current.topic : `${current.topic}; ${next.topic}`;
    const mergedHours = Math.round(Number(current.hoursContact || 0) + Number(next.hoursContact || 0));

    const updated = [...sessions];
    updated[idx] = {
      ...current,
      topic: mergedTopic,
      hoursContact: mergedHours,
    };
    updated.splice(idx + 1, 1);
    setSessions(updated);
  };

  const handleInsertSessionAfter = (targetGlobalIdx) => {
    if (targetGlobalIdx < 0 || targetGlobalIdx >= sessions.length) return;
    const current = sessions[targetGlobalIdx];
    const newId = `sess_manual_${Date.now()}`;
    const newSess = {
      id: newId,
      outcomeIndex: current.outcomeIndex,
      outcomeNumber: current.outcomeNumber,
      outcomeName: current.outcomeName,
      date: current.date,
      academicWeek: current.academicWeek,
      topic: '',
      hoursContact: 1,
      hoursIndependent: 0,
      hoursEvaluation: 0,
      isSaturdayCompensation: false,
      note: '',
    };

    const updated = [...sessions];
    updated.splice(targetGlobalIdx + 1, 0, newSess);
    setSessions(updated);
    setActiveSessionId(newId);
  };

  const handleAddSessionToOutcome = (outcomeIdx) => {
    // თუ მომხმარებელს კურსორი / აქტიური სტრიქონი მონიშნული აქვს ამ სწავლის შედეგში:
    const activeIdx = sessions.findIndex((s) => s.id === activeSessionId && s.outcomeIndex === outcomeIdx);
    if (activeIdx !== -1) {
      handleInsertSessionAfter(activeIdx);
      return;
    }

    // თუ არა, ჩავამატოთ ამ სწავლის შედეგის ბოლო თემის ქვემოთ (და არა მთელი კალენდრის ბოლოში!)
    const ocLastIdx = sessions
      .map((s, idx) => ({ s, idx }))
      .filter((item) => item.s.outcomeIndex === outcomeIdx)
      .pop()?.idx;

    if (ocLastIdx !== undefined) {
      handleInsertSessionAfter(ocLastIdx);
    } else {
      const oc = outcomesConfig[outcomeIdx];
      const newId = `sess_manual_${Date.now()}`;
      const newSess = {
        id: newId,
        outcomeIndex: outcomeIdx,
        outcomeNumber: oc.outcome_number,
        outcomeName: oc.outcome_name,
        date: startDate,
        academicWeek: startAcademicWeek,
        topic: '',
        hoursContact: 1,
        hoursIndependent: 0,
        hoursEvaluation: 0,
        isSaturdayCompensation: false,
        note: '',
      };
      setSessions([...sessions, newSess]);
      setActiveSessionId(newId);
    }
  };

  const handleDeleteSession = (sessId) => {
    if (sessions.length <= 1) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessId));
  };

  const handleAutoDistributeOutcomeHours = (outcomeIdx) => {
    const oc = outcomesConfig[outcomeIdx];
    const target = Math.round(getEffectiveContactHours(oc));
    const ocSessions = sessions.filter((s) => s.outcomeIndex === outcomeIdx);
    if (ocSessions.length === 0) return;

    const n = ocSessions.length;
    const baseH = Math.floor(target / n);
    const extraH = target % n;

    const updated = sessions.map((s) => {
      if (s.outcomeIndex !== outcomeIdx) return s;
      const sIdxInOc = ocSessions.findIndex((item) => item.id === s.id);
      const assigned = sIdxInOc < extraH ? baseH + 1 : baseH;
      return { ...s, hoursContact: assigned };
    });
    setSessions(updated);
  };

  // ============================================================================
  // ნაბიჯი 5: ოფიციალური 12-სვეტიანი ცხრილის გენერირება (CalendarDocument.jsx სტილში)
  // ============================================================================
  const officialTableData = useMemo(() => {
    const widths = [83, 96, 198, 372, 56, 62, 73, 63, 102, 154, 91, 67];
    const allDates = sessions.map((s) => s.date).filter(Boolean).sort();
    const firstDateIso = allDates[0] || startDate;
    const lastSessionDateIso = allDates[allDates.length - 1] || startDate;
    const evalFinalDateIso = addDays(lastSessionDateIso, 7);
    const periodText = `${formatDateGeo(firstDateIso)} - ${formatDateGeo(evalFinalDateIso)}`;

    const baseCell = (extra = {}) => ({
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      verticalAlign: 'middle',
      padding: '6px',
      border: '1px solid #52525b',
      fontFamily: 'Sylfaen, serif',
      fontSize: '10.0pt',
      color: '#18181b',
      ...extra,
    });

    const rows = [];
    let rowNum = 1;

    const headerOrgTitle = organizationName || 'სსიპ - ნესტორ გოქაძის სახელობის ქალაქ ქუთაისის N 22 საჯარო სკოლა';

    // სტრიქონი 1: სასწავლებლის დასახელება
    rows.push({
      number: rowNum++,
      height: '34.5pt',
      cells: [
        {
          column: 1,
          colSpan: 12,
          rowSpan: 1,
          text: `${headerOrgTitle}\nპროფესიული საგანმანათლებლო პროგრამის მოდულის კალენდარული გეგმა`,
          style: baseCell({ fontSize: '12.0pt', fontWeight: 'bold', textAlign: 'center' }),
        },
      ],
    });

    // სტრიქონები 2-8: მარცხნივ 3 სვეტი ლოგოს ბლოკი, მარჯვნივ 9 სვეტი მეტამონაცემები ბაზიდან
    const metaLines = [
      `პროფესიული საგანმანათლებლო პროგრამის სახელწოდება:   ${programName}`,
      `მოდულის სახელწოდება, სტატუსი და სარეგისტრაციო ნომერი: ${moduleTitle}${registrationNumber ? `; სარეგისტრაციო N ${registrationNumber}` : ''} (მოდულის სტატუსი - ${moduleStatus || 'პროფესიული'})`,
      `მოდულზე დაშვების წინაპირობა: ${prerequisite}`,
      `მოცულობა კრედიტებში:    ${credits}`,
      `მოდულის განმახორციელებელი: ${teacherName}`,
      `მოდულის განხორციელების ადგილი:  ${location}`,
      `მოდულის განხორციელების პერიოდი: ${periodText}`,
    ];

    metaLines.forEach((lineText, idx) => {
      const cells = [];
      if (idx === 0) {
        cells.push({
          column: 1,
          colSpan: 3,
          rowSpan: 7,
          isLogoCell: true,
          text: headerOrgTitle,
          style: baseCell({ textAlign: 'center', fontWeight: 'bold', fontSize: '10.0pt', background: '#ffffff' }),
        });
      }
      cells.push({
        column: 4,
        colSpan: 9,
        rowSpan: 1,
        text: lineText,
        style: baseCell({ fontWeight: 'bold', textAlign: 'left', fontSize: '10.0pt' }),
      });
      rows.push({
        number: rowNum++,
        height: idx === 1 ? '29.65pt' : null,
        cells,
      });
    });

    // სტრიქონი 9
    rows.push({
      number: rowNum++,
      height: null,
      cells: [
        {
          column: 1,
          colSpan: 3,
          rowSpan: 1,
          text: 'საათების განაწილება სწავლის შედეგების მიხედვით',
          style: baseCell({ fontWeight: 'bold', textAlign: 'center' }),
        },
        {
          column: 4,
          colSpan: 9,
          rowSpan: 1,
          text: '',
          style: baseCell({}),
        },
      ],
    });

    // სტრიქონები 10, 11, 12: 12-სვეტიანი ცხრილის 3-დონიანი თავსართი
    rows.push({
      number: rowNum++,
      height: null,
      cells: [
        { column: 1, rowSpan: 3, colSpan: 1, text: 'თარიღი  (რიცხვი, თვე, წელი)', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '10.0pt' }) },
        { column: 2, rowSpan: 3, colSpan: 1, text: 'სასწავლო კვირა№', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '10.0pt' }) },
        { column: 3, rowSpan: 3, colSpan: 1, text: 'მოდულის თემატიკა', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
        { column: 4, rowSpan: 3, colSpan: 1, text: 'შესრულების კრიტერიუმები', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
        { column: 5, rowSpan: 1, colSpan: 8, text: 'მოდულის შინაარსი', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
      ],
    });

    rows.push({
      number: rowNum++,
      height: '34.5pt',
      cells: [
        { column: 5, rowSpan: 1, colSpan: 3, text: 'საათების განაწილება სწავლის შედეგების მიხედვით', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
        { column: 8, rowSpan: 2, colSpan: 1, text: 'სწავლების მეთოდი', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
        { column: 9, rowSpan: 2, colSpan: 1, text: 'განმავითარებელი შეფასების მეთოდი/ინსტრუმენტი', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '8.0pt' }) },
        { column: 10, rowSpan: 2, colSpan: 1, text: 'განმსაზღვრელი შეფასების მიმართულება/ინსტრუმენტი', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '8.0pt' }) },
        { column: 11, rowSpan: 2, colSpan: 1, text: 'მოდულის განხორციელებისთვის საჭირო გარემო და რესურსი', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '8.0pt' }) },
        { column: 12, rowSpan: 2, colSpan: 1, text: 'შენიშვნა /რეკომენდაცია', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
      ],
    });

    rows.push({
      number: rowNum++,
      height: '75.0pt',
      cells: [
        { column: 5, rowSpan: 1, colSpan: 1, text: 'საკონტაქტო საათები', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
        { column: 6, rowSpan: 1, colSpan: 1, text: 'დამოუკიდებელი', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
        { column: 7, rowSpan: 1, colSpan: 1, text: 'შეფასება', style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '9.0pt' }) },
      ],
    });

    let grandTotalContact = 0;
    let grandTotalIndependent = 0;
    let grandTotalEvaluation = 0;
    let lastWeekNum = startAcademicWeek;
    let lastDateStr = startDate;

    let pendingMergedOutcomes = [];

    outcomesConfig.forEach((oc, ocIdx) => {
      const ocSessions = sessions.filter((s) => s.outcomeIndex === ocIdx);
      const spanCount = Math.max(1, ocSessions.length);

      rows.push({
        number: rowNum++,
        height: '24.75pt',
        cells: [
          {
            column: 1,
            colSpan: 12,
            rowSpan: 1,
            text: `სწავლის შედეგი ${oc.outcome_number}. ${oc.outcome_name}`,
            style: baseCell({ fontWeight: 'bold', textAlign: 'left', fontSize: '10.0pt', background: '#f8fafc' }),
          },
        ],
      });

      let ocContactSum = 0;
      const ocEvalHours = Number(oc.hours_evaluation || 0);
      const ocIndepHours = Number(oc.hours_independent || 0);

      if (ocSessions.length === 0) {
        rows.push({
          number: rowNum++,
          height: '30.0pt',
          cells: [
            { column: 1, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
            { column: 2, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
            { column: 3, rowSpan: 1, colSpan: 1, text: oc.outcome_name, style: baseCell({ textAlign: 'left' }) },
            { column: 4, rowSpan: 1, colSpan: 1, text: oc.criteria, style: baseCell({ textAlign: 'left', verticalAlign: 'top' }) },
            { column: 5, rowSpan: 1, colSpan: 1, text: '0', style: baseCell({ textAlign: 'center' }) },
            { column: 6, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
            { column: 7, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
            { column: 8, rowSpan: 1, colSpan: 1, text: oc.teaching_methods, style: baseCell({ textAlign: 'center', fontSize: '9.0pt' }) },
            { column: 9, rowSpan: 1, colSpan: 1, text: oc.formative_assessment, style: baseCell({ textAlign: 'center', fontSize: '9.0pt' }) },
            { column: 10, rowSpan: 1, colSpan: 1, text: oc.summative_assessment, style: baseCell({ textAlign: 'center', fontWeight: 'bold', fontSize: '9.0pt' }) },
            { column: 11, rowSpan: 1, colSpan: 1, text: oc.environment_resources || '', style: baseCell({ textAlign: 'center', fontSize: '8.5pt' }) },
            { column: 12, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
          ],
        });
      } else {
        ocSessions.forEach((sess, sIdx) => {
          const hrsC = Number(sess.hoursContact || 0);
          ocContactSum += hrsC;
          lastWeekNum = Number(sess.academicWeek || lastWeekNum);
          lastDateStr = sess.date || lastDateStr;

          const rowCells = [
            { column: 1, rowSpan: 1, colSpan: 1, text: formatDateGeo(sess.date), style: baseCell({ textAlign: 'center' }) },
            { column: 2, rowSpan: 1, colSpan: 1, text: String(sess.academicWeek || ''), style: baseCell({ textAlign: 'center' }) },
            { column: 3, rowSpan: 1, colSpan: 1, text: sess.topic, style: baseCell({ textAlign: 'left' }) },
          ];

          if (sIdx === 0) {
            rowCells.push({
              column: 4,
              rowSpan: spanCount,
              colSpan: 1,
              text: oc.criteria,
              style: baseCell({ textAlign: 'left', verticalAlign: 'top', fontSize: '10.0pt' }),
            });
          }

          rowCells.push(
            { column: 5, rowSpan: 1, colSpan: 1, text: String(hrsC), style: baseCell({ textAlign: 'center' }) },
            { column: 6, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
            { column: 7, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) }
          );

          if (sIdx === 0) {
            rowCells.push(
              { column: 8, rowSpan: spanCount, colSpan: 1, text: oc.teaching_methods, style: baseCell({ textAlign: 'center', fontSize: '9.0pt' }) },
              { column: 9, rowSpan: spanCount, colSpan: 1, text: oc.formative_assessment, style: baseCell({ textAlign: 'center', fontSize: '9.0pt' }) },
              { column: 10, rowSpan: spanCount, colSpan: 1, text: oc.summative_assessment, style: baseCell({ textAlign: 'center', fontWeight: 'bold', fontSize: '9.0pt' }) },
              { column: 11, rowSpan: spanCount, colSpan: 1, text: oc.environment_resources || '', style: baseCell({ textAlign: 'center', fontSize: '8.5pt' }) }
            );
          }

          rowCells.push({
            column: 12,
            rowSpan: 1,
            colSpan: 1,
            text: sess.note || '',
            style: baseCell({ textAlign: 'center', fontSize: '9.0pt' }),
          });

          rows.push({
            number: rowNum++,
            height: '32.0pt',
            cells: rowCells,
          });
        });
      }

      grandTotalContact += ocContactSum;
      grandTotalIndependent += ocIndepHours;
      grandTotalEvaluation += ocEvalHours;

      rows.push({
        number: rowNum++,
        height: '18.6pt',
        cells: [
          { column: 1, rowSpan: 1, colSpan: 4, text: 'ჯამი', style: baseCell({ fontWeight: 'bold', textAlign: 'right', borderRight: '2px solid #52525b' }) },
          { column: 5, rowSpan: 1, colSpan: 1, text: String(ocContactSum), style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '11.0pt' }) },
          { column: 6, rowSpan: 1, colSpan: 1, text: hideIndependentInRows ? '' : String(ocIndepHours || ''), style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '11.0pt' }) },
          { column: 7, rowSpan: 1, colSpan: 1, text: String(ocEvalHours), style: baseCell({ fontWeight: 'bold', textAlign: 'center', fontSize: '11.0pt' }) },
          { column: 8, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
          { column: 9, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
          { column: 10, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
          { column: 11, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
          { column: 12, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
        ],
      });

      pendingMergedOutcomes.push({
        idx: ocIdx,
        number: oc.outcome_number,
        evalHours: ocEvalHours,
        method: oc.summative_assessment,
      });

      const isLastOutcome = ocIdx === outcomesConfig.length - 1;
      const shouldMergeWithNext =
        evaluationMode === 'merge_all_end'
          ? !isLastOutcome
          : evaluationMode === 'merge_matching_pairs'
          ? !isLastOutcome && Boolean(pairMerges[`${ocIdx}-${ocIdx + 1}`])
          : false;

      if (!shouldMergeWithNext && pendingMergedOutcomes.length > 0) {
        // შეფასების თარიღი არის ბოლო საკონტაქტო დღე (ან მომდევნო სასწავლო დღე)
        const evalDateStr = lastDateStr;

        const combinedEvalHours = pendingMergedOutcomes.reduce((acc, item) => acc + item.evalHours, 0);
        const ordinalNames = pendingMergedOutcomes.map((item) => GEORGIAN_ORDINAL[item.idx] || `მე-${item.number}`);
        const evalLabelText =
          ordinalNames.length === 1
            ? `${ordinalNames[0]} სწავლის შედეგის შეფასება`
            : `${ordinalNames.slice(0, -1).join(', ')} და ${ordinalNames[ordinalNames.length - 1]} სწავლის შედეგის შეფასება`;

        rows.push({
          number: rowNum++,
          height: '17.25pt',
          cells: [
            { column: 1, rowSpan: 1, colSpan: 11, text: 'განმსაზღვრელი შეფასება', style: baseCell({ fontWeight: 'bold', textAlign: 'center', background: '#fefce8' }) },
            { column: 12, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ fontWeight: 'bold', textAlign: 'center', background: '#fefce8' }) },
          ],
        });

        rows.push({
          number: rowNum++,
          height: '18.0pt',
          cells: [
            { column: 1, rowSpan: 1, colSpan: 1, text: formatDateGeo(evalDateStr), style: baseCell({ textAlign: 'center' }) },
            { column: 2, rowSpan: 1, colSpan: 1, text: String(lastWeekNum), style: baseCell({ textAlign: 'center' }) },
            { column: 3, rowSpan: 1, colSpan: 2, text: evalLabelText, style: baseCell({ fontWeight: 'bold', textAlign: 'center' }) },
            { column: 5, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
            { column: 6, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ textAlign: 'center' }) },
            { column: 7, rowSpan: 1, colSpan: 1, text: String(combinedEvalHours), style: baseCell({ fontWeight: 'bold', textAlign: 'center' }) },
            { column: 8, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
            { column: 9, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
            { column: 10, rowSpan: 1, colSpan: 1, text: pendingMergedOutcomes[0]?.method || '', style: baseCell({ textAlign: 'center', fontSize: '9.0pt' }) },
            { column: 11, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
            { column: 12, rowSpan: 1, colSpan: 1, text: '', style: baseCell({}) },
          ],
        });

        pendingMergedOutcomes = [];
      }
    });

    const totalContactDisplay = grandTotalContact;

    rows.push({
      number: rowNum++,
      height: '27.75pt',
      cells: [
        { column: 1, rowSpan: 1, colSpan: 4, text: 'სულ ჯამი', style: baseCell({ fontWeight: 'bold', textAlign: 'right', background: '#f1f5f9' }) },
        { column: 5, rowSpan: 1, colSpan: 1, text: String(totalContactDisplay), style: baseCell({ fontWeight: 'bold', textAlign: 'center', background: '#f1f5f9' }) },
        { column: 6, rowSpan: 1, colSpan: 1, text: hideIndependentInRows ? '' : String(grandTotalIndependent || ''), style: baseCell({ fontWeight: 'bold', textAlign: 'center', background: '#f1f5f9' }) },
        { column: 7, rowSpan: 1, colSpan: 1, text: String(grandTotalEvaluation), style: baseCell({ fontWeight: 'bold', textAlign: 'center', background: '#f1f5f9' }) },
        { column: 8, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ background: '#f1f5f9' }) },
        { column: 9, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ background: '#f1f5f9' }) },
        { column: 10, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ background: '#f1f5f9' }) },
        { column: 11, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ background: '#f1f5f9' }) },
        { column: 12, rowSpan: 1, colSpan: 1, text: '', style: baseCell({ background: '#f1f5f9' }) },
      ],
    });

    rows.push({
      number: rowNum++,
      height: '22.0pt',
      cells: [
        {
          column: 1,
          rowSpan: 1,
          colSpan: 12,
          text: `მასწავლებლის სახელი გვარი და ხელმოწერა: ${teacherName}                                                       ხელმოწერა___________________________________________`,
          style: baseCell({ fontSize: '11.0pt', fontWeight: 'bold', textAlign: 'center' }),
        },
      ],
    });

    rows.push({
      number: rowNum++,
      height: '22.0pt',
      cells: [
        {
          column: 1,
          rowSpan: 1,
          colSpan: 12,
          text: 'შეთანხმებულია: კოორდინატორი                                 ხელმოწერა___________________________________________',
          style: baseCell({ fontSize: '11.0pt', fontWeight: 'bold', textAlign: 'center' }),
        },
      ],
    });

    return {
      widths,
      rows,
      firstDateIso,
      evalFinalDateIso,
      grandTotalContact: totalContactDisplay,
      grandTotalEvaluation,
    };
  }, [
    sessions,
    outcomesConfig,
    organizationName,
    programName,
    moduleTitle,
    registrationNumber,
    moduleStatus,
    prerequisite,
    credits,
    teacherName,
    location,
    startDate,
    startAcademicWeek,
    evaluationMode,
    pairMerges,
    deductEvalFromContact,
    hideIndependentInRows,
  ]);

  // ============================================================================
  // ნაბიჯი 5.2: აკადემიის 10-სვეტიანი ცხრილის მონაცემები (შპს მსოფლიო განათლების აკადემია)
  // ============================================================================
  const academyTableData = useMemo(() => {
    const allDates = sessions.map((s) => s.date).filter(Boolean).sort();
    const firstDateIso = allDates[0] || startDate;
    const lastSessionDateIso = allDates[allDates.length - 1] || startDate;
    const totalHours = grandTotalContact + grandTotalIndependent + grandTotalEvaluation;

    const baseCell = (extra = {}) => ({
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      verticalAlign: 'middle',
      padding: '4px 6px',
      border: '0.5pt solid #000000',
      fontFamily: "'Sylfaen', serif",
      fontSize: '10pt',
      color: '#000000',
      ...extra,
    });

    const rows = [];
    let lastWeekNum = startAcademicWeek;
    let lastDateStr = startDate;
    let pendingMergedOutcomes = [];

    outcomesConfig.forEach((oc, ocIdx) => {
      const ocSessions = sessions.filter((s) => s.outcomeIndex === ocIdx);
      let ocContactSum = 0;
      const ocEvalHours = Number(oc.hours_evaluation || 0);
      const ocIndepHours = Number(oc.hours_independent || 0);

      if (ocSessions.length === 0) {
        rows.push({
          type: 'session',
          cells: [
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: oc.outcome_name, style: baseCell({ textAlign: 'left' }) },
            { text: '0', style: baseCell({ textAlign: 'center' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: oc.teaching_methods || 'ლექცია\nპრაქტიკული მეცადინეობა', style: baseCell({ textAlign: 'center', fontSize: '9pt' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: oc.environment_resources || '', style: baseCell({ textAlign: 'center', fontSize: '8.5pt' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
          ],
        });
      } else {
        ocSessions.forEach((sess) => {
          const hrsC = Number(sess.hoursContact || 0);
          ocContactSum += hrsC;
          lastWeekNum = Number(sess.academicWeek || lastWeekNum);
          lastDateStr = sess.date || lastDateStr;

          rows.push({
            type: 'session',
            cells: [
              { text: String(sess.academicWeek || ''), style: baseCell({ textAlign: 'center' }) },
              { text: formatDateGeo(sess.date), style: baseCell({ textAlign: 'center' }) },
              { text: sess.topic, style: baseCell({ textAlign: 'left' }) },
              { text: String(hrsC), style: baseCell({ textAlign: 'center' }) },
              { text: '', style: baseCell({ textAlign: 'center' }) },
              { text: '', style: baseCell({ textAlign: 'center' }) },
              { text: oc.teaching_methods || 'ლექცია\nპრაქტიკული მეცადინეობა', style: baseCell({ textAlign: 'center', fontSize: '9pt' }) },
              { text: '', style: baseCell({ textAlign: 'center' }) },
              { text: oc.environment_resources || '', style: baseCell({ textAlign: 'center', fontSize: '8.5pt' }) },
              { text: sess.note || '', style: baseCell({ textAlign: 'center' }) },
            ],
          });
        });
      }

      // Subtotal row (#CCC0D9)
      const ocTotalHours = ocContactSum + ocIndepHours + ocEvalHours;
      rows.push({
        type: 'outcome_subtotal',
        cells: [
          { text: '', style: baseCell({ background: '#CCC0D9' }) },
          { text: '', style: baseCell({ background: '#CCC0D9' }) },
          { text: '', style: baseCell({ background: '#CCC0D9' }) },
          { text: String(ocContactSum), style: baseCell({ background: '#CCC0D9', fontWeight: 'bold', textAlign: 'center' }) },
          { text: ocIndepHours > 0 ? String(ocIndepHours) : '', style: baseCell({ background: '#CCC0D9', fontWeight: 'bold', textAlign: 'center' }) },
          { text: ocEvalHours > 0 ? String(ocEvalHours) : '', style: baseCell({ background: '#CCC0D9', fontWeight: 'bold', textAlign: 'center' }) },
          { text: ocTotalHours > 0 ? String(ocTotalHours) : '', style: baseCell({ background: '#CCC0D9', fontWeight: 'bold', textAlign: 'center' }) },
          { text: '', style: baseCell({ background: '#CCC0D9' }) },
          { text: '', style: baseCell({ background: '#CCC0D9' }) },
          { text: '', style: baseCell({ background: '#CCC0D9' }) },
        ],
      });

      pendingMergedOutcomes.push({
        idx: ocIdx,
        number: oc.outcome_number,
        name: oc.outcome_name,
        evalHours: ocEvalHours,
        method: oc.summative_assessment || 'პრაქტიკული დავალება',
      });

      const isLastOutcome = ocIdx === outcomesConfig.length - 1;
      const shouldMergeWithNext =
        evaluationMode === 'merge_all_end'
          ? !isLastOutcome
          : evaluationMode === 'merge_matching_pairs'
          ? !isLastOutcome && Boolean(pairMerges[`${ocIdx}-${ocIdx + 1}`])
          : false;

      if (!shouldMergeWithNext && pendingMergedOutcomes.length > 0) {
        const evalDateStr = lastDateStr;
        const combinedEvalHours = pendingMergedOutcomes.reduce((acc, item) => acc + item.evalHours, 0);
        const evalLabel =
          pendingMergedOutcomes.length === 1
            ? `სწავლის შედეგი ${pendingMergedOutcomes[0].number}\n${pendingMergedOutcomes[0].name}`
            : `სწავლის შედეგი ${pendingMergedOutcomes.map((i) => i.number).join('-')}\n` +
              pendingMergedOutcomes.map((i) => `${i.number}. ${i.name}`).join('\n');

        rows.push({
          type: 'evaluation',
          cells: [
            { text: String(lastWeekNum), style: baseCell({ textAlign: 'center' }) },
            { text: formatDateGeo(evalDateStr), style: baseCell({ textAlign: 'center' }) },
            { text: evalLabel, style: baseCell({ textAlign: 'left', fontWeight: 'bold' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: String(combinedEvalHours), style: baseCell({ textAlign: 'center', fontWeight: 'bold' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: pendingMergedOutcomes[0]?.method || 'პრაქტიკული დავალება', style: baseCell({ textAlign: 'center', fontSize: '9pt' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
            { text: '', style: baseCell({ textAlign: 'center' }) },
          ],
        });

        pendingMergedOutcomes = [];
      }
    });

    return {
      rows,
      firstDateIso,
      lastSessionDateIso,
      totalHours,
    };
  }, [
    sessions,
    outcomesConfig,
    startDate,
    startAcademicWeek,
    grandTotalContact,
    grandTotalIndependent,
    grandTotalEvaluation,
    evaluationMode,
    pairMerges,
  ]);

  const handleSaveCalendarToDb = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        id: currentSavedId,
        title: `${moduleTitle} (${registrationNumber || 'გეგმა'})`,
        module_id: selectedFileId ? Number(selectedFileId) : null,
        plan_id: null,
        module_name: moduleTitle,
        registration_number: registrationNumber,
        teacher_name: teacherName,
        program_name: programName,
        start_date: formatDateGeo(officialTableData.firstDateIso),
        end_date: formatDateGeo(officialTableData.evalFinalDateIso),
        config_json: {
          selectedTemplate,
          groupNumber,
          selectedFileId,
          selectedPlanKey,
          organizationName,
          organizationCode,
          programName,
          moduleTitle,
          registrationNumber,
          moduleStatus,
          prerequisite,
          credits,
          teacherName,
          location,
          startDate,
          startAcademicWeek,
          distributionMethod,
          selectedDays,
          dailyHourLimit,
          weekdayHours,
          deductEvalFromContact,
          hideIndependentInRows,
          outcomesConfig,
          holidayResolutions,
          sessions,
          evaluationMode,
          pairMerges,
        },
        table_json: officialTableData,
      };
      const res = await api.saveCalendar(payload);
      if (res.id) setCurrentSavedId(res.id);
      setSuccessMsg('კალენდარული გეგმა წარმატებით შეინახა ბაზაში!');
      const refreshed = await api.getCalendarInitData().catch(() => null);
      if (refreshed?.saved_calendars) setSavedCalendars(refreshed.saved_calendars);
    } catch (err) {
      setError(err.message || 'შენახვა ვერ მოხერხდა');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSavedCalendar = async (calId) => {
    try {
      setLoading(true);
      const res = await api.getSavedCalendar(calId);
      const cal = res.calendar;
      if (cal && cal.config_json) {
        const cfg = cal.config_json;
        setCurrentSavedId(cal.id);
        if (cfg.selectedTemplate) setSelectedTemplate(cfg.selectedTemplate);
        if (cfg.groupNumber) setGroupNumber(cfg.groupNumber);
        setSelectedFileId(cfg.selectedFileId || '');
        setSelectedPlanKey(cfg.selectedPlanKey || '');
        setOrganizationName(cfg.organizationName || '');
        setOrganizationCode(cfg.organizationCode || '');
        setProgramName(cfg.programName || '');
        setModuleTitle(cfg.moduleTitle || '');
        setRegistrationNumber(cfg.registrationNumber || '');
        setModuleStatus(cfg.moduleStatus || 'პროფესიული');
        setPrerequisite(cfg.prerequisite || '');
        setCredits(cfg.credits || '');
        setTeacherName(cfg.teacherName || '');
        setLocation(cfg.location || '');
        setStartDate(cfg.startDate || new Date().toISOString().slice(0, 10));
        setStartAcademicWeek(cfg.startAcademicWeek || 1);
        setDistributionMethod(cfg.distributionMethod || 1);
        setSelectedDays(cfg.selectedDays || [1, 3, 5]);
        setDailyHourLimit(cfg.dailyHourLimit || 6);
        if (cfg.weekdayHours) setWeekdayHours(cfg.weekdayHours);
        setDeductEvalFromContact(Boolean(cfg.deductEvalFromContact));
        setHideIndependentInRows(cfg.hideIndependentInRows !== false);
        if (cfg.outcomesConfig) setOutcomesConfig(cfg.outcomesConfig);
        if (cfg.holidayResolutions) setHolidayResolutions(cfg.holidayResolutions);
        if (cfg.sessions) setSessions(cfg.sessions);
        if (cfg.evaluationMode) setEvaluationMode(cfg.evaluationMode);
        if (cfg.pairMerges) setPairMerges(cfg.pairMerges);
        setStep(6);
      }
    } catch (err) {
      setError(err.message || 'ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        ბაზიდან იტვირთება ატვირთული მოდულები, სასწავლო გეგმები და მასწავლებლები...
      </div>
    );
  }

  const totalTableWidth = officialTableData.widths.reduce((a, b) => a + b, 0);

  return (
    <div className="calendar-generator-root">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-official-calendar,
          #printable-official-calendar * {
            visibility: visible;
          }
          #printable-official-calendar {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
        }
      `}</style>

      {/* ზედა ნავიგაცია: 5 ინტერაქტიული ნაბიჯი */}
      <div className="no-print" style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '18px 22px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={22} color="#2563eb" />
              კალენდარული გეგმის ინტერაქტიული გენერატორი
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              მონაცემები იტვირთება პირდაპირ ბაზიდან: ატვირთული Word მოდულებიდან ({wordModuleFiles.length}), Excel სასწავლო გეგმებიდან ({dbPlans.length}) და მასწავლებლების სიიდან ({dbTeachers.length})
            </p>
          </div>

          {savedCalendars.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={16} color="#475569" />
              <select
                onChange={(e) => e.target.value && handleLoadSavedCalendar(Number(e.target.value))}
                value={currentSavedId || ''}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#f8fafc',
                  color: '#1e293b'
                }}
              >
                <option value="">-- შენახული გეგმების გახსნა ({savedCalendars.length}) --</option>
                {savedCalendars.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title} ({sc.start_date} - {sc.end_date})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
          {[
            { n: 1, title: '1. გეგმა & მოდული', sub: 'მოდულისა და შედეგების არჩევა' },
            { n: 2, title: '2. დღეები & საათები', sub: 'კვირის დღეებზე საათების გაწერა' },
            { n: 3, title: '3. დასვენების დღეები', sub: 'უქმეების შემოწმება & კომპენსაცია' },
            { n: 4, title: '4. თემები & საათები', sub: 'კორექტირება და გაერთიანება' },
            { n: 5, title: '5. შეფასებების წესი', sub: 'შეკითხვა გაერთიანებაზე' },
            { n: 6, title: '6. მზა კალენდარი', sub: '12-სვეტიანი დოკუმენტი & ბეჭდვა' },
          ].map((item) => {
            const active = step === item.n;
            const done = step > item.n;
            return (
              <button
                key={item.n}
                onClick={() => {
                  if (item.n >= 4 && sessions.length === 0) {
                    runScheduleEngine(holidayResolutions);
                  }
                  setStep(item.n);
                }}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: active ? '2px solid #2563eb' : done ? '1px solid #86efac' : '1px solid #e2e8f0',
                  background: active ? '#eff6ff' : done ? '#f0fdf4' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: active ? '#1d4ed8' : done ? '#15803d' : '#334155' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  {item.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="no-print" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="no-print" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {successMsg}
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 1: საწყისი მონაცემების გადამოწმება და განაწილების მეთოდის არჩევა
      ======================================================================== */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* კალენდარული გეგმის ფორმის არჩევა (ფორმა 1 vs ფორმა 2) */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={18} color="#2563eb" />
              აირჩიეთ კალენდარული გეგმის ოფიციალური ფორმა:
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b' }}>
              შეგიძლიათ აირჩიოთ სასურველი ფორმატი. არჩევანი შენარჩუნდება ბაზაში შენახვისას და მისი შეცვლა ნებისმიერ დროს შეგიძლიათ:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              <div
                onClick={() => setSelectedTemplate('template1')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedTemplate === 'template1' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: selectedTemplate === 'template1' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: selectedTemplate === 'template1' ? '#1d4ed8' : '#1e293b' }}>
                    📄 ფორმა 1: კლასიკური (12-სვეტიანი)
                  </div>
                  {selectedTemplate === 'template1' && (
                    <span style={{ background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                      აქტიური
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.45 }}>
                  საჯარო სკოლების ოფიციალური სტანდარტი (სსიპ N 22 სკოლა): ლოგოტიპი, 12 სვეტი (თარიღი, კვირა, თემატიკა, კრიტერიუმები, საათები, მეთოდები, განმავითარებელი/განმსაზღვრელი შეფასება, რესურსები, შენიშვნა).
                </p>
              </div>

              <div
                onClick={() => setSelectedTemplate('template2')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedTemplate === 'template2' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: selectedTemplate === 'template2' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: selectedTemplate === 'template2' ? '#1d4ed8' : '#1e293b' }}>
                    📑 ფორმა 2: აკადემია (10-სვეტიანი — დანართი 1)
                  </div>
                  {selectedTemplate === 'template2' && (
                    <span style={{ background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                      აქტიური
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.45 }}>
                  შპს „მსოფლიო განათლების აკადემია“ (N037 ბრძანება): 10 სვეტი, ვერტიკალური საათების სათაურები, იისფერი (#CCC0D9) შედეგების ჯამი, ლურჯი (#8DB3E2) სულ საათების ჯამი, ჯგუფის № და დირექციის შეთანხმება.
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#2563eb" />
              ნაბიჯი 1: სასწავლო გეგმის, მოდულისა და საწყისი თარიღის გადამოწმება
            </h3>

            {moduleLoading && (
              <div style={{ padding: '10px 14px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                იტვირთება არჩეული მოდულის სწავლის შედეგები და თემატიკა ბაზიდან...
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  1) სასწავლო გეგმა (Excel):
                </label>
                <select
                  value={selectedPlanFileId}
                  onChange={(e) => handleSelectPlanFile(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  {planFilesList.length === 0 && (
                    <option value="">-- ბაზაში სასწავლო გეგმა ვერ მოიძებნა --</option>
                  )}
                  {planFilesList.map((pf) => (
                    <option key={pf.id} value={String(pf.id)}>
                      [{pf.organization_short || 'სასწავლო გეგმა'}] {pf.original_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  2) აირჩიეთ მოდული:
                </label>
                <select
                  value={selectedPlanKey}
                  onChange={(e) => handleSelectPlanModule(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  {dbPlans.filter((p) => !selectedPlanFileId || String(p.file_id) === String(selectedPlanFileId)).length === 0 && (
                    <option value="">-- ამ სასწავლო გეგმაში მოდულები არ არის --</option>
                  )}
                  {dbPlans
                    .filter((p) => !selectedPlanFileId || String(p.file_id) === String(selectedPlanFileId))
                    .map((p, idx) => (
                      <option key={p._key} value={p._key}>
                        {idx + 1}. {p.module_name} ({p.registration_number ? `კოდი: ${p.registration_number}, ` : ''}{p.status || 'პროფესიული'}) — საკონტაქტო: {p.hours_contact} სთ
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  3) მასწავლებელი / მოდულის განმახორციელებელი:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="მასწავლებლის სახელი"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  {dbTeachers.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && setTeacherName(e.target.value)}
                      value={teacherName}
                      style={{ width: '200px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="">-- მასწავლებლები ({dbTeachers.length}) --</option>
                      {dbTeachers.map((t) => (
                        <option key={t.id} value={t.name || t.username}>
                          {t.name || t.username} {t.subject ? `(${t.subject})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* მეტამონაცემების დეტალები ბაზიდან */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>პროფესიული პროგრამის სახელწოდება:</label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>მოდულის სახელწოდება:</label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>სარეგისტრაციო ნომერი & სტატუსი:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="კოდი"
                    style={{ width: '50%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={moduleStatus}
                    onChange={(e) => setModuleStatus(e.target.value)}
                    placeholder="სტატუსი"
                    style={{ width: '50%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>დაშვების წინაპირობა & კრედიტი:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={prerequisite}
                    onChange={(e) => setPrerequisite(e.target.value)}
                    style={{ width: '70%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <input
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    style={{ width: '30%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>განხორციელების ადგილი:</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>ჯგუფის № (ფორმა 2-სთვის):</label>
                <input
                  type="text"
                  value={groupNumber}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  placeholder="მაგ. 4/2026"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          {/* სწავლის შედეგების საათების მიმოხილვა */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>
              არჩეული მოდულის სწავლის შედეგები (პირდაპირ ბაზიდან — `curriculum_outcomes`):
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>№</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>სწავლის შედეგი</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>საკონტაქტო სთ (ბაზა)</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>გასაწერი საკონტაქტო სთ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>შეფასების სთ</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>განმსაზღვრელი შეფასება</th>
                  </tr>
                </thead>
                <tbody>
                  {outcomesConfig.map((oc, idx) => (
                    <tr key={oc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 700 }}>{oc.outcome_number}</td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          value={oc.outcome_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, outcome_name: val } : item)));
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="number"
                          value={oc.raw_hours_contact ?? oc.hours_contact ?? ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, raw_hours_contact: val, hours_contact: val } : item)));
                          }}
                          style={{ width: '70px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                        {getEffectiveContactHours(oc)} სთ
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="number"
                          value={oc.hours_evaluation}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, hours_evaluation: val } : item)));
                          }}
                          style={{ width: '65px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          value={oc.summative_assessment}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, summative_assessment: val } : item)));
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>დადასტურება და დღეების საათების გაწერაზე გადასვლა (ნაბიჯი 2)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 2: კვირის სასწავლო დღეები და თითოეული დღის საათების განსაზღვრა
      ======================================================================== */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#2563eb" />
              ნაბიჯი 2: კვირის სასწავლო დღეები და თითოეული დღის საათების განსაზღვრა
            </h3>

            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '14px' }}>
                  სასწავლო კვირისა და მოდულის დაწყების თარიღის გადამოწმება:
                </div>
                <div style={{ fontSize: '12.5px', color: '#1d4ed8', marginTop: '2px' }}>
                  სასწავლო კვირის არჩევისას მოდულის საწყისი თარიღი გამოითვლება <strong>ავტომატურად</strong>.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>
                    1. სასწავლო კვირა №:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={startAcademicWeek}
                      onChange={(e) => handleStartAcademicWeekChange(e.target.value)}
                      style={{ width: '85px', padding: '8px 12px', borderRadius: '8px', border: '2px solid #2563eb', fontWeight: 700, fontSize: '14px' }}
                    />
                    <span style={{ fontSize: '11.5px', background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      📅 {getWeekPeriodString(startAcademicWeek, academicYearStartDate, holidays)}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>
                    2. მოდულის დაწყების თარიღი (ავტომატური):
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid #2563eb', fontWeight: 700, fontSize: '14px', background: '#f0fdf4' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>
                    სასწავლო წლის დაწყება:
                  </label>
                  <input
                    type="date"
                    value={academicYearStartDate}
                    onChange={(e) => handleAcademicYearStartChange(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* კვირის დღეების მონიშვნა */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                მონიშნეთ კვირის სასწავლო დღე(ები):
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {WEEKDAYS.map((d) => {
                  const active = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleWeekday(d.id)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '8px',
                        border: active ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: active ? '#2563eb' : '#f8fafc',
                        color: active ? '#ffffff' : '#334155',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6, 7 და 8 გაკვეთილის/საათის შედარებისა და არჩევის ბარათები */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  აირჩიეთ დღიური დატვირთვის ვარიანტი (6, 7 ან 8 გაკვეთილი/სთ დღეში):
                </div>
                <div style={{ fontSize: '13px', background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                  სულ მოდულში გასაწერი: {totalModuleContactHours} საკონტაქტო სთ
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {/* 6 საათი */}
                {(() => {
                  const opt = hourOptionsSummary.opt6;
                  const isSelected = selectedDays.every((dId) => (weekdayHours[dId] ?? 6) === 6);
                  return (
                    <div
                      onClick={() => handleSetAllWeekdayHours(6)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: isSelected ? '#1e40af' : '#0f172a' }}>6 სთ / დღეში</span>
                          {isSelected && <span style={{ fontSize: '11px', background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>არჩეულია</span>}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '6px' }}>
                          სულ დაჭირდება: <strong>{opt.totalDays} სასწავლო დღე</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#1e40af', background: '#dbeafe', padding: '6px 8px', borderRadius: '6px', fontWeight: 600, marginBottom: '6px' }}>
                          ბოლო დღეს დარჩენილი: <strong>{opt.remainingOnLastDay} სთ</strong>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          {opt.isExact ? 'ყველა დღეზე სრული 6 სთ (ნაშთი: 0 სთ)' : `${opt.fullDays} დღე x 6 სთ + ბოლო დღე ${opt.remainder} სთ`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSetAllWeekdayHours(6); }}
                        style={{
                          marginTop: '12px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSelected ? '#2563eb' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? '✓ არჩეულია 6 სთ' : 'არჩევა: 6 სთ'}
                      </button>
                    </div>
                  );
                })()}

                {/* 7 საათი */}
                {(() => {
                  const opt = hourOptionsSummary.opt7;
                  const isSelected = selectedDays.every((dId) => (weekdayHours[dId] ?? 6) === 7);
                  return (
                    <div
                      onClick={() => handleSetAllWeekdayHours(7)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: isSelected ? '#1e40af' : '#0f172a' }}>7 სთ / დღეში</span>
                          {isSelected && <span style={{ fontSize: '11px', background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>არჩეულია</span>}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '6px' }}>
                          სულ დაჭირდება: <strong>{opt.totalDays} სასწავლო დღე</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#1e40af', background: '#dbeafe', padding: '6px 8px', borderRadius: '6px', fontWeight: 600, marginBottom: '6px' }}>
                          ბოლო დღეს დარჩენილი: <strong>{opt.remainingOnLastDay} სთ</strong>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          {opt.isExact ? 'ყველა დღეზე სრული 7 სთ (ნაშთი: 0 სთ)' : `${opt.fullDays} დღე x 7 სთ + ბოლო დღე ${opt.remainder} სთ`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSetAllWeekdayHours(7); }}
                        style={{
                          marginTop: '12px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSelected ? '#2563eb' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? '✓ არჩეულია 7 სთ' : 'არჩევა: 7 სთ'}
                      </button>
                    </div>
                  );
                })()}

                {/* 8 საათი */}
                {(() => {
                  const opt = hourOptionsSummary.opt8;
                  const isSelected = selectedDays.every((dId) => (weekdayHours[dId] ?? 6) === 8);
                  return (
                    <div
                      onClick={() => handleSetAllWeekdayHours(8)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: isSelected ? '#1e40af' : '#0f172a' }}>8 სთ / დღეში</span>
                          {isSelected && <span style={{ fontSize: '11px', background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>არჩეულია</span>}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '6px' }}>
                          სულ დაჭირდება: <strong>{opt.totalDays} სასწავლო დღე</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#1e40af', background: '#dbeafe', padding: '6px 8px', borderRadius: '6px', fontWeight: 600, marginBottom: '6px' }}>
                          ბოლო დღეს დარჩენილი: <strong>{opt.remainingOnLastDay} სთ</strong>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          {opt.isExact ? 'ყველა დღეზე სრული 8 სთ (ნაშთი: 0 სთ)' : `${opt.fullDays} დღე x 8 სთ + ბოლო დღე ${opt.remainder} სთ`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSetAllWeekdayHours(8); }}
                        style={{
                          marginTop: '12px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSelected ? '#2563eb' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? '✓ არჩეულია 8 სთ' : 'არჩევა: 8 სთ'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* თითოეული დღის საათების განსაზღვრა */}
            <div style={{ marginBottom: '20px', padding: '18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    კვირის არჩეული დღეების ინდივიდუალური საათები:
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    შეგიძლიათ თითოეულ დღეს ცალ-ცალკე განუსაზღვროთ საათები (ნაგულისხმევად 6 სთ, ლიმიტი 6 - 8 სთ).
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
                {WEEKDAYS.filter((d) => selectedDays.includes(d.id)).map((d) => (
                  <div key={d.id} style={{ background: '#fff', border: '2px solid #2563eb', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e3a8a' }}>{d.label}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>დღიური დატვირთვა</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={weekdayHours[d.id] ?? 6}
                        onChange={(e) => handleWeekdayHoursChange(d.id, e.target.value)}
                        style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, fontSize: '15px', color: '#1d4ed8' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>სთ</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px', fontSize: '13px', color: '#334155', fontWeight: 600, textAlign: 'right' }}>
                კვირის ჯამური დატვირთვა: <span style={{ color: '#2563eb', fontWeight: 700 }}>{selectedDays.reduce((sum, dId) => sum + (weekdayHours[dId] ?? 6), 0)} სთ/კვირაში</span>
              </div>
            </div>

            {/* კალენდარული დღეებისა და საათების წინასწარი ბადე (განრიგი) */}
            <div style={{ marginBottom: '22px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    📅 კალენდარული დღეებისა და საათების წინასწარი განრიგი:
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    ზუსტად ჩანს თითოეულ დღეს რამდენი საათი ჩატარდება და რამდენია დარჩენილი საათების რაოდენობა მოდულში:
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>
                  სულ: {previewDaySlots.length} დღე ({totalModuleContactHours} სთ)
                </div>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>№</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>თარიღი</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>კვირის დღე</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, textAlign: 'center' }}>სასწავლო კვირა</th>
                      <th style={{ padding: '10px 14px', color: '#1e40af', fontWeight: 700, textAlign: 'center' }}>ჩატარდება ამ დღეს</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, textAlign: 'right' }}>დარჩენილი სთ მოდულში</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewDaySlots.map((slot) => {
                      const isLast = slot.remainingAfter === 0;
                      return (
                        <tr
                          key={`${slot.date}_${slot.index}`}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: isLast ? '#f0fdf4' : slot.isComp ? '#fffbeb' : '#ffffff',
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#64748b' }}>{slot.index}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                            {formatDateGeo(slot.date)}
                            {slot.isComp && (
                              <span style={{ marginLeft: '6px', fontSize: '10.5px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>
                                კომპენსაცია
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#334155' }}>{slot.weekdayLabel}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#2563eb' }}>
                            კვირა {slot.academicWeek}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={slot.hours}
                                onChange={(e) => handleCustomDateHourChange(slot.date, e.target.value)}
                                style={{
                                  width: '56px',
                                  padding: '5px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid #93c5fd',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  color: '#1e40af',
                                  background: '#fff',
                                }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>სთ</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                            {isLast ? (
                              <span style={{ color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                                ✓ 0 სთ (მოდული დასრულდა)
                              </span>
                            ) : (
                              <span style={{ color: '#d97706' }}>{slot.remainingAfter} სთ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '12px 18px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                  ✓ მოდულის ყველა საათი ({totalModuleContactHours} სთ) ზუსტად გაწერილია {previewDaySlots.length} დღეზე. ნაშთი: 0 სთ.
                </span>
                <span style={{ fontSize: '12px', color: '#166534' }}>
                  შემდეგ ეტაპზე თემები და შეფასება ავტომატურად განაწილდება ზუსტად ამ დღეებსა და საათებზე.
                </span>
              </div>
            </div>

            {/* დამატებითი წესები */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={deductEvalFromContact}
                  onChange={(e) => setDeductEvalFromContact(e.target.checked)}
                />
                <span>
                  <strong>შეფასების საათები შედის საკონტაქტოში</strong> (საკონტაქტოს გამოაკლდეს შეფასების საათი)
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hideIndependentInRows}
                  onChange={(e) => setHideIndependentInRows(e.target.checked)}
                />
                <span>
                  <strong>დამოუკიდებელი საათები არ გამოჩნდეს კალენდარულში</strong> (მხოლოდ საკონტაქტო და შეფასება)
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} /> უკან (ნაბიჯი 1)
              </button>

              <button
                type="button"
                onClick={() => {
                  runScheduleEngine(holidayResolutions);
                  setStep(3);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>დადასტურება და თემებისა და შეფასების გადანაწილებაზე გადასვლა</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 3: თარიღების გენერირება და დასვენების დღეების ინტერაქტიული მართვა
      ======================================================================== */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#d97706" />
                  ნაბიჯი 3: დასვენების დღეების შემოწმება და გაცდენილი საათების გაწერა
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  თუ სასწავლო დღეს უწევს დასვენება, აირჩიეთ: გავწეროთ შაბათზე (კომპენსაცია) თუ გავაგრძელოთ შემდეგ კვირაზე წინა კვირის შაბლონით.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleApplyAllHolidaysResolution('saturday')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b',
                    background: '#fffbeb',
                    color: '#b45309',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ყველა დასვენების შაბათზე გაწერა
                </button>
                <button
                  onClick={() => handleApplyAllHolidaysResolution('next_week')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #2563eb',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ყველას შემდეგ კვირაზე გადატანა
                </button>
              </div>
            </div>

            {holidayCollisions.length === 0 ? (
              <div style={{ padding: '18px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: '14px' }}>
                არჩეულ სასწავლო დღეებზე ოფიციალური დასვენების დღე არ დაემთხვა. ყველა თარიღი პირდაპირ გენერირდა!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {holidayCollisions.map((col, idx) => {
                  const res = holidayResolutions[col.date] || 'next_week';
                  const satIso = getSaturdayOfSameWeek(col.date);
                  return (
                    <div
                      key={`${col.date}_${idx}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e' }}>
                          დასვენება: {formatDateGeo(col.date)} — {col.holidayName}
                          {col.isVacationWeek && (
                            <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 700 }}>
                              სრული არდადეგების კვირა (არ ითვლება სასწავლო კვირად)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '3px' }}>
                          სწავლის შედეგი {col.outcomeNumber}: გაცდენილი საათი ამ დღეს: <strong>{Math.round(col.missedHours)} სთ</strong> | შედეგზე დარჩენილი გასაწერი საათები: <strong>{Math.round(col.remainingOutcomeHours)} სთ</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleHolidayResolutionChange(col.date, 'saturday')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: res === 'saturday' ? '2px solid #d97706' : '1px solid #cbd5e1',
                            background: res === 'saturday' ? '#d97706' : '#ffffff',
                            color: res === 'saturday' ? '#ffffff' : '#334155',
                            fontWeight: 600,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                          }}
                        >
                          შაბათზე გაწერა ({formatDateGeo(satIso)})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHolidayResolutionChange(col.date, 'next_week')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: res === 'next_week' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: res === 'next_week' ? '#2563eb' : '#ffffff',
                            color: res === 'next_week' ? '#ffffff' : '#334155',
                            fontWeight: 600,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                          }}
                        >
                          შემდეგ კვირაზე გაგრძელება (შაბლონით)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleAddCustomHoliday} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>დამატებითი დასვენების დღის ჩამატება:</span>
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <input
                type="text"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="მიზეზი / დღესასწაული"
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <button
                type="submit"
                onClick={() => setTimeout(() => runScheduleEngine(holidayResolutions), 50)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + დასვენების დამატება და გადათვლა
              </button>
            </form>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} /> უკან (ნაბიჯი 2)
              </button>

              <button
                onClick={() => {
                  runScheduleEngine(holidayResolutions);
                  setStep(4);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>თემებისა და საათების გაწერაზე გადასვლა (ნაბიჯი 4)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 4: თემებისა და საათების ინტერაქტიული რედაქტორი
      ======================================================================== */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="#2563eb" />
              ნაბიჯი 4: თემებისა და საათების ინტერაქტიული კორექტირება
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#64748b' }}>
              თემები წამოღებულია მოდულის Word ფაილიდან. შეგიძლიათ შეცვალოთ თემის ტექსტი, გააერთიანოთ თემები, დაამატოთ ახალი შეხვედრა ან ხელით გადაწეროთ საათების რაოდენობა.
            </p>

            {outcomesConfig.map((oc, ocIdx) => {
              const ocSessions = sessions
                .map((s, globalIdx) => ({ ...s, globalIdx }))
                .filter((s) => s.outcomeIndex === ocIdx);
              const assignedSum = ocSessions.reduce((acc, s) => acc + Number(s.hoursContact || 0), 0);
              const targetSum = getEffectiveContactHours(oc);
              const isBalanced = Math.abs(assignedSum - targetSum) < 0.01;

              return (
                <div
                  key={oc.id}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    marginBottom: '18px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        სწავლის შედეგი {oc.outcome_number}. {oc.outcome_name}
                      </span>
                      <span
                        style={{
                          marginLeft: '12px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: isBalanced ? '#dcfce7' : '#fef3c7',
                          color: isBalanced ? '#15803d' : '#b45309',
                        }}
                      >
                        განაწილებულია: {assignedSum} სთ / გეგმით: {targetSum} სთ (შეფასება: {oc.hours_evaluation} სთ)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleAutoDistributeOutcomeHours(ocIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={13} /> საათების ავტო-გადანაწილება
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSessionToOutcome(ocIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#2563eb',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={13} /> თემის დამატება
                      </button>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                        <th style={{ padding: '8px 10px', width: '140px', textAlign: 'left' }}>თარიღი</th>
                        <th style={{ padding: '8px 10px', width: '90px', textAlign: 'center' }}>კვირა №</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>მოდულის თემატიკა (რედაქტირებადი)</th>
                        <th style={{ padding: '8px 10px', width: '110px', textAlign: 'center' }}>საკონტაქტო სთ</th>
                        <th style={{ padding: '8px 10px', width: '180px', textAlign: 'center' }}>მოქმედება</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocSessions.map((sess, sIdx) => {
                        const isFocused = activeSessionId === sess.id;
                        return (
                          <tr
                            key={sess.id}
                            onClick={() => setActiveSessionId(sess.id)}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isFocused ? '#eff6ff' : sess.isSaturdayCompensation ? '#fffbeb' : '#fff',
                              transition: 'background 0.15s',
                            }}
                          >
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="date"
                                value={sess.date}
                                onFocus={() => setActiveSessionId(sess.id)}
                                onChange={(e) => handleSessionChange(sess.id, 'date', e.target.value)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: isFocused ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                  fontSize: '12.5px',
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="number"
                                value={sess.academicWeek}
                                onFocus={() => setActiveSessionId(sess.id)}
                                onChange={(e) => handleSessionChange(sess.id, 'academicWeek', e.target.value)}
                                style={{
                                  width: '60px',
                                  padding: '5px',
                                  textAlign: 'center',
                                  borderRadius: '6px',
                                  border: isFocused ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="text"
                                value={sess.topic}
                                placeholder="ჩაწერეთ თემა..."
                                onFocus={() => setActiveSessionId(sess.id)}
                                onChange={(e) => handleSessionChange(sess.id, 'topic', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: isFocused ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                  fontSize: '13px',
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={sess.hoursContact}
                                onFocus={() => setActiveSessionId(sess.id)}
                                onChange={(e) => handleSessionChange(sess.id, 'hoursContact', e.target.value)}
                                style={{
                                  width: '70px',
                                  padding: '6px',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: isFocused ? '2px solid #2563eb' : '1px solid #2563eb',
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  title="ამ სტრიქონის ქვემოთ ახალი თემის ჩამატება"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInsertSessionAfter(sess.globalIdx);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #bfdbfe',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Plus size={12} /> ქვემოთ
                                </button>
                                {sIdx < ocSessions.length - 1 && (
                                  <button
                                    type="button"
                                    title="მომდევნო თემასთან გაერთიანება"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMergeWithNextSession(sess.globalIdx);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      background: '#f8fafc',
                                      fontSize: '11.5px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Merge size={12} /> გაერთიანება
                                  </button>
                                )}
                                <button
                                  type="button"
                                  title="სტრიქონის წაშლა"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(sess.id);
                                  }}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #fecaca',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} /> უკან (ნაბიჯი 3)
              </button>

              <button
                onClick={() => setStep(5)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>შეფასებების კონფიგურაციაზე გადასვლა (ნაბიჯი 5)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 5: შეფასებების გაერთიანების შეკითხვა და კრიტერიუმების რედაქტირება
      ======================================================================== */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={20} color="#2563eb" />
              ნაბიჯი 5: შეკითხვა შეფასების საათების დანიშვნასა და გაერთიანებაზე
            </h3>

            <div style={{
              background: '#eff6ff',
              border: '2px solid #93c5fd',
              borderRadius: '12px',
              padding: '18px',
              marginBottom: '20px',
            }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e3a8a', marginBottom: '8px' }}>
                შეკითხვა: როგორ გსურთ სწავლის შედეგების განმსაზღვრელი შეფასებების ჩაწერა კალენდარულ გეგმაში?
              </div>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
                წესის მიხედვით: შეიძლება გაერთიანდეს რამდენიმე შეფასება, თუ მისი ტიპი ემთხვევა და ერთმანეთის მიყოლებით არის (მაგ. გამოკითხვა ან პრაქტიკული დავალება 1 და 2 შედეგზე). თუ არ გაერთიანდება, შეფასება და შეჯამება დაიწერება თითოეული სწავლის შედეგის ამოწურვის შემდეგ სტრიქონში.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div
                  onClick={() => setEvaluationMode('merge_all_end')}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: evaluationMode === 'merge_all_end' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: evaluationMode === 'merge_all_end' ? '#ffffff' : '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                    1. ყველა შედეგის შეფასების გაერთიანება ბოლოში
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    თითოეული სწავლის შედეგის შემდეგ იწერება „ჯამი“, ხოლო ბოლოში ერთიანდება სწავლის შედეგების შეფასება.
                  </div>
                </div>

                <div
                  onClick={() => setEvaluationMode('merge_matching_pairs')}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: evaluationMode === 'merge_matching_pairs' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: evaluationMode === 'merge_matching_pairs' ? '#ffffff' : '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                    2. მსგავსი მიმდევრობითი შედეგების გაერთიანება (წყვილებად)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    თავად მონიშნეთ რომელი მიმდევრობითი სწავლის შედეგების შეფასება გაერთიანდეს (მაგ. 1 და 2 ერთად, 3 და 4 ცალ-ცალკე).
                  </div>
                </div>

                <div
                  onClick={() => setEvaluationMode('separate_per_outcome')}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: evaluationMode === 'separate_per_outcome' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: evaluationMode === 'separate_per_outcome' ? '#ffffff' : '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                    3. არ გაერთიანდეს (ცალ-ცალკე ყოველი შედეგის შემდეგ)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    თითოეული სწავლის შედეგის ამოწურვისთანავე მომდევნო სტრიქონში ჩაიწერება მისი შეფასება და ჯამი.
                  </div>
                </div>
              </div>

              {evaluationMode === 'merge_matching_pairs' && outcomesConfig.length > 1 && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
                    მონიშნეთ რომელი მეზობელი სწავლის შედეგები გაერთიანდეს:
                  </div>
                  {outcomesConfig.slice(0, -1).map((oc, idx) => {
                    const nextOc = outcomesConfig[idx + 1];
                    const key = `${idx}-${idx + 1}`;
                    const sameType = (oc.summative_assessment || '').trim().toLowerCase() === (nextOc.summative_assessment || '').trim().toLowerCase();
                    return (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#0f172a', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(pairMerges[key])}
                          onChange={(e) => setPairMerges((prev) => ({ ...prev, [key]: e.target.checked }))}
                        />
                        <span>
                          <strong>შედეგი {oc.outcome_number}</strong> ({oc.summative_assessment}) + <strong>შედეგი {nextOc.outcome_number}</strong> ({nextOc.summative_assessment})
                          {sameType && (
                            <span style={{ marginLeft: '8px', color: '#15803d', fontWeight: 700 }}>
                              [შეფასების ტიპი ემთხვევა ✓]
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>
              სწავლის შედეგების კრიტერიუმები, სწავლების მეთოდები და გარემო (ბაზიდან):
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {outcomesConfig.map((oc, idx) => (
                <div key={oc.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: '#f8fafc' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a', marginBottom: '10px' }}>
                    სწავლის შედეგი {oc.outcome_number}. {oc.outcome_name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>
                        შესრულების კრიტერიუმები (სვეტი 4):
                      </label>
                      <textarea
                        rows={4}
                        value={oc.criteria}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, criteria: val } : item)));
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>
                        სწავლების მეთოდი (სვეტი 8):
                      </label>
                      <textarea
                        rows={4}
                        value={oc.teaching_methods}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, teaching_methods: val } : item)));
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>
                        საჭირო გარემო და რესურსი (სვეტი 11):
                      </label>
                      <textarea
                        rows={4}
                        value={oc.environment_resources}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, environment_resources: val } : item)));
                        }}
                        placeholder="მაგ: კომპიუტერული ლაბორატორია, პროექტორი..."
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(4)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} /> უკან (ნაბიჯი 4)
              </button>

              <button
                onClick={() => setStep(6)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={18} />
                <span>ოფიციალური 12-სვეტიანი კალენდარული გეგმის ნახვა (ნაბიჯი 6)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 6: ოფიციალური 12-სვეტიანი კალენდარული გეგმა (CalendarDocument.jsx)
      ======================================================================== */}
      {step === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="no-print" style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStep(5)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={15} /> რედაქტირებაზე დაბრუნება (ნაბიჯი 5)
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                <span>მასშტაბი:</span>
                <input
                  type="range"
                  min="65"
                  max="115"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                />
                <strong>{zoomLevel}%</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* ფორმის გადამრთველი (ფორმა 1 vs ფორმა 2) */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('template1')}
                  style={{
                    padding: '7px 13px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedTemplate === 'template1' ? '#2563eb' : 'transparent',
                    color: selectedTemplate === 'template1' ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📄 ფორმა 1 (12 სვეტი)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('template2')}
                  style={{
                    padding: '7px 13px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedTemplate === 'template2' ? '#2563eb' : 'transparent',
                    color: selectedTemplate === 'template2' ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📑 ფორმა 2 (10 სვეტი - აკადემია)
                </button>
              </div>

              <button
                onClick={handleSaveCalendarToDb}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                <Save size={16} />
                <span>{saving ? 'ინახება...' : 'ბაზაში შენახვა'}</span>
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                <Printer size={16} />
                <span>ბეჭდვა / PDF-ად შენახვა</span>
              </button>
            </div>
          </div>

          <div
            id="printable-official-calendar"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #cbd5e1',
              overflowX: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ zoom: `${zoomLevel}%` }}>
              {selectedTemplate === 'template1' ? (
                <table
                  style={{
                    width: `${totalTableWidth}px`,
                    minWidth: '100%',
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed',
                    background: '#ffffff',
                  }}
                >
                  <colgroup>
                    {officialTableData.widths.map((w, idx) => (
                      <col key={idx} style={{ width: `${(w / totalTableWidth) * 100}%` }} />
                    ))}
                  </colgroup>
                  <tbody>
                    {officialTableData.rows.map((row) => (
                      <tr key={row.number} style={row.height ? { height: row.height } : undefined}>
                        {row.cells.map((cell) => (
                          <td
                            key={cell.column}
                            rowSpan={cell.rowSpan}
                            colSpan={cell.colSpan}
                            style={cell.style}
                          >
                            {cell.isLogoCell ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}>
                                {organizationCode === '22_skola' && SCHOOL22_LOGO_BASE64 ? (
                                  <img
                                    src={SCHOOL22_LOGO_BASE64}
                                    alt="22 სკოლა"
                                    style={{ maxWidth: '110px', maxHeight: '110px', objectFit: 'contain' }}
                                  />
                                ) : (
                                  <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#18181b', textAlign: 'center' }}>
                                    {organizationName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              cell.text
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ width: '966px', margin: '0 auto', fontFamily: "'Sylfaen', serif", color: '#000000', fontSize: '11pt', background: '#ffffff', padding: '10px' }}>
                  {/* დანართი 1 დამტკიცების ბლოკი */}
                  <div style={{ textAlign: 'right', fontSize: '9pt', lineHeight: 1.35, marginBottom: '14pt' }}>
                    <div>დანართი 1</div>
                    <div>დამტკიცებულია შპს ,,მსოფლიო განათლების აკადემია“ </div>
                    <div>დირექტორის  2023 წლის 13 დეკემბრის N037 ბრძანებით</div>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', marginBottom: '12pt' }}>
                    კალენდარული გეგმა
                  </div>

                  {/* მეტამონაცემების სია */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt', fontSize: '10.5pt', fontWeight: 'bold', marginBottom: '16pt', lineHeight: 1.35 }}>
                    <div>პროფესიული საგანმანათლებლო დაწესებულების სახელწოდება: შპს  ,,მსოფლიო განათლების აკადემია“</div>
                    <div>საგანმანათლებლო პროგრამის სახელწოდება:  {programName}</div>
                    <div>მოდულის სახელწოდება და სარეგისტრაციო ნომერი: {moduleTitle} {registrationNumber ? `(${registrationNumber})` : ''}</div>
                    <div>მოდულის განხორციელების პერიოდი:   დაწყება:  {formatDateGeo(academyTableData.firstDateIso)}წ.          დასრულება: {formatDateGeo(academyTableData.lastSessionDateIso)}წ.</div>
                    <div>მოდულის კრედიტებისა და საათების რაოდენობა:  {credits || '—'}კრ.-{academyTableData.totalHours}სთ.</div>
                    <div>საათების განაწილება მოდულის მიხედვით: საკონტაქტო საათები-{grandTotalContact}სთ.  დამოუკიდებელი მუშაობის საათები-{grandTotalIndependent}სთ.</div>
                    <div>პროფესიული მასწავლებელი:  {teacherName}</div>
                    <div>ჯგუფის №: {groupNumber || '4/2026'}</div>
                  </div>

                  {/* 10-სვეტიანი ცხრილი */}
                  <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', border: '0.5pt solid #000000' }}>
                    <colgroup>
                      <col style={{ width: '5.5%' }} />
                      <col style={{ width: '8.5%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '4.5%' }} />
                      <col style={{ width: '4.5%' }} />
                      <col style={{ width: '4.5%' }} />
                      <col style={{ width: '13.5%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '9%' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ height: '37.3pt' }}>
                        <th rowSpan={2} style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          კვირის №
                        </th>
                        <th rowSpan={2} style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          თარიღი
                        </th>
                        <th rowSpan={2} style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          თემატიკა
                        </th>
                        <th colSpan={3} style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          სასწავლო დატვირთვის ტიპი
                        </th>
                        <th colSpan={2} style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          მეთოდი
                        </th>
                        <th style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          საჭირო რესურსები
                        </th>
                        <th rowSpan={2} style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          შენიშვნა
                        </th>
                      </tr>
                      <tr style={{ height: '100.75pt' }}>
                        <th style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', padding: '2pt 0' }}>
                          <div style={{ display: 'inline-block', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '96pt', fontWeight: 'bold', fontSize: '10pt', whiteSpace: 'nowrap' }}>
                            საკონტაქტო  საათები
                          </div>
                        </th>
                        <th style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', padding: '2pt 0' }}>
                          <div style={{ display: 'inline-block', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '96pt', fontWeight: 'bold', fontSize: '10pt', whiteSpace: 'nowrap' }}>
                            დამოუკიდებელი
                          </div>
                        </th>
                        <th style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', padding: '2pt 0' }}>
                          <div style={{ display: 'inline-block', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '96pt', fontWeight: 'bold', fontSize: '10pt', whiteSpace: 'nowrap' }}>
                            შეფასება
                          </div>
                        </th>
                        <th style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          სწავლების მეთოდი
                        </th>
                        <th style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', padding: '2pt 4pt' }}>
                          განმსაზღვრელი შეფასების მეთოდი
                        </th>
                        <th style={{ border: '0.5pt solid #000', verticalAlign: 'middle', textAlign: 'center', padding: '2pt 4pt' }}>
                          &nbsp;
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {academyTableData.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.cells.map((cell, cIdx) => (
                            <td key={cIdx} style={cell.style}>
                              {cell.text}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* სულ საათების რაოდენობა (#8DB3E2) */}
                      <tr style={{ height: '22pt' }}>
                        <td colSpan={3} style={{ border: '0.5pt solid #000', background: '#8DB3E2', fontWeight: 'bold', padding: '4pt 6pt', fontSize: '10.5pt' }}>
                          სულ საათების რაოდენობა
                        </td>
                        <td style={{ border: '0.5pt solid #000', background: '#8DB3E2', fontWeight: 'bold', textAlign: 'center', padding: '4pt 2pt', fontSize: '10.5pt' }}>
                          {grandTotalContact}
                        </td>
                        <td style={{ border: '0.5pt solid #000', background: '#8DB3E2', fontWeight: 'bold', textAlign: 'center', padding: '4pt 2pt', fontSize: '10.5pt' }}>
                          {grandTotalIndependent}
                        </td>
                        <td style={{ border: '0.5pt solid #000', background: '#8DB3E2', fontWeight: 'bold', textAlign: 'center', padding: '4pt 2pt', fontSize: '10.5pt' }}>
                          {grandTotalEvaluation}
                        </td>
                        <td colSpan={4} style={{ border: '0.5pt solid #000', background: '#8DB3E2', fontWeight: 'bold', textAlign: 'center', padding: '4pt 6pt', fontSize: '10.5pt' }}>
                          {academyTableData.totalHours}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ხელმოწერა და შეთანხმება */}
                  <div style={{ marginTop: '22pt', fontSize: '10.5pt', fontWeight: 'bold', lineHeight: 1.8 }}>
                    <div>შეთანხმებულია:     </div>
                    <div>სასწავლო  პროცესის   მართვის სამსახურის უფროსი:                                   /დ.გაგუა/</div>
                    <div>თარიღი: ----------------------------</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
