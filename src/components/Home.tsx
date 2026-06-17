import React, { useState } from 'react';
import { User, Announcement, LeaderboardEntry, Semester } from '../types';
import { 
  Award, 
  ScrollText, 
  CheckCircle,
  Calendar,
  Briefcase,
  GraduationCap,
  Info,
  Undo2,
  BookOpen,
  ShieldCheck,
  UserCheck,
  MapPin,
  Laptop
} from 'lucide-react';
import { toast } from '../lib/toast';

interface HomeProps {
  user: User | null;
  announcements?: Announcement[];
  leaderboard?: LeaderboardEntry[];
  navigate: (view: string) => void;
  lang: 'ar' | 'en';
  submitEnrollRequest: (details?: any, semesterId?: string) => void;
  viewExamResults: () => void;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  t: () => any;
  semesters?: Semester[];
}

const ALL_DAYS = [
  { key: 'Sunday', ar: 'الأحد', en: 'Sunday' },
  { key: 'Monday', ar: 'الاثنين', en: 'Monday' },
  { key: 'Tuesday', ar: 'الثلاثاء', en: 'Tuesday' },
  { key: 'Wednesday', ar: 'الأربعاء', en: 'Wednesday' },
  { key: 'Thursday', ar: 'الخميس', en: 'Thursday' },
  { key: 'Friday', ar: 'الجمعة', en: 'Friday' },
  { key: 'Saturday', ar: 'السبت', en: 'Saturday' }
];

const ALL_SLOTS = [
  { key: 'Fajr', ar: 'فجرية', en: 'Fajr (Early Morning)' },
  { key: '8:00-9:15', ar: '٨:٠٠ - ٩:١٥ ص', en: '8:00 - 9:15 AM' },
  { key: '10:00-11:15', ar: '١٠:٠٠ - ١١:١٥ ص', en: '10:00 - 11:15 AM' },
  { key: '12:00-1:15', ar: '١٢:٠٠ - ١:١٥ ظ', en: '12:00 - 1:15 PM' },
  { key: '2:15-3:30', ar: '٢:١٥ - ٣:٣٠ ظ', en: '2:15 - 3:30 PM' },
  { key: '4:15-5:30', ar: '٤:١٥ - ٥:٣٠ ع', en: '4:15 - 5:30 PM' },
  { key: '8:00-9:15PM', ar: '٨:٠٠ - ٩:١٥ م', en: '8:00 - 9:15 PM' }
];

