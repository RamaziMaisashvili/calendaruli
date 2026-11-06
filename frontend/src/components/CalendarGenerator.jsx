import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  Calendar,
  CheckCircle2,
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
  UserCheck,
  MapPin,
  Layers,
  HelpCircle,
  Edit3
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
  // ზამთრის არდადეგები (30 დეკემბერი - 19 იანვარი)
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
];

// საჩვენებელი (დემო) მოდული CalendarDocument.jsx-ის მიხედვით, თუ ბაზაში ჯერ არ არის ატვირთული
const FALLBACK_SAMPLE_MODULE = {
  id: 'sample_os',
  module_name: 'კომპიუტერის პროგრამული უზრუნველყოფა',
  registration_number: '06.2.1.3',
  module_type: 1,
  credits: 6,
  hours_contact: 121,
  hours_independent: 29,
  hours_evaluation: 8,
  hours_total: 150,
  outcomes: [
    {
      id: 'oc_1',
      outcome_number: '1',
      outcome_name: 'ოპერაციული სისტემის ინსტალაცია',
      hours_contact: 40,
      hours_independent: 8,
      hours_evaluation: 2,
      hours_total: 50,
      topics: [
        'ოპერაციული სისტემის არსი',
        'ოპერაციული სისტემების ნაირსახეობები',
        'ოპერაციული სისტემის შიგთავსის მქონე ჩამტვირთველის დამზადება',
        'მყარი დისკის ლოგიკურ ტომებად დაყოფა და დაფორმატება',
        'ოპერაციული სისტემის ინსტალაციის პროცესი (ნაწილი 1)',
        'ოპერაციული სისტემის ინსტალაციის პროცესი (ნაწილი 2)',
        'ოპერაციული სისტემის პირველადი პარამეტრების მომართვა',
        'სისტემის ჩატვირთვის პარამეტრების კონფიგურაცია'
      ].join('\n'),
      criteria: [
        '1.\tაპარატურული მონაცემების შესაბამისად შეარჩევს ოპერაციული სისტემის ვერსიას;',
        '2.\tდავალების შესაბამისად არჩევს დროებითი ჩატვირთვის მოწყობილობას;',
        '3.\tდავალების შესაბამისად ახდენს მყარი დისკის ფორმატისა და მისი დანაყოფების მოცულობის განსაზღვრას სისტემის შემდგომი ინსტალაციისთვის;',
        '4.\tარჩევს ინსტალაციის პროცესში მოთხოვნილ პარამეტრებს;',
        'განსაზღვრული თანმიმდევრობით ასრულებს ოპერაციული სისტემის ინსტალაციას.'
      ].join('\n'),
      assessment_direction: 'პრაქტიკული დავალება დაკვირვებით',
      assessment_methods: 'პრაქტიკული დავალება',
    },
    {
      id: 'oc_2',
      outcome_number: '2',
      outcome_name: 'ოპერაციული სისტემის კონფიგურაცია და მოწყობილობების დრაივერების მართვა',
      hours_contact: 40,
      hours_independent: 8,
      hours_evaluation: 2,
      hours_total: 50,
      topics: [
        'მოწყობილობების დრაივერების არსი და დანიშნულება',
        'დრაივერების მოძიება, ინსტალაცია და განახლება',
        'სისტემური პარამეტრებისა და სამუშაო გარემოს კონფიგურაცია',
        'მომხმარებლების ანგარიშებისა და უფლებების მართვა',
        'ლოკალური რესურსებისა და საქაღალდეების გაზიარება',
        'პერიფერიული მოწყობილობების მიერთება და გამართვა',
        'ქსელური პარამეტრების საბაზისო კონფიგურაცია',
        'სისტემური სერვისებისა და პროცესების მონიტორინგი'
      ].join('\n'),
      criteria: [
        '1.\tახდენს აპარატურული მოწყობილობების იდენტიფიცირებას და შესაბამისი დრაივერების ინსტალაციას;',
        '2.\tდავალების შესაბამისად მართავს მომხმარებლის ანგარიშებს და წვდომის უფლებებს;',
        '3.\tაკონფიგურირებს ოპერაციული სისტემის ძირითად პარამეტრებს.'
      ].join('\n'),
      assessment_direction: 'პრაქტიკული დავალება დაკვირვებით',
      assessment_methods: 'პრაქტიკული დავალება',
    },
    {
      id: 'oc_3',
      outcome_number: '3',
      outcome_name: 'გამოყენებითი პროგრამული უზრუნველყოფის ინსტალაცია და მართვა',
      hours_contact: 15,
      hours_independent: 8,
      hours_evaluation: 2,
      hours_total: 25,
      topics: [
        'გამოყენებითი პროგრამების კლასიფიკაცია და ლიცენზირება',
        'საოფისე და დამხმარე პროგრამების ინსტალაცია',
        'გამოყენებითი პროგრამული უზრუნველყოფის გამართვა'
      ].join('\n'),
      criteria: [
        '1.\tმოთხოვნის შესაბამისად არჩევს და აინსტალირებს გამოყენებით პროგრამულ უზრუნველყოფას;',
        '2.\tახდენს ინსტალირებული პროგრამების განახლებას და დეინსტალაციას.'
      ].join('\n'),
      assessment_direction: 'პრაქტიკული დავალება დაკვირვებით',
      assessment_methods: 'პრაქტიკული დავალება',
    },
    {
      id: 'oc_4',
      outcome_number: '4',
      outcome_name: 'ოპერაციული სისტემის უსაფრთხოების უზრუნველყოფა',
      hours_contact: 18,
      hours_independent: 5,
      hours_evaluation: 2,
      hours_total: 25,
      topics: [
        'ოპერაციული სისტემის უსაფრთხოების უზრუნველყოფის ძირითადი მექანიზმები',
        'ოპერაციული სისტემის უსაფრთხოების დამატებითი მექანიზმები',
        'ანტივირუსული სისტემების მიმოხილვა/ინსტალაცია/კონფიგურაცია',
        'სისტემის დაცვის პოლიტიკა და რეზერვული კოპირების შექმნა'
      ].join('\n'),
      criteria: [
        '1.\tაკონფიგურირებს სისტემას შესაბამისი უსაფრთხოების ნორმების შესაბამისად;',
        '2.\tსწორად განასხვავებს სხვადასხვა ანტივირუსულ პროგრამულ უზრუნველყოფას და ახდენს მათ ინსტალაცია/კონფიგურაცია/განახლებას;',
        '3.\tმოთხოვნილი უსაფრთხოების პოლიტიკის მიხედვით, სხვადასხვა დამხმარე პროგრამების გამოყენებით ახდენს სისტემის დაცვას;',
        '4.\tდავალების შესაბამისად ახდენს სისტემის რეზერვირებას და შემდგომში მის აღდგენას.'
      ].join('\n'),
      assessment_direction: 'პრაქტიკული დავალება დაკვირვებით',
      assessment_methods: 'პრაქტიკული დავალება',
    },
  ]
};

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

