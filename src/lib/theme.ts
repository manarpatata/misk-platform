export function getUserThemeStyles(user: any) {
  let lvlType: 'beginner' | 'intermediate' | 'advanced' | 'iqraa' | 'mujazah' = 'beginner';

  if (user?.role === 'TEACHER') {
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

  return stylesMap[lvlType];
}
