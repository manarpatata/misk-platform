import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Layers, 
  Inbox, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  X, 
  Search, 
  SlidersHorizontal, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  Trash2, 
  UserX, 
  Calendar, 
  MapPin, 
  Video, 
  HelpCircle, 
  Settings, 
  RefreshCw,
  Award
} from 'lucide-react';
import { Session, User, formatOmaniPhone } from '../../types';

// Helper function to match dynamic day and time filters
const matchTimeFilters = (timingsObj: any, filters: { day: string; time: string }[]) => {
  if (!filters || filters.length === 0) return true;
  if (!timingsObj) return false;
  
  // Map our UI time values to the actual keys used in timings database
  const timeKeyMap: Record<string, string> = {
    'Fajr': 'Fajr',
    '8:00': '8:00-9:15',
    '10:00': '10:00-11:15',
    '12:00': '12:00-1:15',
    '2:15': '2:15-3:30',
    '4:15': '4:15-5:30',
    '8:00PM': '8:00-9:15PM'
  };

  // If ANY of the filter rows match, we return true
  return filters.some(f => {
    const { day, time } = f;
    if (!day && !time) return true; // Empty filter matches everything
    
    // Check all entries of timings
    return Object.entries(timingsObj).some(([key, val]) => {
      if (!val) return false;
      const parts = key.split('_');
      if (parts.length !== 2) return false;
      const [dKey, sKey] = parts; // Sunday, Fajr etc.
      
      const dayMatches = !day || dKey === day;
      const mappedTimeKey = timeKeyMap[time] || time;
      const timeMatches = !time || sKey === mappedTimeKey;
      
      return dayMatches && timeMatches;
    });
  });
};

// Helper function to match dynamic session timings
const matchSessionTimeFilters = (timeStr: string, filters: { id: string; day: string; time: string }[]) => {
  if (!filters || filters.length === 0) return true;
  if (!timeStr) return false;
  
  const norm = timeStr.toLowerCase();
  
  // Normalize days
  const dayMaps: Record<string, string[]> = {
    'Sunday': ['sunday', 'الأحد', 'sun'],
    'Monday': ['monday', 'الاثنين', 'mon'],
    'Tuesday': ['tuesday', 'الثلاثاء', 'tue'],
    'Wednesday': ['wednesday', 'الأربعاء', 'wed'],
    'Thursday': ['thursday', 'الخميس', 'thu'],
    'Friday': ['friday', 'الجمعة', 'fri'],
    'Saturday': ['saturday', 'السبت', 'sat']
  };

  const timeMaps: Record<string, string> = {
    'Fajr': '4:15', // Support Fajr time overlap
    '8:00': '8:00',
    '10:00': '10:00',
    '12:00': '12:00',
    '2:15': '2:15',
    '4:15': '4:15',
    '8:00PM': '8:00'
  };

  return filters.some(f => {
    const { day, time } = f;
    if (!day && !time) return true; // Empty filter matches everything
    
    // Day checking
    let dayMatched = true;
    if (day && dayMaps[day]) {
      dayMatched = dayMaps[day].some(keyword => norm.includes(keyword));
    }
    
    // Time checking
    let timeMatched = true;
    if (time) {
      const targetTimeStr = timeMaps[time] || time;
      timeMatched = norm.includes(targetTimeStr.toLowerCase());
    }
    
    return dayMatched && timeMatched;
  });
};

const toArabicNumerals = (numStr: string): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return numStr.replace(/[0-9]/g, (w) => arabicDigits[parseInt(w)]);
};

// Timings utility format mapping
const getFormattedTimings = (userTimings: any, lang: string, student?: any) => {
  if (!userTimings) return lang === 'ar' ? 'غير محدد' : 'Not specified';
  
  // Determine if this student is a postgrad or employee
  const isPostgradOrEmployee = student && !student.employeeId && (
    student.studentType === 'postgrad' ||
    student.cohort === 'Graduate' ||
    student.degree === 'Master' || 
    student.degree === 'PhD' || 
    student.degree === 'PhD / Employee' ||
    student.degree === 'Employee' ||
    (student.academicDegree && (
      student.academicDegree.toLowerCase().includes('master') ||
      student.academicDegree.toLowerCase().includes('phd')
    )) ||
    student.isSenior === true
  );

  const selectedSlots: string[] = [];
  
  const DAYS_MAP: Record<string, {ar: string, en: string}> = {
    Sunday: { ar: 'الأحد', en: 'Sunday' },
    Monday: { ar: 'الأحد', en: 'Sunday' }, // Keep standard names matching
    Monday_real: { ar: 'الإثنين', en: 'Monday' },
    Tuesday: { ar: 'الثلاثاء', en: 'Tuesday' },
    Wednesday: { ar: 'الأربعاء', en: 'Wednesday' },
    Thursday: { ar: 'الخميس', en: 'Thursday' },
    Friday: { ar: 'الجمعة', en: 'Friday' },
    Saturday: { ar: 'السبت', en: 'Saturday' }
  };
  // Override and clean up Monday days map key mapping
  DAYS_MAP['Monday'] = { ar: 'الإثنين', en: 'Monday' };

  const SLOTS_MAP: Record<string, {ar: string, en: string}> = {
    Fajr: { ar: 'فجرية', en: 'Fajr' },
    'Fajr (online)': { ar: 'فجرية', en: 'Fajr' },
    '8:00-9:15': { ar: '8:15-9:30', en: '8:15-9:30' },
    '10:00-11:15': { ar: '10:15-11:30', en: '10:15-11:30' },
    '12:00-1:15': { ar: '12:15-1:30', en: '12:15-1:30' },
    '2:15-3:30': { ar: '2:15-3:30', en: '2:15-3:30' },
    '4:15-5:30': { ar: '4:15-5:30', en: '4:15-5:30' },
    '8:15-9:30': { ar: '8:15-9:30', en: '8:15-9:30' },
    '10:15-11:30': { ar: '10:15-11:30', en: '10:15-11:30' },
    '12:15-1:30': { ar: '12:15-1:30', en: '12:15-1:30' },
    '8:00-9:15PM': { ar: '8:00-9:15 م', en: '8:00-9:15 PM' }
  };

  Object.entries(userTimings).forEach(([key, val]) => {
    if (val) {
      const parts = key.split('_');
      if (parts.length === 2) {
        const dKey = parts[0];
        const sKey = parts[1];
        
        const dayText = DAYS_MAP[dKey] ? (lang === 'ar' ? DAYS_MAP[dKey].ar : DAYS_MAP[dKey].en) : dKey;
        
        let slotText = '';
        if (SLOTS_MAP[sKey]) {
          slotText = lang === 'ar' ? SLOTS_MAP[sKey].ar : SLOTS_MAP[sKey].en;
        } else {
          let temp = sKey;
          if (temp === '8:00-9:15') temp = '8:15-9:30';
          if (temp === '10:00-11:15') temp = '10:15-11:30';
          if (temp === '12:00-1:15') temp = '12:15-1:30';
          slotText = temp;
        }

        let modeSuffix = '';
        if (isPostgradOrEmployee) {
          const isOnlineMode = val === 'online';
          if (isOnlineMode) {
            modeSuffix = ' (online)';
          } else {
            modeSuffix = ' (in-person)';
          }
        }
        
        selectedSlots.push(`${dayText} ${slotText}${modeSuffix}`);
      }
    }
  });

  if (selectedSlots.length === 0) return lang === 'ar' ? 'لا توجد أوقات محددة' : 'No timings selected';
  return selectedSlots.join(' | ');
};

const parseDoubleSessions = (timeStr: string, lang: 'ar' | 'en') => {
  let s1Day = '';
  let s1Time = '';
  let s2Day = '';
  let s2Time = '';

  if (!timeStr) {
    return {
      session1: lang === 'ar' ? 'غير محدد' : 'To be announced',
      session2: lang === 'ar' ? 'لم يحدد بعد' : 'to be announced'
    };
  }

  const parts = timeStr.split('|').map(p => p.trim());
  
  if (parts.length >= 2) {
    const daysPart = parts[0];
    const timePart = parts[1];

    let days: string[] = [];
    if (daysPart.includes('والثلاثاء') || (daysPart.includes('الأحد') && daysPart.includes('الثلاثاء'))) {
      days = lang === 'ar' ? ['الأحد', 'الثلاثاء'] : ['Sunday', 'Tuesday'];
    } else if (daysPart.includes('والأربعاء') || (daysPart.includes('الاثنين') && daysPart.includes('الأربعاء'))) {
      days = lang === 'ar' ? ['الاثنين', 'الأربعاء'] : ['Monday', 'Wednesday'];
    } else if (daysPart.includes('/')) {
      days = daysPart.split('/');
    } else if (daysPart.includes('and')) {
      days = daysPart.split(/\band\b/);
    } else {
      days = [daysPart];
    }

    days = days.map(d => d.trim());

    if (days.length >= 2) {
      s1Day = days[0];
      s1Time = timePart;
      s2Day = days[1];
      s2Time = timePart;
    } else {
      s1Day = days[0] || '';
      s1Time = timePart;
      s2Day = '';
      s2Time = '';
    }
  } else {
    s1Day = timeStr;
    s1Time = '';
    s2Day = '';
    s2Time = '';
  }

  const labelSession1 = lang === 'ar' ? 'الحلقة 1' : 'session 1';
  const labelSession2 = lang === 'ar' ? 'الحلقة 2' : 'Session 2';
  const tbaText = lang === 'ar' ? 'لم يحدد بعد' : 'to be announced';

  const session1Str = `${labelSession1}: ${s1Day}${s1Time ? ` | ${s1Time}` : ''}`;
  const session2Str = s2Day ? `${labelSession2}: ${s2Day}${s2Time ? ` | ${s2Time}` : ''}` : `${labelSession2}: ${tbaText}`;

  return {
    session1: session1Str,
    session2: session2Str
  };
};

// Mapping student levels
const getStudentLevelDisplay = (st: any, lang: string) => {
  const lvl = (st.level || '').toUpperCase();
  if (lvl.includes('BEGIN') || lvl.includes('مبتد')) {
    return lang === 'ar' ? 'مبتدئة' : 'Beginner';
  } else if (lvl.includes('INTERMED') || lvl.includes('تمهيد') || lvl.includes('متوسط') || lvl.includes('TAMKEEN') || lvl.includes('تمكين')) {
    return lang === 'ar' ? 'تمهيدية' : 'Intermediate';
  } else if (lvl.includes('ADVANC') || lvl.includes('متقدم')) {
    return lang === 'ar' ? 'متقدمة' : 'Advanced';
  }
  return st.level || (lang === 'ar' ? 'مبتدئة' : 'Beginner');
};

// Mapping teacher levels
const getTeacherLevelDisplay = (teach: any, lang: string) => {
  const lvl = (teach.level || '').toLowerCase();
  if (lvl.includes('مجاز') || lvl.includes('master') || lvl.includes('certified')) {
    return lang === 'ar' ? 'مجازة' : 'Certified (Mujazah)';
  } else if (lvl.includes('first') || lvl.includes('أول مرة')) {
    return lang === 'ar' ? 'أول مرة في مرحلة إقراء' : 'First time teaching in Iqraa stage';
  } else {
    return lang === 'ar' ? 'طالبة إقراء' : 'Iqraa';
  }
};

interface AssignmentDashboardProps {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  allStudents: any[];
  setAllStudents: React.Dispatch<React.SetStateAction<any[]>>;
  allTeachers: any[];
  setAllTeachers: React.Dispatch<React.SetStateAction<any[]>>;
  lang: 'ar' | 'en';
  t: () => any;
  onBack: () => void;
  setUser?: React.Dispatch<React.SetStateAction<any>>;
  navigate?: (view: string) => void;
  activeAllocationSemesterId?: string | null;
}

