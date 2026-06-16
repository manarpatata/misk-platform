import { 
  GlobalStudent, 
  GlobalTeacher 
} from '../types';

const FIRST_NAMES = [
  'أمل', 'زكية', 'عائشة', 'فاطمة', 'مريم', 'سارة', 'شمسة', 'أسماء', 'نورة', 'منى', 
  'شيخة', 'أشجان', 'مي', 'وفاء', 'ليلى', 'مزنة', 'رؤى', 'بسمة', 'عهود', 'أميرة', 
  'هبة', 'وجدان', 'أمجاد', 'لبابة', 'هدى', 'أروى', 'كوثر', 'يسرى', 'يسار', 'غدير', 
  'بلقيس', 'إشراق', 'هنوف', 'أفراح', 'سهام', 'خلود', 'نهى', 'شروق', 'إيمان', 'منال', 
  'رحمة', 'بثينة', 'ملاك', 'وئام', 'شهد', 'مروة', 'تسنيم', 'مودة', 'سندس', 'ثريا'
];

const MALE_NAMES = [
  'سليمان', 'سعيد', 'صالح', 'بدر', 'حمد', 'سالم', 'خلفان', 'ناصر', 'خالد', 'أحمد', 
  'عبد الله', 'محمد', 'علي', 'سيف', 'هلال', 'راشد', 'مسعود', 'سلطان', 'فيصل', 'سعد', 
  'جمعة', 'خميس', 'طارق', 'يوسف', 'إبراهيم', 'سليّم', 'مرشد', 'فهد', 'ماجد', 'حارب'
];

const TRIBES = [
  'الحارثية', 'الهنائية', 'البلوشية', 'المعولية', 'الخروصية', 'العبرية', 'المعمرية', 
  'الغافرية', 'الدرعية', 'السنيدية', 'الراشدية', 'الوهيبية', 'الرحبية', 'الشبيبية', 
  'الجلندانية', 'السعدية', 'الشعيلية', 'الجابرية', 'المسرورية', 'الحجرية', 'الخضورية', 
  'العلوية', 'الفارسية', 'اليعقوبية', 'الحبشية', 'الريامية', 'اليحمدية', 'السيابية', 
  'الراسبية', 'البوسعيدية', 'الكندية', 'الشمرية'
];

const COLLEGES = [
  'كلية الاقتصاد والعلوم السياسية',
  'كلية العلوم',
  'كلية التربية',
  'كلية الهندسة',
  'كلية الحقوق',
  'كلية الآداب والعلوم الاجتماعية',
  'كلية الطب والعلوم الصحية',
  'كلية التمريض',
  'كلية العلوم الزراعية والبحرية',
  'مستشفى الجامعة',
  'مركز السلطان قابوس المتكامل لعلاج وبحوث أمراض السرطان',
  'إدارة الجامعة وما يتبعها'
];

const REAL_SAMPLE_NOTES = [
  'باية حلقة مبتدئة اذا ممكن 🫶',
  'عسى أحصل حلقة في ذا الوقت 😔.. الثانية عن بعد إن شاء الله 🤍',
  'أريد حلقة التلاوة حضوري ٢ مساء او ٢:١٥ مع حلقة الطالبات ان امكن و حلقة النظري عن بعد',
  'إذا ممكن حلقة الاثنين أخليها تبدأ ١٠:١٠ مراعاة لوقت انتهاء  المحاضرة ',
  'الله يرزقكم الفردوس الأعلى من الجنة يارب❤️',
  'سمعت انه طالبات الإقراء ممكن يمسكن المرحلة المبتدئة أو التمهيدية بس أنا ما أحس مستعدة للتمهيدية أبدًا ما زلت أتعلم فكبداية حالي أريد مبتدئة لو كان مناسب مع أوقاتي 🥹',
  'جدولي م ثابت ياخي بس خاطري في الحضوري، والله ييسر وتضبط الامور 🥹♥️',
  'باركت جهودكم شيخاتنا 🌟💘 أفضّل إني أمسك تمهيدية إذا ما نتعبكم 🤏',
  'عطوني متقدمة من فضلكم🥹، وجزاكم الله خيرًا وبارك فيكم وفي أوقاتكم وأحسن إليكم🫂💕',
  'ما كثيرًا أفضّل توقيت يوم الثلاثاء',
  'شيختي تريدني أمسك متقدمة😗',
  'ربي يرضى عنكم و يجزيكم عنا خير الجزاء🤍',
  'نحب نادي إتقان التلاوة💞',
  'أرجوكم خلوني يوم الأحد والثلاثاء حضوووري، وباية تمهيدية لوجه الله. 🥺❤️‍🩹',
  'أنا ممرضة، وما دام وقت الحلقات ثابتًا سيتعارض مع مناوبات المستشفى (الشفتات)، ولكن سأبذل جهدي كيف لا يتحقق الغياب بإذن الله',
  'إذا يسمح الوضع أريد حلقتان حضوريتان  ف الفصل بأكلمه والمناسب يوم الأحد الساعة ٤ مساءً',
  'اتمنى حلقتي تكون ف مكان قريب من المركز الثقافي',
  'لم أستلم بطاقتي الجامعية علمًا بأني طالبة ماجستير في السنة الثانية',
  'حالياً انا غير موظفه والفترة الصباحيه تناسبني',
  'لم أرفق بطاقتي الجامعية لأننا لم نستلمها بعد',
  'فجري حضوري ام عن بعد غير موضح',
  'أنا أعمل شفتات جزاكم الله خير اذا ممكن تدخلوني كلاسين ع حسب جدولي',
  'ربي يجازيكم الجنان ... متحمسة أكمل المرحلة، وانا طالبة ماجستير ومحاضراتي يوومين فالاسبوع فهذه الاوقات مناسبة لي واااااايد لاني اجي من السويق . لذلك بيكون يومي في الجامعة. شكراً على تعاونكم ♥️',
  'لم استلم البطاقة الجامعية بعد، لذلك لم ارفقها، اعتذر.',
  'المعذرة أرفقت صورة جدولي الدراسي لانه نحن طالبات الدراسات العليا لم تصدر بطاقاتنا الجامعة للآن',
  'سجلت قبل ولكن غيرت الاوقات لانه ما يناسبني الا الاوقات المسائية عن بعد بحكم دوامي'
];

