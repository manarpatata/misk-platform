import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Session, 
  SessionStudent, 
  Announcement,
  Gift,
  Semester
} from '../types';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Pencil, 
  Users, 
  Info, 
  Gift as GiftIcon, 
  Trash2, 
  Plus, 
  Megaphone,
  PlayCircle,
  ExternalLink,
  FileText,
  CheckCircle,
  X,
  Award,
  BookOpen,
  MessageSquare,
  AlertCircle,
  ScrollText,
  ChevronLeft
} from 'lucide-react';

interface MySessionProps {
  user: User;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  leaderboard: any[];
  setLeaderboard: React.Dispatch<React.SetStateAction<any[]>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  lang: 'ar' | 'en';
  showExamResults: boolean;
  setShowExamResults: (show: boolean) => void;
  t: () => any;
  semesters?: Semester[];
}

function softenColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '#8B5CF6'; 
  let cleanHex = hex.slice(1);
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;

  // Mix 15% of original color with 85% of white to get a beautiful premium soft color
  const mix = (val: number) => Math.round(val * 0.15 + 255 * 0.85);
  const softR = mix(r);
  const softG = mix(g);
  const softB = mix(b);

  const toHex = (val: number) => {
    const s = val.toString(16);
    return s.length === 1 ? '0' + s : s;
  };

  return `#${toHex(softR)}${toHex(softG)}${toHex(softB)}`;
}

const parseSingleOrDoubleSessions = (timeStr: string, lang: 'ar' | 'en') => {
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

  const labelSession1 = lang === 'ar' ? 'الحلقة الأولى' : '1st Session';
  const labelSession2 = lang === 'ar' ? 'الحلقة الثانية' : '2nd Session';
  const tbaText = lang === 'ar' ? 'لم يحدد بعد' : 'to be announced';

  const session1Str = `${labelSession1}: ${s1Day}${s1Time ? ` | ${s1Time}` : ''}`;
  const session2Str = s2Day ? `${labelSession2}: ${s2Day}${s2Time ? ` | ${s2Time}` : ''}` : `${labelSession2}: ${tbaText}`;

  return {
    session1: session1Str,
    session2: session2Str
  };
};

