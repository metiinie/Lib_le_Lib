import { api } from '@/lib/api';

export type VerificationStatus = 'submitted' | 'in_review' | 'approved' | 'rejected' | 'expired';

export const verificationService = {
  checkStatus: async (): Promise<{ status: VerificationStatus; rejection_reason?: string }> => {
    const response = await api.get('/verification/me/status');
    return response.data;
  },
};