function getPseudorandomItem<T>(arr: T[], seed: number): T {
  const index = Math.floor((Math.abs(Math.sin(seed) * 10000)) % arr.length);
  return arr[index];
}

import { RAW_IN_PERSON_TEACHERS_TXT, RAW_ONLINE_TEACHERS_TXT } from './clearSamplesRaw';

// Parse raw survey line structured fields
export function parseRawLine(line: string) {
  const cleanLine = line.trim();
  if (!cleanLine) return null;
  
  const colonIndex = cleanLine.indexOf(':');
  if (colonIndex === -1) return null;
  const content = cleanLine.substring(colonIndex + 1).trim();
  
  const result: Record<string, string> = {};
  
  const keyMarkers = [
    { key: 'ID', term: 'ID:' },
    { key: 'college', term: 'college:' },
    { key: 'level', term: 'level:' },
    { key: 'year', term: 'year:' },
    { key: 'cohort', term: 'cohort:' },
    { key: 'available time', term: 'available time:' },
    { key: 'available_time', term: 'available_time:' },
    { key: 'notes', term: 'notes:' }
  ];
  
  const sections: { key: string; startIndex: number }[] = [];
  
  keyMarkers.forEach(({ key, term }) => {
    let idx = content.indexOf(term);
    if (idx !== -1) {
      sections.push({ key, startIndex: idx });
    }
  });
  
  sections.sort((a, b) => a.startIndex - b.startIndex);
  
  for (let i = 0; i < sections.length; i++) {
    const current = sections[i];
    const marker = keyMarkers.find(k => k.key === current.key)!;
    const valueStart = current.startIndex + marker.term.length;
    let valueEnd = content.length;
    
    if (i + 1 < sections.length) {
      valueEnd = sections[i+1].startIndex;
    }
    
    let val = content.substring(valueStart, valueEnd).trim();
    if (val.endsWith(',')) {
      val = val.substring(0, val.length - 1).trim();
    }
    result[current.key] = val;
  }
  
  return result;
}

// Translate raw time text cell to key mapping with specific formats parsed cleanly
export function parseTimingCellWithMode(cell: string | undefined): { slotKey: string; mode: 'selected' | 'online' | 'person' }[] {
  if (!cell || cell === 'لا يناسبني' || cell === 'لا يوجد' || cell.trim() === '') return [];
  
  const arToEnMap: Record<string, string> = {
    '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٠': '0'
  };
  let clean = cell.replace(/[١٢٣٤٥٦٧٨٩٠]/g, (d) => arToEnMap[d] || d).toLowerCase().trim();
  
  const results: { slotKey: string; mode: 'selected' | 'online' | 'person' }[] = [];
  
  let mode: 'selected' | 'online' | 'person' = 'selected';
  if (clean.includes('عن بعد') || clean.includes('online')) {
    mode = 'online';
  } else if (clean.includes('حضوري') || clean.includes('in-person') || clean.includes('person')) {
    mode = 'person';
  }

  if (clean.includes('فجر') || clean.includes('فجرية')) {
    results.push({ slotKey: 'Fajr', mode });
  }
  
  if (clean.includes('8') || clean.includes('٨') || clean.includes('8:00') || clean.includes('8:15') || clean.includes('ثمانية') || clean.includes('الرابعة')) {
    if (clean.includes('مساء') || clean.includes('night') || clean.includes('pm') || clean.includes('م')) {
      results.push({ slotKey: '8:00-9:15PM', mode });
    } else {
      results.push({ slotKey: '8:00-9:15', mode });
    }
  }

  if (clean.includes('10') || clean.includes('١٠') || clean.includes('10:00') || clean.includes('10:15')) {
    results.push({ slotKey: '10:00-11:15', mode });
  }

  if (clean.includes('12') || clean.includes('١٢') || clean.includes('12:00') || clean.includes('12:15')) {
    results.push({ slotKey: '12:00-1:15', mode });
  }

  if (clean.includes('2') || clean.includes('٢') || clean.includes('2:00') || clean.includes('2:15') || clean.includes('٢:١٥')) {
    results.push({ slotKey: '2:15-3:30', mode });
  }

  if (clean.includes('4') || clean.includes('٤') || clean.includes('4:00') || clean.includes('4:15') || clean.includes('٤:١٥') || clean.includes('خمسة') || clean.includes('عصر')) {
    results.push({ slotKey: '4:15-5:30', mode });
  }

  return results;
}

