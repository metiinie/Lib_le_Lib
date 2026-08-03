import { api } from './api';
import { Subscription } from '../types';

export const subscriptionService = {
  getAdminQueue: async (limit: number, offset: number, status?: string, plan?: string) => {
    let url = `/subscriptions/admin/queue?limit=${limit}&offset=${offset}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (plan && plan !== 'all') url += `&plan=${plan}`;
    
    const res = await api.get(url);
    return res.data; // { data: Subscription[], total, limit, offset }
  },

  cancelSubscription: async (subscriptionId: string, reason: string) => {
    const res = await api.post(`/subscriptions/admin/${subscriptionId}/cancel`, { reason });
    return res.data;
  },
};