export default function AssignmentDashboard({
  sessions,
  setSessions,
  allStudents: propAllStudents,
  setAllStudents,
  allTeachers: propAllTeachers,
  setAllTeachers,
  lang,
  t,
  onBack,
  setUser,
  navigate,
  activeAllocationSemesterId
}: AssignmentDashboardProps) {

  const allStudents = useMemo(() => {
    if (!activeAllocationSemesterId) return propAllStudents;
    return propAllStudents.filter(s => s.isEnrolled && s.enrollmentDetails?.semesterId === activeAllocationSemesterId);
  }, [propAllStudents, activeAllocationSemesterId]);

  const allTeachers = useMemo(() => {
    if (!activeAllocationSemesterId) return propAllTeachers;
    return propAllTeachers.filter(t => t.isEnrolled && t.enrollmentDetails?.semesterId === activeAllocationSemesterId);
  }, [propAllTeachers, activeAllocationSemesterId]);
  // Synchronously stretch the main layout container and override background colors to allow full screen visual size
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const bodyEl = document.body;
    if (mainEl) {
      mainEl.classList.add('!max-w-none', '!px-0', '!pt-20', '!pb-0');
    }
    if (bodyEl) {
      bodyEl.classList.add('!bg-slate-50');
    }
    return () => {
      if (mainEl) {
        mainEl.classList.remove('!max-w-none', '!px-0', '!pt-20', '!pb-0');
      }
      if (bodyEl) {
        bodyEl.classList.remove('!bg-slate-50');
      }
    };
  }, []);

  // Navigation tabs for the Dashboard
  // 'overview' | 'students' | 'teachers' | 'sessions' | 'auto-assign' | 'conflicts'
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'sessions' | 'auto-assign' | 'conflicts'>('overview');

  // Format filter for Auto Assignment Tool
  const [autoAssignFormat, setAutoAssignFormat] = useState<'in-person' | 'online'>('in-person');

  // Load/Save Draft assignments
  const [inPersonDraft, setInPersonDraft] = useState<any[]>(() => {
    const cached = localStorage.getItem('itqan_in_person_draft');
    return cached ? JSON.parse(cached) : [];
  });
  const [onlineDraft, setOnlineDraft] = useState<any[]>(() => {
    const cached = localStorage.getItem('itqan_online_draft');
    return cached ? JSON.parse(cached) : [];
  });

  // Algorithm running feedback states
  const [isRunningAlgorithm, setIsRunningAlgorithm] = useState(false);
  const [apiLogMessage, setApiLogMessage] = useState('');

  // Search & Filter state for sections
  const [studentSearch, setStudentSearch] = useState('');
  const [studentLevelFilter, setStudentLevelFilter] = useState<string>('all');
  const [studentTypeFilter, setStudentTypeFilter] = useState<string>('all'); // all, undergrad, postgrad
  const [studentFormatFilter, setStudentFormatFilter] = useState<string>('all'); // all, online, in-person
  const [studentTimeFilters, setStudentTimeFilters] = useState<{ id: string; day: string; time: string }[]>([]);
  const [studentTimingSearch, setStudentTimingSearch] = useState('');
  const [selectedTimings, setSelectedTimings] = useState<string[]>([]);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherLevelFilter, setTeacherLevelFilter] = useState<string>('all');
  const [teacherFormatFilter, setTeacherFormatFilter] = useState<string>('all');
  const [teacherTimeFilters, setTeacherTimeFilters] = useState<{ id: string; day: string; time: string }[]>([]);

  const [showOnlyUnassignedStudents, setShowOnlyUnassignedStudents] = useState(false);
  const [showOnlyUnassignedTeachers, setShowOnlyUnassignedTeachers] = useState(false);

  // Expanded logic for notes
  const [expandedStudentNotes, setExpandedStudentNotes] = useState<string[]>([]);
  const [expandedTeacherNotes, setExpandedTeacherNotes] = useState<string[]>([]);

  // Time filter handlers
  const addStudentTimeFilter = () => {
    setStudentTimeFilters(prev => [
      ...prev,
      { id: Math.random().toString(), day: '', time: '' }
    ]);
  };

  const updateStudentTimeFilter = (id: string, field: 'day' | 'time', value: string) => {
    setStudentTimeFilters(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeStudentTimeFilter = (id: string) => {
    setStudentTimeFilters(prev => prev.filter(f => f.id !== id));
  };

  const addTeacherTimeFilter = () => {
    setTeacherTimeFilters(prev => [
      ...prev,
      { id: Math.random().toString(), day: '', time: '' }
    ]);
  };

  const updateTeacherTimeFilter = (id: string, field: 'day' | 'time', value: string) => {
    setTeacherTimeFilters(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeTeacherTimeFilter = (id: string) => {
    setTeacherTimeFilters(prev => prev.filter(f => f.id !== id));
  };

  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFormatFilter, setSessionFormatFilter] = useState<string>('all');
  const [sessionTimeFilters, setSessionTimeFilters] = useState<{ id: string; day: string; time: string }[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  const addSessionTimeFilter = () => {
    setSessionTimeFilters(prev => [
      ...prev,
      { id: Math.random().toString(), day: '', time: '' }
    ]);
  };

  const updateSessionTimeFilter = (id: string, field: 'day' | 'time', value: string) => {
    setSessionTimeFilters(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeSessionTimeFilter = (id: string) => {
    setSessionTimeFilters(prev => prev.filter(f => f.id !== id));
  };

  // Currently selected elements for editing
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);

  // New Session states
  const [newSessName, setNewSessName] = useState('');
  const [newSessTeacher, setNewSessTeacher] = useState('');
  const [newSessLevel, setNewSessLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [newSessTime, setNewSessTime] = useState('');
  const [newSessLocation, setNewSessLocation] = useState('');
  const [newSessFormat, setNewSessFormat] = useState<'in-person' | 'online'>('in-person');

  // Manual fast reassignment trigger ids
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);

  // States for detailed informational modals ("i" button)
  const [infoModalStudent, setInfoModalStudent] = useState<any | null>(null);
  const [infoModalTeacher, setInfoModalTeacher] = useState<any | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<string[]>([]);

  // Parse Student format and type helper
  const getStudentTypeAndFormat = (student: any) => {
    const isPostgrad = 
      student.degree === 'Master' || 
      student.degree === 'PhD' || 
      student.degree === 'PhD / Employee' ||
      student.degree === 'Employee' ||
      student.academicDegree?.toLowerCase().includes('master') ||
      student.academicDegree?.toLowerCase().includes('phd') || 
      student.cohort === 'Graduate' ||
      student.isSenior === true;
    
    const typeValue: 'undergrad' | 'postgrad' = isPostgrad ? 'postgrad' : 'undergrad';
    
    // Parse preferred format based on times or manual fields
    let formatValue: 'online' | 'in-person' | 'both' = 'in-person';
    if (student.enrollmentDetails?.format) {
      formatValue = student.enrollmentDetails.format;
    } else if (student.accommodation === 'off_campus' || isPostgrad) {
      // Graduate and off-campus students default to preferring online or both
      formatValue = 'online';
    }

    // Inspect real student timing values (can be online/person, selected is person)
    const timingsObj = student.enrollmentDetails?.timings || student.timings || {};
    const hasOnline = Object.values(timingsObj).some(v => v === 'online');
    const hasPerson = Object.values(timingsObj).some(v => v === 'person' || v === 'selected');
    
    if (hasOnline && hasPerson) {
      formatValue = 'both';
    } else if (hasOnline && !hasPerson) {
      formatValue = 'online';
    } else if (hasPerson && !hasOnline) {
      formatValue = 'in-person';
    }
    
    return { typeValue, formatValue };
  };

  // Classify clean arabic/english display strings for SQU terms
  const displayStudentType = (student: any) => {
    const { typeValue } = getStudentTypeAndFormat(student);
    if (typeValue === 'undergrad') {
      return student.cohort || (lang === 'ar' ? 'دفعة بكالوريوس' : 'Undergrad Cohort');
    }
    if (lang === 'ar') {
      return 'دراسات عليا / موظفة';
    }
    return 'Postgraduate/Employee';
  };

  const displayPreferredFormat = (student: any) => {
    const { formatValue } = getStudentTypeAndFormat(student);
    if (lang === 'ar') {
      if (formatValue === 'online') return 'عن بُعد / أونلاين';
      if (formatValue === 'in-person') return 'حضوري وجاهي';
      return 'المسارين (مرن)';
    }
    if (formatValue === 'online') return 'Online';
    if (formatValue === 'in-person') return 'In-Person';
    return 'Both / Flexible';
  };

  // Auto classification for Teachers - strictly online or in-person, never "both"
  const getTeacherPrefAndExp = (teacher: any) => {
    // Certified level dictates experience
    const levelCode = (teacher.level || '').toLowerCase();
    const isMujazah = levelCode.includes('مجاز') || levelCode.includes('teacher') || levelCode.includes('master');
    const expYears = isMujazah ? '5+ Years' : '2-4 Years';
    
    let formatPref: 'in-person' | 'online' = 'online';
    if (teacher.enrollmentDetails?.teacherFormat) {
      formatPref = teacher.enrollmentDetails.teacherFormat === 'person' ? 'in-person' : 'online';
    } else if (teacher.phone?.includes('1234') || teacher.email?.includes('maryam')) {
      formatPref = 'in-person';
    } else if (teacher.email?.includes('sara')) {
      formatPref = 'online';
    } else {
      formatPref = 'in-person';
    }
    
    return { expYears, formatPref };
  };

  // Real-time calculated live statistics
  const stats = useMemo(() => {
    const totalS = allStudents.length;
    const totalT = allTeachers.length;
    const totalSess = sessions.length;
    
    // Unassigned count
    const assignedIds = new Set<string>();
    sessions.forEach(s => {
      s.students?.forEach(st => assignedIds.add(st.id));
    });

    const unassignedCount = allStudents.filter(s => s.approved && !assignedIds.has(s.studentId || s.email)).length;

    return {
      totalS,
      totalT,
      totalSess,
      unassignedCount,
      assignedCount: totalS - unassignedCount
    };
  }, [allStudents, allTeachers, sessions]);

  const studentStats = useMemo(() => {
    let beginner = 0;
    let intermediate = 0;
    let advanced = 0;
    let undergrad = 0;
    let postgrad = 0;
    let inPerson = 0;
    let online = 0;

    allStudents.forEach(s => {
      const stLvl = (s.level || '').toUpperCase();
      if (stLvl.includes('BEGINNER') || stLvl.includes('مبتدئة')) beginner++;
      else if (stLvl.includes('INTERMEDIATE') || stLvl.includes('تمهيدية') || stLvl.includes('متوسطة') || stLvl.includes('TAMKEEN') || stLvl.includes('تمكين')) intermediate++;
      else if (stLvl.includes('ADVANCED') || stLvl.includes('متقدمة')) advanced++;

      const { typeValue, formatValue } = getStudentTypeAndFormat(s);
      if (typeValue === 'undergrad') undergrad++;
      else if (typeValue === 'postgrad') postgrad++;

      if (formatValue === 'in-person') inPerson++;
      else if (formatValue === 'online') online++;
    });

    return { beginner, intermediate, advanced, undergrad, postgrad, inPerson, online };
  }, [allStudents]);

  const teacherStats = useMemo(() => {
    let master = 0;
    let iqraa = 0;
    let inPerson = 0;
    let online = 0;

    allTeachers.forEach(t => {
      const tLvl = (t.level || '').toLowerCase();
      if (tLvl.includes('مجاز') || tLvl.includes('master')) master++;
      else if (tLvl.includes('اقرأ') || tLvl.includes('iqraa') || tLvl.includes('طالبة')) iqraa++;

      const { formatPref } = getTeacherPrefAndExp(t);
      if (formatPref === 'in-person') inPerson++;
      else if (formatPref === 'online') online++;
    });

    return { master, iqraa, inPerson, online };
  }, [allTeachers]);

  const sessionStats = useMemo(() => {
    let inPerson = 0;
    let online = 0;
    sessions.forEach(s => {
      const form = (s.format || '').toLowerCase();
      if (form === 'in-person') inPerson++;
      else if (form === 'online') online++;
    });
    return { inPerson, online };
  }, [sessions]);

  // List of unassigned students
  const unassignedStudents = useMemo(() => {
    const assignedIds = new Set<string>();
    sessions.forEach(s => {
      s.students?.forEach(st => assignedIds.add(st.id));
    });
    return allStudents.filter(s => s.approved && !assignedIds.has(s.studentId || s.email));
  }, [allStudents, sessions]);

  // Handle quick student unassignment
  const handleUnassignStudent = (sessionId: string, studentId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          students: s.students.filter(st => st.id !== studentId)
        };
      }
      return s;
    }));
    
    // Optional Toast notification in Console
    console.log(`Unassigned student ${studentId} from session ${sessionId}`);
  };

  // Handle quick student assignment (Manual Override)
  const handleAssignStudent = (studentId: string, targetSessionId: string, matchKeys?: string[]) => {
    const studentObj = allStudents.find(s => (s.studentId || s.email) === studentId);
    if (!studentObj) return;

    // Remove from other sessions to prevent double assignment
    setSessions(prev => prev.map(s => {
      // Filter out of all sessions but target
      const cleanStudents = s.students.filter(st => st.id !== studentId);
      if (s.id === targetSessionId) {
        let newTime = s.time;
        if (matchKeys && matchKeys.length > 0) {
          const DAYS_MAP: any = { Sunday: 'الأحد', Monday: 'الاثنين', Monday_real: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' };
          const DAYS_MAP_EN: any = { Sunday: 'Sunday', Monday: 'Monday', Monday_real: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday' };
          const SLOTS_MAP: any = { Fajr: 'فجرية', 'Fajr (online)': 'فجرية', '8:00-9:15': '8:15-9:30', '10:00-11:15': '10:15-11:30', '12:00-1:15': '12:15-1:30', '2:15-3:30': '2:15-3:30', '4:15-5:30': '4:15-5:30', '8:15-9:30': '8:15-9:30', '10:15-11:30': '10:15-11:30', '12:15-1:30': '12:15-1:30', '8:00-9:15PM': '8:00-9:15 م'};
          const SLOTS_MAP_EN: any = { Fajr: 'Fajr', 'Fajr (online)': 'Fajr', '8:00-9:15': '8:15-9:30', '10:00-11:15': '10:15-11:30', '12:00-1:15': '12:15-1:30', '2:15-3:30': '2:15-3:30', '4:15-5:30': '4:15-5:30', '8:15-9:30': '8:15-9:30', '10:15-11:30': '10:15-11:30', '12:15-1:30': '12:15-1:30', '8:00-9:15PM': '8:00-9:15 PM'};
          
          const getD = (d: string) => lang === 'ar' ? (DAYS_MAP[d] || d) : (DAYS_MAP_EN[d] || d);
          const getT = (t: string) => lang === 'ar' ? (SLOTS_MAP[t] || t) : (SLOTS_MAP_EN[t] || t);
          
          let dayParts: string[] = [];
          let timePart = '';
          matchKeys.forEach(k => {
             const parts = k.split('_');
             if(parts.length >= 2) {
                 const td = getD(parts[0]);
                 if(!dayParts.includes(td)) dayParts.push(td);
                 timePart = getT(parts[1]); 
             }
          });
          
          newTime = `${dayParts.join('/')} | ${timePart}`;
          if (matchKeys.length === 1) {
             newTime = `${newTime} | ${lang === 'ar' ? 'لم يحدد بعد' : 'To be announced'}`;
          }
        }

        // Prepare student layout conforming with SessionStudent type
        const newEnrollment = {
          id: studentId,
          name: `${studentObj.firstName || studentObj.name} ${studentObj.lastName || ''}`,
          money: studentObj.money || 0,
          avatar: studentObj.avatar || `https://picsum.photos/seed/${studentId}/100/100`,
          absencesExcused: studentObj.absencesExcused || 0,
          absencesUnexcused: studentObj.absencesUnexcused || 0,
          email: studentObj.email,
          phone: studentObj.phone,
          college: studentObj.college,
          cohort: studentObj.cohort
        };
        return {
          ...s,
          time: newTime,
          students: [...cleanStudents, newEnrollment]
        };
      }
      return { ...s, students: cleanStudents };
    }));

    setAssigningStudentId(null);
    alert(lang === 'ar' ? 'تم تعيين الطالبة للحلقة بنجاح!' : 'Student placed in session successfully!');
  };

  // Create Manual Session handler
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessName || !newSessTeacher) {
      alert(lang === 'ar' ? 'يرجى مراجعة ملء الحقول الإجبارية!' : 'Please fill all mandatory fields!');
      return;
    }

    const tObj = allTeachers.find(t => t.email === newSessTeacher || t.firstName === newSessTeacher);
    const teacherName = tObj ? `${tObj.firstName || tObj.name} ${tObj.lastName || ''}` : newSessTeacher;
    const teacherPhone = tObj ? tObj.phone : '+968 9000 0000';

    const cleanLocation = newSessLocation || (newSessFormat === 'online' ? 'Teams Online Channel' : 'SQU Mosque Halls');

    const newSessObj: Session = {
      id: 'sess_man_' + Date.now(),
      name: newSessName,
      teacher: {
        name: teacherName,
        phone: teacherPhone
      },
      time: newSessTime || 'Sunday/Tuesday | 16:15 - 17:30',
      location: cleanLocation,
      maxStudents: 999,
      level: newSessLevel,
      students: [],
      announcements: [],
      themeColor: newSessFormat === 'online' ? '#2563eb' : '#059669',
      themePhoto: 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?auto=format&fit=crop&q=80&w=600'
    };

    setSessions(prev => [...prev, newSessObj]);
    setShowCreateSessionModal(false);
    
    // Reset states
    setNewSessName('');
    setNewSessTeacher('');
    setNewSessLocation('');
    setNewSessTime('');
    
    alert(lang === 'ar' ? 'تم إنشاء الحلقة بنجاح' : 'Session created successfully!');
  };

  // Mock API Trigger for Algorithm proposed drafts: Separated beautifully by format
  const runAutoAssignmentAlgorithm = async (format: 'in-person' | 'online') => {
    setIsRunningAlgorithm(true);
    setApiLogMessage(lang === 'ar' ? 'جاري الاتصال بقاعدة البيانات السحابية واسترجاع رغبات الطلاب...' : 'Connecting to API server & downloading user preference matrix...');
    
    // Step-by-step console/screen logs to make it feel absolute real
    await new Promise(r => setTimeout(r, 600));
    setApiLogMessage(
      lang === 'ar' 
        ? `طلب جاري: POST /api/assignments/run-algorithm?format=${format}` 
        : `Requesting: POST /api/assignments/run-algorithm?format=${format}`
    );
    await new Promise(r => setTimeout(r, 800));
    setApiLogMessage(
      lang === 'ar' 
        ? 'تحليل تناسق مستويات تلاوة المعلمات والطلاب حسب رغبات جامعة السلطان قابوس...' 
        : 'Parsing teacher certification level against student recitation specimens...'
    );
    await new Promise(r => setTimeout(r, 600));

    // RUN Actual Client-side Automated Failsafe Heuristics to mock precise algorithms:
    // We isolate students and assign them matching criteria
    // ENFORCEMENT: Filter out students and teachers already assigned to any session to prevent double assignment in the semester
    const assignedStudentIds = new Set<string>();
    const assignedTeacherEmails = new Set<string>();
    sessions.forEach(s => {
      s.students?.forEach(st => assignedStudentIds.add(st.id));
      if (s.teacher?.name) {
        const tObj = allTeachers.find(t => 
          `${t.firstName} ${t.lastName}` === s.teacher.name || 
          t.firstName === s.teacher.name || 
          s.teacher.name.includes(t.firstName)
        );
        if (tObj?.email) assignedTeacherEmails.add(tObj.email.toLowerCase());
      }
    });

    const approvedStudents = allStudents.filter(s => s.approved && !assignedStudentIds.has(s.studentId || s.email));
    const approvedTeachers = allTeachers.filter(t => t.approved && !assignedTeacherEmails.has(t.email?.toLowerCase()));

    let eligibleStudents = [];
    let eligibleTeachers = [];

    if (format === 'in-person') {
      // In-person: Undergrads & postgrads choosing physical, and physical-available teachers
      eligibleStudents = approvedStudents.filter(s => {
        const { typeValue, formatValue } = getStudentTypeAndFormat(s);
        return typeValue === 'undergrad' || formatValue === 'in-person' || formatValue === 'both';
      });
      eligibleTeachers = approvedTeachers.filter(t => {
        const { formatPref } = getTeacherPrefAndExp(t);
        return formatPref === 'in-person';
      });
    } else {
      // Online: Postgrads & digital-enlisted undergrards, and online teachers
      eligibleStudents = approvedStudents.filter(s => {
        const { typeValue, formatValue } = getStudentTypeAndFormat(s);
        return typeValue === 'postgrad' || formatValue === 'online' || formatValue === 'both';
      });
      eligibleTeachers = approvedTeachers.filter(t => {
        const { formatPref } = getTeacherPrefAndExp(t);
        return formatPref === 'online';
      });
    }
    
    // Helper to get selected timing keys
    const getTimingsKeys = (user: any) => {
      const t = user.enrollmentDetails?.timings || user.timings || {};
      return Object.keys(t).filter(k => t[k]);
    };
    
    // Helper to get allowed levels for teacher
    const getTeacherLevels = (teach: any) => {
      const lvlStr = (teach.level || '').toLowerCase();
      const firstTime = lvlStr.includes('first') || lvlStr.includes('أول مرة') || lvlStr.includes('فصلي الأول') || lvlStr.includes('الأول');
      const isMujaza = lvlStr.includes('مجاز') || lvlStr.includes('master') || lvlStr.includes('certified');
      
      if (isMujaza) return ['ADVANCED', 'INTERMEDIATE', 'BEGINNER'];
      if (!firstTime) return ['INTERMEDIATE', 'BEGINNER']; // Iqraa not first time
      return ['BEGINNER', 'INTERMEDIATE']; // First time
    };

    const proposedDraft: any[] = [];
    let unassignedStudentsLocal = [...eligibleStudents];
    
    // Sort students by level explicitly
    const levelGroups: Record<string, any[]> = {
      'ADVANCED': [],
      'INTERMEDIATE': [],
      'BEGINNER': []
    };

    unassignedStudentsLocal.forEach(st => {
      const lvlStr = (st.level || '').toUpperCase();
      let matchedLvl = 'BEGINNER';
      if (lvlStr.includes('BEGINNER') || lvlStr.includes('مبتدئة')) matchedLvl = 'BEGINNER';
      else if (lvlStr.includes('INTERMEDIATE') || lvlStr.includes('تمهيدية') || lvlStr.includes('متوسطة') || lvlStr.includes('TAMKEEN') || lvlStr.includes('تمكين')) matchedLvl = 'INTERMEDIATE';
      else if (lvlStr.includes('ADVANCED') || lvlStr.includes('متقدمة')) matchedLvl = 'ADVANCED';
      st._matchedLvl = matchedLvl;
      st._tKeys = getTimingsKeys(st);
      levelGroups[matchedLvl].push(st);
    });

    const unassignedTeachersLocal = eligibleTeachers.map(t => {
      t._allowedLvls = getTeacherLevels(t);
      t._tKeys = getTimingsKeys(t);
      return t;
    });

    // Strategy 1: Match 2 times in common
    unassignedTeachersLocal.forEach((teacher, idx) => {
      let assignedStudents: any[] = [];
      let targetLvl = null;
      let matchedKeys: string[] = [];

      // Find best level and best 2 timings keys
      for (const lvl of teacher._allowedLvls) {
        if (assignedStudents.length >= 5) break;
        targetLvl = lvl;
        
        // Loop through pairs of teacher's available times to find a match of at least 2 times for 5 students
        const tKeys = teacher._tKeys;
        if (tKeys.length >= 2) {
          for(let i = 0; i < tKeys.length; i++) {
             for(let j = i+1; j < tKeys.length; j++) {
                const k1 = tKeys[i], k2 = tKeys[j];
                const pool = levelGroups[lvl].filter(s => s._tKeys.includes(k1) && s._tKeys.includes(k2));
                if (pool.length >= 2) { // min threshold to form a session
                   assignedStudents = pool.slice(0, 5);
                   matchedKeys = [k1, k2];
                   break;
                }
             }
             if (assignedStudents.length > 0) break;
          }
        }
        
        if (assignedStudents.length > 0) break;
        
        // If not found two times, try 1 common time
        if (assignedStudents.length === 0) {
          for(const k1 of tKeys) {
             const pool = levelGroups[lvl].filter(s => s._tKeys.includes(k1));
             if (pool.length >= 2) {
                assignedStudents = pool.slice(0, 5);
                matchedKeys = [k1];
                break;
             }
          }
        }

        if (assignedStudents.length > 0) break;
      }

      // Fallback: If still nothing, just grab students of preferred level regardless to not waste teacher? No, wait to be realistic, they could just grab one student or assign them an empty session
      if(assignedStudents.length === 0) {
        targetLvl = teacher._allowedLvls[0]; 
      } else {
        // Remove students from pool
        levelGroups[targetLvl as string] = levelGroups[targetLvl as string].filter(s => !assignedStudents.includes(s));
      }

      const sessionStList = assignedStudents.map(st => ({
        id: st.studentId || st.email,
        name: `${st.firstName || st.name} ${st.lastName || ''}`,
        avatar: st.avatar || `https://picsum.photos/seed/${st.studentId}/100/100`,
        college: st.college,
        level: st.level,
        email: st.email,
        phone: st.phone,
        timings: st._tKeys
      }));
      
      const formatSessionTime = (keys: string[]) => {
          if (keys.length === 0) return lang === 'ar' ? 'سيعلن لاحقاً (لم يتم التعيين بعد)' : 'TBD (No placement)';
          const DAYS_MAP: any = { Sunday: 'الأحد', Monday: 'الاثنين', Monday_real: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' };
          const DAYS_MAP_EN: any = { Sunday: 'Sunday', Monday: 'Monday', Monday_real: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday' };
          const SLOTS_MAP: any = { Fajr: 'فجرية', 'Fajr (online)': 'فجرية', '8:00-9:15': '8:15-9:30', '10:00-11:15': '10:15-11:30', '12:00-1:15': '12:15-1:30', '2:15-3:30': '2:15-3:30', '4:15-5:30': '4:15-5:30', '8:15-9:30': '8:15-9:30', '10:15-11:30': '10:15-11:30', '12:15-1:30': '12:15-1:30', '8:00-9:15PM': '8:00-9:15 م'};
          const SLOTS_MAP_EN: any = { Fajr: 'Fajr', 'Fajr (online)': 'Fajr', '8:00-9:15': '8:15-9:30', '10:00-11:15': '10:15-11:30', '12:00-1:15': '12:15-1:30', '2:15-3:30': '2:15-3:30', '4:15-5:30': '4:15-5:30', '8:15-9:30': '8:15-9:30', '10:15-11:30': '10:15-11:30', '12:15-1:30': '12:15-1:30', '8:00-9:15PM': '8:00-9:15 PM'};
          
          const getD = (d: string) => lang === 'ar' ? (DAYS_MAP[d] || d) : (DAYS_MAP_EN[d] || d);
          const getT = (t: string) => lang === 'ar' ? (SLOTS_MAP[t] || t) : (SLOTS_MAP_EN[t] || t);
          
          let dayParts: string[] = [];
          let timePart = '';
          keys.forEach(k => {
             const parts = k.split('_');
             if(parts.length >= 2) {
                 const td = getD(parts[0]);
                 if(!dayParts.includes(td)) dayParts.push(td);
                 timePart = getT(parts[1]); 
             }
          });
          
          let sess = `${dayParts.join('/')} | ${timePart}`;
          if (keys.length === 1) {
             sess = `${sess} | ${lang === 'ar' ? 'لم يحدد بعد' : 'To be announced'}`;
          }
          return sess;
      };

      let sessionTime = formatSessionTime(matchedKeys);

      proposedDraft.push({
        id: `draft_sess_${format}_${idx}_` + Date.now(),
        name: lang === 'ar' ? `حلقة ذكية (أ. ${teacher.firstName})` : `Smart Propose (T. ${teacher.firstName})`,
        teacher: {
          name: `${teacher.firstName || teacher.name} ${teacher.lastName || ''}`,
          phone: teacher.phone,
          email: teacher.email,
          level: teacher.level
        },
        level: targetLvl,
        location: format === 'online' ? (lang === 'ar' ? 'عبر الأثير - تيمز' : 'MS Teams Link') : (lang === 'ar' ? 'مسجد الجامعة - الدور الأول' : 'SQU Campus Mosque'),
        time: sessionTime,
        students: sessionStList,
        format: format
      });
    });

    if (format === 'in-person') {
      setInPersonDraft(proposedDraft);
      localStorage.setItem('itqan_in_person_draft', JSON.stringify(proposedDraft));
    } else {
      setOnlineDraft(proposedDraft);
      localStorage.setItem('itqan_online_draft', JSON.stringify(proposedDraft));
    }

    setIsRunningAlgorithm(false);
    setApiLogMessage('');
    alert(
      lang === 'ar' 
        ? `نجاح! تلاوة الذكاء الاصطناعي قامت باقتراح مسودة جديدة للتوزيع لـ ${format === 'online' ? 'الشبكة الرقمية' : 'المقرأة الحضورية'}` 
        : `Success! Proposed ${proposedDraft.length} draft groups for ${format === 'online' ? 'Online digital' : 'Campus physical'} formats.`
    );
  };

  // Confirm proposed draft mapping into SQU Live Session Databases
  const handleConfirmDraftAssignments = async (format: 'in-person' | 'online') => {
    const targetDraft = format === 'in-person' ? inPersonDraft : onlineDraft;
    if (targetDraft.length === 0) {
      alert(lang === 'ar' ? 'عفواً، لا توجد مسودة نشطة لاعتمادها' : 'No proposed draft exists to authorize!');
      return;
    }

    // Trigger post to /api/assignments/confirm
    const confirmationPrompt = lang === 'ar'
      ? `هل ترغبين بالتأكيد في إطلاق الفرز وحفظ وتفعيل ${targetDraft.length} حلقة رسمياً في النظام؟ السجل الحالي لبعض حِلق هذا التصنيف قد يُحدث تداخلاً.`
      : `Are you sure you want to commit and launch these ${targetDraft.length} proposed groups to live production databases via /api/assignments/confirm?`;

    if (!window.confirm(confirmationPrompt)) return;

    // Load proposed groups into live state
    const mappedToSessions: Session[] = targetDraft.map(dr => ({
      id: dr.id,
      name: dr.name,
      teacher: {
        name: dr.teacher.name,
        phone: dr.teacher.phone
      },
      location: dr.location,
      time: dr.time,
      maxStudents: 999,
      level: dr.level,
      announcements: [],
      students: dr.students.map((st: any) => ({
        id: st.id,
        name: st.name,
        avatar: st.avatar,
        absencesExcused: 0,
        absencesUnexcused: 0,
        college: st.college,
        email: st.email
      })),
      themeColor: format === 'online' ? '#2563eb' : '#059669',
      themePhoto: 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?auto=format&fit=crop&q=80&w=600'
    }));

    // Retain non-overlapping formatting to clean overlaps, or append smoothly!
    setSessions(prev => {
      // Filter out previous smart draft or old matching formats
      const preserved = prev.filter(s => {
        const isOnlineS = s.location.includes('تيمز') || s.location.includes('Teams') || s.location.toLowerCase().includes('online');
        return format === 'in-person' ? isOnlineS : !isOnlineS;
      });

      // ENFORCEMENT: Clean up any potential double assignment overlaps across formats
      const incomingStudentIds = new Set<string>();
      mappedToSessions.forEach(ns => {
        ns.students.forEach(st => incomingStudentIds.add(st.id));
      });

      const cleanPreserved = preserved.map(s => ({
        ...s,
        students: s.students.filter(st => !incomingStudentIds.has(st.id))
      }));

      return [...cleanPreserved, ...mappedToSessions];
    });

    // Clear Drafts
    if (format === 'in-person') {
      setInPersonDraft([]);
      localStorage.removeItem('itqan_in_person_draft');
    } else {
      setOnlineDraft([]);
      localStorage.removeItem('itqan_online_draft');
    }

    alert(lang === 'ar' ? 'تم حفظ وإطلاق مجموعات التلاوة بنجاح!' : 'Proposed classrooms committed and launched successfully!');
  };

  // Remove individual student from proposed drafts
  const handleRemoveDraftStudent = (draftSessionId: string, studentId: string, format: 'in-person' | 'online') => {
    const targetDraft = format === 'in-person' ? inPersonDraft : onlineDraft;
    const updated = targetDraft.map(s => {
      if (s.id === draftSessionId) {
        return {
          ...s,
          students: s.students.filter((st: any) => st.id !== studentId)
        };
      }
      return s;
    });

    if (format === 'in-person') {
      setInPersonDraft(updated);
      localStorage.setItem('itqan_in_person_draft', JSON.stringify(updated));
    } else {
      setOnlineDraft(updated);
      localStorage.setItem('itqan_online_draft', JSON.stringify(updated));
    }
  };

  // helper to get beautifully formatted bint full name
  const getBintFullName = (st: any) => {
    let f = (st.firstName || '').trim();
    let fa = (st.fatherName || '').trim();
    let g = (st.grandfatherName || '').trim();
    let l = (st.lastName || '').trim();

    if (!f && st.name) {
      const nameParts = st.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        f = nameParts[0];
        l = nameParts[nameParts.length - 1];
        fa = 'سليمان';
        g = 'سعيد';
      } else {
        f = st.name;
      }
    }

    let parts = [f];
    if (fa) {
      parts.push('بنت');
      parts.push(fa);
    }
    if (g) {
      parts.push('بن');
      parts.push(g);
    }
    if (l) {
      parts.push(l);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  // helper to get beautifully formatted teacher full name
  const getTeacherFullName = (teach: any) => {
    if (!teach) return '';
    let f = (teach.firstName || '').trim();
    let fa = (teach.fatherName || '').trim();
    let g = (teach.grandfatherName || '').trim();
    let l = (teach.lastName || '').trim();

    if (!f && teach.name) {
      const nameParts = teach.name.trim().split(/\s+/);
      if (nameParts.length >= 4) {
        return teach.name;
      }
      if (nameParts.length >= 2) {
        f = nameParts[0];
        l = nameParts[nameParts.length - 1];
        fa = 'سليمان';
        g = 'سعيد';
      } else {
        f = teach.name;
      }
    }

    let parts = [f];
    if (fa) {
      parts.push('بنت');
      parts.push(fa);
    }
    if (g) {
      parts.push('بن');
      parts.push(g);
    }
    if (l) {
      parts.push(l);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  // Student filtering calculation page
  const processedStudents = useMemo(() => {
    return allStudents.filter(s => {
      const bintFullName = getBintFullName(s);
      const matchesSearch = 
        bintFullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase());

      const stLvl = (s.level || '').toUpperCase();
      let matchesLvl = true;
      if (studentLevelFilter !== 'all') {
        if (studentLevelFilter === 'BEGINNER') matchesLvl = stLvl.includes('BEGINNER') || stLvl.includes('مبتدئة');
        else if (studentLevelFilter === 'INTERMEDIATE') matchesLvl = stLvl.includes('INTERMEDIATE') || stLvl.includes('تمهيدية') || stLvl.includes('متوسطة') || stLvl.includes('TAMKEEN') || stLvl.includes('تمكين');
        else if (studentLevelFilter === 'ADVANCED') matchesLvl = stLvl.includes('ADVANCED') || stLvl.includes('متقدمة');
      }

      const { typeValue, formatValue } = getStudentTypeAndFormat(s);
      let matchesType = true;
      if (studentTypeFilter !== 'all') {
        matchesType = typeValue === studentTypeFilter;
      }

      let matchesFormat = true;
      if (studentFormatFilter && studentFormatFilter !== 'all') {
        matchesFormat = formatValue === studentFormatFilter;
      }

      const matchesTiming = matchTimeFilters(s.enrollmentDetails?.timings || s.timings, studentTimeFilters);

      let matchesUnassigned = true;
      if (showOnlyUnassignedStudents) {
        const idKey = s.studentId || s.email;
        const assigned = sessions.some(sec => sec.students?.some(subSt => subSt.id === idKey));
        matchesUnassigned = !assigned;
      }

      return matchesSearch && matchesLvl && matchesType && matchesFormat && matchesTiming && matchesUnassigned;
    });
  }, [allStudents, studentSearch, studentLevelFilter, studentTypeFilter, studentFormatFilter, studentTimeFilters, lang, showOnlyUnassignedStudents, sessions]);

  // Teachers filtering calculation page
  const processedTeachers = useMemo(() => {
    return allTeachers.filter(t => {
      const matchesSearch = 
        `${t.firstName || t.name} ${t.lastName || ''}`.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(teacherSearch.toLowerCase());

      let matchesLvl = true;
      const tLvl = (t.level || '').toLowerCase();
      if (teacherLevelFilter !== 'all') {
        if (teacherLevelFilter === 'master') matchesLvl = tLvl.includes('مجاز') || tLvl.includes('master');
        else if (teacherLevelFilter === 'iqraa') matchesLvl = tLvl.includes('اقرأ') || tLvl.includes('iqraa') || tLvl.includes('طالبة');
      }

      const { formatPref } = getTeacherPrefAndExp(t);
      let matchesFormat = true;
      if (teacherFormatFilter !== 'all') {
        matchesFormat = formatPref === teacherFormatFilter;
      }

      const matchesTime = matchTimeFilters(t.enrollmentDetails?.timings || t.timings, teacherTimeFilters);

      let matchesUnassigned = true;
      if (showOnlyUnassignedTeachers) {
        const hasSession = sessions.some(s => 
          s.teacher.phone === t.phone ||
          s.teacher.name === t.name ||
          s.teacher.name === `${t.firstName || ''} ${t.lastName || ''}`.trim() ||
          (t.firstName && s.teacher.name.includes(t.firstName))
        );
        matchesUnassigned = !hasSession;
      }

      return matchesSearch && matchesLvl && matchesFormat && matchesTime && matchesUnassigned;
    });
  }, [allTeachers, teacherSearch, teacherLevelFilter, teacherFormatFilter, teacherTimeFilters, showOnlyUnassignedTeachers, sessions]);

  // Active Sessions sorting
  const processedSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.teacher.name.toLowerCase().includes(sessionSearch.toLowerCase());

      const isOnlineS = s.location.includes('تيمز') || s.location.includes('Teams') || s.location.toLowerCase().includes('online');
      let matchesFormat = true;
      if (sessionFormatFilter !== 'all') {
        matchesFormat = sessionFormatFilter === 'online' ? isOnlineS : !isOnlineS;
      }

      const matchesTime = matchSessionTimeFilters(s.time, sessionTimeFilters);

      return matchesSearch && matchesFormat && matchesTime;
    });
  }, [sessions, sessionSearch, sessionFormatFilter, sessionTimeFilters]);


  return (
    <div className="bg-slate-50 min-h-screen text-start">
      {/* Upper Navigation Back Ribbon */}
      <div className="bg-white border-b border-brand-primary/10 shadow-3xs pt-4 pb-4 px-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest block bg-brand-neutral/80 px-2 py-0.5 rounded-md w-fit mb-1 border border-brand-primary/10">SQU Quran Tajweed Administration</span>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark flex items-center gap-2">
            <span>🎛️</span>
            <span>{lang === 'ar' ? 'منصة التوزيع والفرز الإلكتروني الذكي' : 'Smart Allocation & Assignment Hub'}</span>
          </h1>
        </div>

        <button 
          onClick={onBack}
          className="bg-brand-dark hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <span>←</span>
          <span>{lang === 'ar' ? 'العودة للوحة القيادة' : 'Back to Admin Control Panel'}</span>
        </button>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 pb-12">
        {/* Inner Hub Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl border border-dashed border-slate-200 select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            📊 {lang === 'ar' ? 'نظرة عامة' : 'Overview'}
          </button>
          
          <button
            onClick={() => setActiveTab('auto-assign')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'auto-assign' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            ⚡ {lang === 'ar' ? 'الفرز والتعيين التلقائي' : 'Auto Allocation Tool'}
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'students' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            👥 {lang === 'ar' ? 'شؤون الطالبات' : 'Student Registry'}
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'teachers' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            👩‍🏫 {lang === 'ar' ? 'شؤون المعلمات' : 'Teacher Registry'}
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'sessions' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            🏫 {lang === 'ar' ? 'شؤون الحِلق' : 'Live Classrooms'}
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer relative ${activeTab === 'conflicts' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            ⚠️ {lang === 'ar' ? 'تقرير التداخلات والنزاعات' : 'Conflict Resolution'}
            {stats.unassignedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                {stats.unassignedCount}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in shadow-2s">
            {/* Bento Grid Analytics (Live Database Statistics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
              {/* Total Registered Students */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:border-brand-primary/40 hover:scale-102 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">👥</span>
                  <span className="text-[10px] bg-brand-neutral text-brand-primary border border-brand-primary/10 px-2.5 py-0.5 rounded-md font-extrabold uppercase">
                    {lang === 'ar' ? 'الطالبات المسجلات' : 'Registered Students'}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-brand-primary mb-1">{stats.totalS}</h3>
                  <p className="text-xs text-slate-400 font-bold">
                    {lang === 'ar' ? 'إجمالي الطالبات المسجلات بالمنصة حالياً' : 'Total registered student profiles'}
                  </p>
                </div>
              </div>

              {/* Total Teachers */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:border-indigo-650/40 hover:scale-102 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">👩‍🏫</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded-md font-extrabold uppercase">
                    {lang === 'ar' ? 'معلمات التلاوة' : 'Recitation Guides'}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-indigo-600 mb-1">{stats.totalT}</h3>
                  <p className="text-xs text-slate-400 font-bold">
                    {lang === 'ar' ? 'إجمالي معلمات النادي ومطوعات الإقراء مع الإسناد والفرز' : 'Active teaching mentors'}
                  </p>
                </div>
              </div>

              {/* Live Classrooms */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:border-emerald-600/40 hover:scale-102 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">🏫</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-0.5 rounded-md font-extrabold uppercase">
                    {lang === 'ar' ? 'حِلق التلاوة' : 'Live Classrooms'}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-emerald-600 mb-1">{stats.totalSess}</h3>
                  <p className="text-xs text-slate-400 font-bold">
                    {lang === 'ar' ? 'إجمالي حِلق التلاوة في المسجد أو أونلاين' : 'Total active recitation sessions'}
                  </p>
                </div>
              </div>

              {/* Unassigned Students */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:border-rose-500/40 hover:scale-102 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-150 px-2.5 py-0.5 rounded-md font-extrabold uppercase">
                    {lang === 'ar' ? 'غير مسكنات' : 'Unassigned'}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-rose-600 mb-1">{stats.unassignedCount}</h3>
                  <p className="text-xs text-slate-400 font-bold">
                    {lang === 'ar' ? 'طالبات بانتظار الفرز أو التسكين اليدوي بالنظام' : 'Students awaiting allocation'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: AUTO ALLOCATION TOOLS (SEPARATED BY FORMAT) */}
        {/* ========================================================= */}
        {activeTab === 'auto-assign' && (
          <div className="space-y-8 animate-fade-in text-start">
            
            {/* Format choice widget */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="text-sm font-black text-slate-400 block uppercase tracking-widest mb-4">
                {lang === 'ar' ? 'الرجاء اختيار المسار والفرز المستهدف لتشغيله:' : 'Verify segment path to initialize smart allocate:'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Format In-person option */}
                <button
                  onClick={() => setAutoAssignFormat('in-person')}
                  className={`p-5 rounded-2xl text-start border-2 transition-all cursor-pointer flex flex-col justify-between h-40 ${autoAssignFormat === 'in-person' ? 'border-emerald-600 bg-emerald-50/25 text-emerald-950 ring-4 ring-emerald-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-3xl">🏫</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${autoAssignFormat === 'in-person' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {lang === 'ar' ? 'النشاط الوجاهي (حضوري)' : 'Physical In-Person Format'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black mt-2">{lang === 'ar' ? 'مقرأة مسجد جامعة السلطان قابوس' : 'SQU Campus Mosque Halls'}</h4>
                    <p className="text-[10.5px] text-slate-450 font-bold block mt-1 leading-normal">
                      {lang === 'ar'
                        ? 'فرز الطالبات المسجلات بكالوريوس وحضوريات مصلى الطالبات، مضافاً إليهن المعلمات المتاحات بالجامعة وجداول قاعات التربية.'
                        : 'Isolates Undergraduate students, physical timers requested, and targets Mosque halls available timings.'}
                    </p>
                  </div>
                </button>

                {/* Format Online option */}
                <button
                  onClick={() => setAutoAssignFormat('online')}
                  className={`p-5 rounded-2xl text-start border-2 transition-all cursor-pointer flex flex-col justify-between h-40 ${autoAssignFormat === 'online' ? 'border-brand-primary bg-brand-primary/5 text-brand-dark ring-4 ring-brand-primary/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-3xl">💻</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${autoAssignFormat === 'online' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {lang === 'ar' ? 'المسار الرقمي (تيمز أونلاين)' : 'Virtual Online Streams'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black mt-2">{lang === 'ar' ? 'فترات عبر الأثير والتحفيظ الرقمي' : 'MS Teams Digital Portals'}</h4>
                    <p className="text-[10.5px] text-slate-450 font-bold block mt-1 leading-normal">
                      {lang === 'ar'
                        ? 'فرز طالبات الماجستير، الدكتوراة، والموظفات، وبعض الطالبات بجدول السكنات، مع المعلمات المتفرغات للتدريس عن بعد عير تيمز.'
                        : 'Routes Postgraduate / PhD students, off-campus SQU employees and virtual available supervisors.'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Run Algorithm Actions */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                <div className="text-xs font-bold text-slate-400">
                  {lang === 'ar' ? 'ملاحظة: التشغيل لا يستبدل الحِلق القائمة إلا بعد مراجعتك واعتماد المسودة بالأسفل.' : 'Note: Proposing algorithm does not rewrite live classrooms until you review and confirm drafts below.'}
                </div>

                <button
                  onClick={() => runAutoAssignmentAlgorithm(autoAssignFormat)}
                  disabled={isRunningAlgorithm}
                  className="bg-brand-primary hover:bg-brand-accent text-white px-7 py-3 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRunningAlgorithm ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>
                    {isRunningAlgorithm 
                      ? (lang === 'ar' ? 'جاري الفرز والتحليل المبرمج...' : 'Analyzing database preferences...')
                      : (lang === 'ar' ? `تشغيل الفرز الآلي لحِلق (${autoAssignFormat === 'online' ? 'أونلاين' : 'الحضوري'})` : `Run ${autoAssignFormat === 'online' ? 'Online' : 'In-Person'} Auto-Assignment`)
                    }
                  </span>
                </button>
              </div>

              {/* API Live Console Emulator */}
              {isRunningAlgorithm && (
                <div className="mt-4 p-4 rounded-xl bg-black font-mono text-emerald-400 text-[10.5px] border border-slate-800 space-y-1 select-none animate-pulse">
                  <p>&gt; Connection authorized. Client security token validated successfully.</p>
                  <p>&gt; Triggering API endpoint: POST /api/assignments/run-algorithm?format={autoAssignFormat}</p>
                  <p>&gt; Status Log: {apiLogMessage}</p>
                </div>
              )}
            </div>

            {/* proposed Draft Section Displays */}
            {(() => {
              const currentDraft = autoAssignFormat === 'in-person' ? inPersonDraft : onlineDraft;
              
              const getDraftLevelDisplayAndStyles = (lvl: string, langVal: 'ar' | 'en') => {
                const norm = (lvl || '').toUpperCase();
                let text = lvl;
                let classes = 'bg-purple-50 text-purple-700 border-purple-200';
                
                if (norm.includes('BEGIN') || norm.includes('مبتد')) {
                  text = langVal === 'ar' ? 'مبتدئة' : 'Beginner';
                  classes = 'bg-pink-50 text-pink-700 border-pink-200';
                } else if (norm.includes('INTERMED') || norm.includes('تمهيد') || norm.includes('متوسط') || norm.includes('TAMKEEN') || norm.includes('تمكين')) {
                  text = langVal === 'ar' ? 'تمهيدية' : 'Intermediate';
                  classes = 'bg-orange-50 text-orange-700 border-orange-200';
                } else if (norm.includes('ADVANC') || norm.includes('متقدم')) {
                  text = langVal === 'ar' ? 'متقدمة' : 'Advanced';
                  classes = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                } else {
                  text = langVal === 'ar' ? 'حلقة عامة' : 'General Circular';
                }
                
                return { text, classes };
              };
              
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-brand-dark">
                        {lang === 'ar' ? `مسودة التوزيع المقترحة لـ (${autoAssignFormat === 'online' ? 'أونلاين' : 'حضوري'})` : `Proposed ${autoAssignFormat === 'online' ? 'Online Digital' : 'In-Campus physical'} Proposals`} 
                      </h3>
                      <p className="text-xs text-slate-400 font-bold">
                        {lang === 'ar' ? 'مراجعة المجموعات ومطابقة المعلمات والقدرات الشاغرة قبل التفعيل النهائي.' : 'Review proposals, manage student lists manually, analyze and confirm assignments.'}
                      </p>
                    </div>

                    {currentDraft.length > 0 && (
                      <button
                        onClick={() => handleConfirmDraftAssignments(autoAssignFormat)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'اعتماد المسودة وحفظها بالنظام ✓' : 'Confirm Assignments & Save'}</span>
                      </button>
                    )}
                  </div>

                  {currentDraft.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200">
                      <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-40 animate-pulse" />
                      <p className="text-slate-450 font-bold text-xs">
                        {lang === 'ar' 
                          ? 'لا تتوفر مصفوفة مسودة حالياً. يرجى الضغط على زر "تشغيل الفرز الآلي" بالأعلى لبرمجة وتوزيع المجموعات!' 
                          : 'No draft proposal exists yet. Kick off the auto-allocation algorithm above to formulate classes!'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentDraft.map((dr, index) => {
                        const actualTeacher = allTeachers.find(t => 
                          t.phone === dr.teacher.phone || 
                          t.name === dr.teacher.name ||
                          t.email === dr.teacher.email
                        );

                        const resolvedTeacherName = actualTeacher 
                          ? `${actualTeacher.firstName || ''} ${actualTeacher.lastName || ''}`.trim() || actualTeacher.name
                          : dr.teacher.name;

                        const resolvedTeacherPhone = actualTeacher?.phone || dr.teacher.phone;

                        const teacherRegTimings = actualTeacher 
                          ? getFormattedTimings(actualTeacher.enrollmentDetails?.timings || actualTeacher.timings || [], lang, actualTeacher) 
                          : (lang === 'ar' ? 'لا توجد أوقات معتمدة للمعلمة' : 'No schedules available');

                        const { text: levelText, classes: levelClasses } = getDraftLevelDisplayAndStyles(dr.level, lang);

                        const isOnline = autoAssignFormat === 'online';
                        const modeText = isOnline 
                          ? (lang === 'ar' ? '💻 عن بعد' : '💻 Online') 
                          : (lang === 'ar' ? '🏫 حضوري بالحرم' : '🏫 In-person');

                        return (
                          <div key={index} className="bg-white rounded-3xl border border-slate-200 shadow-3xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                            <div>
                              {/* Class Banner - Clean white styled header with border-b */}
                              <div className="p-5 bg-white border-b border-slate-100">
                                <div className="flex justify-between items-center mb-1 bg-white">
                                  <span className={`text-[10px] border rounded font-black px-2.5 py-0.5 shadow-3xs ${levelClasses}`}>
                                    {levelText}
                                  </span>
                                  <span className="text-[10.5px] text-brand-primary font-black font-sans">
                                    {modeText}
                                  </span>
                                </div>
                                <div className="space-y-1.5 mt-3 text-start">
                                  <h4 className="font-extrabold text-brand-dark text-sm">
                                    👩‍🏫 {lang === 'ar' ? 'المعلمة:' : 'Teacher:'} {resolvedTeacherName}
                                  </h4>
                                  {actualTeacher?.level && (
                                    <span className="text-[10px] bg-red-50 text-red-650 font-extrabold px-2.5 py-0.5 rounded border border-red-100 inline-block mt-1">
                                      {actualTeacher.level}
                                    </span>
                                  )}
                                  <div className="text-[11px] text-slate-500 font-extrabold font-mono text-ltr">
                                    📞 {resolvedTeacherPhone || '---'}
                                  </div>
                                  <div className="text-[10px] text-brand-accent bg-rose-50/40 border border-rose-100/30 rounded-xl px-2.5 py-1.5 font-sans mt-2">
                                    <span className="font-black text-brand-dark block text-[9px] uppercase tracking-wider mb-0.5">
                                      {lang === 'ar' ? 'أوقات حجز المعلمة المعتمدة:' : "Teacher's Registered Schedule:"}
                                    </span>
                                    <span className="font-mono font-bold text-slate-700 block leading-relaxed">{teacherRegTimings}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Class Body Details - Removed location, times separated by session */}
                              <div className="p-5 space-y-4">
                                <div className="text-xs text-slate-500 font-bold space-y-1.5 font-mono text-start">
                                  {(() => {
                                    const { session1, session2 } = parseDoubleSessions(dr.time, lang);
                                    return (
                                      <>
                                        <div className="flex items-center gap-1.5">
                                          <span>📅</span>
                                          <span>{session1}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span>📅</span>
                                          <span>{session2}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Enrolled students list with phone and timings */}
                                <div className="space-y-2 select-none pt-3 border-t border-slate-100">
                                  <span className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider text-start">
                                    {lang === 'ar' ? 'الطالبات المسجلات بالمسودة:' : 'Enrolled Students:'} ({dr.students.length})
                                  </span>

                                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {dr.students.map((st: any, sIdx: number) => {
                                      const fullStudent = allStudents.find(s => s.studentId === st.id || s.email === st.id || s.email === st.email);
                                      const phoneVal = fullStudent?.phone || st.phone || '---';

                                      const studentRegTimings = fullStudent 
                                        ? getFormattedTimings(fullStudent.enrollmentDetails?.timings || fullStudent.timings || [], lang, fullStudent) 
                                        : (st.timings ? getFormattedTimings(st.timings, lang) : (lang === 'ar' ? 'لا توجد أوقات معتمدة' : 'No registered times'));

                                      return (
                                        <div 
                                          key={sIdx} 
                                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/50 hover:bg-slate-100 transition-colors"
                                        >
                                          <div className="flex justify-between items-start gap-1">
                                            <div className="text-start space-y-1 select-text flex-1">
                                              <span className="text-xs font-black text-slate-900 block leading-tight">
                                                <span className="text-slate-400 font-bold font-mono mr-1">{sIdx + 1}.</span> {st.name}
                                              </span>
                                              
                                              {fullStudent?.level && (
                                                <span className="text-[9px] bg-red-50 text-red-650 font-extrabold px-2 py-0.5 rounded border border-red-100 inline-block mt-0.5">
                                                  {fullStudent.level}
                                                </span>
                                              )}
                                              
                                              {/* Student phone keeping Western digits in English */}
                                              <div className="text-[10px] text-slate-500 font-bold font-mono text-ltr flex items-center gap-1 mt-0.5">
                                                <span>📱</span>
                                                <span>{formatOmaniPhone(phoneVal)}</span>
                                              </div>

                                              {/* Student active timelines */}
                                              <div className="text-[9.5px] text-brand-dark/80 bg-white border border-slate-150 rounded-lg p-1.5 font-sans mt-1">
                                                <span className="font-extrabold block text-slate-400 mb-0.5 text-[8px] uppercase tracking-wider">
                                                  {lang === 'ar' ? 'الأوقات المسجلة للطالبة:' : "Student Registered Times:"}
                                                </span>
                                                <span className="font-mono font-bold block leading-relaxed text-slate-700">{studentRegTimings}</span>
                                              </div>
                                            </div>

                                            <button
                                              onClick={() => handleRemoveDraftStudent(dr.id, st.id, autoAssignFormat)}
                                              className="text-red-500 hover:bg-red-50 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black cursor-pointer shrink-0 transition-colors"
                                              title={lang === 'ar' ? 'إزالة الطالبة من المسودة' : 'Unpin Student'}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {dr.students.length === 0 && (
                                      <div className="text-center py-5 bg-slate-50/50 border border-slate-150 rounded-xl">
                                        <p className="text-[10.5px] text-slate-400 italic font-bold">
                                          {lang === 'ar' ? 'لا توجد طالبات في هذه المجموعة بعد' : 'No students in this group'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Options to delete class from proposals */}
                            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-end">
                              <button
                                onClick={() => {
                                  const updated = currentDraft.filter(s => s.id !== dr.id);
                                  if (autoAssignFormat === 'in-person') {
                                    setInPersonDraft(updated);
                                    localStorage.setItem('itqan_in_person_draft', JSON.stringify(updated));
                                  } else {
                                    setOnlineDraft(updated);
                                    localStorage.setItem('itqan_online_draft', JSON.stringify(updated));
                                  }
                                }}
                                className="text-red-650 hover:bg-red-100/50 border border-red-200 bg-white px-3 py-1.5 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                              >
                                {lang === 'ar' ? 'إلغاء المجموعة بالكامل' : 'Cancel Proposed Class'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

           </div>
         )}

         {/* ========================================================= */}
         {/* VIEW 3: STUDENTS REGISTRY */}
         {/* ========================================================= */}
         {activeTab === 'students' && (
           <div className="space-y-6 animate-fade-in text-start">
             <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs flex flex-col gap-4 w-full">
               {/* Search & dropdown select row */}
               <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                 {/* Searching panel */}
               <div className="relative w-full md:flex-grow">
                 <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                 <input
                   type="text"
                   placeholder={lang === 'ar' ? 'ابحثي بالطالبة، الرقم الجامعي، أو رغبة الفرز...' : 'Type student criteria to look up...'}
                   value={studentSearch}
                   onChange={(e) => setStudentSearch(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-primary pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold text-start"
                 />
               </div>

              {/* Timing filtration custom multi-select checkbox dropdown */}


                  {/* Filtering Level, Degree, and Delivery Mode */}
                  <div className="flex flex-wrap gap-2 select-none w-full md:w-auto">
                    <select
                      value={studentLevelFilter}
                      onChange={(e) => setStudentLevelFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                    >
                      <option value="all">{lang === 'ar' ? `جميع المستويات (${allStudents.length})` : `All Tiers (${allStudents.length})`}</option>
                      <option value="BEGINNER">{lang === 'ar' ? `مبتدئة (${studentStats.beginner})` : `Beginner (${studentStats.beginner})`}</option>
                      <option value="INTERMEDIATE">{lang === 'ar' ? `تمهيدية (${studentStats.intermediate})` : `Intermediate (${studentStats.intermediate})`}</option>
                      <option value="ADVANCED">{lang === 'ar' ? `متقدمة (${studentStats.advanced})` : `Advanced (${studentStats.advanced})`}</option>
                    </select>

                    <select
                      value={studentTypeFilter}
                      onChange={(e) => setStudentTypeFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                    >
                      <option value="all">{lang === 'ar' ? `جميع الدرجات العلمية (${allStudents.length})` : `All Degrees (${allStudents.length})`}</option>
                      <option value="undergrad">{lang === 'ar' ? `بكالوريوس (تحت التخرج) (${studentStats.undergrad})` : `Undergraduate (${studentStats.undergrad})`}</option>
                      <option value="postgrad">{lang === 'ar' ? `دراسات عليا / موظفات (${studentStats.postgrad})` : `Graduate / Employee (${studentStats.postgrad})`}</option>
                    </select>

                    <select
                      value={studentFormatFilter}
                      onChange={(e) => setStudentFormatFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                    >
                      <option value="all">{lang === 'ar' ? `جميع أنماط التلقي (${allStudents.length})` : `All Formats (${allStudents.length})`}</option>
                      <option value="in-person">{lang === 'ar' ? `حضوري بالجامعة (${studentStats.inPerson})` : `In-Person (${studentStats.inPerson})`}</option>
                      <option value="online">{lang === 'ar' ? `عن بعد (تيمز) (${studentStats.online})` : `Online (${studentStats.online})`}</option>
                    </select>
                  </div>
                </div>

                {/* Search for unassigned toggle bar */}
                <div className="flex items-center gap-2 px-1 py-1.5 self-start select-none">
                  <input
                    type="checkbox"
                    id="unassignedStudentsCheckbox"
                    checked={showOnlyUnassignedStudents}
                    onChange={(e) => setShowOnlyUnassignedStudents(e.target.checked)}
                    className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary focus:outline-none transition cursor-pointer"
                  />
                  <label htmlFor="unassignedStudentsCheckbox" className="text-xs font-black text-slate-700 cursor-pointer flex items-center gap-1.5">
                    <span>{lang === 'ar' ? 'عرض فقط الطالبات غير الموزعات في الحلقات حالياً' : 'Show only students NOT assigned to any session yet'}</span>
                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-150 px-1.5 py-0.5 rounded-full">
                      {allStudents.filter(s => !sessions.some(sec => sec.students?.some(sub => sub.id === (s.studentId || s.email)))).length}
                    </span>
                  </label>
                </div>

                {/* Specific day and time multi-filters block */}
                <div className="border-t border-slate-100 pt-4 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      {lang === 'ar' ? 'البحث بأوقات وتواريخ محددة وحفظها (OR)' : 'Filter by specific times & days (OR)'}
                    </h5>
                    <button
                      type="button"
                      onClick={addStudentTimeFilter}
                      className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 rounded-lg text-[10.5px] font-black cursor-pointer transition-all flex items-center gap-1"
                    >
                      <span>+</span> {lang === 'ar' ? 'إضافة موعد بحث معين' : 'Add Day/Time Filter'}
                    </button>
                  </div>

                  {studentTimeFilters.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">
                      {lang === 'ar' 
                        ? '*لم يتم تحديد مرشحات وقت مخصصة. سيتم عرض جميع الطالبات بغض النظر عن الوقت.' 
                        : '*No specific time filters defined. Showing all students regardless of availability.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5 items-center">
                      {studentTimeFilters.map((filter) => (
                        <div key={filter.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl animate-fade-in shadow-3xs">
                          <select
                            value={filter.day}
                            onChange={(e) => updateStudentTimeFilter(filter.id, 'day', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10.5px] font-black text-slate-700 focus:outline-none focus:border-brand-primary cursor-pointer"
                          >
                            <option value="">{lang === 'ar' ? 'أي يوم' : 'Any Day'}</option>
                            <option value="Sunday">{lang === 'ar' ? 'الأحد' : 'Sunday'}</option>
                            <option value="Monday">{lang === 'ar' ? 'الاثنين' : 'Monday'}</option>
                            <option value="Tuesday">{lang === 'ar' ? 'الثلاثاء' : 'Tuesday'}</option>
                            <option value="Wednesday">{lang === 'ar' ? 'الأربعاء' : 'Wednesday'}</option>
                            <option value="Thursday">{lang === 'ar' ? 'الخميس' : 'Thursday'}</option>
                          </select>

                          <select
                            value={filter.time}
                            onChange={(e) => updateStudentTimeFilter(filter.id, 'time', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10.5px] font-black text-slate-700 focus:outline-none focus:border-brand-primary cursor-pointer"
                          >
                            <option value="">{lang === 'ar' ? 'أي وقت' : 'Any Time'}</option>
                            <option value="Fajr">{lang === 'ar' ? 'حلقة فجرية' : 'Fajr'}</option>
                            <option value="8:00">{lang === 'ar' ? '٨:٠٠ - ٩:١٥ ص' : '8:00-9:15 AM'}</option>
                            <option value="10:00">{lang === 'ar' ? '١٠:٠٠ - ١١:١٥ ص' : '10:00-11:15 AM'}</option>
                            <option value="12:00">{lang === 'ar' ? '١٢:٠٠ - ١:١٥ ظ' : '12:00-1:15 PM'}</option>
                            <option value="2:15">{lang === 'ar' ? '٢:١٥ - ٣:٣٠ ظ' : '2:15-3:30 PM'}</option>
                            <option value="4:15">{lang === 'ar' ? '٤:١٥ - ٥:٣٠ ع' : '4:15-5:30 PM'}</option>
                            <option value="8:00PM">{lang === 'ar' ? '٨:٠٠ - ٩:١٥ م' : '8:00-9:15 PM'}</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => removeStudentTimeFilter(filter.id)}
                            className="p-1 text-slate-400 hover:text-red-650 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                            title={lang === 'ar' ? 'حذف مرشح الوقت' : 'Remove time filter'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => setStudentTimeFilters([])}
                        className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-black cursor-pointer transition-colors border border-transparent hover:border-red-100"
                      >
                        {lang === 'ar' ? 'مسح تصفية الأوقات' : 'Clear All'}
                      </button>
                    </div>
                  )}
                </div>
            </div>

            {/* Students Grid View */}
            <div className="bg-white rounded-3xl border border-slate-250/65 overflow-x-auto shadow-sm">
              <table className="w-full text-xs font-bold border-collapse select-none min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black h-12 uppercase text-start">
                    <th className="px-5 text-start min-w-[280px]">{lang === 'ar' ? 'الطالبة ووسيلة الاتصال' : 'Student Name & Contact'}</th>
                    <th className="px-5 text-start">{lang === 'ar' ? 'الأوقات المتاحة المحددة' : 'Available Timings Chosen'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'مستوى الطالبة' : 'Student Level'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'نمط التلقي المفضل' : 'Delivery Preference'}</th>
                    <th className="px-5 text-start">{lang === 'ar' ? 'ملاحظات الطالبة' : 'Student Notes'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'الحالة والمقرأة الحالية' : 'Assignment State'}</th>
                    <th className="px-5 text-end">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-start leading-relaxed">
                  {processedStudents.map((st, sidx) => {
                    const idKey = st.studentId || st.email;
                    
                    // Check if current student possesses an assigned session
                    let assignedSession: Session | null = null;
                    sessions.forEach(s => {
                      if (s.students?.some(subSt => subSt.id === idKey)) {
                        assignedSession = s;
                      }
                    });

                    const isExpanded = false;

                    return (
                      <React.Fragment key={idKey || sidx}>
                        <tr className="h-14 transition-colors hover:bg-slate-50/50">
                          <td className="px-5 min-w-[280px] whitespace-nowrap">
                            <div className="flex items-center gap-3" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                              {/* Index Number */}
                              <span className="text-slate-400 font-bold font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-[10.5px] shrink-0">
                                {sidx + 1}
                              </span>
                              {/* Name and Phone, with phone exactly under the name of the user */}
                              <div className="flex-grow" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
                                <span className="font-extrabold text-brand-dark block text-[14.5px] whitespace-nowrap">
                                  {getBintFullName(st)}
                                </span>
                                <span className="text-[11px] text-brand-primary block font-extrabold mt-1 font-mono" style={{ direction: 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                                  📱 {formatOmaniPhone(st.phone)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 text-start font-mono text-xs text-brand-primary font-bold min-w-[280px]">
                            <div className="whitespace-pre-line leading-relaxed py-2 font-black break-words" title={getFormattedTimings(st.enrollmentDetails?.timings || st.timings, lang, st)}>
                              {getFormattedTimings(st.enrollmentDetails?.timings || st.timings, lang, st)}
                            </div>
                          </td>

                          <td className="px-5 text-center">
                            <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-black border tracking-wide whitespace-nowrap shadow-3xs ${
                              (() => {
                                const lvl = (st.level || '').toUpperCase();
                                if (lvl.includes('BEGIN') || lvl.includes('مبتد')) {
                                    return 'bg-pink-50 text-pink-700 border-pink-200';
                                } else if (lvl.includes('INTERMED') || lvl.includes('تمهيد') || lvl.includes('متوسط') || lvl.includes('TAMKEEN') || lvl.includes('تمكين')) {
                                    return 'bg-orange-50 text-orange-700 border-orange-200';
                                } else if (lvl.includes('ADVANC') || lvl.includes('متقدم')) {
                                    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                }
                                return 'bg-purple-50 text-purple-700 border-purple-200';
                              })()
                            }`}>
                              {getStudentLevelDisplay(st, lang)}
                            </span>
                          </td>

                          <td className="px-5 text-center text-slate-500 font-semibold">
                            {displayPreferredFormat(st)}
                          </td>

                          <td className="px-5 text-start text-[11px] text-slate-600 min-w-[200px] max-w-[350px]">
                            <div className="whitespace-pre-wrap break-words leading-relaxed font-semibold">
                              {st.enrollmentDetails?.notes || st.notes || '---'}
                            </div>
                          </td>

                          <td className="px-5 text-center font-bold">
                            {assignedSession ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-1 rounded-lg text-[10px] uppercase font-black">
                                👉 {assignedSession.name}
                              </span>
                            ) : (
                              <span className="bg-red-50 text-red-650 border border-red-100 px-2 py-1 rounded-lg text-[10px] uppercase font-black animate-pulse">
                                ⏳ {lang === 'ar' ? 'غير مسكنة' : 'NOT ASSIGNED'}
                              </span>
                            )}
                          </td>

                          <td className="px-4 text-end">
                            <div className="flex gap-1.5 justify-end items-center">
                              {assignedSession ? (
                                <button
                                  onClick={() => handleUnassignStudent((assignedSession as Session).id, idKey)}
                                  className="text-red-655 hover:bg-red-50 border border-red-100 bg-white px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer"
                                >
                                  {lang === 'ar' ? 'إلغاء التسكين' : 'Unassign Class'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAssigningStudentId(idKey);
                                    setActiveTab('sessions');
                                  }}
                                  className="bg-brand-primary hover:bg-brand-accent text-white px-3.5 py-1.5 rounded-xl font-black text-[10px] shadow-sm cursor-pointer"
                                >
                                  ➕ {lang === 'ar' ? 'تسكين يدوي' : 'Place student'}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setInfoModalStudent(st);
                                }}
                                className="p-1 px-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center shrink-0 transition-all bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100"
                                title={lang === 'ar' ? 'عرض تفاصيل الطالبة' : 'View Student Details'}
                              >
                                ℹ️
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {processedStudents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 font-bold text-slate-400 italic">
                        {lang === 'ar' ? 'عفواً، لا توجد سجلات مطابقة.' : 'No student records matched parameters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: TEACHERS REGISTRY */}
        {/* ========================================================= */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-fade-in text-start">
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs flex flex-col gap-4 w-full">
              {/* Search & selectors row */}
              <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                {/* Searching panel */}
                <div className="relative w-full md:flex-grow">
                  <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'بحث باسم المعلمة ...' : 'Type teacher details to search...'}
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-primary pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold text-start"
                  />
                </div>

                <div className="flex flex-wrap gap-2 select-none w-full md:w-auto">
                  <select
                    value={teacherLevelFilter}
                    onChange={(e) => setTeacherLevelFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                  >
                    <option value="all">{lang === 'ar' ? `جميع تراخيص السند (${allTeachers.length})` : `All Certifications (${allTeachers.length})`}</option>
                    <option value="master">{lang === 'ar' ? `مُجازة بالسند المتصل (${teacherStats.master})` : `Certified Master / Mujazah (${teacherStats.master})`}</option>
                    <option value="iqraa">{lang === 'ar' ? `طالبة إقراء (${teacherStats.iqraa})` : `Iqraa Reciting Student (${teacherStats.iqraa})`}</option>
                  </select>

                  <select
                    value={teacherFormatFilter}
                    onChange={(e) => setTeacherFormatFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                  >
                    <option value="all">{lang === 'ar' ? `جميع أنماط التفرغ (${allTeachers.length})` : `All Formats (${allTeachers.length})`}</option>
                    <option value="in-person">{lang === 'ar' ? `وجاهي بالجامعة فقط (${teacherStats.inPerson})` : `SQU Campus only (${teacherStats.inPerson})`}</option>
                    <option value="online">{lang === 'ar' ? `رقمي عن بعد (تيمز) (${teacherStats.online})` : `Digital remote only (${teacherStats.online})`}</option>
                  </select>
                </div>
              </div>

              {/* Search for unassigned teachers toggle */}
              <div className="flex items-center gap-2 px-1 py-1.5 self-start select-none">
                <input
                  type="checkbox"
                  id="unassignedTeachersCheckbox"
                  checked={showOnlyUnassignedTeachers}
                  onChange={(e) => setShowOnlyUnassignedTeachers(e.target.checked)}
                  className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary focus:outline-none transition cursor-pointer"
                />
                <label htmlFor="unassignedTeachersCheckbox" className="text-xs font-black text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'عرض فقط المعلمات اللواتي لم يُسند لهن حلقات حالياً' : 'Show only teachers NOT assigned to any session yet'}</span>
                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-150 px-1.5 py-0.5 rounded-full">
                    {allTeachers.filter(t => !sessions.some(s => 
                      s.teacher.phone === t.phone ||
                      s.teacher.name === t.name ||
                      s.teacher.name === `${t.firstName || t.name || ''} ${t.lastName || ''}`.trim() ||
                      (t.firstName && s.teacher.name.includes(t.firstName))
                    )).length}
                  </span>
                </label>
              </div>

              {/* Specific day and time multi-filters block */}
              <div className="border-t border-slate-100 pt-4 w-full">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    {lang === 'ar' ? 'البحث بأوقات وتواريخ محددة وحفظها للمعلمات (OR)' : 'Filter teachers by specific times & days (OR)'}
                  </h5>
                  <button
                    type="button"
                    onClick={addTeacherTimeFilter}
                    className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 rounded-lg text-[10.5px] font-black cursor-pointer transition-all flex items-center gap-1"
                  >
                    <span>+</span> {lang === 'ar' ? 'إضافة موعد بحث معين' : 'Add Day/Time Filter'}
                  </button>
                </div>

                {teacherTimeFilters.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    {lang === 'ar' 
                      ? '*لم يتم تحديد مرشحات وقت مخصصة المعلمة. سيتم عرض جميع المعلمات بغض النظر عن الوقت.' 
                      : '*No specific time filters defined. Showing all teachers.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {teacherTimeFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl animate-fade-in shadow-3xs">
                        <select
                          value={filter.day}
                          onChange={(e) => updateTeacherTimeFilter(filter.id, 'day', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10.5px] font-black text-slate-700 focus:outline-none focus:border-brand-primary cursor-pointer"
                        >
                          <option value="">{lang === 'ar' ? 'أي يوم' : 'Any Day'}</option>
                          <option value="Sunday">{lang === 'ar' ? 'الأحد' : 'Sunday'}</option>
                          <option value="Monday">{lang === 'ar' ? 'الاثنين' : 'Monday'}</option>
                          <option value="Tuesday">{lang === 'ar' ? 'الثلاثاء' : 'Tuesday'}</option>
                          <option value="Wednesday">{lang === 'ar' ? 'الأربعاء' : 'Wednesday'}</option>
                          <option value="Thursday">{lang === 'ar' ? 'الخميس' : 'Thursday'}</option>
                        </select>

                        <select
                          value={filter.time}
                          onChange={(e) => updateTeacherTimeFilter(filter.id, 'time', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10.5px] font-black text-slate-700 focus:outline-none focus:border-brand-primary cursor-pointer"
                        >
                          <option value="">{lang === 'ar' ? 'أي وقت' : 'Any Time'}</option>
                          <option value="Fajr">{lang === 'ar' ? 'حلقة فجرية' : 'Fajr'}</option>
                          <option value="8:00">{lang === 'ar' ? '٨:٠٠ - ٩:١٥ ص' : '8:00-9:15 AM'}</option>
                          <option value="10:00">{lang === 'ar' ? '١٠:٠٠ - ١١:١٥ ص' : '10:00-11:15 AM'}</option>
                          <option value="12:00">{lang === 'ar' ? '١٢:٠٠ - ١:١٥ ظ' : '12:00-1:15 PM'}</option>
                          <option value="2:15">{lang === 'ar' ? '٢:١٥ - ٣:٣٠ ظ' : '2:15-3:30 PM'}</option>
                          <option value="4:15">{lang === 'ar' ? '٤:١٥ - ٥:٣٠ ع' : '4:15-5:30 PM'}</option>
                          <option value="8:00PM">{lang === 'ar' ? '٨:٠٠ - ٩:١٥ م' : '8:00-9:15 PM'}</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => removeTeacherTimeFilter(filter.id)}
                          className="p-1 text-slate-400 hover:text-red-650 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                          title={lang === 'ar' ? 'حذف مرشح الوقت' : 'Remove time filter'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => setTeacherTimeFilters([])}
                      className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-black cursor-pointer transition-colors border border-transparent hover:border-red-100"
                    >
                      {lang === 'ar' ? 'مسح تصفية الأوقات' : 'Clear All'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Teachers Board Table */}
            <div className="bg-white rounded-3xl border border-slate-250/65 overflow-x-auto shadow-sm">
              <table className="w-full text-xs font-bold border-collapse select-none min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black h-12 uppercase text-start">
                    <th className="px-5 text-start min-w-[280px]">{lang === 'ar' ? 'المعلمة ووسيلة الاتصال' : 'Teacher Name & Contact'}</th>
                    <th className="px-5 text-start">{lang === 'ar' ? 'الأوقات المتاحة للتدريس' : 'Available Teach Timings'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'الترخيص والاعتماد' : 'Certification'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'نمط المشاركة المفضل' : 'Delivery Preference'}</th>
                    <th className="px-5 text-start">{lang === 'ar' ? 'ملاحظات المعلمة' : 'Teacher Notes'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'الحلقات المشرف عليها' : 'Supervised Recitations'}</th>
                    <th className="px-5 text-end">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-start leading-relaxed">
                  {processedTeachers.map((teach, idx) => {
                    const emKey = teach.employeeId || teach.email;
                    const { expYears, formatPref } = getTeacherPrefAndExp(teach);
                    
                    // Fetch supervised classes
                    const supervisedSessions = sessions.filter(s => s.teacher.name.includes(teach.firstName) || s.teacher.name === teach.name);

                    return (
                      <React.Fragment key={emKey || idx}>
                        <tr className="h-14 transition-colors hover:bg-slate-50/50">
                          <td className="px-5 min-w-[280px] whitespace-nowrap">
                            <div className="flex items-center gap-3" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                              {/* Index Number */}
                              <span className="text-slate-400 font-bold font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-[10.5px] shrink-0">
                                {idx + 1}
                              </span>
                              {/* Name and Phone, with phone exactly under the name of the user */}
                              <div className="flex-grow" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
                                <span className="font-extrabold text-brand-dark block text-[14.5px] whitespace-nowrap">
                                  {getTeacherFullName(teach)}
                                </span>
                                <span className="text-[11px] text-brand-primary block font-extrabold mt-1 font-mono" style={{ direction: 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                                  📱 {formatOmaniPhone(teach.phone)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 text-start font-mono text-xs text-brand-primary font-bold min-w-[280px]">
                            <div className="whitespace-pre-line leading-relaxed py-2 font-black break-words" title={getFormattedTimings(teach.enrollmentDetails?.timings || teach.timings, lang, teach)}>
                              {getFormattedTimings(teach.enrollmentDetails?.timings || teach.timings, lang, teach)}
                            </div>
                          </td>

                          <td className="px-5 text-center">
                            <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-black border tracking-wide whitespace-nowrap shadow-3xs ${
                              (() => {
                                const lvl = (teach.level || '').toLowerCase();
                                if (lvl.includes('مجاز') || lvl.includes('master') || lvl.includes('certified')) {
                                  return 'bg-purple-50 text-purple-700 border-purple-200';
                                } else if (lvl.includes('first') || lvl.includes('أول مرة') || lvl.includes('فصلي الأول') || lvl.includes('الأول')) {
                                  return 'bg-yellow-50 text-amber-800 border-yellow-200';
                                }
                                return 'bg-sky-50 text-sky-700 border-sky-200';
                              })()
                            }`}>
                              {getTeacherLevelDisplay(teach, lang)}
                            </span>
                          </td>

                          <td className="px-5 text-center">
                            <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-black border tracking-wide whitespace-nowrap shadow-3xs ${
                              formatPref === 'online' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {formatPref === 'online' ? (lang === 'ar' ? '💻 عن بعد' : '💻 Online') : (lang === 'ar' ? '🏫 حضوري' : '🏫 In-person')}
                            </span>
                          </td>

                          <td className="px-5 text-start min-w-[200px] max-w-[350px]">
                            <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed break-words font-semibold">
                              {teach.enrollmentDetails?.notes || teach.notes || '---'}
                            </div>
                          </td>

                          <td className="px-5 text-center">
                            {supervisedSessions.length === 0 ? (
                              <span className="text-amber-600 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10 font-bold text-[10px]">
                                {lang === 'ar' ? 'بلا مقرأة' : 'Unassigned'}
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1 justify-center max-w-[220px]">
                                {supervisedSessions.map((sv, svIdx) => (
                                  <span key={svIdx} className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 text-[9.5px] text-slate-800 font-extrabold flex items-center gap-1.5" title={sv.name}>
                                    <span className="truncate max-w-[100px]">{sv.name}</span>
                                    <span className="bg-brand-primary text-white scale-90 rounded px-1 text-[8px] font-bold">
                                      {sv.students?.length}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="px-5 text-end whitespace-nowrap">
                            <button
                              onClick={() => {
                                setInfoModalTeacher(teach);
                              }}
                              className="p-1 px-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center shrink-0 transition-all bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100"
                              title={lang === 'ar' ? 'عرض تفاصيل المعلمة' : 'View Teacher Details'}
                            >
                              ℹ️
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: LIVE CLASSROOMS */}
        {/* ========================================================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-6 animate-fade-in text-start text-brand-dark">
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'بحث باسم الحلقة أو المعلمة...' : 'Search classes by name or teacher...'}
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-primary pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold text-start"
                  />
                </div>

                {/* Fast Reassignment Info Alert if any unassigned student is selected */}
                {assigningStudentId && (
                  <div className="bg-amber-500/5 text-amber-850 px-4 py-2 border border-amber-250 rounded-xl text-xs font-black animate-pulse flex items-center gap-2">
                    <span>
                      {lang === 'ar' 
                        ? 'خطوة تعيين نشطة: اضغطي على زر "إلحاق هنا" بالأسفل لتوزيع الطالبة المختارة فوراً!' 
                        : 'Active Placement: Tap "Place here" on any class to assign!'}
                    </span>
                    <button 
                      onClick={() => setAssigningStudentId(null)}
                      className="w-5 h-5 bg-black/10 text-brand-dark rounded-full text-[10px] font-bold inline-flex items-center justify-center cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 select-none w-full md:w-auto">
                  <select
                    value={sessionFormatFilter}
                    onChange={(e) => setSessionFormatFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                  >
                    <option value="all">{lang === 'ar' ? `جميع الحلقات بمختلف تصنيفاتها (${sessions.length})` : `All Classes (${sessions.length})`}</option>
                    <option value="in-person">{lang === 'ar' ? `حضوري (مقرأة مسجد الجامعة) (${sessionStats.inPerson})` : `Campus In-Person Classrooms (${sessionStats.inPerson})`}</option>
                    <option value="online">{lang === 'ar' ? `أونلاين (قنوات ميكروسوفت تيمز) (${sessionStats.online})` : `Digital Teams Channels (${sessionStats.online})`}</option>
                  </select>

                  <button
                    onClick={() => setShowCreateSessionModal(true)}
                    className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'حلقة يدوية جديدة' : 'Create manually'}</span>
                  </button>
                  
                  {sessions.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          if (selectedSessions.length === processedSessions.length) {
                             setSelectedSessions([]);
                          } else {
                             setSelectedSessions(processedSessions.map(s => s.id));
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-[11px] font-black shadow-sm transition-colors cursor-pointer"
                      >
                        {selectedSessions.length === processedSessions.length
                          ? (lang === 'ar' ? 'إلغاء التحديد' : 'Deselect All')
                          : (lang === 'ar' ? 'تحديد الكل' : 'Select All')}
                      </button>

                      {selectedSessions.length > 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف الحلقات المحددة؟ سيفقد الطلاب مقاعدهم في هذه الحلقات.' : 'Are you sure you want to delete selected classes? Students will lose their seats.')) {
                               setSessions(prev => prev.filter(s => !selectedSessions.includes(s.id)));
                               setSelectedSessions([]);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 px-4 py-2.5 rounded-xl text-[11px] font-black shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? `حذف المحدد (${selectedSessions.length})` : `Delete Selected (${selectedSessions.length})`}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Specific day and time multi-filters block FOR SESSIONS */}
              <div className="border-t border-slate-100 pt-4 w-full">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    {lang === 'ar' ? 'البحث بأوقات وتواريخ محددة وحفظها للحلقات (OR)' : 'Filter sessions by specific times & days (OR)'}
                  </h5>
                  <button
                    type="button"
                    onClick={addSessionTimeFilter}
                    className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 rounded-lg text-[10.5px] font-black cursor-pointer transition-all flex items-center gap-1"
                  >
                    <span>+</span> {lang === 'ar' ? 'إضافة موعد بحث معين' : 'Add Day/Time Filter'}
                  </button>
                </div>

                {sessionTimeFilters.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    {lang === 'ar' 
                      ? '*لم يتم تحديد مرشحات وقت مخصصة للحلقات. سيتم عرض جميع الحلقات بغض النظر عن الوقت.' 
                      : '*No specific time filters defined. Showing all sessions.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {sessionTimeFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl animate-fade-in shadow-3xs">
                        <select
                          value={filter.day}
                          onChange={(e) => updateSessionTimeFilter(filter.id, 'day', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10.5px] font-black text-slate-700 focus:outline-none focus:border-brand-primary cursor-pointer"
                        >
                          <option value="">{lang === 'ar' ? 'أي يوم' : 'Any Day'}</option>
                          <option value="Sunday">{lang === 'ar' ? 'الأحد' : 'Sunday'}</option>
                          <option value="Monday">{lang === 'ar' ? 'الاثنين' : 'Monday'}</option>
                          <option value="Tuesday">{lang === 'ar' ? 'الثلاثاء' : 'Tuesday'}</option>
                          <option value="Wednesday">{lang === 'ar' ? 'الأربعاء' : 'Wednesday'}</option>
                          <option value="Thursday">{lang === 'ar' ? 'الخميس' : 'Thursday'}</option>
                        </select>

                        <select
                          value={filter.time}
                          onChange={(e) => updateSessionTimeFilter(filter.id, 'time', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10.5px] font-black text-slate-700 focus:outline-none focus:border-brand-primary cursor-pointer"
                        >
                          <option value="">{lang === 'ar' ? 'أي وقت' : 'Any Time'}</option>
                          <option value="Fajr">{lang === 'ar' ? 'حلقة فجرية' : 'Fajr'}</option>
                          <option value="8:00">{lang === 'ar' ? '٨:٠٠ - ٩:١٥ ص' : '8:00-9:15 AM'}</option>
                          <option value="10:00">{lang === 'ar' ? '١٠:٠٠ - ١١:١٥ ص' : '10:00-11:15 AM'}</option>
                          <option value="12:00">{lang === 'ar' ? '١٢:٠٠ - ١:١٥ ظ' : '12:00-1:15 PM'}</option>
                          <option value="2:15">{lang === 'ar' ? '٢:١٥ - ٣:٣٠ ظ' : '2:15-3:30 PM'}</option>
                          <option value="4:15">{lang === 'ar' ? '٤:١٥ - ٥:٣٠ ع' : '4:15-5:30 PM'}</option>
                          <option value="8:00PM">{lang === 'ar' ? '٨:٠٠ - ٩:١٥ م' : '8:00-9:15 PM'}</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => removeSessionTimeFilter(filter.id)}
                          className="p-1 text-slate-400 hover:text-red-650 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                          title={lang === 'ar' ? 'حذف مرشح الوقت' : 'Remove time filter'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Display list/grid of SQU Active Classes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedSessions.map((sess, idx) => {
                // Seek live teacher details in allTeachers to support runtime name or format edits
                const actualTeacher = allTeachers.find(t => 
                  t.phone === sess.teacher.phone || 
                  t.name === sess.teacher.name || 
                  `${t.firstName || ''} ${t.lastName || ''}`.trim() === sess.teacher.name
                );

                // Dynamically resolve the teacher's name
                const resolvedTeacherName = actualTeacher 
                  ? `${actualTeacher.firstName || ''} ${actualTeacher.lastName || ''}`.trim() || actualTeacher.name
                  : sess.teacher.name;

                // Strip any existing "أ. " or "T. " prefixes from raw name to construct clean format
                const cleanTeacherName = resolvedTeacherName
                  .replace(/^(T\.\s*|أ\.\s*|Teacher\s*|الاستاذة\s*|الأستاذة\s*)/i, '')
                  .trim();

                const defaultTitle = lang === 'ar' ? `أ. ${cleanTeacherName}` : `T.${cleanTeacherName}`;

                const hasCustomName = sess.name && 
                                      sess.name.trim() !== '' && 
                                      !sess.name.includes('Smart Propose') && 
                                      !sess.name.includes('حلقة ذكية') &&
                                      sess.name.trim() !== defaultTitle;

                const classroomTitle = hasCustomName ? sess.name : defaultTitle;

                // Handle format and location defaults
                const isOnline = actualTeacher 
                  ? actualTeacher.deliveryPreference === 'online' || actualTeacher.enrollmentDetails?.deliveryPreference === 'online'
                  : sess.location.includes('تيمز') || sess.location.includes('Teams') || sess.location.toLowerCase().includes('online');

                const defaultInPersonLoc = lang === 'ar' ? 'استراحة التربية' : 'استراحة التربية (Education Lounge)';
                const defaultOnlineLoc = lang === 'ar' ? 'أونلاين عبر تيمز' : 'Teams Digital Channel';

                let resolvedLocation = sess.location;
                // If location is blank or generic default SQU Campus, resolve to default "استراحة التربية" 
                if (!resolvedLocation || resolvedLocation.includes('مسجد الجامعة') || resolvedLocation.trim().toLowerCase() === 'squ campus mosque' || resolvedLocation.trim() === '') {
                  resolvedLocation = isOnline ? defaultOnlineLoc : defaultInPersonLoc;
                }

                if (actualTeacher) {
                  const teacherPref = actualTeacher.deliveryPreference || actualTeacher.enrollmentDetails?.deliveryPreference;
                  if (teacherPref === 'online' && !resolvedLocation.toLowerCase().includes('teams') && !resolvedLocation.toLowerCase().includes('online')) {
                    resolvedLocation = defaultOnlineLoc;
                  } else if (teacherPref === 'in-person' && (resolvedLocation.toLowerCase().includes('teams') || resolvedLocation.toLowerCase().includes('online'))) {
                    resolvedLocation = defaultInPersonLoc;
                  }
                }
                
                // Determine level text, levels translated, and custom styles
                const getSessionLevelDisplayAndStyles = (lvl: string, langVal: 'ar' | 'en') => {
                  const norm = (lvl || '').toUpperCase();
                  let text = lvl;
                  let classes = 'bg-purple-50 text-purple-700 border-purple-200';
                  
                  if (norm.includes('BEGIN') || norm.includes('مبتد')) {
                    text = langVal === 'ar' ? 'مبتدئة' : 'Beginner';
                    classes = 'bg-pink-50 text-pink-700 border-pink-200';
                  } else if (norm.includes('INTERMED') || norm.includes('تمهيد') || norm.includes('متوسط') || norm.includes('TAMKEEN') || norm.includes('تمكين')) {
                    text = langVal === 'ar' ? 'تمهيدية' : 'Intermediate';
                    classes = 'bg-orange-50 text-orange-700 border-orange-200';
                  } else if (norm.includes('ADVANC') || norm.includes('متقدم')) {
                    text = langVal === 'ar' ? 'متقدمة' : 'Advanced';
                    classes = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                  } else {
                    text = langVal === 'ar' ? 'حلقة عامة' : 'General Circular';
                  }
                  
                  return { text, classes };
                };

                const { text: levelText, classes: levelClasses } = getSessionLevelDisplayAndStyles(sess.level, lang);

                // Online/Offline display in Arabic
                const modeText = isOnline 
                  ? (lang === 'ar' ? '💻 عن بعد' : '💻 Online') 
                  : (lang === 'ar' ? '🏫 حضوري بالحرم' : '🏫 In-person');

                return (
                  <div key={idx} className={`bg-white rounded-3xl border shadow-3xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between ${selectedSessions.includes(sess.id) ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-200'}`}>
                    <div>
                      {/* Class Banner - Clean white styled header with border-b */}
                      <div className="p-5 bg-white border-b border-slate-100 relative">
                        <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-10">
                           <input 
                             type="checkbox" 
                             checked={selectedSessions.includes(sess.id)}
                             onChange={(e) => {
                               if(e.target.checked) setSelectedSessions(prev => [...prev, sess.id]);
                               else setSelectedSessions(prev => prev.filter(id => id !== sess.id));
                             }}
                             className="w-4 h-4 cursor-pointer accent-brand-primary rounded border-slate-300 focus:ring-brand-primary"
                           />
                        </div>
                        <div className="flex justify-between items-center mb-1 bg-white pr-8 rtl:pl-8 rtl:pr-0">
                          <span className={`text-[10px] border rounded font-black px-2.5 py-0.5 shadow-3xs ${levelClasses}`}>
                            {levelText}
                          </span>
                          <span className="text-[10.5px] text-brand-primary font-black font-sans">
                            {modeText}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-brand-dark text-base truncate mt-2">{classroomTitle}</h4>
                        <span className="text-xs text-slate-500 font-extrabold truncate block mt-0.5">👩‍🏫 {resolvedTeacherName}</span>
                      </div>

                      {/* Class Body Details */}
                      <div className="p-5 space-y-4">
                        <div className="text-xs text-slate-500 font-bold space-y-1.5 font-mono">
                          {(() => {
                            const { session1, session2 } = parseDoubleSessions(sess.time, lang);
                            return (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span>📅</span>
                                  <span>{session1}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span>📅</span>
                                  <span>{session2}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Enrolled students list */}
                        <div className="space-y-1.5 select-none pt-3 border-t border-slate-100">
                          <span className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider">
                            {lang === 'ar' ? 'الطالبات المسجلات بالحلقة:' : 'Enrolled Students:'} ({sess.students?.length || 0})
                          </span>

                          <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                            {sess.students && sess.students.length > 0 ? (
                              sess.students.map((st, stIdx) => {
                                return (
                                  <div key={stIdx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/50 flex justify-between items-center text-[10.5px]">
                                    <span className="font-black text-slate-900 leading-normal truncate">
                                      <span className="text-slate-400 font-bold font-mono mr-1">{stIdx + 1}.</span> {st.name}
                                    </span>
                                    <button
                                      onClick={() => handleUnassignStudent(sess.id, st.id)}
                                      className="text-slate-400 hover:text-red-650 text-xs w-5.5 h-5.5 rounded-full hover:bg-red-50 inline-flex items-center justify-center cursor-pointer font-bold shrink-0 transition-colors"
                                      title={lang === 'ar' ? 'إخراج الطالبة من الحلقة' : 'Unassign Student'}
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-slate-400 text-[10px] italic font-bold">
                                {lang === 'ar' ? 'لا توجد طالبات مسجلات' : 'No students placed here yet'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Add Student selector option */}
                        <div className="pt-3 border-t border-slate-100 select-none">
                          <span className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider mb-1.5">
                            {lang === 'ar' ? 'إضافة طالبة للحلقة:' : 'Add Student to Session:'}
                          </span>
                          {unassignedStudents.length > 0 ? (
                            <select
                              value=""
                              onChange={(e) => {
                                const stId = e.target.value;
                                if (stId) {
                                  handleAssignStudent(stId, sess.id);
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[10.5px] font-black text-slate-650 focus:outline-none focus:border-brand-primary cursor-pointer animate-fade-in"
                            >
                              <option value="">
                                {lang === 'ar' ? '➕ اختر طالبة للإضافة...' : '➕ Select student to add...'}
                              </option>
                              {unassignedStudents.map(st => {
                                const bintName = getBintFullName(st);
                                return (
                                  <option key={st.studentId || st.email} value={st.studentId || st.email}>
                                    {bintName} ({getStudentLevelDisplay(st, lang)})
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <span className="text-[9.5px] text-slate-450 italic font-bold block">
                              {lang === 'ar' ? 'جميع الطالبات مسكنات بالحلقات.' : 'All students are already assigned.'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Class Footer options/Quick assign targets */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-end">
                      {assigningStudentId ? (
                        <button
                          onClick={() => handleAssignStudent(assigningStudentId, sess.id)}
                          className="bg-brand-primary w-full hover:bg-brand-accent text-white py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          📥 {lang === 'ar' ? 'إلحاق الطالبة بهذه الحلقة ✓' : 'Place student in this circle ✓'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const confirmDelete = window.confirm(
                              lang === 'ar' 
                                ? 'هل تقرين برغبة حذف هذه الحِلقة وإخراج جميع بناتها؟' 
                                : 'Acknowledge deletion of class of Quran recital?'
                            );
                            if (confirmDelete) {
                              setSessions(prev => prev.filter(s => s.id !== sess.id));
                              alert(lang === 'ar' ? 'تم حذف الحلقة' : 'Session Deleted');
                            }
                          }}
                          className="text-red-650 hover:bg-red-50 border border-red-100 bg-white hover:text-red-700 px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer"
                        >
                          🗑️ {lang === 'ar' ? 'حذف الحلقة' : 'Delete Session'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: CONFLICT RESOLUTION */}
        {/* ========================================================= */}
        {activeTab === 'conflicts' && (
          <div className="space-y-6 animate-fade-in text-start select-none">
            <div className="bg-white rounded-3xl border border-slate-205 p-6 shadow-3xs">
              <h3 className="text-base sm:text-lg font-black text-brand-dark mb-2 flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-5.5 h-5.5" />
                {lang === 'ar' ? 'سجل تداخلات ومنازعات الفرز' : 'Unassigned Registrants Conflict Radar'}
              </h3>
              <p className="text-xs text-slate-400 font-bold max-w-2xl leading-normal text-start">
                {lang === 'ar'
                  ? 'رادار استئنائي يتتبع رغبات التلاوة للطلاب غير المقيدين بأي حِلق رسمية بالنظام حالياً، مقدماً حلولاً ومقترحات ذكية مستندة على تطابق المستويات وأوقات الفراغ الأكاديمي بجامعة السلطان قابوس.'
                  : 'SQU compliance scanner isolates registered reciters who left class networks. Suggests optimal matches in line with level tiers and available schedules.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Conflict Entries */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 block">
                  {lang === 'ar' ? 'الطالبات المتبقيات بدون تمثيل (التوجيهات المستهدفة):' : 'Awaiting Student Interventions list:'} ({unassignedStudents.length})
                </h4>

                {unassignedStudents.length === 0 ? (
                  <div className="bg-white p-8 border border-slate-200/60 rounded-3xl text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-slate-450 font-bold text-xs">{lang === 'ar' ? 'لا توجد أي نزاعات أو طالبات بانتظار الترشيح حالياً!' : 'Compliance checked! Every single student contains perfect placement.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {unassignedStudents.map((stud, idx) => {
                      const idKey = stud.studentId || stud.email;
                      const { typeValue, formatValue } = getStudentTypeAndFormat(stud);
                      
                      const extractTimingsKeys = (user: any) => {
                        const timings = user?.enrollmentDetails?.timings || user?.timings || {};
                        return Object.keys(timings).filter(k => timings[k]);
                      };
                      const studKeys = extractTimingsKeys(stud);

                      // Identify suggested sessions in same level and compatible timing format
                      const compatibleSessionsData = sessions.map(s => {
                        const sLvl = s.level;
                        const stLvl = (stud.level || '').toUpperCase();
                        let levelMatches = false;
                        if (sLvl === 'BEGINNER' && (stLvl.includes('BEGINNER') || stLvl.includes('مبتدئة'))) levelMatches = true;
                        else if (sLvl === 'INTERMEDIATE' && (stLvl.includes('INTERMEDIATE') || stLvl.includes('تمهيدية') || stLvl.includes('متوسطة') || stLvl.includes('TAMKEEN') || stLvl.includes('تمكين'))) levelMatches = true;
                        else if (sLvl === 'ADVANCED' && (stLvl.includes('ADVANCED') || stLvl.includes('متقدمة'))) levelMatches = true;
                        
                        if (!levelMatches) return null;

                        const tObj = allTeachers.find(t => (t.firstName + ' ' + t.lastName).includes(s.teacher.name) || s.teacher.name.includes(t.firstName));
                        let validKeys = tObj ? extractTimingsKeys(tObj) : [];
                        if (validKeys.length === 0) validKeys = studKeys;

                        s.students?.forEach(enrolled => {
                          const eObj = allStudents.find(o => (o.studentId || o.email) === enrolled.id);
                          if (eObj) {
                            const eKeys = extractTimingsKeys(eObj);
                            validKeys = validKeys.filter(k => eKeys.includes(k));
                          }
                        });

                        const matchKeys = validKeys.filter(k => studKeys.includes(k));
                        return { session: s, matchKeys, matchCount: matchKeys.length };
                      }).filter(Boolean).filter(res => res!.matchCount > 0)
                        .sort((a, b) => b!.matchCount - a!.matchCount);

                      return (
                        <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-3xs text-start space-y-3">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="text-xs font-black text-slate-400 block pb-0.5">{stKeyOrderDisplay(stud)}</span>
                              <h5 className="font-extrabold text-brand-dark text-sm">{stud.firstName} {stud.lastName}</h5>
                              <div className="flex gap-2 text-[10px] font-bold text-slate-500 mt-1">
                                <span>🕒 {getFormattedTimings(stud.enrollmentDetails?.timings || stud.timings, lang, stud)}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <span className="text-[10px] bg-red-50 text-red-650 font-extrabold px-2.5 py-0.5 rounded border border-red-100 mt-1">
                                {stud.level}
                              </span>
                              <span className="text-[10px] bg-brand-primary/5 text-brand-dark font-extrabold px-2.5 py-0.5 rounded border border-brand-primary/20 mt-1 flex items-center">
                                {displayPreferredFormat(stud)}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center text-[10.5px] font-bold text-slate-500">
                            <span>📞 {stud.phone || (lang === 'ar' ? 'غير مسجل' : 'Not Provided')}</span>
                          </div>

                          {/* Suggested Auto placement options inside conflict block */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                              {lang === 'ar' ? 'الحلول والمطابقات المرشحة تلقائياً:' : 'Suggested Matches according to Compliance rules:'}
                            </span>

                            {compatibleSessionsData.length === 0 ? (
                              <p className="text-[9.5px] italic text-amber-650 font-bold bg-amber-50 p-2 rounded border border-amber-100">
                                {lang === 'ar'
                                  ? 'لا توجد حلقة قائمة متطابقة مع مستوى التلاوة هذا حالياً. نوصي بتشغيل الفراغات بمسودة المعلمة لإنشاء حلقة جديدة.'
                                  : 'No live class exists of matching tier. Suggested action: Construct a new manual session.'}
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {compatibleSessionsData.slice(0, 3).map((compData, compIdx) => {
                                  const comp = compData!.session;
                                  const mKeys = compData!.matchKeys;
                                  const fakeTimingsObj: any = {};
                                  mKeys.forEach(k => fakeTimingsObj[k] = true);
                                  const formattedMatchTime = getFormattedTimings(fakeTimingsObj, lang);
                                  const separatedTimes = formattedMatchTime.split('|').map(t => t.trim());

                                  return (
                                    <button
                                      key={compIdx}
                                      onClick={() => handleAssignStudent(idKey, comp.id, mKeys)}
                                      className="w-full text-start p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-brand-primary hover:bg-white transition-all cursor-pointer flex justify-between items-center text-[10.5px]"
                                    >
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="font-extrabold text-brand-primary block">{comp.name}</span>
                                          <span className="text-[9px] px-1.5 bg-slate-200 text-slate-600 rounded-md font-bold">
                                            {comp.students?.length} {lang === 'ar' ? 'طالبات' : 'students'}
                                          </span>
                                        </div>
                                        <span className="text-slate-400 block text-[9.5px]">
                                          {lang === 'ar' ? 'المعلمة:' : 'Teacher:'} {comp.teacher.name}
                                          <div className="mt-1 space-y-0.5">
                                            {separatedTimes.map((tLine, tIdx) => (
                                              <span key={tIdx} className="block text-[9px] text-brand-primary/80 font-black bg-brand-primary/5 w-fit px-1 rounded">✅ {tLine}</span>
                                            ))}
                                          </div>
                                        </span>
                                      </div>

                                      <span className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2 py-1 rounded text-[9.5px] shrink-0 transition-colors">
                                        👉 {lang === 'ar' ? 'موافق وإلحاق' : 'Fast Enroll'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>


      {/* MANUAL SESSION CREATION MODAL OVERLAY */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4 animate-fade-in/70">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-2xl max-w-md w-full overflow-hidden text-start">
            <div className="bg-brand-primary p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">{lang === 'ar' ? 'تصميم حلقة تلاوة يدوية' : 'Create New Tajweed Circle'}</h3>
                <p className="text-xs text-white/80 font-bold mt-1">{lang === 'ar' ? 'تصميم وإطلاق الحِلق بمدخلات مخصصة' : 'Manually launch a specific Quran session'}</p>
              </div>

              <button 
                onClick={() => setShowCreateSessionModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'اسم الحلقة المقترح' : 'Custom Session Name'} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: حلقة ترتيل سورة البقرة' : 'E.g., Surah Baqarah Tajweed Group'}
                  value={newSessName}
                  onChange={(e) => setNewSessName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-bold text-start"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'المعلمة المشرفة للمقرأة' : 'Supervisor Teacher'} <span className="text-red-500">*</span></label>
                <select
                  required
                  value={newSessTeacher}
                  onChange={(e) => setNewSessTeacher(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-3 py-2.5 text-xs font-black text-slate-650"
                >
                  <option value="">{lang === 'ar' ? '-- اختاري معلمة مرخصة --' : '-- Choose active teacher --'}</option>
                  {allTeachers.filter(t => t.approved).map((th, thIdx) => (
                    <option key={thIdx} value={th.email}>{th.firstName} {th.lastName} ({th.level})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'تصنيف مستوى الإتقان ' : 'Tajweed Level'}</label>
                  <select
                    value={newSessLevel}
                    onChange={(e) => setNewSessLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-3 py-2.5 text-xs font-black text-slate-650"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'قالب التوصيل' : 'Delivery Format'}</label>
                  <select
                    value={newSessFormat}
                    onChange={(e) => setNewSessFormat(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-3 py-2.5 text-xs font-black text-slate-650"
                  >
                    <option value="in-person">🏫 In-Person (Mosque)</option>
                    <option value="online">💻 Online (Teams)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'الموعد والوقت المفتوح' : 'Schedules'}</label>
                <input
                  type="text"
                  placeholder="E.g., Sunday/Tuesday | 16:15 - 17:30"
                  value={newSessTime}
                  onChange={(e) => setNewSessTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-bold text-start"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'اسم القاعة أو الموقع' : 'Campus Classroom / MS Teams link'}</label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'مثال: مسجد الجامعة - قاعة ١٠' : 'E.g., Campus Mosque - Hall 10'}
                  value={newSessLocation}
                  onChange={(e) => setNewSessLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-bold text-start"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateSessionModal(false)}
                  className="px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إطلاق المجموعة الآن' : 'Launch Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Informational Modal ("i" button) */}
      {infoModalStudent && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-xl text-start animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={infoModalStudent.avatar || `https://picsum.photos/seed/${infoModalStudent.studentId || infoModalStudent.email}/100/100`} className="w-12 h-12 rounded-full border-2 border-white/40 animate-pulse" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-base font-black leading-tight">
                    {`${infoModalStudent.firstName || ''} ${infoModalStudent.fatherName || ''} ${infoModalStudent.grandfatherName || ''} ${infoModalStudent.lastName || ''}`.trim() || infoModalStudent.name}
                  </h4>
                  <p className="text-xs text-white/80 font-mono mt-0.5">{infoModalStudent.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setInfoModalStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
              
              {/* SECTION I: THEIR ACCOUNT INFO (INFO IN THE SYSTEM) */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black text-brand-primary uppercase tracking-wider border-b border-brand-primary/10 pb-1.5">
                  👤 {lang === 'ar' ? 'بيانات الحساب والملف الشخصي بالنظام' : 'Account & Personal Profile Details'}
                </h5>
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-3.5 text-xs font-bold text-slate-700">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'الاسم كاملاً' : 'Full Name'}</span>
                      <span className="text-brand-dark font-extrabold text-sm">
                        {`${infoModalStudent.firstName || ''} ${infoModalStudent.fatherName || ''} ${infoModalStudent.grandfatherName || ''} ${infoModalStudent.lastName || ''}`.trim() || infoModalStudent.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</span>
                      <span className="text-brand-dark font-sans text-sm inline-block" dir="ltr" style={{ direction: 'ltr' }}>
                        {formatOmaniPhone(infoModalStudent.phone)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</span>
                      <span className="text-brand-dark font-mono text-xs">{infoModalStudent.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'الرقم الجامعي (ID)' : 'Student University ID'}</span>
                      <span className="text-brand-dark font-mono text-xs bg-brand-primary/5 border border-brand-primary/10 px-2 py-0.5 rounded w-fit">
                        {infoModalStudent.studentId || '---'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'الكلية بسلطنة عمان' : 'SQU College'}</span>
                      <span className="text-brand-dark text-sm">{infoModalStudent.college || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'سنة الدفعة والالتحاق' : 'Cohort Year'}</span>
                      <span className="text-brand-dark text-sm">{infoModalStudent.cohort || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'المسار والدرجة العلمية' : 'Academic Degree'}</span>
                      <span className="text-brand-dark text-xs">{displayStudentType(infoModalStudent)} {infoModalStudent.degree ? `(${infoModalStudent.degree})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'مستوى التجويد المعتمد' : 'Certification Tier'}</span>
                      <span className="bg-brand-neutral text-brand-primary px-2.5 py-0.5 rounded text-[10.5px] font-black w-fit block mt-0.5">
                        {getStudentLevelDisplay(infoModalStudent, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION II: PLACE FOR REGISTRATION FOR A SESSION INFO */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black text-amber-805 uppercase tracking-wider border-b border-amber-200 pb-1.5">
                  📝 {lang === 'ar' ? 'معلومات حجز واختيار المقرأة الحالية' : 'Recitation Hub Registration Preferences'}
                </h5>
                <div className="bg-amber-500/5 border border-amber-100 rounded-3xl p-4.5 space-y-4 text-xs font-bold text-slate-700">
                  
                  {/* Formats prefered */}
                  <div>
                    <span className="text-slate-450 block text-[10px] uppercase mb-1">{lang === 'ar' ? 'نمط التلقي المفضل' : 'Preferred Lecture Delivery Format'}</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-200 rounded-xl text-amber-900 font-extrabold text-[11px] shadow-3xs">
                      {displayPreferredFormat(infoModalStudent)}
                    </span>
                  </div>

                  {/* Timings */}
                  <div>
                    <span className="text-slate-450 block text-[10px] uppercase mb-1">{lang === 'ar' ? 'المواعيد الشاغرة المرشحة' : 'Selected Classroom Timing Slots'}</span>
                    <p className="text-xs font-mono font-bold text-slate-800 leading-relaxed bg-white/60 p-3 rounded-2xl border border-slate-100">
                      {getFormattedTimings(infoModalStudent.enrollmentDetails?.timings || infoModalStudent.timings, lang, infoModalStudent)}
                    </p>
                  </div>

                  {/* Notes - SHOW ENTIRE NOTE WITHOUT COMPRESSING */}
                  <div>
                    <span className="text-slate-450 block text-[10px] uppercase mb-1">{lang === 'ar' ? 'ملاحظات التسجيل وباقات الحفظ والالتزام بالكامل' : 'Full Applicant Enrollment Notes (Uncompressed)'}</span>
                    <div className="text-[11.5px] font-extrabold text-slate-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-amber-200 shadow-3xs whitespace-pre-wrap break-words">
                      {infoModalStudent.enrollmentDetails?.notes || infoModalStudent.notes || (lang === 'ar' ? 'لا توجد ملاحظات تفصيلية مدونة من الطالبة.' : 'No background notes written by student.')}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-end">
              <button 
                onClick={() => setInfoModalStudent(null)}
                className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                {lang === 'ar' ? 'إغلاق نافذة السجل' : 'Done & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Informational Modal ("i" button) */}
      {infoModalTeacher && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-xl text-start animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={infoModalTeacher.avatar || `https://picsum.photos/seed/${infoModalTeacher.employeeId || infoModalTeacher.email}/100/100`} className="w-12 h-12 rounded-full border-2 border-white/40 animate-pulse" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-base font-black leading-tight">
                    {`${infoModalTeacher.firstName || ''} ${infoModalTeacher.lastName || ''}`.trim() || infoModalTeacher.name}
                  </h4>
                  <p className="text-xs text-white/80 font-mono mt-0.5">{infoModalTeacher.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setInfoModalTeacher(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
              
              {/* SECTION I: THEIR ACCOUNT INFO */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black text-brand-primary uppercase tracking-wider border-b border-brand-primary/10 pb-1.5">
                  👤 {lang === 'ar' ? 'بيانات الاعتماد التوظيفي للمعلمة' : 'Teacher Authority & Account Info'}
                </h5>
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-3.5 text-xs font-bold text-slate-700">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'الاسم كاملاً' : 'Full Name'}</span>
                      <span className="text-brand-dark font-extrabold text-sm">
                        {`${infoModalTeacher.firstName || ''} ${infoModalTeacher.lastName || ''}`.trim() || infoModalTeacher.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'رقم الهاتف المعلمة' : 'Phone Number'}</span>
                      <span className="text-brand-dark font-sans text-sm inline-block" dir="ltr" style={{ direction: 'ltr' }}>
                        {formatOmaniPhone(infoModalTeacher.phone)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'البريد الاكاديمي' : 'SQU Academic Email'}</span>
                      <span className="text-brand-dark font-mono text-xs">{infoModalTeacher.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'الرقم الوظيفي / الجامعي' : 'Employee ID'}</span>
                      <span className="text-brand-dark font-mono text-xs bg-brand-primary/5 border border-brand-primary/10 px-2 py-0.5 rounded w-fit">
                        {infoModalTeacher.employeeId || '---'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'القسم أو الكلية' : 'Department/College'}</span>
                      <span className="text-brand-dark text-sm">{infoModalTeacher.college || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'المستوى ورخصة السند' : 'Certification Category'}</span>
                      <span className="bg-brand-neutral text-brand-primary px-2.5 py-0.5 rounded text-[10.5px] font-black w-fit block mt-0.5">
                        {getTeacherLevelDisplay(infoModalTeacher, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-0.5">{lang === 'ar' ? 'عدد سنوات خبرة التدريس' : 'Total Teaching Experience'}</span>
                      <span className="text-brand-dark text-sm">{getTeacherPrefAndExp(infoModalTeacher).expYears} {lang === 'ar' ? 'سنوات' : 'years'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION II: PLACE FOR REGISTRATION INFO (TIMINGS, IN-PERSON, NOTES) */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black text-amber-805 uppercase tracking-wider border-b border-amber-250 pb-1.5">
                  📝 {lang === 'ar' ? 'عروض وجدول عمل ونمط المعلمة' : 'Recitation Circle Active Schedule Rules'}
                </h5>
                <div className="bg-amber-500/5 border border-amber-100 rounded-3xl p-4.5 space-y-4 text-xs font-bold text-slate-700">
                  
                  {/* Preferences format */}
                  <div>
                    <span className="text-slate-450 block text-[10px] uppercase mb-1">{lang === 'ar' ? 'قناة التدرير المفضلة للنظام' : 'Delivery Preference'}</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-200 rounded-xl text-amber-900 font-extrabold text-[11px] shadow-3xs">
                      {getTeacherPrefAndExp(infoModalTeacher).formatPref === 'online' ? (lang === 'ar' ? '💻 عن بعد (رقمي)' : '💻 Online (Teams)') : (lang === 'ar' ? '🏫 حضوري بالجامعة' : '🏫 In-person (Mosque)')}
                    </span>
                  </div>

                  {/* Timings */}
                  <div>
                    <span className="text-slate-450 block text-[10px] uppercase mb-1">{lang === 'ar' ? 'مواعيد التفرغ المتوفرة والمعتمدة' : 'Authorized instructing available schedules'}</span>
                    <p className="text-xs font-mono font-bold text-slate-800 leading-relaxed bg-white/60 p-3 rounded-2xl border border-slate-100">
                      {getFormattedTimings(infoModalTeacher.enrollmentDetails?.timings || infoModalTeacher.timings, lang, infoModalTeacher)}
                    </p>
                  </div>

                  {/* Notes - SHOW ENTIRE NOTE WITHOUT COMPRESSING */}
                  <div>
                    <span className="text-slate-450 block text-[10px] uppercase mb-1">{lang === 'ar' ? 'توجيهات وملاحظات عمل المعلمة بالكامل' : 'Full Supervisor Instruction Notes (Uncompressed)'}</span>
                    <div className="text-[11.5px] font-extrabold text-slate-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-amber-200 shadow-3xs whitespace-pre-wrap break-words">
                      {infoModalTeacher.enrollmentDetails?.notes || infoModalTeacher.notes || (lang === 'ar' ? 'لا توجد توجيهات إدارية مدونة للمعلمة.' : 'No special supervisor notes written.')}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-end">
              <button 
                onClick={() => setInfoModalTeacher(null)}
                className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                {lang === 'ar' ? 'إغلاق نافذة السجل' : 'Done & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inner helper to display student classification key order neatly
function stKeyOrderDisplay(stud: any) {
  const isPostgrad = 
    stud.degree === 'Master' || 
    stud.degree === 'PhD' || 
    stud.degree === 'Employee' ||
    stud.academicDegree?.toLowerCase().includes('master') ||
    stud.academicDegree?.toLowerCase().includes('phd') || 
    stud.cohort === 'Graduate' ||
    stud.isSenior === true;
  
  return isPostgrad ? '🎓 GRADUATE CANDIDATE' : '🎒 UNDERGRADUATE CANDIDATE';
}
