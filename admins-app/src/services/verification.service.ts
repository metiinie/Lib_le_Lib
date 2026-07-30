import { api } from './api';
import { VerificationSubmission } from '../types';

export const verificationService = {
  getQueue: async (status?: string): Promise<VerificationSubmission[]> => {
    const url = status && status !== 'all' ? `/verification/queue?status=${status}` : '/verification/queue';
    const res = await api.get(url);
    return res.data;
  },

  decide: async (id: string, decision: 'approved' | 'rejected', rejectionReason?: string) => {
    const res = await api.post(`/verification/${id}/decision`, {
      decision,
      status: decision,
      rejectionReason,
    });
    return res.data;
  },
};