function splitTopicsText(rawText) {
  if (!rawText) return [];
  return rawText
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^\s*[\d•\-*.)]+\s*/, '').trim())
    .filter(Boolean);
}

export default function CalendarGenerator() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ბაზიდან წამოღებული მონაცემები
  const [dbModules, setDbModules] = useState([]);
  const [dbPlans, setDbPlans] = useState([]);
  const [dbResources, setDbResources] = useState([]);
  const [dbTeachers, setDbTeachers] = useState([]);
  const [savedCalendars, setSavedCalendars] = useState([]);

  // ინტერაქტიული 5 ნაბიჯი (1..5)
  const [step, setStep] = useState(1);

  // ნაბიჯი 1: ძირითადი პარამეტრები და ბაზიდან ამოღებული მონაცემები
  const [selectedModuleId, setSelectedModuleId] = useState('sample_os');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [programName, setProgramName] = useState('კომპიუტერული ქსელი და სისტემები');
  const [moduleTitle, setModuleTitle] = useState(FALLBACK_SAMPLE_MODULE.module_name);
  const [registrationNumber, setRegistrationNumber] = useState(FALLBACK_SAMPLE_MODULE.registration_number);
  const [moduleStatus, setModuleStatus] = useState('პროფესიული');
  const [prerequisite, setPrerequisite] = useState('საბაზო განათლება');
  const [credits, setCredits] = useState(6);
  const [teacherName, setTeacherName] = useState('გიორგი სანიკიძე');
  const [location, setLocation] = useState('ქ. ქუთაისი, განათლების ქუჩა 64');

  // თარიღისა და საათების განაწილების პარამეტრები (Schedule Engine)
  const [startDate, setStartDate] = useState('2025-12-18');
  const [startAcademicWeek, setStartAcademicWeek] = useState(14);
  const [distributionMethod, setDistributionMethod] = useState(1); // 1, 2, ან 3
  const [selectedDays, setSelectedDays] = useState([4]); // default: ხუთშაბათი (4) როგორც ნიმუშში
  const [dailyHourLimit, setDailyHourLimit] = useState(5);
  const [deductEvalFromContact, setDeductEvalFromContact] = useState(false);
  const [hideIndependentInRows, setHideIndependentInRows] = useState(true);

  // სწავლის შედეგების სამუშაო ასლი (რათა მომხმარებელმა შეძლოს კორექტირება)
  const [outcomesConfig, setOutcomesConfig] = useState([]);

  // ნაბიჯი 2: დასვენების დღეები და კომპენსაციის გადაწყვეტილებები
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  // holidayResolutions: { [holidayIsoDate]: 'next_week' | 'saturday' }
  const [holidayResolutions, setHolidayResolutions] = useState({});
  const [holidayCollisions, setHolidayCollisions] = useState([]);

  // ნაბიჯი 3: დაგენერირებული სესიები/თემები (ინტერაქტიული რედაქტირებისთვის)
  const [sessions, setSessions] = useState([]);

  // ნაბიჯი 4: შეფასებების გაერთიანების კონფიგურაცია
  // evaluationMode: 'merge_all_end' | 'merge_matching_pairs' | 'separate_per_outcome'
  const [evaluationMode, setEvaluationMode] = useState('merge_all_end');
  // კონკრეტული მეზობელი წყვილების გაერთიანება: { "0-1": true, "1-2": true, ... }
  const [pairMerges, setPairMerges] = useState({});

  // ნაბიჯი 5: შენახვა / მასშტაბი
  const [currentSavedId, setCurrentSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(95);

  useEffect(() => {
    loadInitData();
  }, []);

  const loadInitData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCalendarInitData();
      const mods = data.modules || [];
      const plans = data.plans || [];
      const resList = data.resources || [];
      const tList = data.teachers || [];
      const savedList = data.saved_calendars || [];

      setDbModules(mods);
      setDbPlans(plans);
      setDbResources(resList);
      setDbTeachers(tList);
      setSavedCalendars(savedList);

      if (mods.length > 0) {
        applyModuleSelection(String(mods[0].id), mods, plans, resList);
      } else {
        applyModuleSelection('sample_os', [], plans, resList);
      }
    } catch (err) {
      setError(err.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
      applyModuleSelection('sample_os', [], [], []);
    } finally {
      setLoading(false);
    }
  };

  const applyModuleSelection = (modIdStr, modsList = dbModules, plansList = dbPlans, resList = dbResources) => {
    setSelectedModuleId(modIdStr);
    let mod = null;
    if (modIdStr === 'sample_os') {
      mod = FALLBACK_SAMPLE_MODULE;
    } else {
      mod = modsList.find((m) => String(m.id) === String(modIdStr));
    }
    if (!mod) return;

    setModuleTitle(mod.module_name || '');
    setRegistrationNumber(mod.registration_number || '');
    setCredits(mod.credits || 6);

    const modTypeMap = { 1: 'პროფესიული', 2: 'ზოგადი', 3: 'ინტეგრირებული' };
    setModuleStatus(modTypeMap[mod.module_type] || 'პროფესიული');

    // მოვძებნოთ შესაბამისი სასწავლო გეგმა (ექსელიდან) სარეგისტრაციო ნომრით ან სახელით
    const matchedPlan = plansList.find(
      (p) =>
        (mod.registration_number && p.registration_number && p.registration_number.trim() === mod.registration_number.trim()) ||
        (mod.module_name && p.module_name && p.module_name.trim().toLowerCase() === mod.module_name.trim().toLowerCase())
    );

    if (matchedPlan) {
      setSelectedPlanId(String(matchedPlan.id));
      if (matchedPlan.status) setModuleStatus(matchedPlan.status);
      if (matchedPlan.credits) setCredits(matchedPlan.credits);

      // თუ სასწავლო გეგმაში შეფასების საათები ცალკე არ წერია (0-ია), მაშინ შეფასება აკლდება საკონტაქტოს
      const planHasSeparateEval = Number(matchedPlan.hours_evaluation || 0) > 0;
      const modHasEval = Number(mod.hours_evaluation || 0) > 0;
      if (!planHasSeparateEval && modHasEval && Number(matchedPlan.hours_contact || 0) > Number(mod.hours_contact || 0)) {
        setDeductEvalFromContact(true);
      } else {
        setDeductEvalFromContact(false);
      }

      const ws = matchedPlan.weekly_schedule_parsed || [];
      if (ws.length > 0) {
        const firstWeek = ws[0].week;
        if (firstWeek) setStartAcademicWeek(Number(firstWeek));
        const avgWeeklyHours = ws[0].hours ? Number(ws[0].hours) : 5;
        if (avgWeeklyHours > 0 && avgWeeklyHours <= 8) {
          setDailyHourLimit(avgWeeklyHours);
        }
      }
    } else {
      setSelectedPlanId('');
    }

    // მოვძებნოთ შესაბამისი გარემო და რესურსები
    const matchedResources = resList.filter(
      (r) => !r.module_name || (mod.module_name && r.module_name.toLowerCase().includes(mod.module_name.toLowerCase().slice(0, 12)))
    );
    const defaultEnvText = matchedResources.length > 0
      ? Array.from(new Set(matchedResources.map((r) => r.learning_environment || r.item_name).filter(Boolean))).slice(0, 4).join('; ')
      : '';

    // მოვამზადოთ სწავლის შედეგები
    const rawOutcomes = mod.outcomes && mod.outcomes.length > 0 ? mod.outcomes : FALLBACK_SAMPLE_MODULE.outcomes;
    const mappedOutcomes = rawOutcomes.map((oc, idx) => {
      const parsedTopics = splitTopicsText(oc.topics);
      const rawContact = Number(oc.hours_contact || 0);
      const rawEval = Number(oc.hours_evaluation || 2);
      return {
        id: oc.id || `oc_${idx + 1}`,
        outcome_number: oc.outcome_number || String(idx + 1),
        outcome_name: oc.outcome_name || `სწავლის შედეგი ${idx + 1}`,
        raw_hours_contact: rawContact > 0 ? rawContact : 15,
        hours_independent: Number(oc.hours_independent || 0),
        hours_evaluation: rawEval > 0 ? rawEval : 2,
        topicsList: parsedTopics.length > 0 ? parsedTopics : [`${oc.outcome_name || 'თემა'} - ნაწილი 1`, `${oc.outcome_name || 'თემა'} - ნაწილი 2`],
        criteria: oc.criteria || '',
        teaching_methods: 'ლექცია დემონსტრირებით;\nსასწავლო ექსკურსია;\nსემინარი;\nჯგუფში მუშაობა.',
        formative_assessment: oc.assessment_methods || 'პრაქტიკული დავალება',
        summative_assessment: oc.assessment_direction || oc.assessment_methods || 'პრაქტიკული დავალება დაკვირვებით',
        environment_resources: defaultEnvText,
      };
    });

    setOutcomesConfig(mappedOutcomes);

    // შევამოწმოთ მეზობელი სწავლის შედეგების შეფასების ტიპები
    const initialMerges = {};
    for (let i = 0; i < mappedOutcomes.length - 1; i++) {
      const a = (mappedOutcomes[i].summative_assessment || '').trim().toLowerCase();
      const b = (mappedOutcomes[i + 1].summative_assessment || '').trim().toLowerCase();
      if (a && b && a === b) {
        initialMerges[`${i}-${i + 1}`] = true;
      }
    }
    setPairMerges(initialMerges);
  };

  const handlePlanChange = (planIdStr) => {
    setSelectedPlanId(planIdStr);
    const p = dbPlans.find((item) => String(item.id) === String(planIdStr));
    if (!p) return;
    if (p.credits) setCredits(p.credits);
    if (p.status) setModuleStatus(p.status);
    const ws = p.weekly_schedule_parsed || [];
    if (ws.length > 0 && ws[0].week) {
      setStartAcademicWeek(Number(ws[0].week));
    }
  };

  const toggleWeekday = (dayId) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length === 1) return prev; // მინიმუმ 1 დღე უნდა დარჩეს
        return prev.filter((d) => d !== dayId).sort((a, b) => a - b);
      }
      return [...prev, dayId].sort((a, b) => a - b);
    });
  };

  // თითოეული სწავლის შედეგის ეფექტური საკონტაქტო საათი
  // (თუ შეფასება ცალკე არ არის სასწავლო გეგმაში, საკონტაქტოს აკლდება შეფასება)
  const getEffectiveContactHours = (oc) => {
    const base = Number(oc.raw_hours_contact || 0);
    const evalH = Number(oc.hours_evaluation || 0);
    if (deductEvalFromContact) {
      return Math.max(1, base - evalH);
    }
    return base;
  };

  // ============================================================================
  // SCHEDULE ENGINE: თარიღების, კვირების, დასვენებებისა და თემების გამომთვლელი ძრავი
  // ============================================================================
  const runScheduleEngine = (customResolutions = holidayResolutions) => {
    const activeWeekdays = selectedDays.length > 0 ? [...selectedDays].sort((a, b) => a - b) : [4];
    const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));

    // განაწილების მეთოდის მიხედვით დღიური საათების განსაზღვრა:
    // მეთოდი 1: კვირის საათები ნაწილდება ყველა არჩეულ დღეზე
    // მეთოდი 2: კვირის ერთ დღეზე ნაწილდება მაქსიმუმ 2 მოდული (ანუ დღიური ლიმიტის ნახევარი ან მითითებული საათი)
    // მეთოდი 3: ჯერ ერთი მოდული ავსებს კვირის დღეს სრულად (dailyHourLimit) და შემდეგ გადადის მომდევნო დღეზე
    let sessionStandardHours = Number(dailyHourLimit) || 5;
    if (distributionMethod === 1 && activeWeekdays.length > 1) {
      sessionStandardHours = Number(dailyHourLimit) || 5;
    } else if (distributionMethod === 2) {
      sessionStandardHours = Math.max(1, Number(dailyHourLimit) || 4);
    } else if (distributionMethod === 3) {
      sessionStandardHours = Number(dailyHourLimit) || 6;
    }

    const detectedCollisions = [];
    const generatedSessions = [];
    let currentCursorDate = startDate;
    let currentAcadWeek = Number(startAcademicWeek) || 1;
    let lastScheduledMonday = null;

    const getMondayOfIsoDate = (iso) => {
      const wd = getIsoWeekday(iso);
      return addDays(iso, -(wd - 1));
    };

    // გადავუაროთ თითოეულ სწავლის შედეგს
    outcomesConfig.forEach((oc, ocIdx) => {
      const targetContact = getEffectiveContactHours(oc);
      let remainingHours = targetContact;
      const topics = oc.topicsList && oc.topicsList.length > 0 ? oc.topicsList : [oc.outcome_name];
      let topicIdx = 0;

      // სანამ ამ სწავლის შედეგის საკონტაქტო საათები არ ამოიწურება (დამოუკიდებელი საათები არ მონაწილეობს!)
      let safetyCounter = 0;
      while (remainingHours > 0 && safetyCounter < 500) {
        safetyCounter++;
        const wd = getIsoWeekday(currentCursorDate);

        if (activeWeekdays.includes(wd)) {
          const mondayIso = getMondayOfIsoDate(currentCursorDate);

          // თუ დასვენების დღე ემთხვევა სასწავლო დღეს
          if (holidayMap.has(currentCursorDate)) {
            const holidayName = holidayMap.get(currentCursorDate);
            const resolution = customResolutions[currentCursorDate] || 'next_week';
            const hoursThatWouldBeScheduled = Math.min(sessionStandardHours, remainingHours);

            detectedCollisions.push({
              date: currentCursorDate,
              holidayName,
              outcomeNumber: oc.outcome_number,
              outcomeName: oc.outcome_name,
              missedHours: hoursThatWouldBeScheduled,
              remainingOutcomeHours: remainingHours,
              resolution,
            });

            if (resolution === 'saturday') {
              // შაბათზე გაწერა (კომპენსაცია იმავე კვირის შაბათს)
              const satDate = getSaturdayOfSameWeek(currentCursorDate);
              if (!holidayMap.has(satDate)) {
                if (lastScheduledMonday !== null && mondayIso !== lastScheduledMonday) {
                  currentAcadWeek += 1;
                }
                lastScheduledMonday = mondayIso;

                const hrs = Math.min(sessionStandardHours, remainingHours);
                const chosenTopic = topics[Math.min(topicIdx, topics.length - 1)] || oc.outcome_name;

                generatedSessions.push({
                  id: `sess_${ocIdx}_${generatedSessions.length + 1}`,
                  outcomeIndex: ocIdx,
                  outcomeNumber: oc.outcome_number,
                  outcomeName: oc.outcome_name,
                  date: satDate,
                  academicWeek: currentAcadWeek,
                  topic: `${chosenTopic}`,
                  hoursContact: hrs,
                  hoursIndependent: 0, // დამოუკიდებელი არ მონაწილეობს!
                  hoursEvaluation: 0,
                  isSaturdayCompensation: true,
                  compensatedFrom: currentCursorDate,
                  note: `შაბათის კომპენსაცია (${formatDateGeo(currentCursorDate)}-ის ნაცვლად)`,
                });

                remainingHours = Math.round((remainingHours - hrs) * 100) / 100;
                topicIdx += 1;
              }
            }
            // თუ resolution === 'next_week', ეს დღე გამოტოვდება და წინა კვირის შაბლონით გადადის შემდეგ კვირაზე
          } else {
            // ჩვეულებრივი სამუშაო/სასწავლო დღე
            if (lastScheduledMonday !== null && mondayIso !== lastScheduledMonday) {
              currentAcadWeek += 1;
            }
            lastScheduledMonday = mondayIso;

            // ნაშთის წესი: თუ საათები ბოლომდე არ იყოფა (მაგ. დარჩა 3 სთ), ბოლო შეხვედრას ეთმობა ზუსტად ის დარჩენილი 3 სთ
            const hrs = Math.min(sessionStandardHours, remainingHours);
            const chosenTopic = topics[Math.min(topicIdx, topics.length - 1)] || oc.outcome_name;

            generatedSessions.push({
              id: `sess_${ocIdx}_${generatedSessions.length + 1}`,
              outcomeIndex: ocIdx,
              outcomeNumber: oc.outcome_number,
              outcomeName: oc.outcome_name,
              date: currentCursorDate,
              academicWeek: currentAcadWeek,
              topic: chosenTopic,
              hoursContact: hrs,
              hoursIndependent: 0,
              hoursEvaluation: 0,
              isSaturdayCompensation: false,
              note: '',
            });

            remainingHours = Math.round((remainingHours - hrs) * 100) / 100;
            topicIdx += 1;
          }
        }

        currentCursorDate = addDays(currentCursorDate, 1);
      }
    });

    // დავალაგოთ თარიღის მიხედვით (თუ შაბათის კომპენსაცია ჩაჯდა)
    generatedSessions.sort((a, b) => a.date.localeCompare(b.date));

    setHolidayCollisions(detectedCollisions);
    setSessions(generatedSessions);
  };

  // როდესაც მომხმარებელი ნაბიჯ 1-დან ნაბიჯ 2-ზე გადადის, ვამუშავებთ Schedule Engine-ს
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

  const handleRemoveHoliday = (dateToRemove) => {
    setHolidays((prev) => prev.filter((h) => h.date !== dateToRemove));
  };

  // ნაბიჯი 3: თემებისა და საათების ინტერაქტიული მართვა
  const handleSessionChange = (sessId, field, value) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessId ? { ...s, [field]: field === 'hoursContact' || field === 'academicWeek' ? Number(value) : value } : s))
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
    const mergedHours = Number(current.hoursContact || 0) + Number(next.hoursContact || 0);

    const updated = [...sessions];
    updated[idx] = {
      ...current,
      topic: mergedTopic,
      hoursContact: mergedHours,
    };
    updated.splice(idx + 1, 1);
    setSessions(updated);
  };

  const handleAddSessionToOutcome = (outcomeIdx) => {
    const oc = outcomesConfig[outcomeIdx];
    const ocSessions = sessions.filter((s) => s.outcomeIndex === outcomeIdx);
    const lastSess = ocSessions.length > 0 ? ocSessions[ocSessions.length - 1] : sessions[sessions.length - 1];
    const nextDate = lastSess ? addDays(lastSess.date, 7) : startDate;
    const nextWeek = lastSess ? Number(lastSess.academicWeek || 1) + 1 : startAcademicWeek;

    const newSess = {
      id: `sess_manual_${Date.now()}`,
      outcomeIndex: outcomeIdx,
      outcomeNumber: oc.outcome_number,
      outcomeName: oc.outcome_name,
      date: nextDate,
      academicWeek: nextWeek,
      topic: 'ახალი თემა (დააკორექტირეთ)',
      hoursContact: Math.min(dailyHourLimit, 3),
      hoursIndependent: 0,
      hoursEvaluation: 0,
      isSaturdayCompensation: false,
      note: '',
    };

    const updated = [...sessions, newSess].sort((a, b) => {
      if (a.outcomeIndex !== b.outcomeIndex) return a.outcomeIndex - b.outcomeIndex;
      return a.date.localeCompare(b.date);
    });
    setSessions(updated);
  };

  const handleDeleteSession = (sessId) => {
    if (sessions.length <= 1) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessId));
  };

  const handleAutoDistributeOutcomeHours = (outcomeIdx) => {
    const oc = outcomesConfig[outcomeIdx];
    const target = getEffectiveContactHours(oc);
    const ocSessions = sessions.filter((s) => s.outcomeIndex === outcomeIdx);
    if (ocSessions.length === 0) return;

    let rem = target;
    const limit = Number(dailyHourLimit) || 5;
    const updated = sessions.map((s) => {
      if (s.outcomeIndex !== outcomeIdx) return s;
      const isLast = s.id === ocSessions[ocSessions.length - 1].id;
      const assigned = isLast ? Math.max(0, rem) : Math.min(limit, Math.max(0, rem));
      rem = Math.round((rem - assigned) * 100) / 100;
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

    // გამოვთვალოთ ბოლო თარიღი (შეფასების სესიის ჩათვლით)
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

    // სტრიქონი 1: სკოლის დასახელება
    rows.push({
      number: rowNum++,
      height: '34.5pt',
      cells: [
        {
          column: 1,
          colSpan: 12,
          rowSpan: 1,
          text: 'სსიპ - ნესტორ გოქაძის სახელობის ქალაქ ქუთაისის N 22 საჯარო სკოლა\nპროფესიული საგანმანათლებლო პროგრამის მოდულის კალენდარული გეგმა',
          style: baseCell({ fontSize: '12.0pt', fontWeight: 'bold', textAlign: 'center' }),
        },
      ],
    });

    // სტრიქონები 2-8: მარცხნივ 3 სვეტი ლოგოს/სკოლის ბლოკი, მარჯვნივ 9 სვეტი მეტამონაცემები
    const metaLines = [
      `პროფესიული საგანმანათლებლო პროგრამის სახელწოდება:   ${programName}`,
      `მოდულის სახელწოდება, სტატუსი და სარეგისტრაციო ნომერი: ${moduleTitle}; სარეგისტრაციო N ${registrationNumber} (მოდულის სტატუსი - ${moduleStatus})`,
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
          text: 'სსიპ ქუთაისის N22\nსაჯარო სკოლა',
          style: baseCell({ textAlign: 'center', fontWeight: 'bold', fontSize: '10.0pt', background: '#fafafa' }),
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

    // სტრიქონი 9: გამყოფი სათაური
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

    // სტრიქონები 10, 11, 12: 12-სვეტიანი ცხრილის 3-დონიანი თავსართი (Header)
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

    // ახლა დავაგენერიროთ თითოეული სწავლის შედეგი და მისი შეხვედრები
    let grandTotalContact = 0;
    let grandTotalIndependent = 0;
    let grandTotalEvaluation = 0;
    let lastWeekNum = startAcademicWeek;
    let lastDateStr = startDate;

    // დავადგინოთ შეფასების დაჯგუფება:
    // თუ evaluationMode === 'separate_per_outcome', არცერთი არ ერთიანდება, თითოეულ შედეგს ბოლოში ეწერება თავისი შეფასება და ჯამი
    // თუ evaluationMode === 'merge_matching_pairs', ერთიანდება ის მეზობლები, რომლებზეც pairMerges["i-(i+1)"] === true
    // თუ evaluationMode === 'merge_all_end', ყველა შედეგის განმსაზღვრელი შეფასება ერთიანდება ბოლოში (როგორც CalendarDocument.jsx-ში)
    let pendingMergedOutcomes = [];

    outcomesConfig.forEach((oc, ocIdx) => {
      const ocSessions = sessions.filter((s) => s.outcomeIndex === ocIdx);
      const spanCount = Math.max(1, ocSessions.length);

      // სწავლის შედეგის სათაურის სტრიქონი
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
            // წესი 1: დამოუკიდებელი საათი კალენდარულ სესიებში არ შედის!
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

      // სწავლის შედეგის შეჯამების სტრიქონი ("ჯამი")
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

      // თუ არ ერთიანდება მომდევნო შედეგთან, ახლავე ვწერთ განმსაზღვრელი შეფასების სტრიქონს!
      if (!shouldMergeWithNext && pendingMergedOutcomes.length > 0) {
        const evalDateStr = addDays(lastDateStr, 7);
        lastDateStr = evalDateStr;
        lastWeekNum += 1;

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
            { column: 5, rowSpan: 1, colSpan: 1, text: String(combinedEvalHours), style: baseCell({ fontWeight: 'bold', textAlign: 'center' }) },
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

    // სულ ჯამი (Footer)
    // როგორც ნიმუშში (CalendarDocument.jsx სტრიქონი 46): საკონტაქტო საათების სრული ჯამი (შეფასების ჩათვლით ან ცალკე)
    const totalContactDisplay = grandTotalContact + (deductEvalFromContact ? grandTotalEvaluation : 0);

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

    // ხელმოწერების სტრიქონები (47 და 48)
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

  const handleSaveCalendarToDb = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        id: currentSavedId,
        title: `${moduleTitle} (${registrationNumber || 'გეგმა'})`,
        module_id: selectedModuleId !== 'sample_os' ? Number(selectedModuleId) : null,
        plan_id: selectedPlanId ? Number(selectedPlanId) : null,
        module_name: moduleTitle,
        registration_number: registrationNumber,
        teacher_name: teacherName,
        program_name: programName,
        start_date: formatDateGeo(officialTableData.firstDateIso),
        end_date: formatDateGeo(officialTableData.evalFinalDateIso),
        config_json: {
          selectedModuleId,
          selectedPlanId,
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
      const refreshed = await api.getCalendarInitData();
      setSavedCalendars(refreshed.saved_calendars || []);
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
        setSelectedModuleId(cfg.selectedModuleId || 'sample_os');
        setSelectedPlanId(cfg.selectedPlanId || '');
        setProgramName(cfg.programName || '');
        setModuleTitle(cfg.moduleTitle || '');
        setRegistrationNumber(cfg.registrationNumber || '');
        setModuleStatus(cfg.moduleStatus || 'პროფესიული');
        setPrerequisite(cfg.prerequisite || '');
        setCredits(cfg.credits || 6);
        setTeacherName(cfg.teacherName || '');
        setLocation(cfg.location || '');
        setStartDate(cfg.startDate || '2025-12-18');
        setStartAcademicWeek(cfg.startAcademicWeek || 14);
        setDistributionMethod(cfg.distributionMethod || 1);
        setSelectedDays(cfg.selectedDays || [4]);
        setDailyHourLimit(cfg.dailyHourLimit || 5);
        setDeductEvalFromContact(Boolean(cfg.deductEvalFromContact));
        setHideIndependentInRows(cfg.hideIndependentInRows !== false);
        if (cfg.outcomesConfig) setOutcomesConfig(cfg.outcomesConfig);
        if (cfg.holidayResolutions) setHolidayResolutions(cfg.holidayResolutions);
        if (cfg.sessions) setSessions(cfg.sessions);
        if (cfg.evaluationMode) setEvaluationMode(cfg.evaluationMode);
        if (cfg.pairMerges) setPairMerges(cfg.pairMerges);
        setStep(5);
      }
    } catch (err) {
      setError(err.message || 'ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSavedCalendar = async (calId) => {
    if (!window.confirm('ნამდვილად გსურთ შენახული კალენდარული გეგმის წაშლა?')) return;
    try {
      await api.deleteSavedCalendar(calId);
      setSavedCalendars((prev) => prev.filter((c) => c.id !== calId));
      if (currentSavedId === calId) setCurrentSavedId(null);
    } catch (err) {
      setError(err.message || 'წაშლა ვერ მოხერხდა');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        იტვირთება კალენდარული გეგმის გენერატორი...
      </div>
    );
  }

  const totalTableWidth = officialTableData.widths.reduce((a, b) => a + b, 0);

  return (
    <div className="calendar-generator-root">
      {/* ბეჭდვის სტილები */}
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
              კალენდარული გეგმის ინტერაქტიული გენერატორი (Schedule Engine)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              ბაზიდან მონაცემების წამოღება (სასწავლო გეგმა + მოდულის აღწერა), თარიღების გაწერა, დასვენებების კომპენსაცია და 12-სვეტიანი დოკუმენტის ფორმირება
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {[
            { n: 1, title: '1. მონაცემები & მეთოდი', sub: 'ბაზიდან თარიღის გადამოწმება' },
            { n: 2, title: '2. თარიღები & დასვენებები', sub: 'შაბათი ან შემდეგი კვირა' },
            { n: 3, title: '3. თემები & საათები', sub: 'კორექტირება და გაერთიანება' },
            { n: 4, title: '4. შეფასებების წესი', sub: 'შეკითხვა გაერთიანებაზე' },
            { n: 5, title: '5. მზა კალენდარი', sub: '12-სვეტიანი დოკუმენტი & ბეჭდვა' },
          ].map((item) => {
            const active = step === item.n;
            const done = step > item.n;
            return (
              <button
                key={item.n}
                onClick={() => {
                  if (item.n >= 2 && sessions.length === 0) {
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
          {/* წყაროების არჩევა: მოდული (Word) და სასწავლო გეგმა (Excel) */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#2563eb" />
              ნაბიჯი 1: ბაზიდან მოდულის, სასწავლო გეგმისა და საწყისი თარიღის გადამოწმება
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  1) აირჩიეთ მოდული (Word-ის მოდულის აღწერიდან):
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => applyModuleSelection(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="sample_os">
                    [ნიმუში] კომპიუტერის პროგრამული უზრუნველყოფა (06.2.1.3) — 6 კრედ.
                  </option>
                  {dbModules.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.module_name} ({m.registration_number || 'უკოდო'}) — {m.credits || 0} კრედ. [{m.file_name || 'ბაზა'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  2) დაკავშირებული სასწავლო გეგმა (Excel-ის კვირეული დატვირთვა):
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="">-- ავტომატური / ხელით მითითებული კვირები --</option>
                  {dbPlans.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.module_name} ({p.registration_number || '-'}) — საკონტაქტო: {p.hours_contact} სთ, შეფასება: {p.hours_evaluation} სთ
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
                    placeholder="მასწავლებლის სახელი და გვარი"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  {dbTeachers.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && setTeacherName(e.target.value)}
                      value=""
                      style={{ width: '150px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="">სიიდან არჩევა</option>
                      {dbTeachers.map((t) => (
                        <option key={t.id} value={t.name || t.username}>
                          {t.name || t.username}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* მეტამონაცემების დეტალები */}
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
            </div>
          </div>

          {/* თარიღის გადამოწმება და განაწილების 3 მეთოდი */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#2563eb" />
              საწყისი თარიღის გადამოწმება და სასწავლო დღეების განაწილების მეთოდი (1, 2 ან 3)
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
                  გთხოვთ გადაამოწმოთ მოდულის დაწყების თარიღი და სასწავლო კვირის ნომერი:
                </div>
                <div style={{ fontSize: '12.5px', color: '#1d4ed8', marginTop: '2px' }}>
                  სასწავლო კვირა არ ემთხვევა კალენდარულ კვირას. დამოუკიდებელი საათები კალენდარულ გრაფიკში არ მონაწილეობს (მხოლოდ საკონტაქტო და შეფასება).
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>დაწყების თარიღი:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid #2563eb', fontWeight: 700, fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>საწყისი სასწავლო კვირა №:</label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={startAcademicWeek}
                    onChange={(e) => setStartAcademicWeek(Number(e.target.value))}
                    style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '2px solid #2563eb', fontWeight: 700, fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>დღიური საათების ლიმიტი:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={dailyHourLimit}
                    onChange={(e) => setDailyHourLimit(Number(e.target.value))}
                    style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '2px solid #2563eb', fontWeight: 700, fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>

            {/* 3 მეთოდის არჩევა */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                აირჩიეთ კვირის სასწავლო დღეებზე საათების გადანაწილების მეთოდი:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {[
                  {
                    id: 1,
                    title: 'მეთოდი 1: ყველა არჩეულ დღეზე განაწილება',
                    desc: 'კვირის საკონტაქტო საათები ნაწილდება კვირის ყველა მონიშნულ სასწავლო დღეზე თანაბრად.',
                  },
                  {
                    id: 2,
                    title: 'მეთოდი 2: დღეში მაქსიმუმ 2 მოდული',
                    desc: 'კვირის ერთ სასწავლო დღეზე ნაწილდება მაქსიმუმ 2 მოდული შესაბამისი საათობრივი ლიმიტით.',
                  },
                  {
                    id: 3,
                    title: 'მეთოდი 3: თანმიმდევრული შევსება (შაბლონით)',
                    desc: 'ჯერ ერთი მოდული ავსებს კვირის დღეს ბოლომდე, შემდეგ მეორე. პირველი კვირა აიღება შაბლონად საათების ამოწურვამდე.',
                  },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setDistributionMethod(m.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: distributionMethod === m.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: distributionMethod === m.id ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: distributionMethod === m.id ? '#1d4ed8' : '#0f172a' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                      {m.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* კვირის დღეების მონიშვნა */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            </div>
          </div>

          {/* სწავლის შედეგების საათების მიმოხილვა */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>
              სწავლის შედეგების საათობრივი დატვირთვა (ბაზიდან):
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>№</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>სწავლის შედეგი</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>საკონტაქტო საათი (ბაზა)</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>გასაწერი საკონტაქტო სთ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>შეფასების სთ</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>განმსაზღვრელი შეფასების მეთოდი</th>
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
                          value={oc.raw_hours_contact}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setOutcomesConfig((prev) => prev.map((item, i) => (i === idx ? { ...item, raw_hours_contact: val } : item)));
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
                onClick={handleProceedToStep2}
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
                <span>დადასტურება და თარიღების გენერირება (ნაბიჯი 2)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 2: თარიღების გენერირება და დასვენების დღეების ინტერაქტიული მართვა
      ======================================================================== */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#d97706" />
                  ნაბიჯი 2: დასვენების დღეების შემოწმება და გაცდენილი საათების გაწერა
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
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '3px' }}>
                          სწავლის შედეგი {col.outcomeNumber}: გაცდენილი საათი ამ დღეს: <strong>{col.missedHours} სთ</strong> | შედეგზე დარჩენილი გასაწერი საათები: <strong>{col.remainingOutcomeHours} სთ</strong>
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

            {/* დამატებითი დასვენების დღის დამატება */}
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
                onClick={() => setStep(3)}
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
                <span>თემებისა და საათების გაწერაზე გადასვლა (ნაბიჯი 3)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 3: თემებისა და საათების ინტერაქტიული რედაქტორი
      ======================================================================== */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="#2563eb" />
              ნაბიჯი 3: თემებისა და საათების ინტერაქტიული კორექტირება
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#64748b' }}>
              თემები წამოღებულია მოდულის ფაილიდან. შეგიძლიათ შეცვალოთ თემის ტექსტი, გააერთიანოთ თემები, დაამატოთ ახალი შეხვედრა ან ხელით გადაწეროთ საათების რაოდენობა (ბოლო შეხვედრას ავტომატურად ეთმობა დარჩენილი ნაშთი).
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
                      {ocSessions.map((sess, sIdx) => (
                        <tr key={sess.id} style={{ borderBottom: '1px solid #f1f5f9', background: sess.isSaturdayCompensation ? '#fffbeb' : '#fff' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="date"
                              value={sess.date}
                              onChange={(e) => handleSessionChange(sess.id, 'date', e.target.value)}
                              style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              value={sess.academicWeek}
                              onChange={(e) => handleSessionChange(sess.id, 'academicWeek', e.target.value)}
                              style={{ width: '60px', padding: '5px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              value={sess.topic}
                              onChange={(e) => handleSessionChange(sess.id, 'topic', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={sess.hoursContact}
                              onChange={(e) => handleSessionChange(sess.id, 'hoursContact', e.target.value)}
                              style={{ width: '70px', padding: '6px', textAlign: 'center', fontWeight: 700, borderRadius: '6px', border: '1px solid #2563eb' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              {sIdx < ocSessions.length - 1 && (
                                <button
                                  type="button"
                                  title="მომდევნო თემასთან გაერთიანება"
                                  onClick={() => handleMergeWithNextSession(sess.globalIdx)}
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
                                onClick={() => handleDeleteSession(sess.id)}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

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
                onClick={() => setStep(4)}
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
                <span>შეფასებების კონფიგურაციაზე გადასვლა (ნაბიჯი 4)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 4: შეფასებების გაერთიანების შეკითხვა და კრიტერიუმების რედაქტირება
      ======================================================================== */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={20} color="#2563eb" />
              ნაბიჯი 4: შეკითხვა შეფასების საათების დანიშვნასა და გაერთიანებაზე
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
                    თითოეული სწავლის შედეგის შემდეგ იწერება „ჯამი“, ხოლო ბოლოში ერთიანდება „პირველი, მეორე, მესამე და მეოთხე სწავლის შედეგის შეფასება“ (ოფიციალური ნიმუშის მიხედვით).
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

            {/* შესრულების კრიტერიუმების, მეთოდებისა და გარემოს რედაქტირება */}
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>
              სწავლის შედეგების კრიტერიუმები, სწავლების მეთოდები და გარემო (აისახება 12-სვეტიან ცხრილში):
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
                <span>ოფიციალური 12-სვეტიანი კალენდარული გეგმის ნახვა (ნაბიჯი 5)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ნაბიჯი 5: ოფიციალური 12-სვეტიანი კალენდარული გეგმა (CalendarDocument.jsx)
      ======================================================================== */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* სამართავი პანელი */}
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
                onClick={() => setStep(4)}
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
                <ArrowLeft size={15} /> რედაქტირებაზე დაბრუნება
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

          {/* ოფიციალური 12-სვეტიანი დოკუმენტი */}
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
                              <div style={{
                                width: '58px',
                                height: '58px',
                                borderRadius: '50%',
                                border: '2px solid #1e3a8a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '15px',
                                color: '#1e3a8a',
                                background: '#eff6ff'
                              }}>
                                N22
                              </div>
                              <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#18181b', textAlign: 'center', lineHeight: 1.25 }}>
                                სსიპ ქუთაისის N22 საჯარო სკოლა
                              </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
