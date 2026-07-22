import { z } from 'zod';

export const is18OrOlder = (dateOfBirth: string) => {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;
  
  const ageDifMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDifMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  
  return age >= 18;
};

export const profileSchema = z.object({
  nickname: z.string().min(2, 'Nickname must be at least 2 characters').max(30),
  dateOfBirth: z.string().refine(is18OrOlder, {
    message: 'You must be at least 18 years old to use this app.',
  }),
  gender: z.enum(['man', 'woman', 'other']),
  regionId: z.string().optional(),
  relationshipGoals: z
    .array(z.enum(['marriage', 'serious_relationship', 'friendship']))
    .min(1, 'Select at least one relationship goal'),
  bio: z.string().max(500).optional(),
});

export type ProfileDto = z.infer<typeof profileSchema>;