export default function MySession({
  user,
  sessions,
  setSessions,
  leaderboard,
  setLeaderboard,
  setUser,
  lang,
  showExamResults,
  setShowExamResults,
  t,
  semesters
}: MySessionProps) {
  // Find current active semester status
  const activeSemester = semesters?.find(s => s.id === 'fall_2026') || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('itqan_semesters') || '[]').find((s: any) => s.id === 'fall_2026') : null);
  const isSpreadStudents = activeSemester ? !!activeSemester.spreadToStudents : false;
  const isSpreadTeachers = activeSemester ? !!activeSemester.spreadToTeachers : false;

  // Filter sessions for current user (past and present)
  let userSessions = sessions.filter(s => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'TEACHER') {
      return s.teacher.name.toLowerCase().includes(user.firstName.toLowerCase()) || 
             s.teacher.name.toLowerCase().includes(user.lastName.toLowerCase());
    }
    // Student: match name or email, or s.id === user.sessionId
    return s.id === user.sessionId || s.students.some(stud => 
      stud.name.toLowerCase().includes(`${user.firstName} ${user.lastName}`.toLowerCase()) || 
      (stud.email && stud.email.toLowerCase() === user.email.toLowerCase())
    );
  });

  if (userSessions.length === 0 && user.role !== 'ADMIN') {
    if (user.role === 'TEACHER') {
      const sampleTeacherSession: Session = {
        id: 'sample_teacher_session',
        name: lang === 'ar' ? 'حلقة التلاوة المخصصة للمعلمة' : 'My Assigned Teaching Session',
        themeColor: '#7C3AED',
        themePhoto: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
        teacher: {
          name: `أ. ${user.firstName} ${user.lastName}`,
          phone: user.phone || '+968 9988 7766'
        },
        location: lang === 'ar' ? 'مسجد الجامعة - القاعة ٢' : 'University Mosque - Hall 2',
        time: lang === 'ar' ? 'الأحد والثلاثاء | 16:00 - 18:00' : 'Sunday & Tuesday | 16:00 - 18:00',
        maxStudents: 15,
        level: 'INTERMEDIATE',
        students: [
          { id: 's1', name: lang === 'ar' ? 'أمل الفارسية' : 'Amal Al-Farsia', money: 2850, avatar: 'https://picsum.photos/seed/s1/100/100', absencesExcused: 1, absencesUnexcused: 0, email: 'amel@student.squ.edu.om', phone: '+968 9776 5544', college: 'التربية', cohort: '2022' },
          { id: 's2', name: lang === 'ar' ? 'زكية الهاشمية' : 'Zakia Al-Hashmia', money: 1200, avatar: 'https://picsum.photos/seed/s2/100/100', absencesExcused: 0, absencesUnexcused: 1, email: 'zakia@student.squ.edu.om', phone: '+968 9112 3344', college: 'التربية', cohort: '2023' }
        ],
        announcements: [
          { id: 'sa1', text: lang === 'ar' ? 'أهلاً بطالباتنا في حلقة الفصل الجديد.' : 'Welcome to our recitation session.', type: 'text', date: '2026-06-16', author: `${user.firstName} ${user.lastName}` }
        ]
      };
      userSessions = [sampleTeacherSession];
    } else {
      const sampleStudentSession: Session = {
        id: 'sample_student_session',
        name: lang === 'ar' ? 'حلقة مسك للتلاوة والإتقان' : 'Misk Recitation Hub',
        themeColor: '#059669',
        themePhoto: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&q=80&w=600',
        teacher: {
          name: 'أ. عائشة الشكيلية',
          phone: '+968 9222 3344'
        },
        location: lang === 'ar' ? 'عبر الأثير - مايكروسوفت تيمز' : 'Virtual Teams Meeting',
        time: lang === 'ar' ? 'الإثنين والأربعاء | 10:00 - 12:00' : 'Monday & Wednesday | 10:00 - 12:00',
        maxStudents: 10,
        level: 'BEGINNER',
        students: [
          { id: 'usr_stud', name: `${user.firstName} ${user.lastName}`, money: user.money || 100, avatar: user.avatar || 'https://picsum.photos/seed/usr/100/100', absencesExcused: user.absencesExcused || 0, absencesUnexcused: user.absencesUnexcused || 0, email: user.email, phone: user.phone || '+968 9988 7766', college: user.college || 'العلوم', cohort: user.cohort || '2022' },
          { id: 's2', name: lang === 'ar' ? 'زكية الهاشمية' : 'Zakia Al-Hashmia', money: 1200, avatar: 'https://picsum.photos/seed/s2/100/100', absencesExcused: 0, absencesUnexcused: 1, email: 'zakia@student.squ.edu.om', phone: '+968 9112 3344', college: 'التربية', cohort: '2023' }
        ],
        announcements: [
          { id: 'sa1', text: lang === 'ar' ? 'يرجى الالتزام التام بالموعد والحضور المبكر.' : 'Please attend early and ensure a stable connection.', type: 'text', date: '2026-06-16', author: 'أ. عائشة الشكيلية' }
        ]
      };
      userSessions = [sampleStudentSession];
    }
  }

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (showExamResults && user.sessionId) {
      setSelectedSessionId(user.sessionId);
    }
  }, [showExamResults, user.sessionId]);

  const session = userSessions.find(s => s.id === selectedSessionId) || userSessions[0];
  const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';
  const announcements = session.announcements || [];

  // Local UI States
  const [activeInfoStudent, setActiveInfoStudent] = useState<SessionStudent | null>(null);
  const [giftModalStudentId, setGiftModalStudentId] = useState<string | null>(null);
  const [editField, setEditField] = useState<{ field: 'name' | 'location' | 'themeColor' | 'themePhoto'; value: string } | null>(null);
  const [tempColor, setTempColor] = useState('#7C3AED');
  const [tempPhoto, setTempPhoto] = useState('');
  const [newAnnouncementModal, setNewAnnouncementModal] = useState(false);

  // Sync edits when active session changes or when editField opens
  useEffect(() => {
    if (editField && editField.field === 'themeColor') {
      setTempColor(session.themeColor || '#7C3AED');
      setTempPhoto(session.themePhoto || '');
    }
  }, [editField, session]);

  // States for making new announcement
  const [annText, setAnnText] = useState('');
  const [annType, setAnnType] = useState<'text' | 'image' | 'video' | 'link' | 'pdf' | 'poll'>('text');
  const [annAttachment, setAnnAttachment] = useState('');

  // States for sending gift
  const [giftType, setGiftType] = useState<'box' | 'package' | 'envelope' | 'piggy'>('box');
  const [giftAmount, setGiftAmount] = useState(10);
  const [giftMessage, setGiftMessage] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showExamResults && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [showExamResults]);

  // --- Handlers ---

  const handleOpenGift = (giftId: number) => {
    // Collect gift
    setUser(prevUser => {
      if (!prevUser) return null;
      const targetGift = prevUser.gifts.find(g => g.id === giftId);
      if (targetGift && !targetGift.isOpened) {
        const updatedGifts = prevUser.gifts.map(g => g.id === giftId ? { ...g, isOpened: true } : g);
        const addedAmount = targetGift.amount;

        // sync global session representation student object as well
        setSessions(prevSessions => prevSessions.map(sess => {
          if (sess.id === prevUser.sessionId) {
            return {
              ...sess,
              students: sess.students.map(stud => {
                if (stud.name === `${prevUser.firstName} ${prevUser.lastName}`) {
                  return { ...stud, money: stud.money + addedAmount };
                }
                return stud;
              })
            };
          }
          return sess;
        }));

        // sync leaderboard
        setLeaderboard(prevL => prevL.map(item => {
          if (item.name === `${prevUser.firstName} ${prevUser.lastName}`) {
            return { ...item, money: item.money + addedAmount };
          }
          return item;
        }));

        return {
          ...prevUser,
          money: prevUser.money + addedAmount,
          gifts: updatedGifts
        };
      }
      return prevUser;
    });
  };

  const handleEditSessionField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editField) return;

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        if (editField.field === 'themeColor') {
          return {
            ...s,
            themeColor: tempColor,
            themePhoto: tempPhoto
          };
        }
        return {
          ...s,
          [editField.field]: editField.value
        };
      }
      return s;
    }));

    setEditField(null);
  };

  const handleChangeStudentAbsence = (studentId: string, type: 'excused' | 'unexcused', offset: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          students: s.students.map(student => {
            if (student.id === studentId) {
              const prevExcused = student.absencesExcused || 0;
              const prevUnexcused = student.absencesUnexcused || 0;
              const nextExcused = type === 'excused' ? Math.max(0, prevExcused + offset) : prevExcused;
              const nextUnexcused = type === 'unexcused' ? Math.max(0, prevUnexcused + offset) : prevUnexcused;

              // If updating current logged in student
              if (user.role === 'STUDENT' && student.name === `${user.firstName} ${user.lastName}`) {
                setUser(prevU => prevU ? { ...prevU, absencesExcused: nextExcused, absencesUnexcused: nextUnexcused } : null);
              }

              return {
                ...student,
                absencesExcused: nextExcused,
                absencesUnexcused: nextUnexcused
              };
            }
            return student;
          })
        };
      }
      return s;
    }));
  };

  const handleDeleteStudent = (studentId: string) => {
    const isAr = lang === 'ar';
    const confirmMsg = isAr 
      ? 'هل أنتِ متأكدة من حذف هذه الطالبة من الحلقة؟' 
      : 'Are you sure you want to remove this student from the session?';

    if (window.confirm(confirmMsg)) {
      setSessions(prev => prev.map(s => {
        if (s.id === session.id) {
          return {
            ...s,
            students: s.students.filter(stud => stud.id !== studentId)
          };
        }
        return s;
      }));
    }
  };

  const handleDeleteAnnouncement = (annId: string) => {
    const isAr = lang === 'ar';
    const confirmMsg = isAr 
      ? 'هل أنتِ متأكدة من حذف هذا الإعلان؟' 
      : 'Are you sure you want to delete this announcement?';

    if (window.confirm(confirmMsg)) {
      setSessions(prev => prev.map(s => {
        if (s.id === session.id) {
          return {
            ...s,
            announcements: s.announcements.filter(ann => ann.id !== annId)
          };
        }
        return s;
      }));
    }
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annText) return;

    const newAnn: Announcement = {
      id: Date.now().toString(),
      text: annText,
      type: annType,
      attachment: annType === 'pdf' ? '#' : annAttachment,
      date: new Date().toISOString().split('T')[0],
      author: user.firstName + ' ' + user.lastName,
      pollOptions: annType === 'poll' ? [
        { id: 1, text: lang === 'ar' ? 'الخيار الأول' : 'Option One', votes: 0 },
        { id: 2, text: lang === 'ar' ? 'الخيار الثاني' : 'Option Two', votes: 0 }
      ] : undefined
    };

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          announcements: [newAnn, ...s.announcements]
        };
      }
      return s;
    }));

    // Reset Form
    setAnnText('');
    setAnnType('text');
    setAnnAttachment('');
    setNewAnnouncementModal(false);
  };

  const handleVotePoll = (annId: string, optionId: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          announcements: s.announcements.map(ann => {
            if (ann.id === annId && !ann.voted) {
              return {
                ...ann,
                voted: optionId,
                pollOptions: ann.pollOptions?.map(opt => 
                  opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                )
              };
            }
            return ann;
          })
        };
      }
      return s;
    }));
  };

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftModalStudentId) return;

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          students: s.students.map(stud => {
            if (stud.id === giftModalStudentId) {
              const newGift: Gift = {
                id: Date.now(),
                amount: giftAmount,
                message: giftMessage,
                giftType: giftType,
                isOpened: false
              };

              // Check if the recipient student is actually current logged-in user
              if (user.role === 'STUDENT' && stud.name === `${user.firstName} ${user.lastName}`) {
                setUser(prevU => prevU ? { ...prevU, gifts: [newGift, ...prevU.gifts] } : null);
              } else {
                // If it is another student in the teacher's list, simulate their gold coin addition automatically
                stud.money += giftAmount;
                // Sync leaderboard
                setLeaderboard(prevL => prevL.map(item => 
                  item.name === stud.name ? { ...item, money: item.money + giftAmount } : item
                ));
              }

              return {
                ...stud,
                gifts: [newGift, ...(stud.gifts || [])]
              };
            }
            return stud;
          })
        };
      }
      return s;
    }));

    alert(lang === 'ar' ? 'تم إرسال الجائزة بنجاح!' : 'Gift sent successfully close!');
    setGiftModalStudentId(null);
    setGiftMessage('');
    setGiftAmount(10);
    setGiftType('box');
  };

  // Helper selectors for chest icon styles
  const renderGiftBox = (gift: Gift) => {
    switch (gift.giftType) {
      case 'package':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center relative shadow-sm cursor-pointer select-none">
            <div className="absolute w-1 h-full left-1/2 -translate-x-1/2 bg-black/15"></div>
            <div className="absolute h-1 w-full top-1/2 -translate-y-1/2 bg-black/15"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
      case 'envelope':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center relative shadow-sm cursor-pointer select-none">
            <div className="absolute w-4 h-4 bg-red-600 rounded-full border border-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
      case 'piggy':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center relative shadow-sm cursor-pointer select-none">
            <div className="absolute w-6 h-1 bg-slate-600 top-3 rounded-full left-1/2 -translate-x-1/2"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
      case 'box':
      default:
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center relative shadow-md shadow-red-500/20 cursor-pointer select-none transition-transform duration-300 hover:rotate-2 hover:scale-105">
            <div className="absolute w-3 h-full bg-amber-400"></div>
            <div className="absolute h-3 w-full bg-amber-400"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
    }
  };

  const getGiftName = (type: string) => {
    if (lang === 'ar') {
      switch (type) {
        case 'box': return 'علبة هدايا عصرية';
        case 'package': return 'طرد بريدي ورقي';
        case 'envelope': return 'مظروف رسائل تشجيعي';
        case 'piggy': return 'حصالة توفير نقدية';
        default: return 'هدية تشجيعية';
      }
    } else {
      switch (type) {
        case 'box': return 'Gift Box';
        case 'package': return 'Cardboard Package';
        case 'envelope': return 'Encouraging Letter';
        case 'piggy': return 'Piggy Bank';
        default: return 'Incentive Reward';
      }
    }
  };

  if (selectedSessionId === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 animate-fade-in select-none">
        {/* Header */}
        <div className="text-center mb-12 select-none">
          <h1 className="text-3xl sm:text-5xl font-black text-brand-dark mb-4">
            {lang === 'ar' ? 'سجل حلقاتي القرآني' : 'My Quranic Sessions'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-bold max-w-xl mx-auto">
            {lang === 'ar' 
              ? 'تتبعي حِلق التلاوة المقيدة بها حالياً وتاريخ مشاركاتكِ المشرّفة للفصول السابقة.' 
              : 'Browse your active and past physical or digital Quran recitation circles.'}
          </p>
        </div>

        {/* Sessions Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userSessions.map(s => {
            const softBorderColor = softenColor(s.themeColor || '#7C3AED');
            return (
              <div 
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className="relative bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group text-start flex flex-col justify-between min-h-[300px]"
                style={{ borderColor: softBorderColor }}
              >
                {/* Left/Start accent strip of chosen color in beautiful soft premium pastel hex */}
                <div className="absolute top-0 bottom-0 start-0 w-2 z-20" style={{ backgroundColor: softBorderColor }}></div>
                
                {/* Theme Photo Banner */}
                {s.themePhoto ? (
                  <div className="h-28 w-full relative overflow-hidden bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${s.themePhoto})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: softBorderColor }} />
                  </div>
                ) : (
                  <div className="h-6 w-full shrink-0" style={{ backgroundColor: `${softBorderColor}20` }} />
                )}

                <div className="p-5 ps-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span 
                      className="text-[0.65rem] font-black uppercase tracking-wider px-2.5 py-1 rounded-full" 
                      style={{ 
                        backgroundColor: `${softBorderColor}30`, 
                        color: s.themeColor || '#7C3AED' 
                      }}
                    >
                      {s.isPast ? (lang === 'ar' ? 'حلقة سابقة' : 'Past Completed') : (lang === 'ar' ? 'حلقة نشطة' : 'Active Current')}
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 bg-gray-100 rounded-full text-gray-500">
                      {lang === 'ar' ? t()[s.level.toLowerCase()] || s.level : s.level}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-brand-dark mb-2.5 group-hover:text-brand-primary transition-colors">
                    {s.name}
                  </h3>
                  
                  <p className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">{lang === 'ar' ? 'المعقّدة الأستاذة:' : 'Teacher:'}</span>
                    <span className="text-brand-dark font-black">{s.teacher.name}</span>
                  </p>

                  <div className="space-y-2.5 pt-1 text-xs font-bold text-gray-500">
                    <div className="space-y-2 border-t border-gray-100 pt-3 mb-2.5">
                      {(() => {
                        const { session1, session2 } = parseSingleOrDoubleSessions(s.time, lang);
                        return (
                          <>
                            {session1 && (
                              <div className="flex items-center gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-gray-100 font-mono text-[10.5px] text-gray-600">
                                <span>📅</span>
                                <span>{session1}</span>
                              </div>
                            )}
                            {session2 && (
                              <div className="flex items-center gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-gray-100 font-mono text-[10.5px] text-gray-600">
                                <span>📅</span>
                                <span>{session2}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-dashed border-gray-100">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{s.location}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 border-t border-gray-105 p-4 ps-8 flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: s.themeColor || '#7C3AED' }}>
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{s.students.length} {lang === 'ar' ? 'طالبات مقيدات' : 'Students'}</span>
                  </div>
                  <span className="font-extrabold flex items-center gap-1 text-brand-primary group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" style={{ color: s.themeColor || '#7C3AED' }}>
                    {lang === 'ar' ? 'دخول الحلقة ➔' : 'View Session ➔'}
                  </span>
                </div>
              </div>
            );
          })}

          {userSessions.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 py-12 text-center max-w-2xl mx-auto w-full">
              <span className="text-5xl block mb-4">⏳</span>
              <h3 className="text-lg font-black text-brand-dark mb-2">
                {lang === 'ar' ? 'بانتظار اعتماد ونشر تفاصيل الحِلق الدراسيّة' : 'Class Distributions Release Pending'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-bold leading-relaxed mb-4">
                {lang === 'ar' 
                  ? 'لم يقم المسؤول بنشر تفاصيل توزيع مواءمة الحِلق لهذا الفصل بعد. سيتم إعلان الحِلق التلقائي والمجموعات في صفحتكِ فور اعتماد التسميع والتشكيل بالفرز العام.' 
                  : 'The administrator has not finalized or published the classroom allocations for the current academic stream yet. Your assigned recitation circle will appear here instantly upon administrative approval.'}
              </p>
              <div className="inline-block px-4 py-2 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl text-[11px] font-black text-brand-primary">
                {lang === 'ar' ? '🔔 سيتم إشعاركِ عبر قنوات نادي إتقان' : '🔔 You will be updated immediately via club official pipelines'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const themeColor = session.themeColor || '#7C3AED';
  const softBorderColor = softenColor(themeColor);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 active-session-container">
      {/* Dynamic Theme color style overrides */}
      <style>{`
        .active-session-container .bg-brand-primary { background-color: ${themeColor} !important; }
        .active-session-container .text-brand-primary { color: ${themeColor} !important; }
        .active-session-container .border-brand-primary { border-color: ${themeColor} !important; }
        .active-session-container .border-brand-primary\\/10 { border-color: ${themeColor}1a !important; }
        .active-session-container .border-brand-primary\\/15 { border-color: ${themeColor}26 !important; }
        .active-session-container .border-brand-primary\\/25 { border-color: ${themeColor}40 !important; }
        .active-session-container .bg-brand-neutral { background-color: ${themeColor}0e !important; }
        .active-session-container .bg-brand-neutral\\/10 { background-color: ${themeColor}1a !important; }
        .active-session-container .bg-brand-neutral\\/20 { background-color: ${themeColor}33 !important; }
        .active-session-container .text-brand-accent { color: ${themeColor} !important; }
        .active-session-container .hover\\:bg-brand-accent:hover { background-color: ${themeColor}dd !important; }
        .active-session-container .hover\\:border-brand-primary\\/30:hover { border-color: ${themeColor}4d !important; }
        .active-session-container .focus\\:border-brand-primary:focus { border-color: ${themeColor} !important; }
        .active-session-container .shadow-brand-primary\\/10 { box-shadow: 0 4px 6px -1px ${themeColor}1a, 0 2px 4px -2px ${themeColor}1a !important; }
      `}</style>

      {/* Back button to go back to all user sessions */}
      <div className="mb-6 flex justify-start select-none">
        <button
          onClick={() => {
            setSelectedSessionId(null);
            setShowExamResults(false);
          }}
          className="px-4 py-2 bg-white border border-brand-primary/10 hover:border-brand-primary/20 text-brand-primary hover:text-brand-accent rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer group"
        >
          <ChevronLeft className="w-4.5 h-4.5 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
          <span>{lang === 'ar' ? 'العودة لجميع الحلقات' : 'Back to All Sessions'}</span>
        </button>
      </div>

      {/* Teacher Session details header */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden mb-8" style={{ borderColor: softBorderColor }}>
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Theme Photo / Card Cover */}
          <div className="md:col-span-3 min-h-[220px] relative flex flex-col items-center justify-center p-6 text-center text-white select-none overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: session.themePhoto ? `url(${session.themePhoto})` : undefined, backgroundColor: session.themeColor || '#8B5CF6' }}>
            {/* Color Overlay to ensure readability and contrast */}
            <div className="absolute inset-0 bg-brand-dark/50" />
            <div className="absolute inset-0 mix-blend-overlay opacity-40" style={{ backgroundColor: session.themeColor || '#8B5CF6' }} />
            
            {/* Elegant Minimal Ornate Badge Frame instead of profile picture */}
            <div className="relative z-10 w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-md mb-3 shadow-sm">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            
            <div className="relative z-10 px-4">
              <h4 className="text-lg sm:text-xl font-black mb-1 tracking-tight leading-tight">{session.teacher.name}</h4>
              <div className="text-xs font-bold text-white/90 font-mono tracking-tight flex items-center justify-center gap-1 mt-1 bg-white/15 border border-white/20 py-0.5 px-3 rounded-full backdrop-blur-sm">
                <span>📱</span>
                <span>{session.teacher.phone}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-9 p-6 md:p-8 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                  {t().sessionName}
                </label>
                <div className="text-xl font-bold text-brand-dark flex flex-wrap items-center gap-2">
                  <span>{session.name}</span>
                  <div className="flex gap-1.5 items-center">
                    {isTeacher && (
                      <>
                        <Pencil 
                          className="w-4 h-4 text-gray-400 hover:text-brand-primary cursor-pointer transition-colors" 
                          onClick={() => setEditField({ field: 'name', value: session.name })}
                        />
                        <button 
                          onClick={() => setEditField({ field: 'themeColor', value: session.themeColor || '#7C3AED' })}
                          className="p-1 px-2.5 rounded-full text-[0.65rem] font-black border bg-slate-50 text-gray-500 hover:bg-white hover:text-brand-primary hover:border-brand-primary/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-3xs border border-white" style={{ backgroundColor: session.themeColor || '#7C3AED' }}></span>
                          <span>{lang === 'ar' ? 'تعديل لون المظهر' : 'Edit Theme'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:text-end">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                  {t().level}
                </label>
                <span className="inline-block bg-brand-neutral text-brand-primary border border-brand-primary/25 text-xs font-bold py-1 px-3 rounded-full">
                  {lang === 'ar' ? t()[session.level.toLowerCase()] || session.level : session.level}
                </span>
              </div>
            </div>

            <hr className="my-5 border-gray-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-neutral/80 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <small className="text-xs text-gray-400 font-bold block">{t().sessionLocation}</small>
                  <div className="font-bold text-brand-dark flex items-center gap-1.5 text-sm">
                    <span>{session.location}</span>
                    {isTeacher && (
                      <Pencil 
                        className="w-3.5 h-3.5 text-gray-400 hover:text-brand-primary cursor-pointer" 
                        onClick={() => setEditField({ field: 'location', value: session.location })}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-neutral/80 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <small className="text-xs text-gray-400 font-bold block mb-1">{lang === 'ar' ? 'مواعيد الحلقات الأسبوعية التلقائية:' : 'Weekly Session Timings:'}</small>
                  {(() => {
                    const { session1, session2 } = parseSingleOrDoubleSessions(session.time, lang);
                    return (
                      <div className="space-y-1 font-extrabold text-brand-dark text-sm text-start">
                        <div className="flex items-center gap-1.5">
                          <span>⏱</span>
                          <span>{session1}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>⏱</span>
                          <span>{session2}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Mates section for STUDENTS */}
      {!isTeacher && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-brand-primary/10 shadow-sm mb-8 text-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-lg font-black text-brand-dark">
                {lang === 'ar' ? 'زميلات وبنات حلقة التلاوة المرافقة' : 'My Recitation Session Mates'}
              </h4>
              <p className="text-xs text-gray-400 font-bold mb-0">
                {lang === 'ar' 
                  ? 'قائمة أسماء الطالبات المسجلات معكِ في نفس حلقة التلاوة بنادي مسك بجامعة السلطان قابوس.' 
                  : 'A list of SQU student partners registered in your current recitation circle.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {session.students.map((stud) => (
              <div 
                key={stud.id} 
                className="p-3.5 bg-slate-50 border border-gray-100 rounded-xl font-black text-brand-dark flex items-center gap-2.5 text-sm"
              >
                <div className="w-2.5 h-2.5 bg-brand-primary rounded-full" />
                <span>{stud.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHER Management Roster for Students */}
      {isTeacher && (
        <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-6 sm:p-8 mb-8 text-start">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-md shadow-brand-primary/10 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-brand-dark">
                {lang === 'ar' ? 'سجل تفاصيل الطالبات المقيدات بالحلقة' : 'Registered Student Directory'}
              </h4>
              <p className="text-xs sm:text-sm text-gray-400 font-bold mb-0">
                {lang === 'ar' 
                  ? 'استعراض بيانات الطالبات بالتفصيل وتخصصاتهن الدراسية وأرقام هواتفهن بنادي مسك بجامعة السلطان قابوس.' 
                  : 'View comprehensive student academic streams, contacts, and personal level details.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-black uppercase tracking-wider text-end select-none">
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الطالبة / الهاتف' : 'Student / Phone'}</th>
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الكلية والأكاديميا' : 'College & Stream'}</th>
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الدفعة' : 'Cohort'}</th>
                  <th className={`pb-3 py-2 text-end ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{lang === 'ar' ? 'البيانات' : 'Profile'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {session.students.map((stud) => (
                  <tr key={stud.id} className="hover:bg-brand-neutral/10 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={stud.avatar} 
                          alt="" 
                          className="w-10 h-10 rounded-full border border-gray-150 flex-shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-extrabold text-brand-dark leading-snug">{stud.name}</div>
                          <div className="text-xs text-brand-primary font-mono tracking-tight" dir="ltr" style={{ direction: 'ltr', textAlign: 'start' }}>
                            📱 {stud.phone || '+968 9988 7766'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-start font-bold text-gray-600">
                      🎓 {stud.college || (lang === 'ar' ? 'كلية التربية' : 'Education')}
                    </td>

                    <td className="py-4 text-start font-bold text-gray-500">
                      🆔 Cohort {stud.cohort || '2022'}
                    </td>

                    <td className="py-4 text-end">
                      <div className={`flex flex-wrap items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                        {/* Profile Card Trigger */}
                        <button 
                          className="px-2.5 py-1.5 rounded-lg border border-gray-150 hover:bg-gray-50 text-gray-500 font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                          onClick={() => setActiveInfoStudent(stud)}
                        >
                          <Info className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'عرض البيانات' : 'Profile'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Inline Section Field Editor modal */}
      {editField && (
        <div 
          className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto select-none"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setEditField(null);
            }
          }}
        >
          <div className="bg-white p-6 rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-md text-start animate-fade-in my-auto max-h-[85vh] overflow-y-auto select-text">
            <h4 className="text-lg font-black mb-4 text-brand-dark">
              {editField.field === 'name' 
                ? t().sessionName 
                : editField.field === 'location' 
                  ? t().sessionLocation 
                  : (lang === 'ar' ? 'تصميم مظهر ولون حلقة التلاوة' : 'Recitation Session Theme Settings')}
            </h4>
            <form onSubmit={handleEditSessionField}>
              <div className="mb-6">
                {editField.field === 'themeColor' ? (
                  <div className="space-y-4">
                    {/* Header accent info */}
                    <div className="p-3 bg-slate-50 border border-gray-100 rounded-2xl flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tempColor }}></div>
                      <span className="text-xs font-black text-gray-700">
                        {lang === 'ar' ? 'معاينة المظهر النشط' : 'Theme Customization Preview'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-bold mb-1">
                      {lang === 'ar' 
                        ? '١. اختر لون مظهر مخصص لبطاقة حلقة التلاوة:' 
                        : '1. Select a customized style color accent for this recitation session:'}
                    </p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { color: '#7C3AED', name: lang === 'ar' ? 'بنفسجي' : 'Purple' },
                        { color: '#059669', name: lang === 'ar' ? 'أخضر' : 'Green' },
                        { color: '#D97706', name: lang === 'ar' ? 'عسلي' : 'Amber' },
                        { color: '#2563EB', name: lang === 'ar' ? 'أزرق' : 'Blue' },
                        { color: '#DB2777', name: lang === 'ar' ? 'وردي' : 'Pink' },
                        { color: '#DC2626', name: lang === 'ar' ? 'أحمر' : 'Red' },
                        { color: '#0891B2', name: lang === 'ar' ? 'سيان' : 'Cyan' },
                        { color: '#4B5563', name: lang === 'ar' ? 'رمادي' : 'Slate' }
                      ].map(item => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setTempColor(item.color)}
                          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                            tempColor === item.color 
                              ? 'border-brand-primary bg-brand-primary/5' 
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full inline-block shadow-3xs" style={{ backgroundColor: item.color }}></span>
                          <span className="text-[0.6rem] font-bold text-gray-500">{item.name}</span>
                        </button>
                      ))}
                    </div>
                    {/* Color picker */}
                    <div className="flex items-center gap-3 bg-gray-50/50 p-2 border border-gray-150 rounded-2xl">
                      <input 
                        type="color" 
                        value={tempColor}
                        onChange={(e) => setTempColor(e.target.value)}
                        className="w-10 h-10 border-0 rounded cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-bold text-gray-500">
                        {lang === 'ar' ? 'أو اختر لون دقيق مخصص:' : 'Or pick an exact custom color:'}
                        <span className="font-mono text-[0.65rem] text-brand-primary font-black block">{tempColor}</span>
                      </span>
                    </div>

                    {/* Photo theme component */}
                    <hr className="my-3 border-gray-150" />
                    <p className="text-xs text-gray-500 font-bold mb-1">
                      {lang === 'ar' 
                        ? '٢. اختر صورة غلاف مظهر حلقة التلاوة:' 
                        : '2. Select a Cover Theme Photo Background:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { 
                          url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'زخرفة إسلامية' : 'Mosque Geometry' 
                        },
                        { 
                          url: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'قنديل روحي' : 'Lantern Arch' 
                        },
                        { 
                          url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'نقش ماندالا' : 'Elegant Pattern' 
                        },
                        { 
                          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'أفق الغروب' : 'Dusk Sky' 
                        }
                      ].map(item => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => setTempPhoto(item.url)}
                          className={`flex items-center gap-2 p-1.5 rounded-xl border-2 transition-all text-start cursor-pointer hover:bg-gray-50 text-xs font-bold ${
                            tempPhoto === item.url 
                              ? 'border-brand-primary bg-brand-primary/5 shadow-2xs' 
                              : 'border-gray-150'
                          }`}
                        >
                          <img src={item.url} alt="" className="w-8 h-8 object-cover rounded-md flex-shrink-0" referrerPolicy="no-referrer" />
                          <span className="text-[0.65rem] truncate text-gray-700 block leading-tight">{item.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom image URL input */}
                    <div className="mt-2.5">
                      <label className="text-[0.7rem] font-bold text-gray-400 block mb-1">
                        {lang === 'ar' ? 'أو أدخل رابط صورة خارجي مخصص (URL):' : 'Or type a custom external image URL:'}
                      </label>
                      <input 
                        type="url" 
                        value={tempPhoto}
                        onChange={(e) => setTempPhoto(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-slate-50 border border-gray-200 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-2.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={editField.value}
                    onChange={(e) => setEditField({ ...editField, value: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold"
                    required 
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3.5 rounded-2xl text-sm font-black transition-colors"
                  onClick={() => setEditField(null)}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-brand-primary text-white py-3.5 rounded-2xl text-sm font-black hover:bg-brand-accent transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {newAnnouncementModal && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-brand-primary/15 w-full max-w-lg text-start">
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-xl font-black text-gray-800">{t().postAnnouncement}</h4>
              <button onClick={() => setNewAnnouncementModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1">
                  {t().message}
                </label>
                <textarea 
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl p-4 text-sm font-bold"
                  rows={3}
                  required
                  placeholder={lang === 'ar' ? 'اكتب الرسالة الإعلانية هنا...' : 'Type your announcement details...'}
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1">
                  {lang === 'ar' ? 'نوع المرفق' : 'Attachment Type'}
                </label>
                <select 
                  value={annType}
                  onChange={(e: any) => setAnnType(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold"
                >
                  <option value="text">{lang === 'ar' ? 'نص فقط' : 'Just Text'}</option>
                  <option value="image">{lang === 'ar' ? 'صورة مميزة' : 'Featured Image'}</option>
                  <option value="video">{lang === 'ar' ? 'رابط مقطع مرئي (فيديو)' : 'Featured Video'}</option>
                  <option value="link">{lang === 'ar' ? 'رابط خارجي مخصص' : 'External Web Link'}</option>
                  <option value="pdf">{lang === 'ar' ? 'ورقة عمل مستند PDF' : 'Tajweed Worksheet (PDF Document)'}</option>
                  <option value="poll">{lang === 'ar' ? 'بطاقة تصويت واستبيان تفاعلي' : 'Interactive Opinion Poll'}</option>
                </select>
              </div>

              {annType !== 'text' && annType !== 'pdf' && annType !== 'poll' && (
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1 font-mono">
                    URL Address
                  </label>
                  <input 
                    type="url"
                    value={annAttachment}
                    onChange={(e) => setAnnAttachment(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold font-mono text-ltr"
                    placeholder="https://..."
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl text-sm font-black"
                  onClick={() => setNewAnnouncementModal(false)}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-brand-primary text-white py-3.5 rounded-2xl text-sm font-black hover:bg-brand-accent cursor-pointer"
                >
                  {lang === 'ar' ? 'نشر الإعلان' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Student Info Profile Card Modal */}
      {activeInfoStudent && (
        <div 
          className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4 select-none overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setActiveInfoStudent(null);
            }
          }}
        >
          <div className="bg-white p-6 rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-md text-start my-auto max-h-[85vh] overflow-y-auto select-text">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h4 className="text-lg font-black text-brand-dark">
                {lang === 'ar' ? 'بطاقة تفاصيل الطالبة المقيدة' : 'Active Student Profiling'}
              </h4>
              <button onClick={() => setActiveInfoStudent(null)}>
                <X className="w-5.5 h-5.5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-4.5 mb-5 text-start">
              <img 
                src={activeInfoStudent.avatar} 
                alt="" 
                className="w-14 h-14 rounded-full border border-gray-200 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <h5 className="font-black text-brand-dark text-base mb-0.5">{activeInfoStudent.name}</h5>
                <span className="bg-brand-neutral text-brand-primary text-[0.65rem] border py-0.5 px-2 rounded-full font-bold">
                  {lang === 'ar' ? 'طالبة مقيدة بنادي مسك' : 'Registered Member - Misk SQU'}
                </span>
              </div>
            </div>

            {/* Profile fields details grid */}
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'رقم الهاتف والتواصل:' : 'Phone Contact:'}</small>
                <span className="font-mono text-brand-dark font-extrabold block text-left" dir="ltr" style={{ direction: 'ltr', textAlign: 'start' }}>{activeInfoStudent.phone || '+968 9988 7766'}</span>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'البريد الإلكتروني للجامعة:' : 'University Email:'}</small>
                <span className="font-mono text-brand-dark font-extrabold text-ltr block leading-none">{activeInfoStudent.email || `${activeInfoStudent.id}@student.squ.edu.om`}</span>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'الكلية / التخصص:' : 'College / Department:'}</small>
                <span className="text-brand-dark font-extrabold block">{activeInfoStudent.college || (lang === 'ar' ? 'الهندسة والعلوم' : 'Engineering & Science')}</span>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'الدفعة الجامعية:' : 'Cohort Year:'}</small>
                <span className="text-brand-dark font-extrabold font-mono block">{activeInfoStudent.cohort || '2023'}</span>
              </div>
            </div>

            <button 
              className="w-full bg-brand-primary text-white py-3.5 rounded-2xl font-black text-sm hover:bg-brand-accent transition-colors cursor-pointer"
              onClick={() => setActiveInfoStudent(null)}
            >
              {lang === 'ar' ? 'حسناً، إغلاق' : 'Close Details'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
