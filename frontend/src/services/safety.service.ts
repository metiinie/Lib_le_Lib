import { api } from '@/lib/api';

export type ReportCategory = 
  | 'harassment'
  | 'fake_profile'
  | 'outing_threat'
  | 'solicitation'
  | 'scam'
  | 'underage_suspicion'
  | 'other';

export const safetyService = {
  blockUser: async (userId: string) => {
    // In a real implementation this sends POST /blocks
    const response = await api.post('/blocks', { targetUserId: userId });
    return response.data;
  },

  submitReport: async (userId: string, payload: { category: ReportCategory; description?: string; attachmentUrl?: string }) => {
    const response = await api.post('/reports', { targetUserId: userId, ...payload });
    return response.data;
  }
};