// Clean and build timings without mixing random timings for a single person (keeps all chosen timings as-is)
export function buildTimingsObject(days: string[], rowData: string[], defaultFormat?: 'online' | 'person'): Record<string, 'selected' | 'online' | 'person'> {
  const timings: Record<string, 'selected' | 'online' | 'person'> = {};
  
  days.forEach((dayKey, idx) => {
    const parsed = parseTimingCellWithMode(rowData[idx]);
    parsed.forEach(({ slotKey, mode }) => {
      // Respect user selection mode from survey cell, falling back to defaultFormat if generic "selected"
      const finalMode = (mode !== 'selected' ? mode : defaultFormat) || 'selected';
      timings[`${dayKey}_${slotKey}`] = finalMode;
    });
  });

  return timings;
}

// Convert available time string directly list to parsed record of timings
export function parseAvailableTimeToTimings(timeStr: string | undefined, defaultFormat: 'online' | 'person'): Record<string, 'selected' | 'online' | 'person'> {
  const timings: Record<string, 'selected' | 'online' | 'person'> = {};
  if (!timeStr || timeStr.toLowerCase().includes('no specific') || timeStr.trim() === '') return timings;
  
  const parts = timeStr.split('|');
  parts.forEach(part => {
    let clean = part.toLowerCase().trim();
    if (!clean) return;

    let day = '';
    if (clean.includes('الأحد') || clean.includes('احد') || clean.includes('sunday')) day = 'Sunday';
    else if (clean.includes('الإثنين') || clean.includes('الاثنين') || clean.includes('monday')) day = 'Monday';
    else if (clean.includes('الثلاثاء') || clean.includes('tuesday')) day = 'Tuesday';
    else if (clean.includes('الأربعاء') || clean.includes('الاربعاء') || clean.includes('wednesday')) day = 'Wednesday';
    else if (clean.includes('الخميس') || clean.includes('thursday')) day = 'Thursday';
    else if (clean.includes('الجمعة') || clean.includes('جمعه') || clean.includes('friday')) day = 'Friday';
    else if (clean.includes('السبت') || clean.includes('saturday')) day = 'Saturday';

    if (!day) return;

    const val: 'selected' | 'online' | 'person' = defaultFormat;

    let slot = '';
    if (clean.includes('فجر') || clean.includes('فجرية')) {
      slot = 'Fajr';
    } else if (clean.includes('8:15') || clean.includes('8:00') || clean.includes('٨:١٥') || clean.includes('٨:٠٠') || clean.includes('الرابعة')) {
      if (clean.includes('مساء') || clean.includes('pm') || clean.includes('م')) {
        slot = '8:00-9:15PM';
      } else {
        slot = '8:00-9:15';
      }
    } else if (clean.includes('10:15') || clean.includes('10:00') || clean.includes('١٠:١٥') || clean.includes('١٠:٠٠')) {
      slot = '10:00-11:15';
    } else if (clean.includes('12:15') || clean.includes('12:00') || clean.includes('١٢:١٥') || clean.includes('١٢:٠٠')) {
      slot = '12:00-1:15';
    } else if (clean.includes('2:15') || clean.includes('2:00') || clean.includes('٢:١٥') || clean.includes('٢:٠٠')) {
      slot = '2:15-3:30';
    } else if (clean.includes('4:15') || clean.includes('4:00') || clean.includes('٤:١٥') || clean.includes('٤:٠٠')) {
      slot = '4:15-5:30';
    } else if (clean.includes('8') || clean.includes('٨')) {
      if (clean.includes('مساء') || clean.includes('pm') || clean.includes('م')) {
        slot = '8:00-9:15PM';
      } else {
        slot = '8:00-9:15';
      }
    }

    if (day && slot) {
      timings[`${day}_${slot}`] = val;
    }
  });
  
  return timings;
}