export default function Home({
  user,
  navigate,
  lang,
  submitEnrollRequest,
  viewExamResults,
  setUser,
  t,
  semesters = []
}: HomeProps) {
  const isAr = lang === 'ar';
  const tField = (ar: string, en: string) => isAr ? ar : en;

  const getActiveSemester = (): Semester | null => {
    if (semesters.length === 0) return null;
    
    // Sort semesters to check the latest
    const sorted = [...semesters].sort((a, b) => new Date(a.announcementTime || 0).getTime() - new Date(b.announcementTime || 0).getTime());
    
    // Prefer the latest semester that is not stopped
    const openSemesters = sorted.filter(sem => {
      const isClosed = user?.role === 'TEACHER'
        ? (sem.stopRegistrationTeachers ?? sem.stopRegistration)
        : (sem.stopRegistrationStudents ?? sem.stopRegistration);
      return !isClosed;
    });
    if (openSemesters.length > 0) {
      return openSemesters[openSemesters.length - 1];
    }
    
    // Fallback to the latest overall
    return sorted[sorted.length - 1];
  };

  // Form State for Join Session
  const [studentType, setStudentType] = useState<'undergrad' | 'postgrad'>(() => {
    if (user && user.degree) {
      const degLower = user.degree.toLowerCase();
      if (degLower.includes('bachelor') || degLower.includes('تحت') || degLower.includes('بكالوريوس') || degLower.includes('undergrad')) {
        return 'undergrad';
      }
      if (degLower.includes('postgrad') || degLower.includes('employee') || degLower.includes('staff') || degLower.includes('موظف') || degLower.includes('دراسات') || degLower.includes('خريج')) {
        return 'postgrad';
      }
    }
    return 'undergrad';
  });

  React.useEffect(() => {
    if (user && user.degree) {
      const degLower = user.degree.toLowerCase();
      if (degLower.includes('bachelor') || degLower.includes('تحت') || degLower.includes('بكالوريوس') || degLower.includes('undergrad')) {
        setStudentType('undergrad');
      } else if (degLower.includes('postgrad') || degLower.includes('employee') || degLower.includes('staff') || degLower.includes('موظف') || degLower.includes('دراسات') || degLower.includes('خريج')) {
        setStudentType('postgrad');
      }
    }
  }, [user]);

  // For teachers: Online or In-Person format choice
  const [teacherFormat, setTeacherFormat] = useState<'online' | 'person'>('online');
  
  const [isLastSemester, setIsLastSemester] = useState<boolean>(false);
  const [timings, setTimings] = useState<Record<string, 'selected' | 'online' | 'person' | undefined>>({});
  const [notes, setNotes] = useState<string>('');
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);
  const [showConfirmResetModal, setShowConfirmResetModal] = useState<boolean>(false);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 px-4 sm:px-6">
        <div className="mb-10 animate-fade-in animate-duration-500 animate-delay-150">
          <h1 className="text-4xl sm:text-6xl font-black text-brand-dark mb-6 leading-tight">
            {t().heroTitle}
          </h1>
          <p className="text-2xl sm:text-3.5xl text-amber-500 mb-10 font-serif leading-loose px-4 max-w-2xl mx-auto">
            “{t().heroSubtitle}”
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button 
              className="px-8 py-4 bg-brand-primary text-white text-lg font-black rounded-2xl shadow-lg shadow-brand-primary/30 hover:bg-brand-accent hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer" 
              onClick={() => navigate('register')}
            >
              {t().getStarted}
            </button>
            <button 
              className="px-8 py-4 border-3 border-brand-primary text-brand-primary text-lg font-black rounded-2xl hover:bg-brand-neutral/50 hover:translate-y-0.5 transition-all duration-150 cursor-pointer bg-white shadow-xs" 
              onClick={() => navigate('login')}
            >
              {t().login}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';

  // Define active days based on student/teacher role and format preferences
  let activeDays = ALL_DAYS.slice(0, 5); // Sunday to Thursday default
  if (isTeacher) {
    if (teacherFormat === 'online') {
      // Teachers online gets Saturday & Friday columns besides Sun-Thu
      activeDays = ALL_DAYS;
    } else {
      activeDays = ALL_DAYS.slice(0, 5);
    }
  } else {
    if (studentType === 'postgrad') {
      // Postgraduate students also get Sunday, Friday & Saturday
      activeDays = ALL_DAYS;
    } else {
      activeDays = ALL_DAYS.slice(0, 5);
    }
  }

  // Define active slots based on student/teacher role and preferences
  let activeSlots = ALL_SLOTS.slice(1, 6); // Default is standard 5 slots (no Fajr, no 8-9:15pm)
  if (isTeacher) {
    if (teacherFormat === 'online') {
      activeSlots = ALL_SLOTS; // includes Fajr and 8:00-9:15 PM
    } else {
      activeSlots = ALL_SLOTS.slice(1, 6); // Fajr and 8:00-9:15 PM cannot be held in person!
    }
  } else {
    if (studentType === 'postgrad') {
      activeSlots = ALL_SLOTS; // Postgraduate gets Fajr and 8:00-9:15 PM
    } else {
      activeSlots = ALL_SLOTS.slice(1, 6);
    }
  }

  // Retrieve slot status, online-only restrictions and overall availability
  const getSlotStatus = (dayKey: string, slotKey: string) => {
    const isAlwaysOnlineOnly = slotKey === 'Fajr' || slotKey === '8:00-9:15PM';

    // 1. Fridays and Saturdays: No in-person sessions at all.
    if (dayKey === 'Friday' || dayKey === 'Saturday') {
      if (isTeacher) {
        if (teacherFormat === 'person') {
          return {
            allowed: false,
            onlineOnly: true,
            reasonAr: 'لا توجد حلقات حضورية في عطلة نهاية الأسبوع',
            reasonEn: 'No in-person Mosque classes on weekends'
          };
        }
        return { allowed: true, onlineOnly: true, reasonAr: 'حلقة عن بعد فقط', reasonEn: 'Online Only' };
      } else {
        if (studentType === 'undergrad') {
          return {
            allowed: false,
            onlineOnly: true,
            reasonAr: 'عن بعد فقط لطالبات الدراسات العليا',
            reasonEn: 'Online Only (for postgraduates)'
          };
        } else {
          return {
            allowed: true,
            onlineOnly: true,
            reasonAr: 'عن بعد فقط يومي الجمعة والسبت',
            reasonEn: 'Online Only'
          };
        }
      }
    }

    // 2. Thursday afternoon: After 12.00-1.15 PM, i.e., '2:15-3:30', '4:15-5:30', '8:00-9:15PM'
    if (dayKey === 'Thursday' && (slotKey === '2:15-3:30' || slotKey === '4:15-5:30' || slotKey === '8:00-9:15PM')) {
      if (isTeacher) {
        if (teacherFormat === 'person') {
          return {
            allowed: false,
            onlineOnly: true,
            reasonAr: 'لا توجد جلسات حضورية بعد الظهر يوم الخميس',
            reasonEn: 'No physical sessions Thursday afternoon'
          };
        }
        return { allowed: true, onlineOnly: true, reasonAr: 'عن بعد فقط للخميس بعد الظهر', reasonEn: 'Online Only' };
      } else {
        if (studentType === 'undergrad') {
          return {
            allowed: false,
            onlineOnly: false,
            reasonAr: 'لا توجد جلسات لطالبات البكالوريوس بعد الظهر بالخميس',
            reasonEn: 'No sessions for Bachelor on Thursday afternoon'
          };
        } else {
          return {
            allowed: true,
            onlineOnly: true,
            reasonAr: 'عن بعد فقط للخميس بعد الظهر',
            reasonEn: 'Online Only Thursday afternoon'
          };
        }
      }
    }

    // Fajr / 8:00-9:15 PM is online-only
    if (isAlwaysOnlineOnly) {
      if (isTeacher && teacherFormat === 'person') {
        return {
          allowed: false,
          onlineOnly: true,
          reasonAr: 'هذا الوقت متاح عن بعد فقط',
          reasonEn: 'This slot is online only'
        };
      }
      return {
        allowed: true,
        onlineOnly: true,
        reasonAr: 'عن بعد فقط',
        reasonEn: 'Online Only'
      };
    }

    return {
      allowed: true,
      onlineOnly: false,
      reasonAr: '',
      reasonEn: ''
    };
  };

  // Handle slot cell clicking
  const handleSlotClick = (dayKey: string, slotKey: string) => {
    const key = `${dayKey}_${slotKey}`;
    const status = getSlotStatus(dayKey, slotKey);

    if (!status.allowed) return;

    if (isTeacher) {
      // Simple selection toggle for teachers based on their selected overall format
      setTimings(prev => ({
        ...prev,
        [key]: prev[key] === 'selected' ? undefined : 'selected'
      }));
    } else {
      if (studentType === 'undergrad') {
        setTimings(prev => ({
          ...prev,
          [key]: (prev[key] === 'person' || prev[key] === 'selected') ? undefined : 'person'
        }));
      } else {
        // Postgraduate cycle selector: undefined -> 'online' -> 'person' (if not onlineOnly) -> undefined
        setTimings(prev => {
          const current = prev[key];
          let next: 'selected' | 'online' | 'person' | undefined = undefined;
          
          if (!current) {
            next = 'online';
          } else if (current === 'online') {
            if (status.onlineOnly) {
              next = undefined; // Skip in-person
            } else {
              next = 'person';
            }
          }
          
          return {
            ...prev,
            [key]: next
          };
        });
      }
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one slot is selected
    const selectedKeys = Object.entries(timings).filter(([_, val]) => !!val);
    if (selectedKeys.length === 0) {
      toast.error(tField(
        'يرجى تحديد وقت واحد على الأقل لإرسال رغبات جدولك الدراسي!', 
        'Please select at least one hour on the calendar grid to submit your schedule!'
      ));
      return;
    }

    const activeSem = getActiveSemester();
    if (!activeSem) {
      toast.error(tField(
        'عذراً، لا يوجد تقديم للفصل الدراسي حالياً أو انتهى موعد التسجيل.',
        'Sorry, there is no active enrollment or the deadline has passed.'
      ));
      return;
    }

    const details = {
      studentType: isTeacher ? 'teacher' : studentType,
      teacherFormat: isTeacher ? teacherFormat : undefined,
      isLastSemester: (!isTeacher && studentType === 'undergrad') ? isLastSemester : undefined,
      timings,
      notes,
      submittedAt: new Date().toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-US')
    };

    submitEnrollRequest(details, activeSem.id);
    toast.success(tField(
      'تم إرسال طلب تسجيل خيارات تلاوتك وتوقيتاتك بنجاح للفرز والمطابقة ببرنامج مسك بجامعة السلطان قابوس!', 
      'Your timing preferences and registration details have been successfully submitted!'
    ));
  };

  const handleResetRegistration = () => {
    setShowConfirmResetModal(true);
  };

  const confirmResetAction = () => {
    if (setUser) {
      setShowRegistrationForm(true);
      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          isEnrolled: false,
          enrollmentDetails: undefined
        };
        localStorage.setItem('itqan_user', JSON.stringify(updated));
        return updated;
      });
    }
    setShowConfirmResetModal(false);
  };

  const cancelResetAction = () => {
    setShowConfirmResetModal(false);
  };



  // --- UNIFIED VIEW FOR STUDENTS & TEACHERS ---
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 select-none">
      
      {/* Dynamic SQU Welcome Banner (no absence/coins HUD displayed) */}
      {/* Dynamic SQU Welcome Banner with level-appropriate classy, soft dark gradients matching the burgundy theme */}
      {(() => {
        const isUserAdmin = user?.role?.toLowerCase() === 'admin';
        const isTOrA = isTeacher || isUserAdmin;

        let lvlType: 'beginner' | 'intermediate' | 'advanced' | 'iqraa' | 'mujazah' = 'mujazah';

        if (isTOrA) {
          const lStr = (user?.level || '').toLowerCase();
          if (lStr.includes('اقرا') || lStr.includes('iqra')) {
            lvlType = 'iqraa';
          } else {
            lvlType = 'mujazah';
          }
        } else {
          const lvl = (user?.level || '').toUpperCase();
          if (lvl.includes('BEGIN') || lvl.includes('مبتد')) {
            lvlType = 'beginner';
          } else if (lvl.includes('INTERMED') || lvl.includes('تمهيد') || lvl.includes('متوسط') || lvl.includes('TAMKEEN') || lvl.includes('تمكين') || lvl.includes('INTRODUC')) {
            lvlType = 'intermediate';
          } else if (lvl.includes('ADVANC') || lvl.includes('متقدم')) {
            lvlType = 'advanced';
          } else if (lvl.includes('اقرا') || lvl.includes('iqra')) {
            lvlType = 'iqraa';
          } else if (lvl.includes('مجاز') || lvl.includes('mujaz')) {
            lvlType = 'mujazah';
          }
        }

        const stylesMap = {
          beginner: {
            bg: 'from-[#5e2b3c] via-[#431c28] to-[#250d14]', // Soft dusty deep pink / rose-maroon
            tag: 'bg-white/10 text-pink-200 border border-white/15'
          },
          intermediate: {
            bg: 'from-[#633a20] via-[#472714] to-[#261308]', // Soft earthy deep warm orange
            tag: 'bg-white/10 text-orange-200 border border-white/15'
          },
          advanced: {
            bg: 'from-[#224033] via-[#162b21] to-[#091510]', // Classy soft forest green
            tag: 'bg-white/10 text-emerald-250 border border-white/15'
          },
          iqraa: {
            bg: 'from-[#2b3c54] via-[#1b2738] to-[#0d141e]', // Classy soft steel blue
            tag: 'bg-white/10 text-sky-200 border border-white/15'
          },
          mujazah: {
            bg: 'from-[#432649] via-[#2d1832] to-[#170b1a]', // Beautiful soft imperial deep royal plum purple
            tag: 'bg-white/10 text-purple-200 border border-white/15'
          }
        };

        const choice = stylesMap[lvlType];

        return (
          <div className={`bg-gradient-to-br ${choice.bg} rounded-3xl p-6 sm:p-8 text-white text-start shadow-md mb-8 relative overflow-hidden transition-all duration-300`}>
            <div className="absolute right-0 bottom-0 top-0 opacity-[0.04] pointer-events-none">
              <svg className="w-96 h-96 text-white" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 0 L100 50 L50 100 L0 50 Z" />
              </svg>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div>
                <h2 className="text-xl sm:text-2.5xl font-black tracking-tight leading-tight mb-0 animate-fade-in font-sans">
                  {(() => {
                    const pfx = isTOrA ? (lang === 'ar' ? 'أ. ' : 'T. ') : '';
                    const fName = user?.firstName || '';
                    const lName = user?.lastName || '';
                    return `${pfx}${fName} ${lName}`.trim();
                  })()}
                </h2>
              </div>

              <div className={`${choice.tag} px-4.5 py-2 rounded-2xl shadow-3xs shrink-0 select-none backdrop-blur-xs font-black text-xs sm:text-sm`}>
                <span>
                  {(() => {
                    if (isTOrA) {
                      const lvlStr = (user?.level || '').toLowerCase();
                      if (lvlStr.includes('اقرا') || lvlStr.includes('iqra')) {
                        return lang === 'ar' ? 'طالبة اقراء' : 'Iqraa Student';
                      } else {
                        return lang === 'ar' ? 'مجازة' : 'Mujaza';
                      }
                    }
                    
                    const lvl = user?.level || 'غير مصنفة';
                    switch (lvl.toUpperCase()) {
                      case 'BEGINNER':
                      case 'مبتدئة':
                        return lang === 'ar' ? 'مبتدئة' : 'Beginner';
                      case 'INTERMEDIATE':
                      case 'INTRODUCTORY':
                      case 'تمهيدية':
                      case 'متوسطة':
                        return lang === 'ar' ? 'تمهيدية' : 'Introductory';
                      case 'ADVANCED':
                      case 'متقدمة':
                        return lang === 'ar' ? 'متقدمة' : 'Advanced';
                      default:
                        return lvl;
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DYNAMIC REGISTRATION AND SCHEDULE COORDINATION MODULE */}
      {(() => {
        const activeSem = getActiveSemester();

        if (!activeSem) {
          return (
            <div className="bg-white rounded-3xl border border-dashed border-slate-205 p-10 text-center text-slate-400 font-bold select-none animate-fade-in">
              {tField('لا توجد فترات تسجيل أو فصول دراسية نشطة حالياً.', 'No active semester registration periods at the moment.')}
            </div>
          );
        }

        const now = new Date();
        const isRoleBlocked = user?.role === 'TEACHER' ? !!activeSem.stopRegistrationTeachers : !!activeSem.stopRegistrationStudents;
        const isRegistrationClosed = isRoleBlocked || (user?.role === 'TEACHER'
          ? ((activeSem.stopRegistrationTeachersTime && new Date(activeSem.stopRegistrationTeachersTime) <= now) || activeSem.stopRegistration || (activeSem.stopRegistrationTime && new Date(activeSem.stopRegistrationTime) <= now))
          : ((activeSem.stopRegistrationStudentsTime && new Date(activeSem.stopRegistrationStudentsTime) <= now) || activeSem.stopRegistration || (activeSem.stopRegistrationTime && new Date(activeSem.stopRegistrationTime) <= now)));
        const isEnrolledInActiveSem = user.isEnrolled && user.enrollmentDetails && user.enrollmentDetails.semesterId === activeSem.id;

        const showFormDirectly = false; // Always show details card first

        if (isEnrolledInActiveSem) {
          return (
            /* Receipt / Registered schedule view card */
            <div id="enrolled_announcement" className="relative group bg-white rounded-3xl border border-emerald-500/50 shadow-3xs hover:border-emerald-500 overflow-hidden animate-fade-in transition-all duration-300">
              
              {/* Clean White Top Header Section */}
              <div className="relative bg-slate-50/60 p-6 sm:p-8 border-b border-slate-100 overflow-hidden">
                {/* Subtle Soft Glow */}
                <div className="absolute top-0 right-0 -tr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -bl-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header Content */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 bg-transparent text-start">
                    {/* Consistent Soft Icon Container */}
                    <div className="w-13 h-13 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 transition-transform duration-300 group-hover:scale-105 border border-emerald-500/20">
                      <CheckCircle className="w-6.5 h-6.5" />
                    </div>
                    
                    <div>
                      {/* Quiet Active Status Badge */}
                      <span className="inline-flex items-center gap-2 text-[10.5px] font-extrabold px-3 py-1 rounded-lg border transition-all duration-300 bg-emerald-50 text-emerald-700 border-emerald-150">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span className="tracking-wide font-sans">
                          {tField('تمت العملية بنجاح - جاري الفرز', 'Successfully Submitted - In Progress')}
                        </span>
                      </span>
                      
                      {/* Title */}
                      <h2 className="text-lg sm:text-xl font-black text-brand-dark mt-2 tracking-tight font-sans leading-tight">
                        {isTeacher 
                          ? tField(`تم تقديم رغبات التدريس لـ (${activeSem.title})`, `Teaching options scheduled for (${activeSem.title})`)
                          : tField(`طلب الالتحاق نشط لـ (${activeSem.title})`, `Enrollment active for (${activeSem.title})`)
                        }
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Body Section */}
              <div className="p-6 sm:p-10 relative z-10 bg-white">
                
                {/* Blockquote-styled Description Container with brand theme borders */}
                <div className="mb-6 p-5 bg-emerald-50/50 border-l-4 rtl:border-l-0 rtl:border-r-4 border-emerald-500/30 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl text-emerald-800 leading-relaxed text-sm sm:text-base text-justify font-sans">
                  <p className="font-bold text-emerald-700">
                    {tField('جاري إعداد التوزيع والفرز الإلكتروني الآمن بناءً على معطياتك مع شؤون الحلقات.', 'Status: Mapping coordinates with SQU automated harmony schedulers based on your preferences.')}
                  </p>
                </div>

              {/* Details list */}
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-5 mb-6 space-y-4 font-bold text-xs sm:text-sm text-gray-650">
                
                <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-3 gap-1">
                  <span className="text-gray-400 font-bold">{tField('نمط العضو بالبرنامج:', 'Academic Role Profile:')}</span>
                  <span className="text-brand-dark font-black">
                    {isTeacher ? (
                      tField('أستاذة وموجهة تلاوة معتمدة', 'SQU Certified Recitation Mentor')
                    ) : (
                      user.enrollmentDetails.studentType === 'undergrad' 
                        ? tField('طالبة دراسات أولية (بكالوريوس)', 'Undergraduate student')
                        : tField('طالبة دراسات عليا / موظفة جامعة', 'Postgraduate Student / SQU Staff')
                    )}
                  </span>
                </div>

                {isTeacher && user.enrollmentDetails.teacherFormat && (
                  <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-3 gap-1">
                    <span className="text-gray-400 font-bold">{tField('قناة التدريس المفضلة:', 'Preferred Recitation Format:')}</span>
                    <span className="text-brand-dark font-black">
                      {user.enrollmentDetails.teacherFormat === 'online' 
                        ? tField('حلقات رقمية (عن بعد)', 'Digital Recitation (Online)') 
                        : tField('حلقات فعلية (حضوري)', 'Physical Recitation (In-Person)')}
                    </span>
                  </div>
                )}

                {!isTeacher && user.enrollmentDetails.studentType === 'undergrad' && (
                  <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-3 gap-1">
                    <span className="text-gray-400 font-bold">{tField('الفصل الدراسي الأخير بالجامعة؟', 'Is this your final SQU semester?')}</span>
                    <span className="text-brand-dark font-black">
                      {user.enrollmentDetails.isLastSemester 
                        ? tField('نعم - خريجة هذا الفصل', 'Yes - Graduating senior') 
                        : tField('لا - طالبة مستمرة بالدراسة', 'No - Continuing standard academic status')}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-gray-400 font-bold block mb-3">{tField('ساعات التوقيت المستهدفة المطلوبة:', 'Your Selected Timings:')}</span>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(user.enrollmentDetails.timings || {}).filter(([_, val]) => !!val).map(([key, value]) => {
                      const [dayKey, slotKey] = key.split('_');
                      const targetDay = ALL_DAYS.find(d => d.key === dayKey);
                      const targetSlot = ALL_SLOTS.find(s => s.key === slotKey);
                      
                      if (!targetDay || !targetSlot) return null;

                      let label = isAr ? `${targetDay.ar} - ${targetSlot.ar}` : `${targetDay.en} - ${targetSlot.en}`;
                      if (value === 'online') {
                        label += ` (${tField('عن بعد', 'Online')})`;
                      } else if (value === 'person') {
                        if (!isTeacher && studentType === 'undergrad') {
                          label += ` (${tField('متاح', 'Available')})`;
                        } else {
                          label += ` (${tField('حضوري', 'In-Person')})`;
                        }
                      }

                      return (
                        <span 
                          key={key}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black ${
                            value === 'online' || isTeacher && user.enrollmentDetails.teacherFormat === 'online'
                              ? 'bg-sky-50 text-sky-700 border-sky-200' 
                              : value === 'person' || isTeacher && user.enrollmentDetails.teacherFormat === 'person'
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-brand-primary/5 text-brand-primary border-brand-primary/20'
                          }`}
                        >
                          <span>🕒</span>
                          <span>{label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex flex-col gap-1 text-xs">
                  <span className="text-gray-400 font-bold">{tField('ملاحظات المنسق ومطالب التدريس الحالية:', 'Remarks / Notes:')}</span>
                  <p className="text-brand-dark font-medium italic mt-1 mb-0 p-3 bg-white rounded-xl border border-gray-100">
                    {user.enrollmentDetails.notes || tField('لا توجد ملاحظات تخصصية إضافية.', 'No additional specific guidelines noted.')}
                  </p>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="flex flex-col sm:flex-row justify-between items-center select-none font-black text-xs text-gray-400 pt-6 border-t border-slate-100 gap-4 mt-6">
                <span>{tField('تقديم الرغبات:', 'Submitted on:')} {user.enrollmentDetails.submittedAt}</span>
                
                <button 
                  onClick={handleResetRegistration}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl border border-transparent hover:border-red-150 transition-all duration-200 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Undo2 className="w-4.5 h-4.5" />
                  <span>{tField('تعديل الحجز والرغبات', 'Edit Preferences & Resubmit')}</span>
                </button>
              </div>
              </div>
            </div>
          );
        }

        if (!showFormDirectly && !showRegistrationForm) {
          return (
            /* Dynamic Announcement Card from the active semester state */
            <div id="registration_announcement" className="relative group bg-white rounded-3xl border border-slate-200 shadow-3xs hover:border-brand-primary/20 overflow-hidden animate-fade-in transition-all duration-300">
              
              {/* Clean White Top Header Section */}
              <div className="relative bg-slate-50/60 p-6 sm:p-8 border-b border-slate-100 overflow-hidden">
                {/* Subtle Soft Glow */}
                <div className="absolute top-0 right-0 -tr-10 w-64 h-64 bg-brand-neutral/40 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -bl-10 w-64 h-64 bg-brand-neutral/30 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header Content */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 bg-transparent text-start">
                    {/* Consistent Soft Icon Container */}
                    <div className="w-13 h-13 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0 transition-transform duration-300 group-hover:scale-105 border border-brand-primary/15">
                      <Award className="w-6.5 h-6.5" />
                    </div>
                    
                    <div>
                      {/* Quiet Active Status Badge */}
                      <span className={`inline-flex items-center gap-2 text-[10.5px] font-extrabold px-3 py-1 rounded-lg border transition-all duration-300 ${
                        isRegistrationClosed 
                          ? 'bg-rose-50 text-rose-700 border-rose-150' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                      }`}>
                        <span className="relative flex h-2 w-2">
                          {!isRegistrationClosed && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${isRegistrationClosed ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                        </span>
                        <span className="tracking-wide font-sans">
                          {isRegistrationClosed ? tField('انتهت فترة التسجيل', 'Registration Stopped') : tField('متاح للتسجيل الآن', 'Registration Open Now')}
                        </span>
                      </span>
                      
                      {/* Semester Title - Prominent Sans-serif (Tajawal/Inter) */}
                      <h2 className="text-xl sm:text-2.5xl font-black text-brand-dark mt-2 tracking-tight font-sans leading-tight">
                        {activeSem.title}
                      </h2>
                    </div>
                  </div>

                  {/* Decorative Badge Removed */}
                </div>
              </div>

              {/* Main Body Section */}
              <div className="p-6 sm:p-10 relative z-10 bg-white">

                {/* Blockquote-styled Description Container with brand theme borders */}
                <div className="mb-8 p-5 bg-slate-50/50 border-l-4 rtl:border-l-0 rtl:border-r-4 border-brand-primary/30 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl text-slate-705 leading-relaxed text-sm sm:text-base text-justify font-sans">
                  <p className="font-medium text-slate-700">
                    {activeSem.description}
                  </p>
                </div>

                {/* Footer and CTA button (Stacked structure for cleaner presentation) */}
                <div className="pt-6 border-t border-slate-100 flex flex-col items-center w-full font-sans">
                  <button
                    id="start_registration_btn"
                    disabled={isRegistrationClosed}
                    onClick={() => setShowRegistrationForm(true)}
                    className={`w-full px-8 py-4 px-8 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-300 transform outline-none border ${
                      isRegistrationClosed 
                        ? 'bg-slate-105 text-slate-400 border-slate-200 cursor-not-allowed select-none'
                        : 'bg-brand-primary hover:bg-brand-accent text-white cursor-pointer shadow-3xs hover:ring-4 hover:ring-brand-primary/10 border-transparent transition-all duration-200 hover:-translate-y-0.5'
                    }`}
                  >
                    <span>{isRegistrationClosed 
                      ? (isRoleBlocked 
                          ? tField('التسجيل غير متاح لفئتكِ حالياً', 'Intake is not yet open for your academic profile') 
                          : tField('انتهت فترة تقديم الرغبات المتاحة حالياً', 'Intake period has ended / closed')
                        )
                      : tField('البدء برصد الرغبات وحجز المواعيد', 'Start Preferences Grid Submission')
                    }</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          /* Dynamic Registration Form styled beautifully */
          <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-xl p-6 sm:p-10 text-start animate-fade-in relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary flex-shrink-0">
                  <Calendar className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">
                    {isTeacher 
                      ? tField('رصد واختيار ساعات تسيير الحلقات القرآني للعام الفصول الممتدة', 'Register Teaching Hours availability')
                      : tField('تقديم طلب التسميع والالتحاق بالحلقات القرآني', 'Register Recital Weekly Session Hours')
                    }
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 font-bold mb-0">
                    {isTeacher
                      ? tField('حددي نمط الحلقة المطلوب لتأمين فرز مجموعات الطالبات بما يتوافق مع نمطك.', 'Select preference formats and hour schedules to map and align student roster lists.')
                      : tField('أدخلي تطلعاتك التدريبية في التسميع لحجز الساعات المناسبة بنادي مسك بجامعة السلطان قابوس.', 'Provide SQU class parameters and schedule grids to place you in the perfect Quran circle.')
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRegistrationForm(false)}
                className="px-3.5 py-2 hover:bg-slate-100 text-gray-500 rounded-xl border border-gray-150 transition-all text-xs font-black cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Undo2 className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">{tField('رجوع للملخص', 'Go Back')}</span>
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-6">
            
            {/* Step 1: Select Type (only for teachers) */}
            {isTeacher && (
              <div className="space-y-3">
                <label className="text-xs sm:text-sm font-black text-brand-dark flex items-center gap-1.5">
                  <span>١.</span>
                  <span>
                    {tField('تحديد نمط التدريب والتحفيظ المفضل لحلقتك:', '1. Target teaching format channel (Online/In-person):')}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 rounded-2xl border-2 cursor-pointer relative transition-all duration-200 flex items-center gap-3.5 ${
                      teacherFormat === 'online' 
                        ? 'border-brand-primary bg-brand-primary/5 shadow-xs font-black' 
                        : 'border-gray-150 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setTeacherFormat('online');
                      setTimings({});
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                      <Laptop className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-brand-dark leading-tight mb-1">{tField('حلقة تفاعلية عن بعد (رقمية)', 'Digital Session Circle (Online)')}</h5>
                      <span className="text-[0.65rem] text-gray-400 font-bold">Zoom/Meet SQU Virtual class integration</span>
                    </div>
                  </div>

                  <div 
                    className={`p-4 rounded-2xl border-2 cursor-pointer relative transition-all duration-200 flex items-center gap-3.5 ${
                      teacherFormat === 'person' 
                        ? 'border-brand-primary bg-brand-primary/5 shadow-xs font-black' 
                        : 'border-gray-150 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setTeacherFormat('person');
                      setTimings({});
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-brand-dark leading-tight mb-1">{tField('حلقة حضورية (مسجد الجامعة)', 'In-Person Mosque Circle')}</h5>
                      <span className="text-[0.65rem] text-gray-400 font-bold">Physical Recitation in SQU Saffron-colored archs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timetable Interactive Grid */}
            <div className="space-y-3.5 select-none">
              <div>
                <label className="text-xs sm:text-sm font-black text-brand-dark flex flex-wrap items-center gap-1.5">
                  <span>{isTeacher ? '٢.' : '١.'}</span>
                  <span>{tField('جدول رصد وتحديد التوقيتات والأوقات المناسبة للحلقة:', 'Preferred Weekly Timetable Calendar Grid:')}</span>
                </label>
                <span className="text-[0.7rem] text-gray-400 font-bold block mt-0.5 leading-relaxed">
                  {isTeacher ? (
                    tField('حددي الخانات الزمنية المناسبة معكِ لإقامة السلسلة. انقري على الفراغات الزمنية لتفعيلها باللون البنفسجي.', 'Click directly on the empty time slots corresponding to your teaching schedule to toggle selection.')
                  ) : (
                    studentType === 'undergrad' 
                      ? tField('انقري مباشرة على الفراغات الزمنية المواءمة لجدولك لتفعيلها. (ملاحظة: التسجيل لحلقات البكالوريوس حضوري فقط بمسجد الجامعة).', 'Click directly on the empty time slots corresponding to your SQU calendar. (Note: Undergraduate classes are strictly In-Person at SQU Mosque).')
                      : tField('طالبة دراسات عليا: انقري للتنقل بين خيارات: نقرة أولى (عن بعد) ➔ نقرة ثانية (حضوري) ➔ نقرة ثالثة (إلغاء).', 'Cycle mode: Check once (Online) ➔ Click twice (In-Person) ➔ Click a third time to clear.')
                  )}
                </span>
              </div>

              {/* Grid implementation (Flipped: Days on top header, Timings as rows) */}
              <div className="overflow-x-auto border border-gray-150 rounded-2xl select-none">
                <table className="w-full text-start text-xs border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-gray-150 text-brand-dark text-[0.7rem] font-black uppercase text-center select-none font-sans">
                      <th className="py-3 px-4 text-start font-serif text-[0.75rem] w-[140px] sm:w-[160px] bg-slate-50">{tField('الفترة الزمنية / اليوم', 'Time slot / SQU Day')}</th>
                      {activeDays.map(day => (
                        <th key={day.key} className="py-3 px-1.5 border-s border-gray-150 text-center font-black">
                          {isAr ? day.ar : day.en}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 select-none">
                    {activeSlots.map(slot => (
                      <tr key={slot.key} className="hover:bg-slate-50/40 transition-colors">
                        {/* Vertical Row Header: Time period */}
                        <td className="py-3 px-4 font-black text-brand-dark bg-slate-50/30 text-start w-[140px] sm:w-[160px]">
                          {isAr ? slot.ar : slot.en}
                        </td>
                        {activeDays.map(day => {
                          const key = `${day.key}_${slot.key}`;
                          const val = timings[key];
                          const status = getSlotStatus(day.key, slot.key);

                          let cellStyle = "bg-white text-gray-400 hover:bg-brand-primary/[0.02]";
                          let content = "";

                          if (!status.allowed) {
                            cellStyle = "bg-slate-100/70 text-slate-400 cursor-not-allowed border-dashed";
                            content = tField('غير متاح', 'Closed');
                          } else {
                            if (isTeacher) {
                              if (val === 'selected') {
                                cellStyle = "bg-brand-primary/10 border-brand-primary text-brand-primary font-black scale-[0.98]";
                                content = isAr ? '✓ متاح' : '✓ Selected';
                              } else {
                                content = "-";
                              }
                            } else if (studentType === 'undergrad') {
                              if (val === 'person' || val === 'selected') {
                                cellStyle = "bg-amber-50 text-amber-700 font-extrabold scale-[0.98] border border-amber-100";
                                content = isAr ? 'متاح' : 'Available';
                              } else {
                                content = "-";
                              }
                            } else {
                              // Postgraduate student cycles
                              if (val === 'online') {
                                cellStyle = "bg-sky-50 text-sky-700 font-extrabold scale-[0.98] border border-sky-100";
                                content = tField('عن بعد', 'Online');
                              } else if (val === 'person') {
                                cellStyle = "bg-amber-50 text-amber-700 font-extrabold scale-[0.98] border border-amber-100";
                                content = tField('حضوري', 'In-person');
                              } else {
                                content = "-";
                              }
                            }
                          }

                          return (
                            <td 
                              key={day.key}
                              onClick={() => handleSlotClick(day.key, slot.key)}
                              className={`py-3.5 px-2 text-center border-s border-gray-150 cursor-pointer select-none transition-all duration-150 text-[0.67rem] font-bold ${cellStyle}`}
                              title={!status.allowed ? (isAr ? status.reasonAr : status.reasonEn) : undefined}
                            >
                              <div className="flex items-center justify-center min-h-[22px]">
                                {content}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend Display */}
              {!isTeacher && studentType === 'postgrad' && (
                <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start pt-2 px-1 text-[0.7rem] font-extrabold select-none">
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded bg-sky-50 border border-sky-300 inline-block flex-shrink-0" />
                    <span className="text-sky-700">{tField('عن بعد', 'Online')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-300 inline-block flex-shrink-0" />
                    <span className="text-amber-700">{tField('حضوري', 'In-Person')}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-3.5 h-3.5 rounded bg-white border border-gray-200 inline-block flex-shrink-0" />
                    <span className="text-gray-405">{tField('غير متاح', 'Not selected')}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Compact Graduating Senior Option */}
            {!isTeacher && studentType === 'undergrad' && (
              <div className="p-3 bg-slate-50 border border-gray-150 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in animate-duration-300">
                <div className="text-start">
                  <h5 className="text-[11px] sm:text-xs font-black text-brand-dark leading-tight">
                    {tField('هل هذا الفصل الدراسي هو الفصل الأخير لكِ بجامعة السلطان قابوس؟', 'Is this current semester your final semester at SQU?')}
                  </h5>
                  <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                    {tField('طالبات الخريجات لهن الأولوية القصوى في حجز مقاعد الحلقات للتسريع والتمكين.', 'Graduating seniors get highest placement priority in circles.')}
                  </span>
                </div>
                <div className="flex gap-1.5 w-full sm:w-auto shrink-0 select-none">
                  <button 
                    type="button"
                    onClick={() => setIsLastSemester(true)}
                    className={`px-3 py-1.5 border rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      isLastSemester === true 
                        ? 'bg-brand-primary text-white border-brand-primary' 
                        : 'bg-white border-gray-150 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {tField('نعم، خريجة', 'Yes')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsLastSemester(false)}
                    className={`px-3 py-1.5 border rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      isLastSemester === false 
                        ? 'bg-brand-primary text-white border-brand-primary' 
                        : 'bg-white border-gray-150 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {tField('لا، مستمرة', 'No')}
                  </button>
                </div>
              </div>
            )}

            {/* Steps & Remarks */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-black text-brand-dark flex items-center gap-1.5 block">
                <span>{isTeacher ? '٣.' : '٢.'}</span>
                <span>{tField('ملاحظات المنسق وتطلعات التسميع (ملاحظات):', 'Personal Remarks & Course Desires (Notes):')}</span>
              </label>
              <textarea 
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isTeacher ? (
                  tField(
                    'اكتبي أي توجيهات تخصصية بشأن الحد الأدنى لمستوى الطالبات المطلوب بحلقتك، أو تفضيل تلاوات معينة...',
                    'e.g. Note any pedagogical styles, preferred SQU student cohort groups, or level constraints...'
                  )
                ) : (
                  tField(
                    'مثال: أفضّل التسميع الفردي، أو لدي رغبة بمراجعة أحكام ومخارج التجويد الأساسية أو التلاوة السريعة للإجازات...', 
                    'e.g. Any specific learning style preferences, previous memorization achievements, or Tajweed reviews...'
                  )
                )}
                className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold placeholder-gray-300"
              />
            </div>

            <div className="pt-3">
              <button 
                type="submit"
                className="w-full px-8 py-4 bg-brand-primary hover:bg-brand-accent text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/10 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{isTeacher ? tField('إرسال رغبات أوقات التدريس بالحلقة', 'Submit Teaching Schedule preferences') : tField('إلقاء طلب التسجيل وحجز المواعيد', 'Submit Recital Enrollment Schedule')}</span>
              </button>
            </div>

          </form>
        </div>
      );
    })()}

      {showConfirmResetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center transform transition-all">
            <h3 className="text-xl font-black text-brand-dark mb-4">
              {tField('تعديل الحجز', 'Edit Preferences')}
            </h3>
            <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">
              {tField(
                'هل أنتِ متأكدة من رغبتكِ في تعديل خيارات التوقيت وإعادة التقديم؟',
                'Are you sure you want to review and modify your current timing schedule?'
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={confirmResetAction}
                className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-xl font-black text-sm transition-colors border border-transparent"
              >
                {tField('نعم، تعديل الإرسال', 'Yes, modify')}
              </button>
              <button 
                onClick={cancelResetAction}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-sm transition-colors cursor-pointer"
              >
                {tField('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
