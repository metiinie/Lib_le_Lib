import { api } from '@/lib/api';
import { ProfileDto } from '@/lib/zod-schemas';

export const accountService = {
  updateProfile: async (data: Partial<ProfileDto>) => {
    const response = await api.patch('/profiles/me', data);
    return response.data;
  },

  deleteAccount: async () => {
    // Hits DELETE /users/me which handles cascade deletion of all user data
    const response = await api.delete('/users/me');
    return response.data;
  },

  purchaseSubscription: async (planId: string) => {
    // Mock interaction with Expo In-App Purchases or Stripe
    return { success: true, plan: planId };
  },

  restorePurchases: async () => {
    return { success: true, activePlans: [] };
  }
};
