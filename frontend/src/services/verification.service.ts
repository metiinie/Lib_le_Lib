import { api } from '@/lib/api';

export type VerificationStatus = 'submitted' | 'in_review' | 'approved' | 'rejected' | 'expired';

export const verificationService = {
  checkStatus: async (): Promise<{ status: VerificationStatus; rejection_reason?: string }> => {
    const response = await api.get('/verification/me/status');
    return response.data;
  },

  submitVerification: async (documentType: string = 'medical_document', contentType: string = 'application/pdf'): Promise<{ uploadUrl: string }> => {
    const response = await api.post<{ uploadUrl: string }>('/verification/submissions', {
      documentType,
      contentType,
    });
    return response.data;
  },
};
