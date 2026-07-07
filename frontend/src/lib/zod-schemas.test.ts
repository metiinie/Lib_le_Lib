import { profileSchema, is18OrOlder } from './zod-schemas';

describe('Zod Schemas - 18+ Age Gate', () => {
  beforeAll(() => {
    // Mock Date.now() to a fixed date so age tests are deterministic
    jest.useFakeTimers().setSystemTime(new Date('2026-07-07T00:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('is18OrOlder logic works accurately', () => {
    // Exactly 18 years old
    expect(is18OrOlder('2008-07-07')).toBe(true);
    // 17.9 years old
    expect(is18OrOlder('2008-07-08')).toBe(false);
    // Older
    expect(is18OrOlder('1990-01-01')).toBe(true);
    // Way too young
    expect(is18OrOlder('2015-01-01')).toBe(false);
  });

  it('rejects profile creation if under 18', () => {
    const data = {
      nickname: 'TestUser',
      dateOfBirth: '2010-01-01', // Under 18
      gender: 'man',
      region: 'Addis Ababa',
      relationshipGoals: ['friendship'],
    };

    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('You must be at least 18 years old to use this app.');
    }
  });

  it('accepts profile creation if 18+', () => {
    const data = {
      nickname: 'TestUser',
      dateOfBirth: '2000-01-01', // 26 years old
      gender: 'man',
      region: 'Addis Ababa',
      relationshipGoals: ['serious_relationship'],
      bio: 'Hello world',
    };

    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
