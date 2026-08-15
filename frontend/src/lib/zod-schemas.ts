import { z } from 'zod';

export const parseAndNormalizeDate = (dobStr: string): { normalized: string; age: number } | null => {
  if (!dobStr || typeof dobStr !== 'string') return null;
  const trimmed = dobStr.trim();
  if (!trimmed) return null;

  let year: number | null = null;
  let month = 1;
  let day = 1;

  // Format 1: Just 4-digit year, e.g. "1996"
  if (/^\d{4}$/.test(trimmed)) {
    year = parseInt(trimmed, 10);
  } else {
    // Format 2: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10);
      month = parseInt(ymdMatch[2], 10);
      day = parseInt(ymdMatch[3], 10);
    } else {
      // Format 3: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
      const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (dmyMatch) {
        const p1 = parseInt(dmyMatch[1], 10);
        const p2 = parseInt(dmyMatch[2], 10);
        year = parseInt(dmyMatch[3], 10);
        if (p1 > 12) {
          day = p1;
          month = p2;
        } else {
          month = p1;
          day = p2;
        }
      }
    }
  }

  const currentYear = new Date().getFullYear();
  if (!year || isNaN(year) || year < 1900 || year > currentYear) {
    return null;
  }

  month = Math.max(1, Math.min(12, month));
  day = Math.max(1, Math.min(31, day));

  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const normalized = `${year}-${monthStr}-${dayStr}`;

  const today = new Date();
  let age = today.getFullYear() - year;
  const mDiff = (today.getMonth() + 1) - month;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
    age--;
  }

  return { normalized, age };
};

export const is18OrOlder = (dateOfBirth: string) => {
  const res = parseAndNormalizeDate(dateOfBirth);
  if (!res) return false;
  return res.age >= 18;
};

export const profileSchema = z.object({
  nickname: z.string().min(2, 'Nickname must be at least 2 characters').max(30),
  dateOfBirth: z.string().refine((val) => {
    const parsed = parseAndNormalizeDate(val);
    return parsed !== null;
  }, {
    message: 'Please enter a valid date or birth year (e.g. 1996 or YYYY-MM-DD).',
  }).refine((val) => {
    return is18OrOlder(val);
  }, {
    message: 'You must be at least 18 years old to use this app.',
  }),
  gender: z.enum(['man', 'woman', 'other']),
  regionId: z.string().optional(),
  relationshipGoals: z
    .array(z.enum(['marriage', 'serious_relationship', 'friendship']))
    .min(1, 'Select at least one relationship goal'),
  lookingFor: z.array(z.enum(['men', 'women', 'everyone'])).default(['everyone']),
  virusType: z.string().optional(),
  bio: z.string().max(500).optional(),
});

export type ProfileDto = z.infer<typeof profileSchema>;