// Raw spreadsheet rows for In-Person Teachers (from the attached files)
const RAW_IN_PERSON_TEACHERS = [
  ['١٠-١١:١٥صباحا', '١٢-١:١٥ مساء', '١٠-١١:١٥صباحا', '١٢-١:١٥ مساء', 'لا يناسبني'],
  ['لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['٤:١٥-٥:٣٠ مساء', '٨-٩:١٥ صباحا', 'لا يناسبني', 'لا يناسبني', '١٢-١:١٥ مساء'],
  ['٤:١٥-٥:٣٠ مساء', 'لا يناسبني', '٤:١٥-٥:٣٠ مساء', '٤:١٥-٥:٣٠ مساء', 'لا يناسبني'],
  ['١٢-١:١٥ مساء', '٢:١٥-٣:٣٠ مساء', '١٢-١:١٥ مساء', '', '١٠-١١:١٥صباحا'],
  ['لا يناسبني', '١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء', 'لا يناسبني', '١٠-١١:١٥صباحا', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', '١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', '١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', '٢:١٥-٣:٣٠ مساء'],
  ['١٠-١١:١٥صباحا', '١٢-١:١٥ مساء, ٤:١٥-٥:٣٠ مساء', '١٠-١١:١٥صباحا, ٤:١٥-٥:٣٠ مساء', '١٢-١:١٥ مساء', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', '٨-٩:١٥ صباحا'],
  ['٨-٩:١٥ صباحا', '٨-٩:١٥ صباحا', '١٠-١١:١٥صباحا', '٨-٩:١٥ صباحا', '٨-٩:١٥ صباحا'],
  ['٢:١٥-٣:٣٠ مساء', '١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', '٢:١٥-٣:٣٠ مساء', 'لا يناسبني', '١٠-١١:١٥صباحا'],
  ['١٢-١:١٥ مساء', 'لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '٢:١٥-٣:٣٠ مساء', 'لا يناسبني', '٢:١٥-٣:٣٠ مساء', 'لا يناسبني'],
  ['٨-٩:١٥ صباحا', '١٢-١:١٥ مساء', '٨-٩:١٥ صباحا, ١٠-١١:١٥صباحا', 'لا يناسبني', 'لا يناسبني'],
  ['٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', '٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', '٤:١٥-٥:٣٠ مساء', '٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', '٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء'],
  ['١٠-١١:١٥صباحا', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', '١٠-١١:١٥صباحا', 'لا يناسبني', '١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء', 'لا يناسبني'],
  ['١٠-١١:١٥صباحا', '١٠-١١:١٥صباحا', '١٠-١١:١٥صباحا', '١٠-١١:١٥صباحا', 'لا يناسبني'],
  ['٢:١٥-٣:٣٠ مساء', '١٠-١١:١٥صباحا', '٢:١٥-٣:٣٠ مساء', '١٠-١١:١٥صباحا', 'لا يناسبني'],
  ['٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', 'لا يناسبني', '٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '٨-٩:١٥ صباحا, ١٢-١:١٥ مساء', 'لا يناسبني', '١٠-١١:١٥ مساء', '١٠-١١:١٥صباحا, ١٢-١:١٥ مساء'],
  ['لا يناسبني', 'لا يناسبني', '٤:١٥-٥:٣٠ مساء', '١٠-١١:١٥صباحا', '١٠-١١:١٥صباحا'],
  ['١٢-١:١٥صباحا', 'لا يناسبني', '١٠-١١:١٥صباحا', 'لا يناسبني', 'لا يناسبني'],
  ['١٢-١:١٥ مساء', '١٢-١:١٥ مساء', '١٢-١:١٥ مساء', '١٢-١:١٥ مساء', 'لا يناسبني'],
  ['لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني'],
  ['١٠-١١:١٥صباحا', '١٢-١:١٥ مساء', '١٢-١:١٥ مساء', '١٢-١:١٥ مساء, ٤:١٥-٥:٣٠ مساء', 'لا يناسبني'],
  ['٨-٩:١٥ صباحا, ١٢-١:١٥ مساء', '٨-٩:١٥ صباحا, ١٢-١:١٥ مساء', '١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', '٨-٩:١٥ صباحا, ١٢-١:١٥ مساء', '٨-٩:١٥ صباحا'],
  ['١٢-١:١٥ مساء', 'لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني', '١٠-١١:١٥صباحا', 'لا يناسبني'],
  ['لا يناسبني', '١٢-١:١٥ مساء', '٢:١٥-٣:٣٠ مساء', '١٢-١:١٥ مساء', ''],
  ['لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني', '١٢-١:١٥ مساء', 'لا يناسبني'],
  ['٤:١٥-٥:٣٠ مساء', '٨-٩:١٥ مساء', '٤:١٥-٥:٣٠ مساء', '٨-٩:١٥ مساء', 'فجرية, ٨-٩:١٥ صباحا']
];

// Raw spreadsheet rows for Online Teachers (7-day layout)
const RAW_ONLINE_TEACHERS = [
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', 'لا يناسبني', '١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ صباحا, ١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '٤:١٥-٥:٣٠ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'لا يناسبني'],
  ['فجرية', 'فجرية', 'فجرية', 'فجرية', 'فجرية', 'فجرية', 'فجرية'],
  ['١٢-١:١٥ مساء', '١٢-١:١٥ مساء', '١٢-١:١٥ مساء', '١٢-١:١٥ مساء', '١٢-١:١٥ مساء', '١٠-١١:١٥صباحا, ١٢-١:١٥ مساء', '١٠-١١:١٥صباحا, ١٢-١:١٥ مساء'],
  ['٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', 'لا يناسبني', '٨-٩:١٥ صباحا', 'فجرية'],
  ['فجرية', 'فجرية', 'فجرية', 'فجرية', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['فجرية', 'فجرية, ٨-٩:١٥ مساء', 'فجرية', 'فجرية, ٨-٩:١٥ مساء', 'فجرية', 'فجرية, ٨-٩:١٥ صباحا', 'فجرية, ٨-٩:١٥ صباحا'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'فجرية'],
  ['٤:١٥-٥:٣٠ مساء', 'لا يناسبني', '٤:١٥-٥:٣٠ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['٨-٩:١٥ صباحا', 'لا يناسبني', '٨-٩:١٥ صباحا', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['٨-٩:١٥ صباحا, ٨-٩:١٥ مساء', '٨-٩:١٥ صباحا', '٨-٩:١٥ صباحا, ٨-٩:١٥ مساء', '٨-٩:١٥ صباحا, ٨-٩:١٥ مساء', '٨-٩:١٥ صباحا, ٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية, ٨-٩:١٥ صباحا, ١٠-١١:١٥صباحا', 'فجرية, ٨-٩:١٥ صباحا, ١٠-١١:١٥صباحا'],
  ['٨-٩:١٥ مساء', 'لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'لا يناسبني'],
  ['٨-٩:١٥ مساء', 'لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية, ٨-٩:١٥ صباحا', 'فجرية, ٨-٩:١٥ صباحا'],
  ['٤:١٥-٥:٣٠ مساء', 'لا يناسبني', 'فجرية, لا يناسبني', 'فجرية, ٨-٩:١٥ صباحا', 'فجرية, ٨-٩:١٥ صباحا', 'فجرية', 'لا يناسبني'],
  ['٨-٩:١٥ مساء', 'لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'فجرية'],
  ['٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', '٨-٩:١٥ مساء', 'لا يناسبني', 'فجرية, ٨-٩:١٥ صباحا', 'فجرية, ٨-٩:١٥ صباحا'],
  ['فجرية, ٨-٩:١٥ صباحا', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية, ٨-٩:١٥ صباحا', 'فجرية, ٨-٩:١٥ صباحا', 'فجرية, ٨-٩:١٥ صباحا'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', '٨-٩:١٥ صباحا, ١٠-١١:١٥صباحا', '٨-٩:١٥ صباحا, ١٠-١١:١٥صباحا'],
  ['٨-٩:١٥ مساء', '٨-٩:١٥ مساء', 'فجرية', 'فجرية', 'فجرية', 'فجرية', 'لا يناسبني'],
  ['٤:١٥-٥:٣٠ مساء', '٤:١٥-٥:٣٠ مساء', '٤:١٥-٥:٣٠ مساء', '٤:١٥-٥:٣٠ مساء', '٤:١٥-٥:٣٠ مساء', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '٨-٩:١٥ صباحا', '٨-٩:١٥ صباحا, ١٠-١١:١٥صباحا', 'لا يناسبني', '٨-٩:١٥ صباحا', 'لا يناسبني', '١٠-١١:١٥صباحا'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'فجرية'],
  ['٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', '٨-٩:١٥ مساء', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', '١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء', '١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء, ٤:١٥-٥:٣٠ مساء', '١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء', '١٠-١١:١٥صباحا, ٢:١٥-٣:٣٠ مساء', '١٠-١١:١٥صباحا', '١٠-١١:١٥صباحا']
];

// Raw survey rows for In-Person Students
const RAW_IN_PERSON_STUDENTS = [
  ['2:00- 3:15', 'لا يناسبني', '2:00- 3:15', 'لا يناسبني', 'لا يناسبني'],
  ['12:00 -1:15, 2:00- 3:15', '8:00 - 9:15, 10:00 -11:15', '12:00 -1:15', '12:00 -1:15, 2:00- 3:15', '8:00 - 9:15'],
  ['لا يناسبني', 'لا يناسبني', '10:00 -11:15', '4:00- 5:15 مساءً', 'لا يناسبني'],
  ['12:00 -1:15', '12:00 -1:15', '12:00 -1:15', '12:00 -1:15', 'لا يناسبني'],
  ['10:00 -11:15', 'لا يناسبني', '10:00 -11:15', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '12:00 -1:15, 2:00- 3:15', 'لا يناسبني', '12:00 -1:15, 2:00- 3:15', 'لا يناسبني'],
  ['لا يناسبني', '10:00 -11:15', '8:00 - 9:15', 'لا يناسبني', '8:00 - 9:15'],
  ['8:00 - 9:15', 'لا يناسبني', '8:00 - 9:15', 'لا يناسبني', 'لا يناسبني'],
  ['10:00 -11:15', '10:00 -11:15', '10:00 -11:15', '10:00 -11:15', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', '8:00 - 9:15, 12:00 -1:15', 'لا يناسبني', '10:00 -11:15'],
  ['10:00 -11:15', '8:00 - 9:15', '10:00 -11:15', '2:00- 3:15', '10:00 -11:15'],
  ['4:00- 5:15 مساءً', '4:00- 5:15 مساءً', '4:00- 5:15 مساءً', '8:00 - 9:15, 10:00 -11:15, 4:00- 5:15 مساءً', 'لا يناسبني'],
  ['10:00 -11:15', '12:00 -1:15', '10:00 -11:15', '12:00 -1:15', 'لا يناسبني'],
  ['2:00- 3:15', '10:00 -11:15', '10:00 -11:15', '10:00 -11:15', '12:00 -1:15'],
  ['10:00 -11:15, 12:00 -1:15', '8:00 - 9:15, 2:00- 3:15', '10:00 -11:15, 12:00 -1:15', '8:00 - 9:15, 2:00- 3:15', '10:00 -11:15'],
  ['12:00 -1:15', '10:00 -11:15', '12:00 -1:15', '10:00 -11:15', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', '10:00 -11:15', 'لا يناسبني', '12:00 -1:15'],
  ['لا يناسبني', 'لا يناسبني', '2:00- 3:15', '10:00 -11:15', 'لا يناسبني'],
  ['لا يناسبني', '10:00 -11:15', 'لا يناسبني', '10:00 -11:15', 'لا يناسبني'],
  ['لا يناسبني', '8:00 - 9:15, 10:00 -11:15', '12:00 -1:15, 2:00- 3:15', '8:00 - 9:15, 10:00 -11:15', 'لا يناسبني'],
  ['12:00 -1:15', '10:00 -11:15', '12:00 -1:15', '10:00 -11:15', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', '10:00 -11:15', 'لا يناسبني', 'لا يناسبني'],
  ['10:00 -11:15', '12:00 -1:15', 'لا يناسبني', 'لا يناسبني', '8:00 - 9:15'],
  ['8:00 - 9:15', '12:00 -1:15', '8:00 - 9:15, 2:00- 3:15', '12:00 -1:15', '12:00 -1:15'],
  ['لا يناسبني', '10:00 -11:15', '10:00 -11:15', '10:00 -11:15', '12:00 -1:15'],
  ['12:00 -1:15', '12:00 -1:15', '10:00 -11:15', '12:00 -1:15', '8:00 - 9:15'],
  ['لا يناسبني', '10:00 -11:15', 'لا يناسبني', '10:00 -11:15', 'لا يناسبني']
];

// Raw survey rows for Online Students (7-day layout)
const RAW_ONLINE_STUDENTS = [
  ['فجرية', 'فجرية', 'فجرية', 'فجرية', 'فجرية', 'فجرية', 'فجرية'],
  ['فجرية', '8:00 صباحاً (عن بعد)', 'فجرية', '8:00 صباحاً (عن بعد)', 'فجرية', 'فجرية', 'فجرية'],
  ['8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '2:00 مساءً (عن بعد)', 'لا يناسبني', '2:00 مساءً (عن بعد)'],
  ['4:00 عصراً (حضوري)', 'لا يناسبني', '4:00 عصراً (حضوري)', 'لا يناسبني', 'لا يناسبني', '4:00 عصراً (عن بعد)', '4:00 عصراً (عن بعد)'],
  ['8 مساء (عن بعد)', 'فجرية', '8 مساء (عن بعد)', 'فجرية', 'فجرية', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)'],
  ['8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '2:00 مساءً (عن بعد)', '2:00 مساءً (عن بعد)'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'فجرية'],
  ['فجرية', 'فجرية', 'فجرية', 'فجرية', 'فجرية', 'لا يناسبني', 'لا يناسبني'],
  ['8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', 'فجرية', 'فجرية'],
  ['8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)'],
  ['8 مساء (عن بعد)', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', '4:00 عصراً (عن بعد)', 'لا يناسبني', '4:00 عصراً (عن بعد)'],
  ['8:00 صباحاً (عن بعد)', '4:00 عصراً (عن بعد)', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'فجرية'],
  ['8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', 'لا يناسبني', 'لا يناسبني'],
  ['8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)'],
  ['8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)', '8:00 صباحاً (عن بعد)'],
  ['8:00 صباحاً (عن بعد)', '10:00 صباحاً (حضوري)', '8:00 صباحاً (عن بعد)', '10:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', 'فجرية', '8:00 صباحاً (عن بعد)'],
  ['لا يناسبني', 'فجرية', 'لا يناسبني', 'فجرية', 'فجرية', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '8 مساء (عن بعد)', 'لا يناسبني', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)', '8 مساء (عن بعد)'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'فجرية'],
  ['10:00  (عن بعد)', '10:00  (عن بعد)', '10:00  (عن بعد)', '10:00  (عن بعد)', '10:00  (عن بعد)', 'لا يناسبني', 'لا يناسبني'],
  ['8:00 صباحاً (حضوري)', '8:00 صباحاً (حضوري)', '2:00 مساءً (حضوري)', '8:00 صباحاً (حضوري)', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', '12:00 ظهراً (عن بعد)', 'لا يناسبني', '12:00 ظهراً (عن بعد)', 'لا يناسبني', 'لا يناسبني', 'لا يناسبني'],
  ['لا يناسبني', 'لا يناسبني', 'لا يناسبني', 'فجرية', 'فجرية', 'فجرية, 4:00 عصراً (عن بعد)', 'فجرية, 4:00 عصراً (عن بعد)']
];

export function generateRealTeachers(): any[] {
  const list: any[] = [];
  let seed = 4421;

  // Split and parse in-person teachers raw txt
  const ipLines = RAW_IN_PERSON_TEACHERS_TXT.trim().split('\n');
  for (let i = 0; i < ipLines.length; i++) {
    const line = ipLines[i];
    const parsed = parseRawLine(line);
    if (!parsed) continue;

    seed++;
    const firstName = getPseudorandomItem(FIRST_NAMES, seed);
    const fatherName = getPseudorandomItem(MALE_NAMES, seed + 1);
    const grandfatherName = getPseudorandomItem(MALE_NAMES, seed + 2);
    const lastName = getPseudorandomItem(TRIBES, seed + 3);
    
    const college = parsed.college || getPseudorandomItem(COLLEGES, seed + 4);
    const level = parsed.level || 'طالبة اقراء';
    const notes = parsed.notes || '';
    const availableTimeStr = parsed['available time'] || parsed['available_time'] || '';

    // Parse timings exactly as the teacher selected!
    const timings = parseAvailableTimeToTimings(availableTimeStr, 'person');

    const phoneDigit = 9000000 + (Math.floor(Math.abs(Math.cos(seed) * 1000000)) % 999999);
    const phone = `9689${phoneDigit}`;

    const rawId = parsed.ID ? parsed.ID.trim() : '';
    const hasValidId = rawId && !/[\u0600-\u06FF]/.test(rawId) && !['no', 'none', 'n/a', 'na', 'false', 'nil', 'لا يوجد', 'متخرجة', 'خريجة'].includes(rawId.toLowerCase());
    const employeeId = hasValidId ? `T_IP_${rawId}` : `T_IP_${1420 + i}`;

    const email = `teacher.${1420 + i}@squ.edu.om`;

    list.push({
      firstName,
      fatherName,
      grandfatherName,
      lastName,
      role: 'TEACHER',
      phone,
      email,
      employeeId,
      level,
      college,
      approved: true,
      isNew: false,
      isEnrolled: true,
      notes: notes,
      enrollmentDetails: {
        semesterId: 'fall_2026',
        teacherFormat: 'person',
        timings,
        notes: notes
      }
    });
  }

  // Split and parse online teachers raw txt
  const olLines = RAW_ONLINE_TEACHERS_TXT.trim().split('\n');
  for (let i = 0; i < olLines.length; i++) {
    const line = olLines[i];
    const parsed = parseRawLine(line);
    if (!parsed) continue;

    seed++;
    const firstName = getPseudorandomItem(FIRST_NAMES, seed);
    const fatherName = getPseudorandomItem(MALE_NAMES, seed + 1);
    const grandfatherName = getPseudorandomItem(MALE_NAMES, seed + 2);
    const lastName = getPseudorandomItem(TRIBES, seed + 3);
    
    const college = parsed.college || getPseudorandomItem(COLLEGES, seed + 4);
    const level = parsed.level || 'طالبة اقراء';
    const notes = parsed.notes || '';
    const availableTimeStr = parsed['available time'] || parsed['available_time'] || '';

    // Parse timings exactly as the teacher selected!
    const timings = parseAvailableTimeToTimings(availableTimeStr, 'online');

    const phoneDigit = 9000000 + (Math.floor(Math.abs(Math.cos(seed) * 1000000)) % 999999);
    const phone = `9689${phoneDigit}`;

    const rawId = parsed.ID ? parsed.ID.trim() : '';
    const hasValidId = rawId && !/[\u0600-\u06FF]/.test(rawId) && !['no', 'none', 'n/a', 'na', 'false', 'nil', 'لا يوجد', 'متخرجة', 'خريجة'].includes(rawId.toLowerCase());
    const employeeId = hasValidId ? `T_OL_${rawId}` : `T_OL_${2420 + i}`;

    const email = `teacher.${2420 + i}@squ.edu.om`;

    list.push({
      firstName,
      fatherName,
      grandfatherName,
      lastName,
      role: 'TEACHER',
      phone,
      email,
      employeeId,
      level,
      college,
      approved: true,
      isNew: false,
      isEnrolled: true,
      notes: notes,
      enrollmentDetails: {
        semesterId: 'fall_2026',
        teacherFormat: 'online',
        timings,
        notes: notes
      }
    });
  }

  return list;
}

export function generateRealStudents(): any[] {
  const list: any[] = [];
  let seed = 8847;

  // Generate 267 in-person students
  for (let i = 0; i < 267; i++) {
    seed++;
    const firstName = getPseudorandomItem(FIRST_NAMES, seed);
    const fatherName = getPseudorandomItem(MALE_NAMES, seed + 1);
    const grandfatherName = getPseudorandomItem(MALE_NAMES, seed + 2);
    const lastName = getPseudorandomItem(TRIBES, seed + 3);
    const college = getPseudorandomItem(COLLEGES, seed + 4);
    
    const lvlSeed = i % 3;
    let level = 'مبتدئة';
    if (lvlSeed === 1) level = 'تمهيدية';
    if (lvlSeed === 2) level = 'متقدمة';

    const cohortYear = 2021 + (i % 5);
    const studentId = `s${140000 + i}`;
    const email = `${studentId}@student.squ.edu.om`;
    const phoneDigit = 9000000 + (Math.floor(Math.abs(Math.cos(seed) * 1000000)) % 999999);
    const phone = `9689${phoneDigit}`;

    // Map real timing row
    const rawSurveyRow = RAW_IN_PERSON_STUDENTS[i % RAW_IN_PERSON_STUDENTS.length];
    const timings = buildTimingsObject(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], rawSurveyRow, 'person');
    const assignedNotes = i % 3 === 0 ? getPseudorandomItem(REAL_SAMPLE_NOTES, seed + 15) : '';

    list.push({
      firstName,
      fatherName,
      grandfatherName,
      lastName,
      role: 'STUDENT',
      phone,
      email,
      studentId,
      level,
      college,
      cohort: String(cohortYear),
      degree: 'Bachelor',
      cardPicName: `sid_${studentId}.jpg`,
      voiceFileName: `voice_${studentId}.mp3`,
      approved: seed % 20 !== 0,
      isNew: i % 8 === 0,
      isEnrolled: true,
      notes: assignedNotes,
      enrollmentDetails: {
        semesterId: 'fall_2026',
        format: 'in-person',
        timings,
        notes: assignedNotes
      }
    });
  }

  // Generate 194 online students
  for (let i = 0; i < 194; i++) {
    seed++;
    const firstName = getPseudorandomItem(FIRST_NAMES, seed);
    const fatherName = getPseudorandomItem(MALE_NAMES, seed + 1);
    const grandfatherName = getPseudorandomItem(MALE_NAMES, seed + 2);
    const lastName = getPseudorandomItem(TRIBES, seed + 3);
    const college = getPseudorandomItem(COLLEGES, seed + 4);
    
    const lvlSeed = i % 3;
    let level = 'مبتدئة';
    if (lvlSeed === 1) level = 'تمهيدية';
    if (lvlSeed === 2) level = 'متقدمة';

    const degreeSeed = i % 3;
    let degree = 'Master';
    let cohort = 'Graduate';
    if (degreeSeed === 1) degree = 'PhD';
    if (degreeSeed === 2) degree = 'Employee';

    const studentId = `s${240000 + i}`;
    const email = `${studentId}@student.squ.edu.om`;
    const phoneDigit = 9000000 + (Math.floor(Math.abs(Math.cos(seed) * 1000000)) % 999999);
    const phone = `9689${phoneDigit}`;

    // Map real timing row
    const rawSurveyRow = RAW_ONLINE_STUDENTS[i % RAW_ONLINE_STUDENTS.length];
    const timings = buildTimingsObject(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], rawSurveyRow, 'online');
    const assignedNotes = i % 3 === 0 ? getPseudorandomItem(REAL_SAMPLE_NOTES, seed + 20) : '';

    list.push({
      firstName,
      fatherName,
      grandfatherName,
      lastName,
      role: 'STUDENT',
      phone,
      email,
      studentId,
      level,
      college,
      cohort,
      degree,
      cardPicName: `sid_${studentId}.jpg`,
      voiceFileName: `voice_${studentId}.mp3`,
      approved: seed % 20 !== 0,
      isNew: i % 8 === 0,
      isEnrolled: true,
      notes: assignedNotes,
      enrollmentDetails: {
        semesterId: 'fall_2026',
        format: 'online',
        timings,
        notes: assignedNotes
      }
    });
  }

  return list;
}
